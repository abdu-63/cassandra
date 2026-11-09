# Contribuer

Merci de vouloir améliorer EcoTrack · Cassandra. Le projet est volontairement simple : un seul fichier, aucune dépendance, aucun build. Merci de garder cette contrainte.

## Avant de proposer une modification

```sh
node scripts/verify.mjs
```

Le contrôle doit passer. Il vérifie la syntaxe du script inline, la structure des leçons et la cohérence des exercices. Il affiche aussi un avertissement tant que les QCM gardent tous leur réponse en première position.

## Règles de contenu

- Interface et explications en français, ton tutoyé.
- Une seule forme de réponse par exercice : QCM (`o` + `a`), saisie (`t`) ou blocs (`b` + `x`).
- Ajouter un exercice à la fin d'une leçon, ou une leçon à la fin du parcours : les identifiants dépendent de la position et la progression sauvegardée en dépend.
- Ne pas inventer une commande CQL. En cas de doute, ouvrir une issue avec la question plutôt que de compléter au hasard.
- Vérifier les réponses à la main dans le navigateur, en thème clair et sombre, sur mobile et au clavier.

## Code

- Tout reste dans `index.html`. Pas de framework, pas de bundler, pas de fichier CSS ou JS séparé.
- Garder le style existant : `var`, fonctions nommées, concaténation de chaînes.
- Échapper avec `esc()` tout texte dynamique injecté dans `innerHTML`.
- Ne pas renommer les clés `localStorage` (`cassduo`, `cassduo_ui`) sans migration.
- Ne pas ajouter de tracker, d'analytics ou de ressource distante en dehors des polices.

Les détails techniques, le modèle de contenu et la checklist complète sont dans `AGENTS.md`. Les conventions visuelles et d'accessibilité sont dans `.agents/skills/`.

## Commits

Les messages existants sont courts (`v1`, `v2`, … `v6`). Rester concis et décrire le changement en une ligne : `v7`, `fix: corrige la mesure 3`, `docs: met à jour le README`. Éviter les messages fourre-tout.

## Pull requests

1. Décrire le changement et le problème résolu.
2. Indiquer les vérifications faites (commande `verify`, navigateurs testés, mobile, clavier).
3. Joindre une capture si l'interface change.
4. Signaler toute rupture de compatibilité avec une progression existante.
