# ADR 0003 — Vue métier en lecture, NetBox source de vérité

- Statut : accepté (version 0.4.0)
- Remplace : ADR 0001 (stockage JSON) et ADR 0002 (historisation JSON)

## Contexte

it-landscape gérait ses propres référentiels JSON (applications, flux, infrastructure, réseau),
édités dans l'application, et proposait en plus des vues techniques et une réconciliation avec
NetBox. Dans les organisations qui l'utilisent, NetBox et le plugin netbox-it-landscape portent
déjà ces données, maintenues au quotidien : la double saisie faisait diverger les deux sources,
et la richesse fonctionnelle rendait l'outil difficile à lire pour un public non technique.

## Décision

1. NetBox (plugin netbox-it-landscape) est l'unique source des domaines, processus,
   applications et flux. it-landscape les lit avec un jeton en lecture seule ; aucune donnée
   métier n'est stockée ni modifiée dans l'application.
2. L'application se limite à une vue « Paysage » orientée métier : zones, domaines, processus,
   applications, indicateurs (hébergement, mutualisation, interfaces, criticité, processus
   outillés) et fiche application avec lien vers NetBox.
3. Infrastructure, réseau, flux détaillés et administration restent dans NetBox.
4. Un jeu de démonstration au format de l'API NetBox remplace les fichiers JSON d'exemple.

## Conséquences

- Plus de double saisie ; la vue est toujours à jour (cache serveur de 2 minutes par défaut).
- Suppression des écrans d'administration, de l'historisation JSON, de l'export et du seed NetBox.
- Dépendance à la disponibilité de NetBox, atténuée par le service de la dernière version connue.
- Les données dans `data/` se limitent aux comptes locaux (`data/auth/`) et au jeu de démonstration.
