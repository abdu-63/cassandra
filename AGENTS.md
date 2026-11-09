# AGENTS.md

Consignes pour les agents de code qui travaillent sur ce dépôt. Lire ce fichier en entier avant de modifier `index.html`.

## 1. Mission

`index.html` est une application d'entraînement au TP3 Cassandra (EcoTrack) et au cours NoSQL. L'interface reprend les codes de Duolingo : parcours de leçons, cœurs, XP, série, examen blanc, correction immédiate.

Le public est francophone, principalement étudiant. Le ton est direct, encourageant, tutoyé. Le contenu technique doit rester exact : une requête CQL fausse est un bug plus grave qu'un bouton mal aligné.

## 2. Règles d'or

1. **Un seul fichier applicatif.** Tout le HTML, le CSS, le JavaScript et le contenu vivent dans `index.html`. Ne pas introduire de bundler, de framework, de module ES, de dépendance npm ni de fichier CSS/JS séparé.
2. **Zéro build.** L'application doit continuer à fonctionner en ouvrant `index.html` directement et sur un hébergement statique.
3. **Pas de réseau obligatoire.** Les seules ressources externes sont les polices Google Fonts et, optionnellement, l'API `window.claude` quand la page est hébergée dans un artifact claude.ai. Ne pas ajouter d'analytics, de CDN JavaScript ou de tracker.
4. **Français d'abord.** Toute l'interface, les questions, les explications et les messages sont en français. Les mots-clés CQL restent en majuscules (`SELECT`, `INSERT`, `PRIMARY KEY`).
5. **ES5 par défaut.** Le script existant utilise `var`, des déclarations `function` et de la concaténation de chaînes. Garder ce style pour la cohérence et la compatibilité. Les API navigateur modernes (`closest`, `Math.hypot`, `Object.assign`, `Promise`, Pointer Events) sont autorisées.
6. **Ne pas casser la progression sauvegardée.** Les clés `localStorage`, le schéma de `P` et les identifiants d'exercices sont un contrat. Toute modification de structure exige une migration ou une remise à zéro explicite.
7. **Échapper le texte dynamique.** Tout contenu affiché via `innerHTML` qui ne vient pas d'une constante de confiance doit passer par `esc()`. Cela inclut les réponses tapées, les codes importés et les messages d'erreur.
8. **Vérifier avant de rendre.** Lancer `node scripts/verify.mjs`, puis dérouler la checklist manuelle de la section 11.
9. **Ne pas committer `.DS_Store`.** Le fichier est ignoré et a été retiré de l'index Git.
10. **Ne pas inventer de contenu CQL.** Si une commande, un type ou une contrainte n'est pas certain, le signaler au lieu de compléter au hasard.

## 3. Carte du dépôt

```text
index.html              application complète
scripts/verify.mjs      vérification statique (Node, zéro dépendance)
AGENTS.md               ce fichier
README.md               présentation humaine
CONTRIBUTING.md         règles de contribution
.editorconfig           style d'édition
.gitignore              fichiers ignorés
.nojekyll               désactive Jekyll sur GitHub Pages
.agents/skills/         skills projet, copiés depuis ~/.agents/skills
.github/workflows/      vérification automatique
```

## 4. Anatomie de `index.html`

Le fichier suit cet ordre. Les repères sont des extraits de code, pas des numéros de ligne, car le fichier bouge.

