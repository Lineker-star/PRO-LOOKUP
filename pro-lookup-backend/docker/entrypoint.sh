#!/usr/bin/env bash
# Démarrage du service web (Render). N'exécute PAS les migrations lorsqu'il est utilisé
# comme worker de file d'attente (voir docker/entrypoint-queue.sh).
set -euo pipefail

mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/framework/testing storage/logs bootstrap/cache
chmod -R a+rw storage bootstrap/cache

php artisan migrate --force
php artisan storage:link || true
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Render fournit le port d'écoute via $PORT (Railway fait de même) ; FrankenPHP/Caddy le lit via SERVER_NAME.
export SERVER_NAME=":${PORT:-80}"
exec frankenphp run --config /etc/frankenphp/Caddyfile
