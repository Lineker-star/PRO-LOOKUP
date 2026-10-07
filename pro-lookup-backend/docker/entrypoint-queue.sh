#!/usr/bin/env bash
# Démarrage du worker de file d'attente (Render : service « Background Worker »).
# Pas de migration ici : le service web s'en charge déjà à chaque déploiement.
set -euo pipefail

mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/framework/testing storage/logs bootstrap/cache
chmod -R a+rw storage bootstrap/cache

exec php artisan queue:work --tries=3 --max-time=3600