1. **`<head>`** : métadonnées, favicon SVG inline, préconnexion Google Fonts, feuille de style inline.
2. **CSS** : variables de design dans `:root`, thème sombre via `prefers-color-scheme`, composants (`.node`, `.chip`, `.opt`, `.foot`…), media query `prefers-reduced-motion`.
3. **Corps** : `<div id="app"></div>` et un `<noscript>`.
4. **Script inline**, dans cet ordre :
   - helpers CQL : `W`, `im`, `is`, `ie`, `U`, `SEL`, constantes `T1`–`T3`, `CM` ;
   - données : `var L=[…]` (leçons et exercices) ;
   - état persistant `P`, `save()`, `cloud()` ;
   - utilitaires : `esc`, `shuf`, `nz`, `ans`, `allDone` ;
   - icônes SVG : objet `D`, fonction `I(name, size, filled)` ;
   - vues : `home()`, `show()`, `settings()`, `script()` ;
   - moteur d'exercice : `start`, `cur`, `exam`, `pick`, `check`, `next`, `finish` ;
   - code de sauvegarde : `makeCode`, `parseCode`, `mergeCode` ;
   - énoncés de TP : `var SP=[…]` puis `L.forEach(…)` qui attache `l.sp` ;
   - glisser-déposer : `DR`, `drBegin`, `drMove`, `drDrop` ;
   - clavier global ;
   - amorçage : `applyUI(); home(); cloud();`.

Il n'y a pas de modules : les fonctions sont globales et appelées par des attributs `onclick="…"` dans le HTML généré. Renommer une fonction impose de mettre à jour ses appels inline.

## 5. Modèle de contenu

### 5.1 Leçon

```js
{
  n: "Nom affiché",        // requis, français
  ic: "database",          // requis, clé de l'objet D
  ex: [ /* exercices */ ], // requis, au moins un
  sp: "<b>Énoncé…</b>"     // ajouté au runtime depuis SP, pas dans L
}
```

`sp` est un fragment HTML affiché dans un panneau repliable au-dessus de l'exercice. Il est défini dans le tableau `SP`, à la même position que la leçon. Chaque leçon qui contient un exercice de blocs ou de saisie doit avoir un énoncé : il porte les colonnes, les types et les valeurs que la question ne répète pas.

### 5.2 Exercice

Champs communs :

| Champ | Requis | Rôle |
| --- | --- | --- |
| `q` | oui | énoncé de la question |
| `e` | oui | explication affichée après correction |
| `id` | calculé | `lessonIndex-exerciseIndex`, ajouté au runtime |

Une seule forme de réponse par exercice :

| Forme | Champs | Vérification |
| --- | --- | --- |
| QCM | `o` (tableau de 2 à 4 chaînes), `a` (index 0-based) | `S.sel == ex.a` |
| Saisie | `t` (chaîne ou tableau de variantes acceptées) | comparaison normalisée |
| Blocs | `b` (tableau ordonné), `x` (intrus optionnels) | concaténation exacte |

Règles de contenu :

- **QCM** : varier la position de la bonne réponse. Toutes les questions actuelles utilisent `a: 0`, ce qui est un défaut connu. Ne pas ajouter un nouveau QCM avec la réponse toujours en premier.
- **Saisie** : `t` accepte plusieurs orthographes si nécessaire (par exemple `43.30` et `43.3`). La comparaison `nz()` ignore la casse, les espaces, les guillemets typographiques et les points-virgules finaux. Pour une clause `WHERE … AND …`, l'ordre des deux conditions peut être inversé.
- **Blocs** : `b` doit produire une requête valide une fois les jetons joints par une espace. Les jetons incluent leur ponctuation (`"mesures",`, `");"`). `x` contient des jetons crédibles mais faux ; ils sont mélangés aux bons dans la banque.
- **Explication** : courte, factuelle, elle explique la règle CQL ou la contrainte du TP. Pas de remplissage.

### 5.3 Identifiants et stabilité

Les identifiants sont attribués par position :

```js
L.forEach(function(l,i){l.ex.forEach(function(e,k){e.id=i+"-"+k})});
```

Conséquences :

- `P.done` est indexé par **index de leçon** (0-based).
- `P.wr` est indexé par **identifiant d'exercice** (`"3-2"`).
- `spCard` retrouve l'énoncé avec `parseInt(ex.id)`, donc l'identifiant doit commencer par l'index de la leçon.
- **Ajouter une leçon à la fin** est sûr. **Ajouter un exercice à la fin d'une leçon** est sûr. **Insérer au milieu** décale tous les identifiants suivants et invalide la progression existante.
- Si une insertion au milieu est indispensable : incrémenter `VERSION`, prévoir une migration de `P.done` et `P.wr`, ou assumer une remise à zéro. Documenter le choix.

