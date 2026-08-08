#!/usr/bin/env node
import { spawn } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const NEXT_ENV_VAR = "{{APP_NAME_KEBAB_UPPER}}_NEXT_PORT";
const NEXT_PORT_PLACEHOLDER = "{{NEXT_PORT}}";
const NEXT_PORT =
  process.env[NEXT_ENV_VAR] ??
  process.env.NEXT_PORT ??
  (/^\d+$/.test(NEXT_PORT_PLACEHOLDER) ? NEXT_PORT_PLACEHOLDER : "3307");

const standaloneServer = resolve(".next", "standalone", "server.js");

/**
 * La sortie `output: "standalone"` de Next n'est pas auto-suffisante, malgre
 * ce que son nom laisse croire : elle contient le serveur et les modules,
 * mais ni `.next/static` ni `public`. Next attend que le deploiement les
 * copie lui-meme.
 *
 * Sans cette copie, le serveur demarre et sert le HTML, puis chaque
 * `/_next/static/...` repond 404 : pas de feuille de style, pas de bundle
 * client, donc aucune hydratation React. L'application s'affiche, en texte
 * brut et sans le moindre bouton qui reagit, ce qui ressemble a tout sauf a
 * un probleme de fichiers manquants.
 *
 * La copie est idempotente et se fait au demarrage plutot qu'au build, pour
 * reparer aussi les builds deja produits.
 */
function syncStandaloneAssets() {
  if (!existsSync(standaloneServer)) return;
  const pairs = [
    [resolve(".next", "static"), resolve(".next", "standalone", ".next", "static")],
    [resolve("public"), resolve(".next", "standalone", "public")],
  ];
  for (const [from, to] of pairs) {
    if (!existsSync(from)) continue;
    cpSync(from, to, { recursive: true });
  }
}

syncStandaloneAssets();

const command = existsSync(standaloneServer) ? process.execPath : "next";
const args = existsSync(standaloneServer) ? [standaloneServer] : ["start", "-p", String(NEXT_PORT)];

const child = spawn(command, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: String(NEXT_PORT),
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
