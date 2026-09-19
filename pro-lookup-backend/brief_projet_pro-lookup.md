# Spécification technique — PRO-LOOKUP
### Réseau professionnel interne pour l'Institut Universitaire ZTF (Bertoua)

Ce document est destiné à un agent IA assistant au développement. Il décrit le contexte, les rôles, les fonctionnalités, le modèle de données et la stack technique du projet, afin de servir de référence tout au long du développement.

---

## 1. Contexte et vision

**PRO-LOOKUP** est un réseau social professionnel réservé aux membres de l'**Institut Universitaire ZTF** (Bertoua), fonctionnant comme un LinkedIn interne : chaque membre (enseignant, chercheur, étudiant, personnel administratif, etc.) crée un profil public, publie du contenu, et est visible/classable selon son **rang** (Professeur, Docteur, Ingénieur, Étudiant, etc.).

Point clé qui différencie PRO-LOOKUP de LinkedIn : **l'inscription est réservée aux membres de l'institut**, et **tout nouveau profil doit être approuvé par un administrateur avant de devenir public**, à l'exception des profils créés directement par un administrateur (auto-approuvés).

La face publique du site (accueil, flux de publications, profils, recherche) reste **consultable par n'importe quel visiteur**, membre ou non de l'institut, exactement comme un profil LinkedIn public est consultable via un simple lien — mais **seule la création de compte est restreinte**.

---

## 2. Acteurs et rôles

| Rôle | Description | Droits |
|---|---|---|
| **Visiteur anonyme** | Toute personne, interne ou externe, sans compte | Consulte la page d'accueil publique, les profils publics (via lien direct ou recherche), les publications publiques, les pages de classement par rang. Ne peut ni publier, ni commenter, ni se connecter à un membre. |
| **Utilisateur en attente d'approbation** | Vient de s'inscrire, profil créé mais non validé par l'admin | Peut se connecter à son espace, éditer son profil, mais son profil **n'est pas visible publiquement** et n'apparaît pas dans les classements/recherches tant qu'il n'est pas approuvé. Bandeau "en attente de validation" affiché. |
| **Utilisateur approuvé (membre public)** | Profil validé par un admin | Profil visible publiquement, peut publier des posts, commenter, liker, se connecter à d'autres membres, apparaît dans les classements par rang et dans la recherche. |
| **Administrateur** | Géré par l'institut | Tous les droits d'un membre + peut créer son propre profil **sans validation**, approuver/rejeter les inscriptions en attente, suspendre ou supprimer un profil, gérer les rangs disponibles, modérer les publications. |

---

## 3. Parcours utilisateur détaillé

### 3.1 Inscription (membre standard)
1. L'utilisateur clique sur "S'inscrire" depuis la page publique.
2. Formulaire : nom, prénom, email (idéalement restreint à un domaine institutionnel, ex. `@iuztf.cm`, si l'institut dispose d'un tel domaine — sinon validation manuelle par l'admin), mot de passe, photo de profil, rang (sélection dans une liste prédéfinie : Professeur, Docteur, Ingénieur, Étudiant, Chercheur, Personnel administratif, etc.), établissement/département interne, bio courte.
3. À la soumission, le compte est créé avec le statut `pending` (en attente).
4. L'utilisateur reçoit un email de confirmation ("votre profil est en cours de validation par l'administration").
5. Un administrateur reçoit une notification (email + notification interne) d'une nouvelle demande.
6. L'utilisateur peut se connecter immédiatement à son espace personnel, mais voit un bandeau "Profil en attente de validation — non visible publiquement", et ne peut pas encore publier ni apparaître dans les classements.

### 3.2 Approbation par l'administrateur
1. L'admin accède à un tableau de bord "Demandes en attente" listant tous les profils `pending`.
2. Pour chaque demande, l'admin voit les informations soumises (photo, nom, rang, email) et peut : **Approuver**, **Rejeter** (avec motif optionnel), ou **Demander une correction** (renvoie un message à l'utilisateur).
3. Si approuvé : le statut passe à `approved`, le profil devient public, l'utilisateur reçoit une notification/email.
4. Si rejeté : le compte passe à `rejected` (ou supprimé selon la politique retenue), l'utilisateur reçoit un email avec le motif.

### 3.3 Création de profil par un administrateur
- L'admin dispose d'un formulaire identique à l'inscription standard, mais accessible depuis son tableau de bord.
- Le profil créé passe **directement** au statut `approved`, sans passer par la file d'attente.

