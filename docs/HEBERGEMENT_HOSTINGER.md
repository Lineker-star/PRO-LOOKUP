# Héberger PRO-LOOKUP sur Hostinger — procédure complète

Ce guide met en ligne les deux applications sur **un seul VPS Hostinger** :

| Adresse (exemple) | Application | Technologie |
|---|---|---|
| `https://prolookup.cm` (et `www`) | Site public, espace enseignant, administration | Next.js (Node.js), port interne 3000 |
| `https://api.prolookup.cm` | API | Laravel 12 (PHP 8.3) + PostgreSQL |

Remplacez partout `prolookup.cm` par votre vrai nom de domaine.

---

## 0. Quelle offre Hostinger choisir ?

**Choisissez un VPS (offre « KVM »)**, pas l'hébergement mutualisé :

- PRO-LOOKUP a besoin de **PostgreSQL** (brief §6) : l'hébergement mutualisé Hostinger ne propose que MySQL/MariaDB.
- Le site Next.js a besoin d'un **serveur Node.js permanent**, ainsi que d'un processus qui envoie les emails en arrière-plan : c'est simple sur un VPS, limité sur le mutualisé.
- Taille conseillée : **KVM 2** (2 vCPU, 8 Go de RAM). La compilation de Next.js consomme de la mémoire ; KVM 1 (4 Go) fonctionne mais avec la mémoire d'échange (swap) décrite à l'étape 3.
- Système à installer : **Ubuntu 24.04 LTS** (modèle « Plain OS », sans panneau).

> Alternative mutualisée (offres Business / Cloud avec applications Node.js) : possible en passant la base en MySQL, mais non testée avec PRO-LOOKUP. Voir l'annexe B.

