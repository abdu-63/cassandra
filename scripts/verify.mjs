#!/usr/bin/env node
// Static checks for the single-file app. No dependencies, no DOM needed.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = resolve(root, "index.html");
const html = readFileSync(htmlPath, "utf8");

const passed = [];
const warnings = [];
const errors = [];

function check(label, fn) {
  try {
    fn();
    passed.push(label);
  } catch (error) {
    errors.push(`${label} — ${error.message}`);
  }
}

function fail(message) {
  throw new Error(message);
}

check("HTML : doctype", () => {
  if (!/^<!DOCTYPE html>/i.test(html.trimStart())) fail("doctype manquant");
});

check("HTML : langue", () => {
  if (!/<html\s+lang="fr"/i.test(html)) fail('attribut lang="fr" manquant');
});

check("HTML : encodage", () => {
  if (!/<meta\s+charset="utf-8"/i.test(html)) fail('meta charset="utf-8" manquant');
});

check("HTML : viewport", () => {
  if (!/<meta\s+name="viewport"/i.test(html)) fail("meta viewport manquante");
});

check("HTML : point de montage", () => {
  const matches = html.match(/id="app"/g) || [];
  if (matches.length !== 1) fail(`attendu 1 élément #app, trouvé ${matches.length}`);
});

check("HTML : un seul script inline", () => {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  if (scripts.length !== 1) fail(`attendu 1 script, trouvé ${scripts.length}`);
  if (/<script[^>]+src=/i.test(html)) fail("script externe détecté");
});

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
if (scripts.length !== 1) {
  report();
  process.exit(1);
}

const script = scripts[0][1];

check("JS : compilation", () => {
  new vm.Script(script, { filename: "index.html#inline-script" });
});

function extractArray(name, startMarker, endPattern) {
  const start = script.indexOf(startMarker);
  if (start < 0) fail(`déclaration ${startMarker} introuvable`);
  const match = endPattern.exec(script.slice(start));
  if (!match) fail(`fin de ${name} introuvable`);
  const end = start + match.index + 2;
  const code = script.slice(start, end);
  const context = vm.createContext({});
  return { code, context, value: vm.runInContext(`${code}\n;${name}`, context) };
}

let L;
let SP;

check("Données : chargement de L", () => {
  const found = extractArray("L", "var W=", /\]\s*;\s*var P=/);
  L = found.value;
  if (!Array.isArray(L) || L.length === 0) fail("L doit être un tableau non vide");
});

check("Données : chargement de SP", () => {
  const found = extractArray("SP", "var SP=", /\]\s*;\s*L\.forEach/);
  SP = found.value;
  if (!Array.isArray(SP)) fail("SP doit être un tableau");
});

const stats = { lessons: 0, exercises: 0, qcm: 0, text: 0, blocks: 0, qcmAnswers: {} };
const ids = new Set();

