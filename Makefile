.PHONY: dev test docker docker-stop

# Développement local — rechargement à chaud, sans Docker
dev:
	npm run dev

test:
	npm test && npm run lint && npm run build

# Docker (démonstration, ou NetBox si NETBOX_URL / NETBOX_TOKEN sont définis)
docker:
	docker compose up --build

docker-stop:
	docker compose down
