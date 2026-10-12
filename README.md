<img src="public/it-landscape-logo-with-text.png" alt="it-landscape" width="280" />

# it-landscape

Vue **métier** du système d'information : un paysage applicatif lisible par tous, construit à
partir de [NetBox](https://netbox.dev) et de son plugin **netbox-it-landscape**.

- **NetBox est la source de vérité** : domaines, processus, applications et flux y sont saisis,
  avec l'infrastructure, le réseau et tout le détail technique.
- **it-landscape les montre** à celles et ceux qui ne vont pas dans NetBox : directions,
  référents métiers, chefs de projet. Lecture seule, aucune saisie dans l'application.

## Ce que montre la vue Paysage

| Élément | Lecture |
|---|---|
| Zones d'urbanisation | Production de soins, support, pilotage, échanges, référentiels, socle |
| Domaines → processus → applications | Le paysage, établissement par établissement ou consolidé |
| Pastilles de couleur | Interfaces de l'application : médicale, administrative, planification, facturation, autre |
| Trait de gauche | Type d'hébergement (interne, hébergeur, éditeur, SaaS…) |
| Badge `C` / badge chiffré | Application critique / nombre d'établissements qui l'utilisent |
| Bandeau de synthèse | Applications, part mutualisée, processus outillés, critiques, répartition de l'hébergement et des interfaces |
| Fiche application | Description, éditeur, référent, interfaces, utilisation par établissement, échanges, lien vers NetBox |

Filtres : recherche (nom, éditeur, mot-clé), hébergement, interfaces, applications mutualisées,
applications critiques. L'état des filtres est dans l'URL : un lien partagé ouvre la même vue.

## Démarrage rapide

```bash
npm install
npm run dev
```

Sans NetBox configuré, l'application affiche un **jeu de démonstration fictif**
(`data/demo/netbox-landscape.json`, même format que l'API NetBox). Compte de développement :
`viewer` / `password` (le fichier `.env.local` est créé au premier lancement).

## Brancher NetBox

```dotenv
NETBOX_URL=http://netbox.interne:8000        # adresse vue par le serveur
NETBOX_TOKEN=nbt_xxxx.yyyy                   # jeton en LECTURE SEULE
NETBOX_PUBLIC_URL=https://netbox.example.org # facultatif : adresse des liens « Ouvrir dans NetBox »
LANDSCAPE_CACHE_SECONDS=120                  # facultatif : durée du cache côté serveur
```

Le jeton n'a besoin que de la lecture sur les objets du plugin (`business-domains`,
`business-processes`, `applications`, `application-flows`) et sur les custom fields.
Si NetBox devient injoignable, la dernière version connue reste affichée avec un avertissement.

### Champs optionnels exploités

Le plugin suffit. Ces custom fields NetBox, s'ils existent, enrichissent la vue :

| Custom field | Objet | Usage |
|---|---|---|
| `zone_urbanisation` (sélection) | Domaine | Regroupement et ordre des zones ; libellés lus dans le choice set |
| `hebergement_type` (sélection) | Application | Catégories d'hébergement ; sans ce champ, le texte libre `hosting` est utilisé |
| `statut` (`projet`, `actif`, `en_retrait`, `decommissionne`) | Application | Badge « en projet » ; les applications décommissionnées sont masquées |
| `code` | Domaine, processus | Code affiché à côté du nom |
| `criticite_flux` = `non_active`, ou tag `flux-non-active` | Flux | Flux ignorés dans les échanges |

## Authentification

- Comptes locaux : `data/auth/access-rules.json` (mots de passe hachés bcrypt,
  `npm run hash-password -- 'mot de passe'`).
- Entra ID / Azure AD : `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`.
- Toute personne authentifiée lit le paysage ; il n'y a pas de rôle d'écriture.
- En production (`IT_LANDSCAPE_ENV=production`), le démarrage est refusé si `NEXTAUTH_SECRET`
  est absent ou par défaut, si `AUTH_ENABLED=false`, ou si le compte `admin/password` existe.

## Déploiement

- **Docker** : `docker compose -f docker-compose.prod.yml up -d --build` (variables dans `.env`).
- **Node** : `npm ci && npm run build && npm start` (Node 20 ou 22), derrière un reverse proxy TLS.
- Contrôle de santé : `GET /api/health`.

## Tests

```bash
npm test        # modèle NetBox → paysage, filtres et indicateurs, accès, contrôles de démarrage
npm run lint
npm run build
```

## Historique

La version 0.4 recentre l'application sur la vue métier. Les vues techniques des versions
précédentes (infrastructure, réseau, flux détaillés, simulation d'incident, qualité de données,
administration des référentiels JSON) sont retirées : ces informations vivent dans NetBox.
Voir [docs/adr/0003-vue-metier-netbox.md](docs/adr/0003-vue-metier-netbox.md).

## Licence

Voir [LICENSE](LICENSE).
