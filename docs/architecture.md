# Architecture

```
NetBox + plugin netbox-it-landscape
   │  API REST, jeton lecture seule
   ▼
lib/landscape.js        lecture paginée, jointure domaines / processus / applications / flux,
   │                    libellés des choice sets, cache serveur, repli démo
   ▼
GET /api/landscape      route protégée (session NextAuth)
   │  modèle « paysage » JSON
   ▼
pages/index.js          vue Paysage : périmètre établissement, filtres, URL partageable
lib/landscapeView.js    calculs purs : filtres, indicateurs, regroupements (testés)
components/             en-tête, synthèse, filtres, carte du paysage, fiche application
```

## Modèle renvoyé par `/api/landscape`

| Clé | Contenu |
|---|---|
| `source` | `netbox` ou `demo` ; `stale: true` si NetBox est injoignable et que le cache est servi |
| `establishments` | Sites NetBox portant au moins un domaine métier |
| `zones` | Zones d'urbanisation présentes, dans l'ordre de lecture |
| `domains`, `processes` | Fusionnés entre établissements par nom ; `establishments` = sites concernés |
| `applications` | Hébergement normalisé, interfaces, criticité, statut, établissements, placements (processus × site), échanges actifs, lien NetBox |
| `hostingTypes`, `interfaces` | Référentiels d'affichage |

## Choix

- **Pages Router Next.js**, rendu client de la vue (les données arrivent par l'API protégée).
- **Aucune dépendance d'interface** : CSS maison (`styles/app.css`), polices auto-hébergées
  (`@fontsource`), pas de bibliothèque de composants ni d'animation.
- **Accessibilité** : une information portée par une couleur l'est aussi par un texte
  (`aria-label`, `title`, légende) ; navigation au clavier, `Échap` ferme la fiche.
- **Sécurité** : en-têtes `nosniff`, `DENY`, `same-origin` ; contrôle de configuration au
  démarrage en production ; jeton NetBox uniquement côté serveur.
