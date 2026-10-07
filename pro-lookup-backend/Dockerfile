# Image de production du backend PRO-LOOKUP, utilisée pour le déploiement sur Render.
# Railway continue d'utiliser Railpack (voir railway.json) : ce fichier ne change rien
# pour Railway tant que son service n'est pas explicitement reconfiguré pour l'utiliser.

# ---------------------------------------------------------------- Actifs Vite (page d'accueil Laravel par défaut)
FROM node:20-bookworm-slim AS assets
WORKDIR /app
COPY package.json ./
RUN npm install
COPY vite.config.js ./
COPY resources ./resources
RUN npm run build

# ---------------------------------------------------------------- Dépendances PHP (Composer)
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist --optimize-autoloader

# ---------------------------------------------------------------- Exécution (FrankenPHP)
FROM dunglas/frankenphp:php8.2-bookworm AS runtime

# pdo_pgsql/pgsql : base PostgreSQL. gd : photos de profil (App\Services\ImageStore).
RUN install-php-extensions pdo_pgsql pgsql gd zip opcache

WORKDIR /app
COPY . .
COPY --from=vendor /app/vendor ./vendor
COPY --from=assets /app/public/build ./public/build

RUN mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/framework/testing storage/logs bootstrap/cache \
    && chmod -R a+rw storage bootstrap/cache

COPY docker/Caddyfile /etc/frankenphp/Caddyfile
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY docker/entrypoint-queue.sh /usr/local/bin/entrypoint-queue.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/entrypoint-queue.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
