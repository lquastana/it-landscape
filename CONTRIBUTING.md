# Contribuer

Merci de votre intérêt pour `it-landscape`. Le projet est une vue métier en lecture seule du
système d'information, alimentée par NetBox et le plugin netbox-it-landscape.

## Démarrage local

```bash
npm install
npm run dev
```

Application locale : http://localhost:3000 (jeu de démonstration sans NetBox ; compte `viewer` /
`password`). Pour brancher un NetBox, renseigner `NETBOX_URL` et `NETBOX_TOKEN` (lecture seule)
dans `.env.local`.

## Avant de proposer une modification

1. Ouvrir ou choisir une issue.
2. Créer une branche courte et descriptive, par exemple `fix/filtre-hebergement`.
3. Garder les changements ciblés : une PR résout un sujet clair.
4. Ne pas commiter de secrets, `.env`, ni de données réelles.

## Vérifications

```bash
npm test
npm run lint
npm run build
```

## Données de démonstration

`data/demo/netbox-landscape.json` reproduit le format de l'API NetBox. Il doit rester fictif :
aucune organisation, personne ou donnée réelle. Toute évolution du modèle (`lib/landscape.js`,
`lib/landscapeView.js`) s'accompagne d'un test dans `test/`.

## Style

- Textes de l'interface en français, vouvoiement, boutons en verbe d'action.
- Pas d'information portée par la couleur seule ; vérifier clavier et largeur mobile.
- Pas de nouvelle dépendance d'interface sans nécessité.

## Pull requests

Résumé court, commandes exécutées, captures pour les changements d'interface, limites connues.
