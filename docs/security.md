# Sécurité

Exigences minimales pour déployer `it-landscape` en environnement partagé ou en production.

## Principes

- L'application est **en lecture seule** : elle ne stocke ni ne modifie aucune donnée métier.
  Les données viennent de NetBox ; seuls les comptes locaux sont conservés (`data/auth/`).
- Le jeton NetBox reste **côté serveur** et doit être **en lecture seule** (`write_enabled`
  désactivé) : une fuite ne permet alors aucune modification de NetBox.
- Toute personne authentifiée lit le paysage ; il n'existe pas de rôle d'écriture.

## Déploiement HTTPS

- Placer l'application derrière un reverse proxy terminant TLS (Nginx, Apache, Traefik,
  Caddy, ingress) ; ne pas exposer directement le serveur Next.js.
- `NEXTAUTH_URL` = URL publique HTTPS exacte ; rediriger HTTP vers HTTPS, activer HSTS.
- Transmettre `X-Forwarded-Proto`, `X-Forwarded-Host`, `X-Forwarded-For`.

## Variables

| Variable | Obligatoire | Usage |
|----------|-------------|-------|
| `NEXTAUTH_URL` | Oui | URL publique de l'application. |
| `NEXTAUTH_SECRET` | Oui | Secret de signature des sessions, au moins 32 caractères aléatoires. |
| `AUTH_ENABLED` | Oui | `true` hors poste de développement. |
| `IT_LANDSCAPE_ENV` | Production | `production` active les contrôles de démarrage. |
| `NETBOX_URL`, `NETBOX_TOKEN` | Production | Source NetBox ; jeton en lecture seule. |
| `NETBOX_PUBLIC_URL` | Non | Adresse des liens vers NetBox affichés aux utilisateurs. |
| `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` | Recommandé | SSO Entra ID. |
| `NEXT_PUBLIC_*` | Non | Habillage, visible côté navigateur : jamais de secret. |

## Contrôles au démarrage (production)

`scripts/startup-security-check.mjs` refuse de démarrer si `NEXTAUTH_SECRET` est absent ou
par défaut, si `NEXTAUTH_URL` manque, si `AUTH_ENABLED=false`, ou si
`data/auth/access-rules.json` est absent ou contient encore `admin/password`.

## Comptes et SSO

- Remplacer les comptes de développement de `data/auth/access-rules.json` avant toute mise en
  service (`npm run hash-password -- '…'` pour générer un hash bcrypt).
- SSO recommandé : Entra ID, URI de redirection `https://<domaine>/api/auth/callback/azure-ad`,
  application restreinte aux groupes autorisés.

## Rotation et sauvegarde

- Rotation de `NEXTAUTH_SECRET`, du jeton NetBox et du secret Entra ID selon la politique SSI,
  et immédiatement en cas de fuite.
- Seul `data/auth/` est à sauvegarder ; les données métier sont sauvegardées avec NetBox.

## Docker

Image `node:22-alpine`, utilisateur non-root `node`, `no-new-privileges`, capabilities retirées,
`HEALTHCHECK` sur `/api/health`, port publié uniquement vers le reverse proxy.