Il vous faut aussi :
- un **nom de domaine** (acheté chez Hostinger ou ailleurs) ;
- une **boîte email** pour envoyer les emails de la plateforme (ex. `noreply@prolookup.cm`, via l'offre email Hostinger) ;
- le code du projet sur **GitHub** (dépôt privé), ou à défaut un accès SFTP.

---

## 1. Préparer le code sur votre ordinateur

Le serveur récupère le code depuis GitHub. Commitez et poussez tout le travail :

```bash
cd S:\PRO-LOOKUP
git add -A
git commit -m "PRO-LOOKUP : API v1 + frontend Next.js"
git remote add origin https://github.com/<votre-compte>/pro-lookup.git   # si pas encore fait
git push -u origin main
```

Vérifiez sur GitHub que les fichiers `.env` et `.env.local` **n'y sont pas** : ils contiennent des secrets et sont exclus par les `.gitignore`.

---

## 2. Commander le VPS et configurer le domaine

1. hPanel → **VPS** → commander, système **Ubuntu 24.04**, définir le **mot de passe root**. Notez l'**adresse IP** du VPS.
2. hPanel → **Domaines** → votre domaine → **DNS / Serveurs de noms** → créez (ou modifiez) :

| Type | Nom | Valeur | TTL |
|---|---|---|---|
| A | `@` | IP du VPS | 3600 |
| A | `www` | IP du VPS | 3600 |
| A | `api` | IP du VPS | 3600 |

Supprimez les anciens enregistrements A/AAAA de `@` et `www` qui pointent ailleurs. La propagation prend de quelques minutes à quelques heures ; vérifiez avec `ping api.prolookup.cm`.

3. Email : hPanel → **Emails** → créez `noreply@prolookup.cm` avec un mot de passe. Hostinger ajoute lui-même les enregistrements MX/SPF/DKIM si le domaine est chez eux.

---

## 3. Sécuriser et préparer le serveur

Connectez-vous (Windows : PowerShell ou le terminal du navigateur dans hPanel) :

```bash
ssh root@<IP_DU_VPS>
```

```bash
# Mises à jour et fuseau horaire
apt update && apt -y upgrade
timedatectl set-timezone Africa/Douala

# Utilisateur de déploiement (ne pas tout faire en root)
adduser deploy
usermod -aG sudo deploy

# Pare-feu : SSH + web uniquement
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

# Mémoire d'échange de 2 Go (indispensable sur KVM 1, utile partout)
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Reconnectez-vous ensuite en tant que `deploy` : `ssh deploy@<IP_DU_VPS>`.

---

## 4. Installer les logiciels

```bash
# Serveur web, outils
sudo apt -y install nginx git unzip curl certbot python3-certbot-nginx

# PHP 8.3 et les extensions utilisées par Laravel
sudo apt -y install php8.3-fpm php8.3-cli php8.3-pgsql php8.3-mbstring php8.3-xml \
  php8.3-curl php8.3-zip php8.3-gd php8.3-intl php8.3-bcmath

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# PostgreSQL
sudo apt -y install postgresql

# Node.js 22 et PM2 (garde le site Next.js allumé)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt -y install nodejs
sudo npm install -g pm2

# Vérifications
php -v && composer --version && psql --version && node -v && pm2 -v
```

Autoriser des envois de fichiers assez gros (photos, justificatifs, jusqu'à 10 images de 10 Mo par publication) :

```bash
sudo sed -i 's/^upload_max_filesize.*/upload_max_filesize = 12M/; s/^post_max_size.*/post_max_size = 110M/; s/^memory_limit.*/memory_limit = 256M/' /etc/php/8.3/fpm/php.ini
sudo systemctl restart php8.3-fpm
```

---

## 5. Créer la base de données

Choisissez un mot de passe fort (notez-le, il servira à l'étape 6) :

```bash
sudo -u postgres psql -c "CREATE USER prolookup WITH PASSWORD 'MOT_DE_PASSE_FORT';"
sudo -u postgres psql -c "CREATE DATABASE pro_lookup OWNER prolookup ENCODING 'UTF8';"
```

---

## 6. Installer l'API Laravel

```bash
sudo mkdir -p /var/www && sudo chown deploy:deploy /var/www
cd /var/www
git clone https://github.com/<votre-compte>/pro-lookup.git
cd /var/www/pro-lookup/pro-lookup-backend

composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
nano .env
```

Dans `.env`, mettez (ou remplacez) ces valeurs :

```ini
APP_NAME=PRO-LOOKUP
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.prolookup.cm
APP_LOCALE=fr
APP_FALLBACK_LOCALE=fr

LOG_LEVEL=warning

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=pro_lookup
DB_USERNAME=prolookup
DB_PASSWORD=MOT_DE_PASSE_FORT

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local

# Emails (boîte Hostinger)
MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=noreply@prolookup.cm
MAIL_PASSWORD=MOT_DE_PASSE_DE_LA_BOITE_MAIL
MAIL_FROM_ADDRESS=noreply@prolookup.cm
MAIL_FROM_NAME="PRO-LOOKUP — Université ZTF"

# Frontend
FRONTEND_URL=https://prolookup.cm
FRONTEND_URLS=https://prolookup.cm,https://www.prolookup.cm
FRONTEND_REVALIDATE_URL=https://prolookup.cm/api/revalidate
FRONTEND_REVALIDATE_SECRET=SECRET_A_GENERER
```

Générez le secret partagé (à recopier aussi dans le frontend, étape 8) :

```bash
openssl rand -hex 32
```

Puis initialisez la base :

```bash
php artisan migrate --force
php artisan db:seed --class=ReferenceSeeder --force   # grades, catégories, écoles supérieures PROVISOIRES
php artisan storage:link
```

> ⚠️ Ne lancez **pas** `php artisan db:seed` tout court : il crée les comptes de démonstration (`admin@iuztf.cm` / `Password123!` et des enseignants fictifs).

Créez le **vrai compte administrateur** (mot de passe de 12 caractères minimum) :

```bash
ADMIN_EMAIL="admin@votre-domaine.cm" ADMIN_PASSWORD="UnMotDePasseTresSolide!2026" \
ADMIN_FIRST_NAME="Prénom" ADMIN_LAST_NAME="Nom" \
php artisan db:seed --class=AdminSeeder --force
```

La commande est rejouable : relancée avec un autre `ADMIN_PASSWORD`, elle réinitialise le mot de passe de ce compte.

Droits d'écriture pour le serveur web, puis mise en cache de la configuration :

```bash
sudo chown -R deploy:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
php artisan config:cache
php artisan route:cache
```

---

## 7. Configurer Nginx pour l'API

```bash
sudo nano /etc/nginx/sites-available/api.prolookup.cm
```

```nginx
server {
    listen 80;
    server_name api.prolookup.cm;
    root /var/www/pro-lookup/pro-lookup-backend/public;
    index index.php;

    client_max_body_size 110M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Photos et médias publics
    location /storage/ {
        expires 30d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/api.prolookup.cm /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

---

## 8. Installer le site Next.js

Les variables `NEXT_PUBLIC_…` sont intégrées **au moment de la compilation** : créez le fichier avant `npm run build`.

```bash
cd /var/www/pro-lookup/pro-lookup-frontend
nano .env.production
```

```ini
API_URL=https://api.prolookup.cm/api/v1
NEXT_PUBLIC_API_URL=https://api.prolookup.cm/api/v1
NEXT_PUBLIC_SITE_URL=https://prolookup.cm
REVALIDATE_SECRET=LE_MEME_SECRET_QUE_FRONTEND_REVALIDATE_SECRET
```

```bash
npm ci
npm run build
pm2 start npm --name pro-lookup-frontend -- start -- -p 3000
pm2 save
pm2 startup systemd     # puis copiez-collez la commande « sudo env PATH=… » qu'il affiche
```

> Le build interroge l'API (plan du site). Si l'API n'est pas encore en HTTPS (étape 10), le build réussit quand même ; relancez simplement `npm run build && pm2 restart pro-lookup-frontend` après l'étape 10.

---

## 9. Configurer Nginx pour le site

```bash
sudo nano /etc/nginx/sites-available/prolookup.cm
```

```nginx
server {
    listen 80;
    server_name prolookup.cm www.prolookup.cm;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/prolookup.cm /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 10. Certificats HTTPS (gratuits, Let's Encrypt)

Une fois les DNS propagés :

```bash
sudo certbot --nginx -d prolookup.cm -d www.prolookup.cm -d api.prolookup.cm
```

Répondez à l'email demandé et choisissez la **redirection HTTP → HTTPS**. Le renouvellement est automatique ; testez-le avec `sudo certbot renew --dry-run`.

Redirection facultative de `www` vers l'adresse sans `www` : dans le bloc `server` HTTPS de `prolookup.cm`, ajoutez en tête :

```nginx
if ($host = www.prolookup.cm) { return 301 https://prolookup.cm$request_uri; }
```

puis `sudo nginx -t && sudo systemctl reload nginx`.

Recompilez ensuite le site pour que le plan du site soit complet :

```bash
cd /var/www/pro-lookup/pro-lookup-frontend && npm run build && pm2 restart pro-lookup-frontend
```

---

## 11. Envoi des emails en arrière-plan

Les emails (demande reçue, compte approuvé, refus, suspension…) partent via une file d'attente. Créez un service qui la traite en permanence :

```bash
sudo nano /etc/systemd/system/pro-lookup-queue.service
```

```ini
[Unit]
Description=PRO-LOOKUP - envoi des emails (file Laravel)
After=network.target postgresql.service

[Service]
User=deploy
Group=www-data
Restart=always
RestartSec=5
WorkingDirectory=/var/www/pro-lookup/pro-lookup-backend
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --max-time=3600

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now pro-lookup-queue
sudo systemctl status pro-lookup-queue
```

---

## 12. Vérifications finales

| Test | Résultat attendu |
|---|---|
| `https://api.prolookup.cm/api/ping` | `{"status":"ok"}` |
| `https://api.prolookup.cm/api/v1/public/stats` | chiffres en JSON |
| `https://prolookup.cm` | page d'accueil avec les chiffres clés |
| Connexion avec le compte admin créé à l'étape 6 | arrivée sur `/admin` |
| Admin → **Grades, catégories, écoles** | remplacer les écoles supérieures provisoires par la liste officielle ; nommer au moins un second administrateur (Admin → Enseignants et administrateurs → fiche → « Nommer administrateur ») |
| Admin → **Création directe** d'un enseignant | l'enseignant reçoit l'email « Définir mon mot de passe » |
| Coller l'URL `https://prolookup.cm/in/<identifiant>` dans WhatsApp | aperçu avec photo, nom, grade |
| `https://prolookup.cm/sitemap.xml` et `/robots.txt` | listes des profils, exclusion de `/espace` et `/admin` |

Journaux en cas de problème :

```bash
tail -f /var/www/pro-lookup/pro-lookup-backend/storage/logs/laravel.log   # API
pm2 logs pro-lookup-frontend                                              # site Next.js
sudo tail -f /var/log/nginx/error.log                                     # serveur web
sudo journalctl -u pro-lookup-queue -f                                    # emails
```

---

## 13. Sauvegardes

Base de données chaque nuit à 2 h, conservée 14 jours :

```bash
mkdir -p /home/deploy/sauvegardes
crontab -e
```

```cron
0 2 * * * PGPASSWORD='MOT_DE_PASSE_FORT' pg_dump -h 127.0.0.1 -U prolookup pro_lookup | gzip > /home/deploy/sauvegardes/pro_lookup_$(date +\%F).sql.gz && find /home/deploy/sauvegardes -name '*.sql.gz' -mtime +14 -delete
30 2 * * * tar czf /home/deploy/sauvegardes/fichiers_$(date +\%F).tgz -C /var/www/pro-lookup/pro-lookup-backend storage/app && find /home/deploy/sauvegardes -name 'fichiers_*.tgz' -mtime +14 -delete
```

`storage/app` contient les photos, médias, **CV et justificatifs** : c'est aussi important que la base. Pensez aussi aux **instantanés (snapshots)** du VPS dans hPanel, et à copier régulièrement les sauvegardes hors du serveur.

---

## 14. Mettre à jour le site après une modification

Sur votre ordinateur : `git push`. Puis sur le serveur :

```bash
cd /var/www/pro-lookup && git pull

# API
cd pro-lookup-backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache
sudo systemctl restart php8.3-fpm pro-lookup-queue

# Site
cd ../pro-lookup-frontend
npm ci && npm run build && pm2 restart pro-lookup-frontend

# Vider le cache des pages publiques (indispensable si une migration a changé les données affichées)
cd ../pro-lookup-backend && php artisan frontend:revalidate
```

---

## Annexe A — Récapitulatif des secrets à noter

| Secret | Où il sert |
|---|---|
| Mot de passe root / deploy du VPS | connexion SSH |
| `DB_PASSWORD` | `.env` Laravel + sauvegardes |
| `APP_KEY` (généré) | `.env` Laravel — **ne jamais le changer** en production (sinon mots de passe de réinitialisation et données chiffrées invalides) |
| `FRONTEND_REVALIDATE_SECRET` = `REVALIDATE_SECRET` | `.env` Laravel **et** `.env.production` Next.js (même valeur) |
| Mot de passe de la boîte email | `MAIL_PASSWORD` |
| Compte administrateur | créé à l'étape 6 |

## Annexe B — Hébergement mutualisé Hostinger (non recommandé)

Sur les offres **Business / Cloud** qui proposent des « applications Node.js » :

1. Base : créer une base **MySQL** dans hPanel et mettre `DB_CONNECTION=mysql`, `DB_PORT=3306`. Le code a été rendu compatible MySQL, mais cette configuration **n'a pas été testée** : lancez `php artisan test` en local contre une base MySQL avant de basculer.
2. API : déposer `pro-lookup-backend` hors de `public_html`, faire pointer le sous-domaine `api` sur son dossier `public`, lancer les commandes `composer`/`artisan` via le terminal SSH d'hPanel.
3. Emails : sans processus permanent, mettre `QUEUE_CONNECTION=sync` (les emails partent pendant la requête, un peu plus lentement).
4. Site : créer une application Node.js dans hPanel pour `pro-lookup-frontend` (commande de build `npm run build`, démarrage `npm run start`), avec les variables de l'étape 8.

Le VPS reste la solution conforme au brief (PostgreSQL, processus en arrière-plan, contrôle complet).