### 5.4 Énoncés du TP (`SP`)

`SP` est un tableau parallèle à `L`. Il contient du HTML (balises `<b>`, `<code>`, `<ul>`, `<li>`). Il est attaché aux leçons par :

```js
L.forEach(function(l,i){l.sp=SP[i]});
```

Toute leçon ajoutée doit avoir une entrée `SP` au même index, même si elle vaut `null`. `scripts/verify.mjs` vérifie que les deux tableaux ont la même longueur.

## 6. État runtime et persistance

### 6.1 État persistant `P`

```js
P = { done: [], xp: 0, streak: 0, last: "", best: 0, wr: {} }
```

| Champ | Sens |
| --- | --- |
| `done` | booléens par index de leçon |
| `xp` | XP cumulé des leçons |
| `streak` | série de jours consécutifs |
| `last` | `Date.toDateString()` du dernier jour actif |
| `best` | meilleure note d'examen sur 20 |
| `wr` | map `exerciseId → 1` des exercices à revoir |

`save()` normalise `P.done` sur la longueur de `L`, écrit `localStorage["cassduo"]`, puis pousse vers le cloud si `DB` existe.

### 6.2 État de session `S`

`S` décrit la session en cours : `li` (leçon), `exam`, `rev`, `ex`, `q`, `pos`, `hearts`, `xp`, `ok`, `total`, `sel`, `placed`, `bank`, `st`, `txt`, `hint`, `fresh`, `fbk`, `miss`, `spHide`, `fid`.

- `st` vaut `"ask"` ou `"done"`.
- `placed` contient les identifiants de blocs placés, dans l'ordre.
- `bank` est la liste mélangée `{t, id}` des blocs et intrus.
- `fid` sert à restaurer le focus après un réordonnancement clavier.

### 6.3 Clés de stockage

| Clé | Portée | Contenu |
| --- | --- | --- |
| `cassduo` | locale | `P` sérialisé |
| `cassduo_ui` | locale | `{ size: 90 \| 100 \| 115 \| 130 }` |
| `data/users/<id>/progress` | cloud | copie de `P` via `window.claude` |
| `__t` | locale | test de disponibilité de `localStorage`, supprimé aussitôt |

Ne pas renommer ces clés sans migration. `LS` mémorise si `localStorage` est utilisable ; l'application doit rester fonctionnelle sans stockage.

### 6.4 Code de sauvegarde

Format : `ECO1.<base64url(JSON)>.<djb2(base64)>`.

```js
{ v: 1, d: "010…", x: 120, s: 3, l: "Mon Nov 08 2026", b: 16, w: [ "3-2" ] }
```

`parseCode` vérifie le préfixe, la longueur, les types, les bornes et les identifiants d'exercice. `mergeCode` fusionne sans régression : union des leçons validées, maximum pour l'XP et le record, maximum pour la série en cas de même date, union des erreurs.

Le checksum djb2 détecte une corruption de copier-coller. **Ce n'est pas une sécurité.** Ne jamais s'en servir comme authentification.

### 6.5 Synchronisation cloud

`cloud()` ne fait rien si `window.claude` ou `claude.use` est absent. Sinon :

1. ouvre les services `db` et `user` ;
2. lit `data/users/<user id>/progress` ;
3. fusionne avec l'état local sans écraser une progression plus avancée ;
4. conserve le handle `DB` pour les `save()` suivants.

Ne pas supposer que le cloud est disponible. Toute nouvelle fonctionnalité doit avoir un chemin local complet.

## 7. Conventions de code

### JavaScript

