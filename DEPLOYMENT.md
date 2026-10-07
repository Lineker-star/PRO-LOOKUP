# Lancer et déployer PRO-LOOKUP

Deux applications distinctes qui ne communiquent que par l'API :

- `pro-lookup-backend/` — API Laravel 12 + PostgreSQL
- `pro-lookup-frontend/` — site Next.js 16 (React + TypeScript)

## En local

### 1. Backend (port 8000)

```bash
cd pro-lookup-backend
composer install
cp .env.example .env          # puis renseigner DB_PASSWORD et générer la clé :
php artisan key:generate
php artisan migrate --seed    # crée les tables, les listes de référence et les comptes de démonstration
php artisan storage:link      # rend les photos et médias accessibles
php artisan serve --host=127.0.0.1 --port=8000
```

Vérification : http://127.0.0.1:8000/api/ping doit répondre `{"status":"ok"}`.

Les emails sont écrits dans `storage/logs/laravel.log` (`MAIL_MAILER=log`). Avec `QUEUE_CONNECTION=database`, lancer aussi `php artisan queue:work`.

### 2. Frontend (port 3000)

```bash
cd pro-lookup-frontend
npm install
cp .env.example .env.local    # mettre dans REVALIDATE_SECRET la même valeur que FRONTEND_REVALIDATE_SECRET côté Laravel
npm run dev                   # développement
# ou : npm run build && npm run start   (version de production)
```

Ouvrir http://localhost:3000. Comptes de démonstration : voir `DECISIONS.md`.

### 3. Tests

```bash
cd pro-lookup-backend && php artisan test     # règles d'accès : visiteur, en attente, approuvé, admin
cd pro-lookup-frontend && npx tsc --noEmit && npm run lint
```

## En production

### Backend Laravel (ex. Railway)

1. Service PostgreSQL + service depuis `pro-lookup-backend` (PHP 8.2+).
2. Commande de démarrage : `php artisan migrate --force && php artisan storage:link && php artisan config:cache && php artisan route:cache && php artisan serve --host=0.0.0.0 --port=$PORT`, plus un processus `php artisan queue:work` pour les emails.
3. Variables : `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY`, `APP_URL=https://api.<domaine>`, variables `DB_*`, SMTP (`MAIL_*`), `QUEUE_CONNECTION=database`,
   `FRONTEND_URL=https://<domaine>`, `FRONTEND_URLS=https://<domaine>` (CORS),
   `FRONTEND_REVALIDATE_URL=https://<domaine>/api/revalidate`, `FRONTEND_REVALIDATE_SECRET=<secret long et aléatoire>`.
4. Stockage : le disque `public` (photos, médias) doit être persistant ou remplacé par un stockage objet ; les justificatifs restent sur le disque privé `local`.
5. Ne pas lancer `db:seed` en production sans retirer les comptes de démonstration.

### Backend Laravel sur Render (en parallèle de Railway)

Le backend peut aussi tourner sur Render, **sans rien changer à Railway** : Railway continue d'utiliser
Railpack (figé explicitement par `pro-lookup-backend/railway.json`), Render utilise le
`pro-lookup-backend/Dockerfile` (image FrankenPHP). Les deux lisent le même dépôt ; chacun a ses
propres variables d'environnement et sa propre base de données.

1. Dans Render : **New → Blueprint**, pointer sur ce dépôt. Le fichier `render.yaml` (racine du dépôt)
   crée un service web, un worker de file d'attente et une base PostgreSQL gratuite.
2. Compléter les variables marquées `sync: false` dans le tableau de bord (`APP_KEY`, `APP_URL`,
   `BREVO_*`, `FRONTEND_*`) — `php artisan key:generate --show` en local donne `APP_KEY`.
3. Vérifier `https://<service>.onrender.com/api/ping`.
4. Limites du **plan gratuit Render**, à connaître avant de l'utiliser en production :
   - **Pas de disque persistant** : les photos, CV et justificatifs déposés disparaissent à chaque
     redéploiement et à chaque redémarrage du service (le plan gratuit n'autorise pas de disque).
     Un disque persistant demande un plan payant, ou un passage à un stockage objet (S3, Cloudflare R2).
   - **Mise en veille après inactivité** : le premier appel après une pause peut prendre
     plusieurs dizaines de secondes (`cold start`).
   - **Base PostgreSQL gratuite expirée après 90 jours** : il faut la recréer (ou passer à un plan
     payant) avant l'expiration, sous peine de perdre les données.
5. Si Render doit devenir le site de référence, reportez son URL dans Vercel
   (`API_URL`, `NEXT_PUBLIC_API_URL`) et dans les variables `FRONTEND_*` du service Render — comme à la
   fin de la section Railway plus haut.

### Frontend Next.js (ex. Vercel, ou un serveur Node.js)

1. Racine du projet : `pro-lookup-frontend`. Build : `npm run build`. Démarrage (hors Vercel) : `npm run start`.
2. Variables : `API_URL` et `NEXT_PUBLIC_API_URL=https://api.<domaine>/api/v1`, `NEXT_PUBLIC_SITE_URL=https://<domaine>`, `REVALIDATE_SECRET=<même secret que Laravel>`.
3. Next.js a besoin d'un serveur Node.js : ce n'est pas un simple dossier statique.

### Ordre recommandé

PostgreSQL → Laravel (migrations) → vérifier `/api/ping` → Next.js → reporter l'adresse du site dans `FRONTEND_URL(S)` et `FRONTEND_REVALIDATE_URL` côté Laravel → vider le cache de configuration Laravel (`php artisan config:cache`).
