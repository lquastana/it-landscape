# Sécurité

## Principes

- L'application est **publique et en lecture seule** : pas de compte, pas de connexion, aucune
  donnée stockée ni modifiée. Elle ne contient aucun secret côté navigateur.
- Elle n'affiche que le paysage métier (domaines, processus, applications, éditeurs, référents,
  échanges entre applications) : aucune adresse IP, aucun serveur, aucune donnée de santé.
- Le jeton NetBox reste **côté serveur** et doit être **en lecture seule** (`write_enabled`
  désactivé) : une fuite ne permet aucune modification de NetBox.

## Publication

- Placer l'application derrière un reverse proxy (Nginx, Apache, Traefik, Caddy, ingress) ;
  ne pas exposer directement le serveur Next.js.
- Si l'accès doit être restreint (réseau interne uniquement, SSO d'entreprise), le faire au
  niveau du reverse proxy : filtrage d'adresses, authentification du proxy.
- Les référents nommés dans NetBox sont visibles de tous les lecteurs : en tenir compte avant
  une publication hors du réseau interne.

## Variables

| Variable | Usage |
|----------|-------|
| `NETBOX_URL`, `NETBOX_TOKEN` | Source NetBox ; jeton en lecture seule, jamais exposé au navigateur. |
| `NETBOX_PUBLIC_URL` | Adresse des liens vers NetBox affichés aux lecteurs. |
| `LANDSCAPE_CACHE_SECONDS` | Durée du cache serveur (limite la charge sur NetBox). |
| `NEXT_PUBLIC_*` | Habillage, visible côté navigateur : jamais de secret. |

## Rotation

Rotation du jeton NetBox selon la politique SSI, et immédiatement en cas de fuite. Aucune autre
donnée à sauvegarder : tout le contenu vient de NetBox.

## Docker

Image `node:22-alpine`, utilisateur non-root `node`, `no-new-privileges`, capabilities retirées,
aucun volume, `HEALTHCHECK` sur `/api/health`, port publié uniquement vers le reverse proxy.