### 3.4 Consultation publique
- Un visiteur non connecté peut : parcourir la page d'accueil publique (grille de profils/posts publics), consulter un profil via son lien direct (`/profil/{slug-ou-id}`), parcourir les pages de classement par rang, effectuer une recherche par nom/rang/département.
- Un visiteur ne peut pas voir les profils `pending`/`rejected`, ni interagir (like, commentaire, message) sans compte.

### 3.5 Partage de profil ("demande de lien")
- Chaque profil public possède une URL stable et partageable (ex. `pro-lookup.iuztf.cm/p/jean-dupont`).
- Un bouton "Copier le lien du profil" est disponible sur chaque page profil, permettant à un membre d'envoyer son lien à un tiers, exactement comme sur LinkedIn.

---

## 4. Fonctionnalités détaillées par écran

1. **Accueil public** — bandeau institutionnel (logo PRO-LOOKUP + mention "Institut Universitaire ZTF, Bertoua"), fil de publications publiques (posts des membres approuvés), mise en avant de profils par rang, barre de recherche.
2. **Inscription / Connexion** — formulaires décrits en 3.1, avec validations côté client et serveur.
3. **Fil d'actualité (connecté)** — publications des membres suivis/connectés + suggestions, possibilité de publier un post (texte + image), liker, commenter.
4. **Page de classement général** — liste de tous les membres approuvés, filtrable par rang, département, recherche texte.
5. **Pages de classement par rang** (Professeur, Docteur, Ingénieur, Étudiant, etc.) — mêmes composants que le classement général, filtrés par rang, avec bandeau de catégorie.
6. **Page de profil individuel** — photo, nom, rang (badge), département, bio, parcours/expérience, publications du membre, bouton "Se connecter" (demande de mise en relation), bouton "Copier le lien du profil".
7. **Tableau de bord administrateur**
   - Vue "Demandes en attente" (approbation/rejet)
   - Vue "Tous les membres" (suspendre, supprimer, modifier le rang)
   - Gestion des rangs disponibles (CRUD sur la liste des rangs/grades)
   - Modération des publications signalées
   - Création directe de profil (auto-approuvé)
8. **Paramètres du compte** — édition du profil, changement de mot de passe, confidentialité, suppression du compte.
9. **Messagerie** (optionnelle en V1, à prévoir en V2) — messages entre membres connectés.

---

## 5. Modèle de données (proposition)

### `users`
| Champ | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| first_name | string | |
| last_name | string | |
| email | string, unique | |
| password | string, hashé | |
| avatar_path | string, nullable | |
| bio | text, nullable | |
| department | string, nullable | département/faculté interne |
| rank_id | FK → `ranks.id` | |
| role | enum(`member`, `admin`) | |
| status | enum(`pending`, `approved`, `rejected`, `suspended`) | par défaut `pending`, `approved` si créé par un admin |
| slug | string, unique | pour URL de profil publique |
| approved_by | FK → `users.id`, nullable | admin ayant validé |
| approved_at | timestamp, nullable | |
| rejection_reason | text, nullable | |
| created_at / updated_at | timestamp | |

### `ranks`
| Champ | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| name | string | ex. "Professeur", "Docteur", "Ingénieur", "Étudiant" |
| slug | string, unique | pour les routes `/classement/{slug}` |
| order | integer | ordre d'affichage/priorité hiérarchique |
| badge_color | string, nullable | par défaut l'or `#D4A24C` défini dans la charte |

### `posts`
| Champ | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| user_id | FK → `users.id` | |
| content | text | |
| image_path | string, nullable | |
| visibility | enum(`public`, `connections`) | par défaut `public` |
| created_at / updated_at | timestamp | |

### `comments`
id, post_id (FK), user_id (FK), content, created_at

### `likes`
id, post_id (FK), user_id (FK), created_at (contrainte unique post_id+user_id)

### `connections`
id, requester_id (FK → users), addressee_id (FK → users), status (`pending`, `accepted`, `declined`), created_at

### `notifications`
id, user_id (FK), type, payload (json), read_at, created_at

---

## 6. Stack technique

