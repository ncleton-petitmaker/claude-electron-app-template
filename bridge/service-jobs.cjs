const { spawn } = require("node:child_process");
const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");

/**
 * Boucle de travaux des services qui hebergent leur propre file.
 *
 * Le principe est celui deja en service chez Rossini : l'application en ligne
 * depose un travail, le Bridge du poste le reclame, l'execute avec
 * l'abonnement de son proprietaire, et renvoie la reponse. L'abonnement ne
 * quitte jamais la machine.
 *
 * Difference d'implantation : Rossini passe par le plan de controle, qui
 * porte `bridge_jobs` dans la meme base que l'application. Un service comme
 * le CRM Yaka Performance n'a pas de plan de controle et expose les trois
 * memes routes chez lui. On l'interroge donc directement, avec le jeton de
 * service que Bridge detient deja pour lui.
 *
 * Cf. ULTRAPLAN-IA-DEUX-MODES.md, phase C.
 */

/** Rythme d'interrogation. Meme cadence que le plan de controle. */
const PAS_MS = 5000;

/**
 * Duree du bail demande. Doit couvrir un run complet : un bail plus court
 * que l'execution ferait reprendre le travail par un autre poste alors que
 * le premier est encore en train de repondre, et l'utilisateur verrait deux
 * reponses se marcher dessus.
 */
const BAIL_S = 300;

/** Au-dela, on considere l'agent bloque et on rend la main. */
const EXECUTION_MAX_MS = 4 * 60_000;

function nomDuPoste() {
  return `${os.hostname()}`.slice(0, 100);
}

/**
 * Declare le serveur MCP de Bridge aupres de codex.
 *
 * C'est cette declaration qui donne a l'agent l'acces aux donnees du service.
 * Sans elle, il tourne quand meme, repond quand meme, mais sans rien pouvoir
 * lire : la premiere version de cette boucle posait les variables
 * d'environnement du proxy sans declarer le serveur, et l'agent repondait
 * « aucune connexion au CRM disponible » tout en ayant l'air de fonctionner.
 * Une panne de ce genre se lit comme une hallucination du modele.
 *
 * `required=true` est volontaire : mieux vaut un travail en echec explicite
 * qu'une reponse inventee faute de donnees.
 */
function argumentsMcp(payload) {
  if (!payload.mcpProxyBaseUrl || !payload.mcpProxyAccessToken) return [];

  const racine = path.resolve(__dirname, "..");
  const bundle = [
    process.env.BRIDGE_MCP_PATH,
    path.join(racine, "dist", "mcp.cjs"),
    path.join(racine, "mcp.cjs"),
  ].filter(Boolean).find((c) => fs.existsSync(c));

  const source = path.join(racine, "server", "mcp.ts");
  if (!bundle && !fs.existsSync(source)) return [];

  const commande = bundle ? process.execPath : "npx";
  const args = bundle ? [bundle] : ["tsx", source];

  const env = {
    BRIDGE_MCP_PROXY_BASE_URL: payload.mcpProxyBaseUrl,
    BRIDGE_MCP_PROXY_ACCESS_TOKEN: payload.mcpProxyAccessToken,
    ...(payload.mcpProxyActionsPath
      ? { BRIDGE_MCP_PROXY_ACTIONS_PATH: payload.mcpProxyActionsPath }
      : {}),
    ...(bundle ? { ELECTRON_RUN_AS_NODE: process.env.ELECTRON_RUN_AS_NODE ?? "1" } : {}),
  };

  const nom = "bridge";
  return [
    "-c", `mcp_servers.${nom}.command=${JSON.stringify(commande)}`,
    "-c", `mcp_servers.${nom}.args=${JSON.stringify(args)}`,
    ...Object.entries(env).flatMap(([k, v]) => [
      "-c", `mcp_servers.${nom}.env.${k}=${JSON.stringify(v)}`,
    ]),
    "-c", `mcp_servers.${nom}.enabled=true`,
    "-c", `mcp_servers.${nom}.required=true`,
    "-c", `mcp_servers.${nom}.startup_timeout_sec=20`,
    "-c", `mcp_servers.${nom}.tool_timeout_sec=120`,
    "-c", `mcp_servers.${nom}.default_tools_approval_mode="approve"`,
  ];
}