- Style existant : `var`, fonctions nommées, concaténation de chaînes, objets littéraux compacts.
- Éviter de reformater tout le fichier : les diffs doivent rester lisibles.
- Les fonctions sont globales parce que le HTML généré les appelle en inline. Si une fonction est renommée, chercher toutes les occurrences `onclick="…"`.
- `innerHTML` est le mécanisme de rendu. Construire le HTML avec des chaînes, échapper les données avec `esc()`, puis réaffecter `A.innerHTML`.
- Ne pas utiliser `eval`, `new Function` ou `document.write` dans l'application.
- Les événements tactiles passent par Pointer Events (`pointerdown`, `pointermove`, `pointerup`), pas par des bibliothèques.
- Les animations doivent rester désactivables par `prefers-reduced-motion`.

### HTML et CSS

- Unités en `rem`, largeur maximale `40rem`, mise en page mobile d'abord.
- Couleurs et rayons via les variables `--bg`, `--fg`, `--mut`, `--bd`, `--g`, `--b`, `--r`, `--o`, `--card`, etc. Ne pas coder une couleur en dur si une variable existe.
- Le thème sombre est automatique. `data-theme="light"` sur `<html>` force le thème clair, mais aucun bouton ne l'expose aujourd'hui.
- Utiliser `.sr-only`-like si nécessaire, mais l'accessibilité actuelle repose surtout sur `aria-label`, `role` et le focus visible.
- Ne pas ajouter de `!important` sauf nécessité mesurée.

### Textes

- Français, tutoiement, phrases courtes.
- Pas d'emoji dans l'interface.
- Pas de vocabulaire marketing (“révolutionnaire”, “ultime”, “seamless”).
- Les explications techniques nomment la règle : clé de partition, clustering key, tombstone, upsert, TTL, `WRITETIME`.
- Les liens externes gardent `target="_blank"` et `rel="noopener noreferrer"`.

### Icônes

- Les tracés SVG sont dans `D`, au format `viewBox="0 0 24 24"`.
- Ajouter une icône : ajouter une clé dans `D`, puis appeler `I("nom", taille, rempli)`.
- Les icônes décoratives doivent rester `aria-hidden="true"` (déjà géré par `I`).

## 8. Recettes

### Ajouter un exercice

1. Choisir la leçon cible et ajouter l'exercice **à la fin** de `ex` pour ne pas décaler les identifiants.
2. Choisir une seule forme : `o/a`, `t` ou `b/x`.
3. Écrire un `q` autosuffisant et un `e` utile.
4. Vérifier la réponse à la main, puis lancer `node scripts/verify.mjs`.
5. Tester l'exercice dans le navigateur, en mode clair et sombre.

### Ajouter une leçon

