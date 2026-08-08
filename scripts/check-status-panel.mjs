#!/usr/bin/env node
/**
 * Verifie la syntaxe du script du panneau Bridge.
 *
 * Le rendu du panneau vit dans une chaine de gabarit, a l'interieur de
 * statusHtml() dans bridge/electron-main.cjs. `node --check` valide le
 * fichier .cjs mais ne regarde jamais ce JS-la : une accolade en trop y
 * passe la verification, puis vide la fenetre au demarrage sans un mot
 * dans les journaux. Deux refontes du panneau sont tombees dans ce trou.
 *
 * Ce script extrait le bloc <script> du gabarit et le passe au parseur.
 */
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SOURCE = "bridge/electron-main.cjs";
const html = readFileSync(SOURCE, "utf8");

// Le fichier contient plusieurs blocs <script> (panneau, overlay voix,
// dialogues). On veut celui du panneau, reconnaissable a sa fonction
// render(state). Les autres interpolent des ${...} du gabarit et ne sont
// pas du JS autonome.
const ANCHOR = "function render(state) {";
const anchorAt = html.indexOf(ANCHOR);
if (anchorAt === -1) {
  console.error(`${SOURCE}: render(state) introuvable, le panneau a change de forme.`);
  process.exit(1);
}
const start = html.lastIndexOf("<script>", anchorAt);
const end = html.indexOf("</script>", anchorAt);
if (start === -1 || end === -1) {
  console.error(`${SOURCE}: bloc <script> du panneau introuvable.`);
  process.exit(1);
}

const script = html.slice(start + "<script>".length, end);
if (script.includes("${")) {
  console.error(
    `${SOURCE}: le script du panneau interpole du gabarit (\${...}).\n` +
      "Ce controle ne sait verifier qu'un script autonome : sortir l'interpolation, " +
      "ou adapter ce script.",
  );
  process.exit(1);
}
/**
 * Le bloc est lu tel qu'il est ecrit dans le gabarit, ou les echappements
 * sont ceux d'une chaine a accents graves : `\\/` dans le source vaut `\/`
 * a l'execution. Sans cette conversion, le parseur voit des expressions
 * regulieres invalides qui n'existent pas vraiment.
 */
function unescapeTemplate(raw) {
  const simples = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", v: "\v", "0": "\0" };
  return raw.replace(/\\(.)/gs, (_, c) => simples[c] ?? c);
}

const tmp = join(tmpdir(), `bridge-status-panel-${process.pid}.js`);
writeFileSync(tmp, unescapeTemplate(script));

try {
  execFileSync(process.execPath, ["--check", tmp], { stdio: "pipe" });
  const lines = script.split("\n").length;
  console.log(`Panneau Bridge : script valide (${lines} lignes).`);
} catch (err) {
  const detail = String(err.stderr ?? err.message).replaceAll(tmp, `${SOURCE} (bloc <script>)`);
  console.error(`Panneau Bridge : script invalide.\n${detail}`);
  process.exitCode = 1;
} finally {
  try {
    unlinkSync(tmp);
  } catch {
    /* fichier temporaire deja parti */
  }
}
