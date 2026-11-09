---
name: ecotrack-app
description: Use whenever editing index.html in this repository — adding or fixing lessons and exercises, changing the Duolingo-style interface, persistence and localStorage, ECO1 backup codes, exam mode, drag-and-drop, or the Cassandra TP3 content. Load it before any content change so exercise IDs and saved progress stay valid.
---

# EcoTrack App

Application d'entraînement au TP3 Cassandra (EcoTrack) et au cours NoSQL, dans un seul `index.html`. Lire `AGENTS.md` à la racine du dépôt avant une modification de structure.

## Invariants

- Un seul fichier applicatif. Pas de build, pas de framework, pas de dépendance, pas de CSS/JS séparé.
- L'application doit fonctionner en `file://` et sur un hébergement statique.
- Interface en français, ton tutoyé, mots-clés CQL en majuscules.
- Script en style ES5 : `var`, fonctions nommées, concaténation de chaînes.
- `innerHTML` est le rendu ; échapper toute donnée dynamique avec `esc()`.
- `P.done` est indexé par leçon, `P.wr` par identifiant d'exercice.
- Les identifiants valent `lessonIndex-exerciseIndex` (0-based), calculés par position.
- `SP` est un tableau parallèle à `L` pour les énoncés de TP.
- Ne pas renommer `cassduo` ou `cassduo_ui` sans migration.

## Carte rapide de `index.html`

| Repère | Contenu |
| --- | --- |
| `var W=` … `var L=[` | helpers CQL, constantes `T1`–`T3`, `CM` |
| `var L=[` | leçons et exercices |
| `var P=` | état persistant, `save()`, `cloud()` |
| `function esc` / `nz` / `ans` | utilitaires de rendu et de comparaison |
| `var D=` / `function I` | icônes SVG |
| `function home` / `show` / `settings` | vues |
| `function check` / `next` / `finish` | moteur d'exercice |
| `function makeCode` / `parseCode` / `mergeCode` | sauvegarde `ECO1` |
| `var SP=[` | énoncés de TP |
| `function drBegin` / `drMove` / `drDrop` | glisser-déposer |

## Formes d'exercice

```js
// QCM
{ q: "…", o: ["…", "…"], a: 0, e: "…" }

// Saisie, avec variantes acceptées
{ q: "…", t: ["…", "…"], e: "…" }

// Blocs, avec intrus
{ q: "…", b: ["SELECT", "*", "FROM", "mesures", ";"], x: ["ALL"], e: "…" }
```

Une seule forme par exercice. `b` est ordonné et joint par des espaces. `x` est mélangé aux bons jetons dans la banque.

## Workflow

1. Lire la section concernée de `AGENTS.md`.
2. Pour un exercice : l'ajouter à la fin de `ex` d'une leçon.
3. Pour une leçon : l'ajouter à la fin de `L`, puis ajouter `SP` au même index (`null` autorisé).
4. Écrire un `q` autosuffisant, un `e` factuel, et varier la position de la bonne réponse d'un QCM.
5. Vérifier la réponse CQL à la main.
6. Lancer `node scripts/verify.mjs`.
7. Tester dans le navigateur : clair/sombre, 320 px, clavier, persistance, rechargement.

## Vérification

```sh
node scripts/verify.mjs
python3 -m http.server 8000   # test manuel
```

Le script contrôle la syntaxe du script inline, la structure de `L`, les types de réponse, les bornes de `a`, les variantes vides, les blocs vides, la longueur de `SP`, l'unicité des identifiants et l'absence d'`eval`.

## Dette connue

- Les 28 QCM ont leur réponse en position 0 (`a: 0`). Varier les positions ou mélanger les options avec remappage de `a`.
- L'XP d'un examen blanc n'est pas ajouté à `P.xp`.
- `nz()` supprime tous les espaces : la comparaison est tolérante, pas un validateur CQL.
- Pas de service worker, pas de manifeste, pas de test navigateur automatisé.

## Skills à charger avec celui-ci

- `antislop` + `antislop-ui` pour toute modification visuelle.
- `antislop-human` ou `frontend-a11y` pour le clavier, le contraste ou les états.
- `break-ui` pour tester les cas extrêmes.
- `code-review` avant de rendre un diff.
