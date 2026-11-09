# EcoTrack · Cassandra

Application web pour réviser le TP3 Cassandra (EcoTrack) et le cours NoSQL, dans une interface façon Duolingo.

Tout tient dans un seul fichier : `index.html`. Pas de build, pas de dépendance, pas de framework, pas de serveur obligatoire.

## Contenu

- **13 leçons** : les 11 étapes du TP, la théorie du cours et les commandes du cours.
- **63 exercices** : 28 QCM, 12 commandes à taper, 23 commandes à reconstruire par blocs.
- **Parcours progressif** : une leçon débloque la suivante, avec 5 cœurs par leçon.
- **Examen blanc** : 20 questions tirées au hasard, note sur 20 et record personnel.
- **Révision des erreurs** : les questions ratées reviennent dans une session dédiée.
- **Script CQL** : une fois le parcours terminé, l'application génère le script complet du TP, prêt à copier.
- **Sauvegarde locale** : progression, XP, série et erreurs dans le navigateur.
- **Transfert entre appareils** : code `ECO1…` à copier-coller, sans compte ni serveur.
- **Synchronisation cloud optionnelle** : si la page est hébergée dans un artifact claude.ai, la progression se synchronise via `window.claude`.
- **Confort** : thème sombre automatique, taille de texte réglable, animations réduites si demandé, navigation clavier et glisser-déposer tactile.

## Lancer l'application

Le plus simple :

```sh
open index.html
```

Ou avec un petit serveur local, utile pour tester le presse-papiers et la persistance dans des conditions proches de la production :

```sh
python3 -m http.server 8000
# puis http://localhost:8000
```

L'application fonctionne aussi hors ligne une fois la page chargée. Les polices Google Fonts ont des fallbacks système si le réseau est absent.

## Vérifier le contenu

Un contrôle statique vérifie la syntaxe JavaScript, la structure des leçons et la cohérence des exercices :

```sh
node scripts/verify.mjs
```

Le script échoue si un exercice n'a pas exactement un type de réponse, si un QCM pointe hors de ses options, si une réponse vide existe ou si le tableau des énoncés du TP ne correspond plus aux leçons.

## Structure

```text
.
├── index.html              # application complète : HTML, CSS, JS et contenu
├── scripts/
│   └── verify.mjs          # vérification statique du contenu
├── .agents/
│   └── skills/             # skills projet pour les agents de code
├── .github/
│   └── workflows/
│       └── verify.yml      # vérification automatique sur GitHub
├── AGENTS.md               # consignes complètes pour les agents IA
├── CONTRIBUTING.md         # règles pour contribuer
├── README.md
├── .editorconfig
├── .gitignore
└── .nojekyll
```

## Modèle de contenu

Les leçons vivent dans le tableau `L` de `index.html`. Chaque leçon a un nom, une icône, une liste d'exercices et un énoncé de TP optionnel.

```js
{
  n: "Keyspace",
  ic: "database",
  ex: [
    {
      q: "Quelle stratégie de réplication pour un keyspace de TP sur un seul nœud ?",
      o: ["SimpleStrategy", "NetworkTopologyStrategy", "LocalStrategy", "RandomStrategy"],
      a: 0,
      e: "SimpleStrategy suffit pour un seul datacenter (ici replication_factor = 1)."
    }
  ]
}
```

Trois formes d'exercice, exclusives l'une de l'autre :

| Champ | Type | Réponse attendue |
| --- | --- | --- |
| `o` + `a` | QCM | index de la bonne option dans `o` |
| `t` | texte ou tableau de textes | réponse tapée, comparée sans casse ni espaces |
| `b` + `x` | blocs | suite ordonnée de `b`, avec `x` comme intrus |

Le champ `e` contient l'explication affichée après correction. `AGENTS.md` détaille les invariants à respecter avant de modifier le contenu.

## Progression et sauvegarde

| Clé | Contenu |
| --- | --- |
| `cassduo` | progression complète : `done`, `xp`, `streak`, `last`, `best`, `wr` |
| `cassduo_ui` | préférence de taille de texte |
| `data/users/<id>/progress` | document cloud, uniquement si `window.claude` est disponible |

Le code de sauvegarde `ECO1.<base64url>.<somme>` contient les leçons validées, l'XP, la série, le record et les identifiants d'exercices à revoir. La somme est un contrôle d'intégrité, pas une sécurité. À l'import, le code est validé puis fusionné sans jamais écraser une progression plus avancée.

## Déploiement

Le site est entièrement statique. Il peut être servi depuis GitHub Pages, Netlify, Vercel ou n'importe quel hébergeur de fichiers. Le fichier `.nojekyll` évite le traitement Jekyll sur GitHub Pages.

Aucune variable d'environnement, aucun secret et aucune étape de build ne sont nécessaires.

## Accessibilité

- Cibles tactiles d'au moins 44 px, focus visible, libellés ARIA sur les boutons icône.
- Navigation complète au clavier : `Entrée` valide, flèches gauche/droite réordonnent les blocs, `Retour arrière` retire un bloc, `Échap` annule un glisser.
- Animations désactivées avec `prefers-reduced-motion`.
- Thème sombre automatique avec `prefers-color-scheme`.
- Taille de texte réglable de 90 % à 130 %.
- Zoom navigateur non bloqué.

## Limites connues

- Les 28 QCM ont leur bonne réponse en première position (`a: 0`). C'est un point à corriger côté contenu.
- Les trois `INSERT` complets (stations, mesures, events) se reconstruisent par blocs et non en saisie libre : la comparaison de chaîne exacte est trop punitive sur des collections imbriquées. La saisie reste utilisée sur les `UPDATE`, `DELETE` et `SELECT`.
- L'XP gagné pendant un examen blanc n'est pas ajouté au total permanent.
- Pas de service worker ni de manifeste : l'application n'est pas installable comme PWA.
- Les polices viennent de Google Fonts ; le rendu reste correct hors ligne grâce aux fallbacks.

## Contribuer

Lire `CONTRIBUTING.md` pour les règles humaines et `AGENTS.md` pour les conventions destinées aux agents de code. Avant toute proposition :

```sh
node scripts/verify.mjs
```

## Auteur

- GitHub : [abdu-63](https://github.com/abdu-63)
- Instagram : [@abdu.plt](https://www.instagram.com/abdu.plt/)
- LinkedIn : [Rahman Palta](https://www.linkedin.com/in/rahman-palta)