1. Ajouter la leçon **à la fin** de `L` (ou assumer la migration des identifiants).
2. Ajouter une entrée au même index dans `SP`, même si c'est `null`.
3. Choisir une icône existante dans `D`, ou en ajouter une.
4. Vérifier que le déblocage séquentiel fonctionne (`home()` verrouille tant que la précédente n'est pas validée).
5. Mettre à jour les compteurs du README si le nombre de leçons ou d'exercices change.
6. Lancer `node scripts/verify.mjs`.

### Corriger une réponse

- **QCM** : modifier `a`, pas l'ordre des options, sauf si toutes les options doivent être réécrites. Si tu introduis un mélange des options à l'affichage, il faut remapper `a` après le mélange.
- **Saisie** : ajouter une variante dans le tableau `t` plutôt que de relâcher la comparaison globale.
- **Blocs** : corriger les jetons de `b` dans l'ordre exact de la requête ; garder `x` crédible.

### Ajouter un énoncé de TP

1. Écrire le fragment HTML dans `SP` à l'index de la leçon.
2. Utiliser `<b>`, `<code>`, `<ul>`, `<li>` et échapper les caractères spéciaux (`&lt;`, `&gt;`).
3. Ne pas dupliquer une explication déjà présente dans `e`.
4. Vérifier le rendu dans le panneau repliable sur mobile.

### Modifier le design

1. Passer par les variables CSS de `:root` en premier.
2. Vérifier les deux thèmes (clair et sombre).
3. Vérifier le contraste avec le skill `antislop-human` si un couple de couleurs change.
4. Vérifier à 320 px de large, puis sur desktop.
5. Ne pas casser les cibles tactiles de 44 px minimum.

### Changer une clé de stockage

1. Écrire une migration au démarrage : lire l'ancienne clé, transformer, écrire la nouvelle, supprimer l'ancienne.
2. Garder la lecture de l'ancienne clé au moins une version.
3. Tester avec une progression existante, pas seulement avec un stockage vide.

## 9. Accessibilité

L'application doit rester utilisable au clavier et sur mobile.

- Chaque bouton icône a un `aria-label` explicite.
- Les groupes de choix utilisent `role="radio"` / `aria-checked` quand c'est pertinent.
- Le focus visible est global (`:focus-visible`). Ne pas le supprimer.
- Les blocs placés se réordonnent avec les flèches gauche/droite, se retirent avec `Retour arrière` ou `Suppr`.
- `Entrée` déclenche le bouton principal, sauf dans un `textarea` sans `Ctrl`/`Cmd`.
- `Échap` annule un glisser en cours.
- Les animations sont coupées par `prefers-reduced-motion`.
- Les feedbacks de correction devraient être annoncés (`role="status"` ou `aria-live="polite"`) ; c'est une amélioration souhaitable.
- Ne pas bloquer le zoom (`user-scalable=no` interdit).

## 10. Sécurité

Le modèle de menace est limité : application statique, pas de compte, pas de serveur applicatif.

- Ne jamais injecter de HTML non échappé depuis une saisie utilisateur, un code importé ou une réponse de l'API cloud.
- Le code `ECO1` est une donnée non fiable : il est parsé, borné et validé avant fusion. Ne pas retirer ces contrôles.
- Ne pas ajouter de secret, de clé API ou de token dans le fichier.
- Ne pas ajouter de dépendance distante sans demande explicite.
- Les liens externes conservent `rel="noopener noreferrer"`.
- La CSP n'est pas définie à cause du script inline ; si elle est ajoutée un jour, prévoir `'unsafe-inline'` ou externaliser, ce qui contredit la règle du fichier unique. Documenter le compromis.

## 11. Vérification

### Automatique

```sh
node scripts/verify.mjs
```

Le script vérifie :

- la présence du doctype, de `lang="fr"`, du viewport et de `#app` ;
- la compilation du script inline ;
- la structure de `L` : tableau non vide, exercices non vides, un seul type de réponse par exercice ;
- les QCM : options non vides et index `a` dans les bornes ;
- les saisies : variantes non vides ;
- les blocs : `b` non vide, `x` valide, aucun jeton vide ;
- la longueur de `SP` égale à celle de `L` ;
- l'unicité des identifiants ;
- des avertissements si tous les QCM ont `a: 0` ou si un `TODO` reste dans le fichier ;
- des erreurs si `VERSION` est invalide ou si `eval` / `new Function` apparaît.

### Manuelle

À faire dans un navigateur, idéalement via `python3 -m http.server` :

1. La page d'accueil s'affiche sans erreur console.
2. Une leçon se lance, les 5 cœurs sont visibles, une mauvaise réponse retire un cœur.
3. Une bonne réponse affiche l'explication et ajoute l'XP attendu.
4. Un QCM, une saisie et un exercice de blocs fonctionnent.
5. Le glisser-déposer fonctionne à la souris et au doigt.
6. Les flèches réordonnent un bloc, `Retour arrière` le retire.
7. La progression survit à un rechargement.
8. Le code `ECO1` se génère, se copie et s'importe dans un autre profil de navigateur.
9. L'examen blanc tire 20 questions et affiche une note sur 20.
10. La révision des erreurs ne contient que les exercices ratés.
11. Le script CQL est complet une fois toutes les leçons validées.
12. Le thème sombre et le thème clair sont lisibles.
13. La taille de texte 130 % ne casse pas la mise en page.
14. À 320 px, aucun débordement horizontal.
15. La réinitialisation demande bien deux appuis.

## 12. Skills du projet

Les skills sont dans `.agents/skills/`. OpenCode les découvre automatiquement ; ils sont aussi compatibles avec la convention `.claude/skills`. Les copies locales ont priorité sur les skills globaux de même identifiant.

| Skill | Charger quand… |
| --- | --- |
| `antislop` | toujours, comme filtre de base avant de produire du code ou du texte |
| `antislop-ui` | modification de l'interface, des couleurs, de la mise en page ou du motion |
| `antislop-layoutmobile` | mise en page responsive, grilles, débordements, cibles tactiles |
| `antislop-human` | contraste, clavier, focus, états, accessibilité |
| `antislop-code` | écriture ou nettoyage de commentaires |
| `antislop-copywriting` | textes visibles : titres, boutons, messages, explications |
| `frontend-design` | nouvelle direction visuelle ou refonte d'un écran |
| `frontend-a11y` | formulaires, modales, navigation clavier, ARIA |
| `emil-design-eng` | polish d'interaction, détails d'animation, sensation générale |
| `animate` | ajout d'une animation ou d'une transition |
| `review-animations` | critique d'une animation existante |
| `break-ui` | test avec des données extrêmes : noms longs, zéro élément, emoji |
| `code-review` | relecture d'une branche ou d'un diff |
| `security-review` | ajout d'une entrée utilisateur, d'un stockage ou d'un import |
| `ecotrack-app` | toute modification de `index.html` : modèle de contenu, état, rendu, vérification |

Charger un skill avec l'outil `skill` ou en le mentionnant `@skill-id`. Ne pas copier un skill global dans le projet sans raison : les skills globaux restent disponibles.

## 13. Pièges connus et dette

- **QCM déséquilibrés** : 28 QCM sur 28 ont `a: 0`. La bonne réponse est toujours la première option. C'est le premier point à corriger côté contenu.
- **XP d'examen** : `check()` incrémente `S.xp`, mais `finish()` ne l'ajoute pas à `P.xp` pour un examen. Le total permanent ne bouge donc pas pendant un examen blanc.
- **`ans()` et les variantes** : pour une saisie, `ans()` renvoie la première variante acceptée. L'indice affiché prend les trois premiers mots de cette variante. Ordonner les variantes en conséquence.
- **`nz()` supprime tous les espaces** : `SELECT*FROM` passerait la comparaison. C'est tolérant et volontaire ; ne pas s'appuyer dessus pour valider une syntaxe CQL.
- **`spCard` dépend de `parseInt(ex.id)`** : changer le format d'identifiant casse les énoncés de TP.
- **Pas de service worker ni de manifeste** : pas d'installation PWA, pas de cache explicite.
- **Polices distantes** : Google Fonts peut être bloqué ; les fallbacks système prennent le relais.
- **`VERSION`** : constante en haut du script, affichée dans les paramètres et le pied de page. L'incrémenter pour toute livraison visible.
- **`.DS_Store`** : anciennement suivi par Git, désormais ignoré et retiré de l'index.
- **Pas de tests navigateur automatisés** : la vérification est statique plus une checklist manuelle.

## 14. Definition of done

Une modification est terminée quand :

- `node scripts/verify.mjs` passe sans erreur ;
- la checklist manuelle de la section 11 a été déroulée pour les zones touchées ;
- il n'y a pas d'erreur dans la console du navigateur ;
- les thèmes clair et sombre restent lisibles ;
- le parcours clavier et le tactile fonctionnent ;
- la progression existante n'est pas cassée ;
- le contenu CQL a été relu ;
- `README.md` et `AGENTS.md` sont à jour si le modèle de contenu, les commandes ou les fonctionnalités changent ;
- `VERSION` est incrémenté si le changement est visible pour l'utilisateur.
