// Règle du Ludo : deux pions de la même couleur sur une même case forment un bloc
// protégé, un pion adverse qui arrive dessus ne peut pas les capturer.
// Usage : node outils/appliquer-pions-empiles.mjs   (depuis la racine du projet)

import fs from "node:fs";
import path from "node:path";

const racine = process.cwd();
const rel = "src/lib/ludo-engine.ts";
const chemin = path.join(racine, rel);

function arreter(message) {
  console.log("ARRET : " + message + " -- rien n'a ete modifie");
  process.exit(1);
}

const brut = fs.readFileSync(chemin, "utf8").replace(/^\uFEFF/, "");
const crlf = brut.includes("\r\n");
let t = brut.replace(/\r\n/g, "\n");

if (t.includes("PION_EMPILES")) arreter("le moteur contient deja la regle des pions empiles");

const capture =
  'if (otherT.state === "track" && otherT.trackPos === token.trackPos) {';
const ia = 'if (otherT.state === "track" && otherT.trackPos === dest) {';
const compte = (texte, sous) => texte.split(sous).length - 1;

if (compte(t, capture) !== 1) arreter("condition de capture introuvable");
if (compte(t, ia) !== 1) arreter("condition de capture de l'IA introuvable");

t = t.replace(
  capture,
  'if (\n' +
    '                otherT.state === "track" &&\n' +
    '                otherT.trackPos === token.trackPos &&\n' +
    '                // PION_EMPILES : deux pions de la meme couleur sur la case = bloc protege\n' +
    '                otherP.tokens.filter((x) => x.state === "track" && x.trackPos === token.trackPos).length < 2\n' +
    '              ) {'
);
t = t.replace(
  ia,
  'if (\n' +
    '                otherT.state === "track" &&\n' +
    '                otherT.trackPos === dest &&\n' +
    '                otherP.tokens.filter((x) => x.state === "track" && x.trackPos === dest).length < 2\n' +
    '              ) {'
);

fs.mkdirSync(path.join(racine, "sauvegardes-securite"), { recursive: true });
fs.copyFileSync(chemin, path.join(racine, "sauvegardes-securite", "src__lib__ludo-engine.ts"));
fs.writeFileSync(chemin, crlf ? t.replace(/\n/g, "\r\n") : t, "utf8");
console.log("OK : regle des pions empiles appliquee (sauvegarde dans sauvegardes-securite)");