### Backend — Laravel
- **Framework** : Laravel 12.
- **API** : REST API via routes `api.php`, Laravel Sanctum pour l'authentification SPA (cookies + tokens, adapté à un frontend React séparé).
- **Base de données** : PostgreSQL (cohérent avec l'expérience déjà acquise sur d'autres projets) ou MySQL selon préférence finale.
- **Stockage des fichiers** (photos de profil, images de posts) : disque local en développement, migration vers un stockage objet (S3-compatible ou Cloudflare R2) en production.
- **Autorisations** : Policies/Gates Laravel pour distinguer `member` / `admin`, middleware personnalisé pour bloquer l'accès aux fonctionnalités réservées aux profils `approved`.
- **Notifications** : Laravel Notifications (email via Mailtrap en dev, SMTP institutionnel en prod) pour les événements (inscription reçue, profil approuvé/rejeté, nouvelle demande pour l'admin).
- **Validation** : Form Requests dédiés pour l'inscription, la création de post, l'approbation admin.
- **Seeders** : rangs par défaut (Professeur, Docteur, Ingénieur, Étudiant, Chercheur, Personnel administratif), compte admin initial.

### Frontend — React
- **Framework** : React (Vite recommandé pour la rapidité de build).
- **Routing** : React Router.
- **Gestion d'état / requêtes API** : React Query (ou équivalent) pour la synchronisation avec l'API Laravel, Context API ou Zustand pour l'état d'authentification global.
- **UI** : Tailwind CSS, en respectant strictement la charte graphique PRO-LOOKUP (palette ci-dessous), composants réutilisables (carte profil, badge de rang, bouton, formulaire multi-étapes).
- **Authentification** : intégration avec Laravel Sanctum (cookies httpOnly + CSRF token), gestion des états `pending` / `approved` pour adapter l'interface (bandeau d'attente, restrictions de fonctionnalités).
- **Upload de photo** : composant de recadrage/prévisualisation avant envoi.

### Environnement / déploiement
- **Pas de conteneurisation Docker** : déploiement direct (build natif / Nixpacks côté Railway pour le backend Laravel 12, build statique Vite pour le frontend React).
- **Hébergement** : Railway (cohérent avec les déploiements déjà réalisés), avec base PostgreSQL managée.
- **Variables d'environnement** : séparation claire dev/prod pour les clés API, SMTP, stockage fichiers.
- **CI/CD** (optionnel V2) : pipeline simple de build/test/déploiement.

---

## 7. Identité visuelle (rappel de la charte déjà définie)

| Rôle | Couleur | Code hex |
|---|---|---|
| Primaire | Bleu nuit profond | `#0A2540` |
| Accent interactif | Sarcelle / turquoise | `#00A9A5` |
| Accent "rang" (badges) | Or doux | `#D4A24C` |
| Fond général | Gris très clair | `#F7F9FB` |
| Fond des cartes | Blanc | `#FFFFFF` |
| Texte principal | Presque noir | `#1A1A1A` |
| Texte secondaire | Gris moyen | `#6B7280` |
| Bordures | Gris clair | `#E2E8F0` |
| Succès | Vert discret | `#2F9E44` |
| Erreur/alerte | Rouge discret | `#D64545` |

Le logo PRO-LOOKUP (voir prompt de génération séparé) doit apparaître dans le header de toutes les pages, avec la mention "Institut Universitaire ZTF — Bertoua" en sous-titre discret sur la page d'accueil publique.

---

## 8. Exigences non-fonctionnelles

- **Sécurité** : hashage des mots de passe (bcrypt/argon2 via Laravel), protection CSRF, validation stricte des uploads (type/taille des images), limitation du taux de requêtes sur les endpoints sensibles (inscription, connexion).
- **Confidentialité** : un profil `pending` ou `rejected` ne doit être visible ni via l'API publique, ni via une recherche — vérification systématique du statut côté backend, pas seulement côté frontend.
- **Performance** : pagination sur les listes (classements, fil d'actualité), lazy loading des images.
- **Responsive** : toutes les pages doivent être utilisables sur desktop et mobile.
- **Accessibilité** : contrastes conformes (le bleu nuit sur fond clair et le blanc sur bleu nuit respectent déjà un bon contraste), labels de formulaire explicites.

---

## 9. Priorisation suggérée (MVP puis itérations)

**V1 (MVP)**
- Inscription avec statut `pending`, approbation admin, création directe par l'admin
- Page d'accueil publique, page profil publique, classement général et par rang
- Fil de publications (texte + image, like, commentaire)
- Authentification, gestion de session

**V2**
- Système de connexions entre membres (demande/acceptation)
- Messagerie interne
- Notifications en temps réel
- Modération avancée des publications

---