if (Array.isArray(L)) {
  check("Contenu : structure des leçons", () => {
    L.forEach((lesson, lessonIndex) => {
      const where = `leçon ${lessonIndex}`;
      if (!lesson || typeof lesson !== "object") fail(`${where} : objet attendu`);
      if (typeof lesson.n !== "string" || !lesson.n.trim()) fail(`${where} : nom manquant`);
      if (typeof lesson.ic !== "string" || !lesson.ic.trim()) fail(`${where} : icône manquante`);
      if (!Array.isArray(lesson.ex) || lesson.ex.length === 0) {
        fail(`${where} (${lesson.n}) : aucun exercice`);
      }
      stats.lessons++;

      lesson.ex.forEach((exercise, exerciseIndex) => {
        const at = `${where} (${lesson.n}), exercice ${exerciseIndex}`;
        if (!exercise || typeof exercise !== "object") fail(`${at} : objet attendu`);
        if (typeof exercise.q !== "string" || !exercise.q.trim()) fail(`${at} : énoncé q manquant`);
        if (typeof exercise.e !== "string" || !exercise.e.trim()) fail(`${at} : explication e manquante`);

        const kinds = ["o", "t", "b"].filter((key) => exercise[key] != null);
        if (kinds.length !== 1) {
          fail(`${at} : un seul type de réponse attendu, trouvé ${kinds.join(", ") || "aucun"}`);
        }

        const id = `${lessonIndex}-${exerciseIndex}`;
        if (ids.has(id)) fail(`${at} : identifiant dupliqué ${id}`);
        ids.add(id);
        stats.exercises++;

        if (exercise.o != null) {
          stats.qcm++;
          if (!Array.isArray(exercise.o) || exercise.o.length < 2 || exercise.o.length > 4) {
            fail(`${at} : un QCM doit avoir 2 à 4 options`);
          }
          exercise.o.forEach((option, index) => {
            if (typeof option !== "string" || !option.trim()) fail(`${at} : option ${index} vide`);
          });
          if (!Number.isInteger(exercise.a) || exercise.a < 0 || exercise.a >= exercise.o.length) {
            fail(`${at} : index de réponse a invalide (${exercise.a})`);
          }
          stats.qcmAnswers[exercise.a] = (stats.qcmAnswers[exercise.a] || 0) + 1;
        }

        if (exercise.t != null) {
          stats.text++;
          const accepted = Array.isArray(exercise.t) ? exercise.t : [exercise.t];
          if (accepted.length === 0) fail(`${at} : aucune variante de réponse`);
          accepted.forEach((answer, index) => {
            if (typeof answer !== "string" || !answer.trim()) fail(`${at} : variante ${index} vide`);
          });
        }

        if (exercise.b != null) {
          stats.blocks++;
          if (!Array.isArray(exercise.b) || exercise.b.length === 0) fail(`${at} : blocs b vides`);
          if (exercise.x != null && !Array.isArray(exercise.x)) fail(`${at} : intrus x doit être un tableau`);
          [...exercise.b, ...(exercise.x || [])].forEach((token, index) => {
            if (typeof token !== "string" || !token.trim()) fail(`${at} : jeton ${index} vide`);
          });
        }
      });
    });
  });

  check("Contenu : énoncés SP alignés sur L", () => {
    if (!Array.isArray(SP)) fail("SP non chargé");
    if (SP.length !== L.length) fail(`SP a ${SP.length} entrées pour ${L.length} leçons`);
    SP.forEach((statement, index) => {
      if (statement != null && typeof statement !== "string") {
        fail(`SP[${index}] doit être null ou une chaîne HTML`);
      }
    });
  });
}

check("Runtime : schéma d'identifiants", () => {
  if (!script.includes('e.id=i+"-"+k')) fail("attribution e.id=i+\"-\"+k introuvable");
  if (!script.includes("parseInt(ex.id)")) fail("spCard ne dérive plus la leçon depuis ex.id");
});

check("Runtime : clés de stockage", () => {
  if (!script.includes('localStorage.setItem("cassduo"')) fail('clé "cassduo" introuvable');
  if (!script.includes('localStorage.setItem("cassduo_ui"')) fail('clé "cassduo_ui" introuvable');
  if (!script.includes("data/users/")) fail("chemin cloud data/users/ introuvable");
});

check("Runtime : version", () => {
  const match = script.match(/var VERSION=(\d+);/);
  if (!match) fail("constante VERSION introuvable");
  if (!Number.isInteger(Number(match[1])) || Number(match[1]) < 1) fail("VERSION doit être un entier positif");
});

check("Sécurité : pas d'évaluation dynamique", () => {
  if (/\beval\s*\(/.test(script)) fail("eval() détecté");
  if (/new\s+Function\s*\(/.test(script)) fail("new Function() détecté");
});

if (stats.qcm > 0) {
  const positions = Object.keys(stats.qcmAnswers);
  if (positions.length === 1 && Number(positions[0]) === 0) {
    warnings.push(
      `${stats.qcm} QCM sur ${stats.qcm} ont leur réponse en position 0 : varier a ou mélanger les options au rendu.`,
    );
  }
}

if (/\bTODO\b|\bFIXME\b/.test(html)) {
  warnings.push("TODO ou FIXME présent dans index.html.");
}

function report() {
  const line = "─".repeat(58);
  console.log("EcoTrack · Cassandra — vérification\n" + line);
  passed.forEach((label) => console.log(`  ok   ${label}`));
  if (stats.lessons) {
    console.log(line);
    console.log(
      `  ${stats.lessons} leçons · ${stats.exercises} exercices · ` +
        `${stats.qcm} QCM · ${stats.text} saisies · ${stats.blocks} blocs`,
    );
    console.log(`  réponses QCM par position : ${JSON.stringify(stats.qcmAnswers)}`);
  }
  if (warnings.length) {
    console.log(line);
    warnings.forEach((warning) => console.log(`  attention  ${warning}`));
  }
  if (errors.length) {
    console.log(line);
    errors.forEach((error) => console.log(`  erreur     ${error}`));
    console.log(line);
    console.log(`  ${errors.length} erreur(s) — échec`);
    process.exit(1);
  }
  console.log(line);
  console.log(`  ${passed.length} contrôle(s) passé(s) — succès`);
}

report();