async function appel(service, chemin, corps) {
  const base = service.launchCallbackUrl || service.healthUrl || service.baseUrl;
  const url = new URL(chemin, base);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${service.serviceToken}`,
    },
    body: JSON.stringify(corps ?? {}),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json().catch(() => ({}));
  return { statut: res.status, data };
}

/**
 * Traduit un evenement JSONL de `codex exec --json` en fragment lisible.
 *
 * On ne fait remonter que ce qui a un sens pour la personne devant l'ecran :
 * le texte de la reponse et les outils appeles. Les evenements de
 * bookkeeping resteraient du bruit dans une conversation.
 *
 * Retourne null pour ce qu'il faut ignorer.
 */
function fragmentDepuisCodex(evt) {
  if (!evt || typeof evt !== "object") return null;
  const type = evt.type || evt.msg?.type;

  if (type === "item.completed" && evt.item?.type === "agent_message") {
    return { kind: "text", data: { text: String(evt.item.text ?? "") } };
  }
  if (type === "agent_message_delta" || type === "item.delta") {
    const delta = evt.delta ?? evt.msg?.delta;
    if (typeof delta === "string" && delta) return { kind: "text", data: { text: delta } };
    return null;
  }
  if (type === "item.started" && evt.item?.type === "command_execution") {
    return { kind: "tool_use", data: { name: "commande", detail: String(evt.item.command ?? "") } };
  }
  if (type === "error") {
    return { kind: "error", data: { error: String(evt.message ?? evt.msg?.message ?? "erreur de l'agent") } };
  }
  return null;
}

/**
 * Execute un travail avec codex et renvoie le texte final.
 *
 * `onFragment` est appele au fil de l'eau. Un echec d'envoi de fragment
 * n'interrompt pas l'execution : perdre un morceau d'affichage vaut mieux
 * que perdre la reponse entiere.
 */
function executerAvecCodex({ binaire, payload, cwd, onFragment }) {
  return new Promise((resolve) => {
    const args = [
      "exec",
      "--json",
      "--skip-git-repo-check",
      "--ignore-user-config",
      "--ignore-rules",
      "--color", "never",
      // Lecture seule : un travail venu d'une application en ligne ne doit
      // pas pouvoir ecrire sur le disque du collaborateur. Les ecritures
      // metier passent par le proxy MCP, donc par l'API du service, qui
      // applique ses propres droits.
      "--sandbox", "read-only",
    ];
    if (Array.isArray(payload.imageUrls)) {
      for (const img of payload.imageUrls) args.push("--image", img);
    }
    args.push(...argumentsMcp(payload));

    const env = { ...process.env };
    if (payload.mcpProxyBaseUrl) env.BRIDGE_MCP_PROXY_BASE_URL = payload.mcpProxyBaseUrl;
    if (payload.mcpProxyAccessToken) env.BRIDGE_MCP_PROXY_ACCESS_TOKEN = payload.mcpProxyAccessToken;

    const enfant = spawn(binaire, args, { cwd, env });
    let reste = "";
    let texte = "";
    let seq = 0;
    let fini = false;

    const minuteur = setTimeout(() => {
      if (fini) return;
      fini = true;
      enfant.kill("SIGTERM");
      resolve({ ok: false, error: "L'agent local n'a pas repondu dans le temps imparti." });
    }, EXECUTION_MAX_MS);

    enfant.stdout.on("data", (buf) => {
      reste += buf.toString();
      const lignes = reste.split("\n");
      reste = lignes.pop() ?? "";
      for (const ligne of lignes) {
        if (!ligne.trim()) continue;
        let evt;
        try {
          evt = JSON.parse(ligne);
        } catch {
          continue; // ligne partielle ou trace hors JSON
        }
        const frag = fragmentDepuisCodex(evt);
        if (!frag) continue;
        if (frag.kind === "text") texte += frag.data.text;
        onFragment({ seq: seq++, kind: frag.kind, data: frag.data });
      }
    });

    let erreurs = "";
    enfant.stderr.on("data", (b) => {
      erreurs += b.toString();
      if (erreurs.length > 4000) erreurs = erreurs.slice(-4000);
    });

    enfant.on("error", (err) => {
      if (fini) return;
      fini = true;
      clearTimeout(minuteur);
      resolve({ ok: false, error: `Agent local injoignable : ${err.message}` });
    });

    enfant.on("close", (code) => {
      if (fini) return;
      fini = true;
      clearTimeout(minuteur);
      if (code === 0) {
        resolve({ ok: true, texte });
        return;
      }
      resolve({
        ok: false,
        error: erreurs.trim() || `L'agent local s'est arrete avec le code ${code}.`,
      });
    });

    enfant.stdin.write(String(payload.prompt ?? ""));
    enfant.stdin.end();
  });
}

/**
 * Une passe : reclame, execute, repond.
 *
 * Volontairement sequentielle par service. Executer deux travaux en parallele
 * sur le meme poste ferait tourner deux agents sur le meme abonnement, ce que
 * le fournisseur peut refuser, et ce qui ralentirait les deux.
 */
async function passeUnService(service, { codexBin, dataDir, journal }) {
  let reclame;
  try {
    reclame = await appel(service, "/bridge/jobs/poll", {
      deviceId: nomDuPoste(),
      limit: 1,
      leaseSeconds: BAIL_S,
    });
  } catch (err) {
    return { erreur: `file injoignable : ${err.message}` };
  }
  if (reclame.statut !== 200) {
    return { erreur: `file refusee (${reclame.statut}) : ${reclame.data?.error ?? ""}`.trim() };
  }
  const jobs = Array.isArray(reclame.data?.jobs) ? reclame.data.jobs : [];
  if (jobs.length === 0) return { traites: 0 };

  for (const job of jobs) {
    journal?.(`${service.name}: travail ${job.id.slice(0, 8)} pris en charge.`);

    if (!codexBin) {
      await appel(service, "/bridge/jobs/complete", {
        jobId: job.id,
        leaseId: job.leaseId,
        status: "failed",
        error:
          "Aucun agent installe sur ce poste. Ouvre Yaka Bridge > Reglages pour installer Codex, " +
          "ou bascule l'assistant en mode en ligne.",
      }).catch(() => null);
      continue;
    }

    const cwd = path.join(dataDir, "jobs", service.serviceId);
    fs.mkdirSync(cwd, { recursive: true });

    // Les fragments partent par lots : un envoi HTTP par mot rendrait le
    // reseau plus lent que l'agent.
    let lot = [];
    let envoiEnCours = Promise.resolve();
    const viderLot = () => {
      if (lot.length === 0) return;
      const aEnvoyer = lot;
      lot = [];
      envoiEnCours = envoiEnCours
        .then(() =>
          appel(service, "/bridge/jobs/events", {
            jobId: job.id,
            leaseId: job.leaseId,
            events: aEnvoyer,
          }),
        )
        .catch(() => null);
    };
    const rythme = setInterval(viderLot, 400);

    const issue = await executerAvecCodex({
      binaire: codexBin,
      payload: job.payload ?? {},
      cwd,
      onFragment: (f) => lot.push(f),
    });

    clearInterval(rythme);
    viderLot();
    await envoiEnCours;

    await appel(service, "/bridge/jobs/complete", {
      jobId: job.id,
      leaseId: job.leaseId,
      status: issue.ok ? "succeeded" : "failed",
      ...(issue.ok ? { result: { texte: issue.texte } } : { error: issue.error }),
    }).catch(() => null);

    journal?.(
      issue.ok
        ? `${service.name}: travail ${job.id.slice(0, 8)} termine.`
        : `${service.name}: travail ${job.id.slice(0, 8)} en echec (${issue.error}).`,
    );
  }
  return { traites: jobs.length };
}

/**
 * Demarre la boucle.
 *
 * `lireServices` est appele a chaque tour plutot qu'une fois au demarrage :
 * la configuration change quand on ajoute un service ou qu'on remplace un
 * jeton, et une liste figee continuerait a interroger l'ancienne adresse.
 */
function demarrerBoucleTravaux({ lireServices, findCodexBin, dataDir, journal }) {
  let enCours = false;

  const tour = async () => {
    if (enCours) return; // un tour lent ne doit pas en declencher un second
    enCours = true;
    try {
      const services = (lireServices() ?? []).filter((s) => s.serviceToken && !s.paused);
      if (services.length === 0) return;
      const codexBin = findCodexBin();
      for (const service of services) {
        const r = await passeUnService(service, { codexBin, dataDir, journal });
        // Une file injoignable est frequente et sans gravite (service arrete,
        // reseau coupe). On ne la signale que si elle a une explication utile.
        if (r.erreur) console.warn(`[jobs] ${service.serviceId}: ${r.erreur}`);
      }
    } catch (err) {
      console.warn(`[jobs] tour interrompu : ${err?.message ?? err}`);
    } finally {
      enCours = false;
    }
  };

  void tour();
  const minuteur = setInterval(() => void tour(), PAS_MS);
  return () => clearInterval(minuteur);
}

module.exports = { demarrerBoucleTravaux, fragmentDepuisCodex };
