# Skills du projet

Ces skills sont une copie locale de skills globaux, choisie pour ce projet et versionnée avec le dépôt. Ils sont découverts automatiquement par OpenCode (`.agents/skills` est une source de compatibilité projet) et suivent la même convention que `.claude/skills`.

Les copies locales ont priorité sur les skills globaux de même identifiant. Les skills globaux non copiés restent disponibles.

## Contenu

| Skill | Pourquoi il est là |
| --- | --- |
| `antislop` | filtre de base contre le code et le design génériques |
| `antislop-ui` | couleurs, composants, mise en page, motion |
| `antislop-layoutmobile` | mise en page mobile, grilles, débordements, cibles tactiles |
| `antislop-human` | contraste, clavier, focus, états, accessibilité |
| `antislop-code` | hygiène des commentaires |
| `antislop-copywriting` | textes visibles, ton, anti-formules IA |
| `frontend-design` | direction visuelle et typographie |
| `frontend-a11y` | ARIA, formulaires, navigation clavier |
| `emil-design-eng` | polish d'interaction et détail d'animation |
| `animate` | création d'animations et de transitions |
| `review-animations` | critique d'animations existantes |
| `break-ui` | test avec des données extrêmes |
| `code-review` | relecture de diff |
| `security-review` | entrées utilisateur, stockage, import de code |
| `ecotrack-app` | skill local propre à cette application |

Le skill `ecotrack-app` n'est pas une copie : il est écrit pour ce dépôt et décrit les invariants de `index.html`.

## Mettre à jour une copie

Depuis la racine du dépôt :

```sh
rsync -a --exclude '.DS_Store' ~/.agents/skills/antislop .agents/skills/
```

Remplacer `antislop` par le skill voulu. Vérifier ensuite le diff : un skill global peut avoir changé de structure.

## Ajouter un skill

1. Vérifier qu'il n'existe pas déjà dans ce dossier.
2. Le copier avec `rsync`, ou l'écrire localement s'il est spécifique au projet.
3. Ajouter une ligne dans le tableau ci-dessus et dans la section 12 de `AGENTS.md`.
4. Garder le fichier d'entrée au format `skills/<id>/SKILL.md` avec un frontmatter `name` et `description`.

## Licence

Les skills copiés appartiennent à leurs auteurs. `frontend-design` inclut son `LICENSE.txt`. Ne pas retirer les fichiers de licence lors d'une mise à jour.
