# PRO-LOOKUP — Document de cadrage du projet

> **Destinataire :** l'agent IA qui assiste le développement de PRO-LOOKUP.
> **Rôle du document :** source de vérité unique sur le projet. En cas de doute, ce document prime sur toute supposition. Tout point qui n'y figure pas est traité selon la section 15 (« Comment travailler »).

---

## 1. Le projet en une phrase

**PRO-LOOKUP est la vitrine professionnelle publique du corps enseignant de l'Université ZTF (Bertoua, Cameroun)**. Elle s'inspire des profils et des publications de LinkedIn, mais **ce n'est pas un réseau social**. Chaque enseignant approuvé y a un profil public et y publie des contenus publics, consultables par le monde entier sans compte. Les enseignants n'échangent pas entre eux sur la plateforme : pas de messagerie, pas de mise en relation (ajout à un réseau), pas de commentaires.

**Stack technique :** PostgreSQL (base de données) · Laravel 12 (backend, API REST, déjà implémenté) · React JS + TypeScript avec le framework Next.js (frontend) · communication exclusivement par API (détails au §9).

## 2. Vision et objectifs

| Objectif | Ce que cela signifie concrètement |
|---|---|
| **Valoriser l'université** | N'importe qui dans le monde (étudiant, parent, partenaire, chercheur, recruteur) peut découvrir les enseignants de l'Université ZTF, leurs parcours, leurs domaines d'expertise, leurs travaux et leurs publications. |
| **Garantir la fiabilité** | Seuls de vrais enseignants de l'université apparaissent : chaque compte est **validé par un administrateur** avant d'être visible. |
| **Donner la parole aux enseignants** | Chaque enseignant approuvé gère lui-même son profil et **publie des contenus publics** (actualités, articles, annonces, travaux) visibles de tous. |

### Ce que PRO-LOOKUP reprend de LinkedIn, et ce qu'il écarte

| | LinkedIn | PRO-LOOKUP |
|---|---|---|
| Qui peut créer un compte | Tout le monde | **Uniquement le personnel enseignant de l'Université ZTF** |
| Activation du compte | Immédiate | **Après approbation d'un administrateur** |
| Profils | Publics, URL personnalisable, partage | ✅ **Repris** : publics, URL `/in/…` personnalisable, copie du lien, QR code, PDF |
| Publications (posts) | Fil d'actualité | ✅ **Repris, entièrement public** : toute publication est visible de tous, sans compte |
| Mise en relation entre membres (bouton « Se connecter » d'un profil LinkedIn), abonnements, invitations | Oui | ❌ **Écarté** — sur PRO-LOOKUP, « Se connecter » sert uniquement à **accéder à son compte** (§5.3) |
| Messagerie entre membres | Oui | ❌ **Écarté** |
| Réactions (« J'aime »…) et commentaires | Oui | ❌ **Écarté** |
| Fil personnalisé, suggestions de personnes | Oui | ❌ **Écarté** : un seul fil public, identique pour tous |

---

## 3. Les acteurs

| Acteur | Description | Ce qu'il peut faire |
|---|---|---|
| **Visiteur** | Toute personne, sans compte, partout dans le monde | Consulter l'accueil, l'annuaire, les profils et **toutes les publications** ; partager un lien ; signaler un contenu ; déposer une demande d'inscription (s'il est enseignant) |
| **Enseignant en attente** | A déposé une demande, pas encore approuvée | Se connecter, compléter son profil en brouillon, suivre l'état de sa demande. **Rien de lui n'est public**, il ne peut pas publier |
| **Enseignant approuvé** | Compte validé par l'administrateur | Profil visible publiquement ; accès à son **espace enseignant** pour gérer son profil et ses publications |
| **Enseignant refusé / suspendu** | Demande rejetée ou compte suspendu | Voit uniquement un écran expliquant le motif et la marche à suivre. Profil **et publications** retirés de toutes les pages publiques |
| **Administrateur** | Gestionnaire de la plateforme, désigné par l'université | Approuver/refuser les demandes, créer des comptes directement, gérer les enseignants, les grades, les facultés et modérer les publications |

> **Les étudiants, le personnel administratif non enseignant et les personnes extérieures ne peuvent pas créer de compte.** Ils restent des visiteurs, avec un accès complet en lecture.

---

## 4. Règle d'accès fondamentale : trois zones

### Zone A — Publique (sans compte, visible dans le monde entier)

| Page | Contenu |
|---|---|
| **Accueil** | Présentation de PRO-LOOKUP et de l'Université ZTF, barre de recherche, enseignants mis en avant, **dernières publications**, chiffres clés (nombre d'enseignants, de publications, de facultés/départements), appel à l'action « Vous êtes enseignant à l'Université ZTF ? Demandez votre accès » |
| **Annuaire des enseignants** | Liste de **tous les enseignants approuvés**, recherche par nom, filtres (faculté, département, grade, domaine d'expertise), tri alphabétique, pagination |
| **Profil détaillé d'un enseignant** | Toutes les informations publiques de l'enseignant (§6) et **ses publications**, à une **URL unique et personnalisable** (`/in/:identifiant`, ex. `/in/jean-mbarga`), avec les fonctions de partage : copier le lien, QR code, enregistrer en PDF (§6.4 et §6.5) |
| **Publications** | Fil public de toutes les publications des enseignants, du plus récent au plus ancien ; filtres (catégorie, faculté, département, enseignant) ; recherche par mot-clé |
| **Détail d'une publication** | Page propre à chaque publication (`/publications/:id`), partageable, avec aperçu de lien (§7) |
| **Recherche** | Résultats sur les enseignants et les publications |

Pages techniques également publiques : inscription, connexion, mot de passe oublié, mentions légales / politique de confidentialité, pages d'erreur (404).

### Zone B — Espace enseignant (enseignant connecté)

Espace **de gestion personnelle**, pas d'espace social : tableau de bord personnel, modification de son profil, rédaction et gestion de ses publications, réglages « Mon profil public et mon URL », paramètres du compte. Un enseignant en attente n'y voit que son profil en brouillon et l'état de sa demande.

### Zone C — Administration (administrateurs uniquement)

Tableau de bord, demandes d'inscription, gestion des enseignants, création directe de comptes, grades, facultés et départements, modération des publications et des signalements.

### Règle absolue

> Le contenu public (profils approuvés et publications publiées) est visible de tous. **Tout le reste ne doit jamais être accessible publiquement**, ni par l'interface, ni par l'API, ni par un lien direct, ni par les moteurs de recherche : données de compte, justificatifs et matricules, coordonnées et sections masquées par l'enseignant, profils non approuvés, brouillons de publication, publications masquées par l'administration, contenu des enseignants suspendus. Cette règle est appliquée **côté serveur** (API Laravel), jamais seulement en masquant des éléments dans l'interface.

---

## 5. Inscription et approbation (parcours clé)

### 5.1 Qui peut s'inscrire

Uniquement le **personnel enseignant de l'Université ZTF**. Le formulaire d'inscription recueille les éléments permettant à l'administrateur de le vérifier :

1. **Compte** : nom, prénom, email, mot de passe.
2. **Rattachement** : faculté, département, grade, **matricule enseignant**, **justificatif** (attestation de service, arrêté de nomination ou contrat — PDF ou image).
3. **Profil de base** : photo, titre professionnel, domaine d'expertise principal.
4. **Récapitulatif** et acceptation des conditions d'utilisation et de la politique de confidentialité.

Après envoi : écran « Demande envoyée — en attente de validation par l'administration » + email de confirmation.

### 5.2 Cycle de vie d'un compte

```
                 ┌──────────────► REFUSÉ (motif obligatoire) ──► nouvelle demande possible
                 │
INSCRIPTION ──► EN ATTENTE ──► APPROUVÉ ◄──► SUSPENDU (motif obligatoire)
                                  ▲
CRÉATION DIRECTE PAR L'ADMIN ─────┘  (approuvé d'office)
```

| Transition | Qui | Effet |
|---|---|---|
| Inscription → En attente | Enseignant | Email à l'administrateur |
| En attente → Approuvé | Admin | Email « Votre compte est activé » ; profil publié dans l'annuaire ; l'enseignant peut publier |
| En attente → Refusé | Admin | Email avec le motif ; aucune donnée publique |
| Approuvé → Suspendu | Admin | Profil **et publications immédiatement** retirés des pages publiques ; accès à l'espace enseignant bloqué |
| Suspendu → Approuvé | Admin | Profil et publications de nouveau visibles |
| Création directe | Admin | Compte approuvé d'office ; l'enseignant reçoit un email pour définir son mot de passe |

Toutes les actions de l'administrateur sont **journalisées** (qui, quoi, quand, motif). Les notifications aux enseignants se font **par email** et par un bandeau dans leur espace ; il n'y a pas de centre de notifications social.

---

### 5.3 Le bouton « Se connecter » (accès au compte)

- **Emplacement** : bouton **« Se connecter »** visible dans le header de **toutes les pages publiques**, en haut à droite, à côté de « Demander un accès » (desktop) ; sur mobile, dans le menu et en bouton compact dans le header.
- **Destination** : page `/connexion` — email, mot de passe, case « Rester connecté », lien « Mot de passe oublié ? », lien « Vous êtes enseignant et n'avez pas de compte ? Demander un accès ».
- **Qui l'utilise** : les enseignants (en attente, approuvés, refusés, suspendus) et les administrateurs. Les visiteurs n'en ont pas besoin : tout le contenu public est accessible sans compte.
- **Après connexion**, redirection automatique selon le compte :

| Compte | Redirigé vers |
|---|---|
| Enseignant approuvé | `/espace` (tableau de bord), ou la page d'où il venait |
| Enseignant en attente / refusé / suspendu | `/espace/en-attente` (écran explicatif) |
| Administrateur | `/admin` |

- **Une fois connecté**, le bouton « Se connecter » est remplacé par « Publier » (enseignant approuvé) et le **menu avatar** (Mon espace, Mon profil, Mes publications, Paramètres, **Se déconnecter**).
- **Erreurs** : message unique « Email ou mot de passe incorrect » (sans préciser lequel) ; blocage temporaire après plusieurs échecs ; email non vérifié → invitation à renvoyer l'email de vérification.

---

## 6. Le profil enseignant

### 6.1 Contenu du profil

- **En-tête** : photo, bannière, nom complet, **grade** (badge), titre professionnel, faculté et département
- **À propos** : biographie
- **Domaines d'expertise** et spécialités
- **Enseignements** : cours et unités d'enseignement dispensés
- **Parcours académique** : diplômes (intitulé, établissement, année)
- **Expérience professionnelle**
- **Recherche** : axes de recherche, **publications scientifiques** (titre, revue/éditeur, année, lien/DOI)
- **Distinctions** et prix
- **Langues**
- **Liens** : ORCID, Google Scholar, ResearchGate, LinkedIn, site personnel
- **Coordonnées** : email professionnel, téléphone, bureau
- **Publications** : onglet listant ses publications PRO-LOOKUP (§7)

### 6.2 Qui voit quoi

Il n'y a que deux vues d'un profil : la **vue publique** (identique pour tout le monde, y compris les autres enseignants connectés) et la **vue du propriétaire** (avec modification).

| Élément | Tout le monde (vue publique) | L'enseignant lui-même | Administrateur |
|---|---|---|---|
| En-tête (photo, nom, grade, titre, faculté, département) | ✅ toujours | ✅ + modification | ✅ |
| À propos, expertise, enseignements, parcours, expérience, recherche, distinctions, langues, liens | ✅ sauf sections masquées (§6.6) | ✅ + modification | ✅ |
| Email professionnel, téléphone, bureau | ⚙️ uniquement ceux que l'enseignant rend publics | ✅ | ✅ |
| Publications publiées | ✅ | ✅ + gestion | ✅ + modération |
| Brouillons de publication | ❌ | ✅ | ❌ |
| Matricule, justificatif, statut du compte | ❌ | ✅ (sauf justificatif après traitement) | ✅ |
| Copier le lien, partager, QR code, enregistrer en PDF | ✅ | ✅ | ✅ |

### 6.3 Grades

Le grade est une **catégorie informative**, jamais une échelle de mérite. La liste est gérée par l'administrateur ; valeurs initiales proposées :

Professeur · Maître de conférences · Chargé de cours · Assistant · Enseignant vacataire

- Tous les badges de grade ont le même traitement visuel.
- Aucun libellé ne hiérarchise les personnes ; l'annuaire ne trie jamais par grade ou par « score ».

### 6.4 L'URL du profil (comme `linkedin.com/in/…`)

Sur LinkedIn, chaque membre a une adresse de profil publique unique (`linkedin.com/in/identifiant`), qu'il peut personnaliser et diffuser partout : CV, signature d'email, carte de visite, site web. PRO-LOOKUP reprend ce principe :

| Règle | Détail |
|---|---|
| **Format** | `https://<domaine>/in/<identifiant>` — ex. `…/in/jean-mbarga`. Adresse courte, pratique sur une carte de visite ou une diapositive |
| **Création automatique** | À l'approbation du compte, l'identifiant est généré à partir de « prénom-nom » : minuscules, sans accents, espaces remplacés par des tirets. En cas de doublon, un suffixe est ajouté (`jean-mbarga-2`) |
| **Personnalisation** | L'enseignant peut le modifier depuis « Modifier mon profil public et mon URL » : **3 à 100 caractères**, lettres minuscules, chiffres et tirets uniquement ; unicité vérifiée **en direct** pendant la saisie |
| **Mots réservés** | Interdits comme identifiant : `admin`, `api`, `connexion`, `inscription`, `parametres`, `publications`, `recherche`, etc. |
| **Limite de modifications** | 5 changements maximum par période de 180 jours (comme LinkedIn), pour éviter les abus et les liens instables |
| **Anciennes URL** | **Amélioration par rapport à LinkedIn** : un ancien identifiant **redirige définitivement (301)** vers le nouveau, afin que les liens déjà imprimés ou partagés continuent de fonctionner. Un ancien identifiant ne peut pas être repris par un autre enseignant |
| **Profil indisponible** | Si le compte est en attente, refusé, suspendu ou supprimé, l'URL affiche une page « Ce profil n'est pas disponible » (404), **sans révéler la raison** |
| **Contrôle admin** | L'administrateur peut réinitialiser un identifiant inapproprié (action journalisée) |
| **URL canonique** | Chaque profil déclare son URL canonique (balise `canonical`) : une seule adresse officielle par profil pour les moteurs de recherche |

### 6.5 Partager un profil

| Fonction | Où | Comportement |
|---|---|---|
| **Copier le lien du profil** | Bouton sur l'en-tête du profil + menu « Plus… » | Copie l'URL canonique dans le presse-papiers ; confirmation « Lien copié » affichée **dans le bouton** pendant 2 secondes |
| **Partager** (mobile) | Menu « Plus… » | Ouvre le partage natif du téléphone (WhatsApp, SMS, email…) via l'API Web Share ; à défaut, copie le lien |
| **QR code du profil** | Menu « Plus… » et page « Mon profil public » | Affiche le QR code de l'URL du profil, téléchargeable en PNG et SVG, pour cartes de visite, affiches, diapositives de conférence |
| **Enregistrer en PDF** | Menu « Plus… » | Génère un PDF propre du profil (mise en page CV, logo de l'université, URL et QR code en pied de page) ne contenant **que les sections publiques** |
| **Aperçu du lien** | Automatique | Quand l'URL est collée dans WhatsApp, Facebook, LinkedIn, un email… un aperçu riche s'affiche : photo, « Nom — Grade, Département · Université ZTF », courte bio (balises Open Graph et Twitter Card) |
| **Coordonnées** | Lien « Coordonnées » de l'en-tête | Fenêtre listant l'URL du profil PRO-LOOKUP (toujours affichée) puis les coordonnées que l'enseignant a rendues publiques |
| **Badge de profil** | Page « Mon profil public » | Code HTML prêt à coller (signature d'email, site personnel, page de laboratoire) affichant un petit badge « Voir mon profil PRO-LOOKUP » avec lien vers l'URL |

Il n'existe **aucun** bouton de mise en relation (« Ajouter à mon réseau », « Suivre ») ni « Message » sur un profil. Le bouton **« Se connecter »** de PRO-LOOKUP est uniquement celui de l'accès au compte, dans le header (§5.3).

### 6.6 « Mon profil public » (réglages de visibilité)

Page de l'espace enseignant, accessible depuis le profil (« Modifier mon profil public et mon URL ») et depuis les paramètres :

- **Aperçu en direct** : « Voir mon profil tel que le public le voit ».
- **Mon URL** : modification de l'identifiant (§6.4), bouton copier, QR code, badge.
- **Sections visibles** : un interrupteur par section — À propos, expertise, enseignements, parcours académique, expérience, recherche et publications scientifiques, distinctions, langues, liens. L'**en-tête** reste toujours public : c'est la base de l'annuaire.
- **Coordonnées** : un interrupteur pour chacune (email professionnel, téléphone, bureau), désactivées par défaut.
- **Référencement** : autoriser ou non l'indexation de son profil et de ses publications par les moteurs de recherche. Désactivé → les pages restent accessibles par leur lien mais portent une balise `noindex`.
- Une section ou une coordonnée masquée n'apparaît **nulle part** publiquement : ni sur la page, ni dans le PDF, ni dans l'aperçu de lien, ni dans l'API publique.

---

## 7. Les publications (posts) — toutes publiques

### 7.1 Principe

Un enseignant approuvé publie des contenus, comme sur LinkedIn, mais **chaque publication est publique** : visible par tout le monde, sans compte, et partageable par un lien. Il n'y a ni réactions, ni commentaires, ni partage interne, ni fil personnalisé.

### 7.2 Contenu d'une publication

| Élément | Détail |
|---|---|
| **Texte** | Obligatoire ; mise en forme simple (paragraphes, gras, italique, listes, liens) |
| **Titre** | Optionnel (recommandé pour les articles) |
| **Catégorie** | Actualité · Article · Événement · Annonce · Travaux de recherche (liste gérée par l'admin) |
| **Médias** | Jusqu'à 10 images (avec texte alternatif), ou un document PDF, ou un lien externe avec aperçu |
| **Date** | Date de publication ; mention « Modifiée le … » si l'auteur l'a éditée |

### 7.3 Ce que l'enseignant peut faire (espace enseignant)

- **Rédiger** dans une fenêtre « Nouvelle publication » (comme la modale « Commencer un post » de LinkedIn), avec aperçu avant publication.
- **Enregistrer en brouillon** ou **publier immédiatement**.
- **Modifier** ou **supprimer** ses propres publications (suppression avec confirmation).
- Voir la liste de ses publications avec leur état : brouillon, publiée, masquée par l'administration (avec le motif).

### 7.4 Où les publications apparaissent

- Page **Publications** (fil public de toutes les publications, filtres, recherche).
- Onglet **Publications** du profil de l'auteur.
- Section **Dernières publications** de l'accueil.
- Page de **détail** `/publications/:id` : contenu complet, carte de l'auteur (photo, nom, grade, lien vers son profil), autres publications du même auteur.

### 7.5 Partager une publication

Mêmes mécanismes que pour un profil : **Copier le lien**, **Partager** (partage natif mobile), et **aperçu riche** quand le lien est collé ailleurs (titre ou début du texte, première image ou photo de l'auteur, nom de l'auteur · Université ZTF).

### 7.6 Signalement et modération

Le contenu étant public, tout visiteur peut **signaler** une publication ou un profil (motif + commentaire optionnel + email optionnel), avec une protection anti-abus (limite de fréquence, captcha). L'administrateur traite les signalements (§8) et peut **masquer** une publication avec un motif communiqué à l'auteur.

### 7.7 Patterns d'interface repris de LinkedIn

Fenêtre « Nouvelle publication », visionneuse d'image plein écran (lightbox), tiroir d'édition d'une section de profil, menu « Plus… » (copier le lien, partager, QR code, PDF, signaler). Ces fenêtres sont autorisées dans les zones A et B, **jamais** dans la zone C.

---

## 8. L'administration (Zone C)

| Écran | Contenu |
|---|---|
| Tableau de bord | Indicateurs : enseignants actifs, demandes en attente, publications récentes, signalements ouverts |
| Demandes en attente | Liste filtrable → fiche détaillée avec justificatif → **Approuver** / **Refuser (motif obligatoire)** |
| Enseignants | Recherche, filtres (grade, faculté, statut), fiche enseignant : modifier le grade, **réinitialiser l'URL du profil**, suspendre, réactiver, supprimer, historique |
| Création directe | Formulaire pleine page ; compte approuvé d'office |
| Publications | Liste de toutes les publications (filtres : auteur, catégorie, statut) → **masquer** (motif obligatoire) / rétablir / supprimer |
| Signalements | Liste des signalements → classer sans suite / masquer la publication / suspendre l'auteur |
| Grades, catégories | Ajouter, renommer, désactiver |
| Facultés et départements | Gérer la liste utilisée dans les formulaires et les filtres |
| Journal d'audit | Historique de toutes les actions d'administration |

**Règles d'interface Zone C :** aucune modale, popup ni toast flottant ; chaque action est une page ou une section pleine page ; confirmations intégrées dans la page ; sidebar scrollable (menu burger sur mobile) ; pas de footer.

---

## 9. Architecture et stack technique (imposée)

### 9.1 Stack

| Couche | Technologie | État |
|---|---|---|
| Base de données | **PostgreSQL** | En place avec le backend |
| Backend | **Laravel 12**, API REST JSON | **Déjà implémenté** : à auditer (voir §9.5 et phase 0) |
| Frontend | **React JS + TypeScript**, avec le framework **Next.js** (App Router) — application séparée | À développer |
| Communication | **API REST** uniquement : le frontend ne touche jamais directement la base de données | — |

> **Précision pour l'agent :** le frontend **est** une application React JS + TypeScript. Next.js n'est pas une autre technologie à la place de React : c'est le framework React qui organise les pages et les routes, et qui prépare le HTML des pages publiques sur le serveur. Toute l'interface s'écrit en **composants React fonctionnels et hooks, en TypeScript (fichiers `.tsx`)**. Ne pas créer de projet Vite ou Create React App à côté.

Architecture « découplée » : deux projets distincts (`backend/` Laravel et `frontend/` Next.js) qui ne communiquent que par l'API.

```
Navigateur / WhatsApp / Google
        │
        ▼
Frontend Next.js (React + TS) ──(HTTPS / JSON)──► API Laravel 12 ──► PostgreSQL
  • pages publiques : HTML complet préparé sur le serveur        │
  • espace enseignant / admin : rendu dans le navigateur        └──► Stockage fichiers (photos, médias : public / justificatifs : privé), emails
```

**Pourquoi Next.js ?** Une application React classique (Vite) envoie au navigateur une page HTML **vide**, que le JavaScript remplit ensuite. Un navigateur s'en accommode, mais WhatsApp, Facebook, LinkedIn ou X ne lisent **que** ce HTML initial, sans exécuter le JavaScript : un lien de profil ou de publication partagé n'aurait **ni image, ni nom, ni description**. Google finit généralement par exécuter le JavaScript, mais plus lentement et moins fiablement. Next.js prépare le HTML **sur le serveur** (rendu côté serveur, SSR) : la page publique arrive complète, avec son contenu et ses balises d'aperçu. Le code reste du React ; Laravel reste le seul backend.

### 9.2 Côté backend (Laravel 12) — attendus

L'agent vérifie que le backend existant respecte ces principes, et les signale dans l'audit s'ils manquent :

- **Authentification** : Laravel Sanctum (cookies de session SPA de préférence, ou tokens), cohérente avec la configuration CORS.
- **Contrôle d'accès** : middlewares par groupe de routes (public / enseignant / enseignant approuvé / admin) + **Policies** Laravel (un enseignant ne modifie que son profil et ses publications). Le statut `approved` est vérifié côté serveur.
- **API Resources** distinctes selon le public : `PublicProfileResource` (champs publics uniquement, sections et coordonnées masquées exclues), `OwnerProfileResource`, `AdminProfileResource` ; `PublicPostResource`, `OwnerPostResource`. C'est la principale protection contre les fuites de données.
- **Requêtes publiques** : ne renvoient que les profils `approved` et les publications `published` dont l'auteur est `approved`.
- **Form Requests** pour toute validation d'entrée ; nettoyage du texte riche des publications (protection XSS).
- **Stockage** : disque public pour photos, bannières et médias des publications ; **disque privé** pour les justificatifs, servis uniquement via une route admin authentifiée.
- **Emails** via les Notifications Laravel, envoyés en file d'attente (queues).
- **Journal d'audit** des actions admin.
- Enums PHP pour les statuts et rôles ; migrations compatibles PostgreSQL.
- **Signal de mise à jour vers Next.js** : quand un profil ou une publication change, est masqué, supprimé, ou quand un compte est suspendu ou change d'identifiant, Laravel appelle une route sécurisée de revalidation du frontend (`POST /api/revalidate` avec clé secrète) pour que les pages publiques en cache soient mises à jour immédiatement.

### 9.3 Côté frontend (React JS + TypeScript, framework Next.js) — attendus

- **Next.js, App Router**, TypeScript en mode `strict`.
- **Zone A (publique)** : **Server Components + rendu côté serveur**. Les pages `/`, `/enseignants`, `/in/[slug]`, `/publications` et `/publications/[id]` appellent l'API publique Laravel depuis le serveur Next.js et renvoient un HTML complet, avec les balises meta générées par `generateMetadata` (titre, description, Open Graph, Twitter Card, URL canonique). Mise en cache avec revalidation courte (ex. 5 minutes) et revalidation immédiate sur signal de Laravel.
- **Images d'aperçu** : générées par Next.js (`opengraph-image`) pour les profils (photo, nom, grade, logo) et les publications (titre, auteur, logo) lorsqu'aucune image n'est fournie.
- **Sitemap** (`sitemap.ts`) et `robots.ts` générés à partir de l'API publique (profils et publications indexables).
- **Redirections 301** des anciens identifiants faites par le serveur Next.js (`permanentRedirect`) ; contenu introuvable → `notFound()` (404).
- **Zones B et C** : composants client (`"use client"`), rendus dans le navigateur, en `noindex`.
- **Gardes d'accès** : `middleware.ts` de Next.js pour rediriger selon l'état de connexion, le statut et le rôle (§10).
- **TanStack Query** pour les appels API côté client, un client HTTP unique (fetch) configuré pour Sanctum.
- **Types TypeScript** qui reflètent exactement les réponses de l'API (un fichier de types par ressource).
- Formulaires : react-hook-form + zod (mêmes règles que les Form Requests Laravel). Éditeur de texte simple pour les publications (ex. Tiptap).
- Style : Tailwind CSS avec la palette du §13 en variables de thème.
- Bilinguisme : FR par défaut, EN (bibliothèque i18n compatible App Router, ex. next-intl).
- Les gardes du frontend améliorent l'expérience **mais ne protègent rien** : la sécurité reste dans l'API Laravel.
- Hébergement : Next.js a besoin d'un serveur Node.js (Vercel, ou un VPS avec Node) ; ce n'est pas un simple dossier de fichiers statiques.

### 9.4 Contrat d'API (principes)

- Préfixe versionné : `/api/v1`.
- Groupes de routes alignés sur les zones :

| Groupe | Protection | Exemples |
|---|---|---|
| **Public** | aucune | `GET /public/teachers` (annuaire, filtres, pagination) · `GET /public/teachers/{slug}` · `GET /public/teachers/{slug}/posts` · `GET /public/teachers/{slug}/pdf` · `GET /public/posts` (filtres, recherche, pagination) · `GET /public/posts/{id}` · `GET /public/search?q=…` · `GET /public/stats` · `GET /public/faculties`, `/grades`, `/categories` · `POST /public/reports` · `POST /auth/register` · `POST /auth/login` · `POST /auth/forgot-password` |
| **Enseignant** (tout statut) | `auth:sanctum` | `GET /me` · `GET /me/status` · `PUT /me/profile` (brouillon si en attente) |
| **Enseignant approuvé** | `auth:sanctum` + statut `approved` | `GET /me/posts` · `POST /me/posts` · `PUT /me/posts/{id}` · `DELETE /me/posts/{id}` · `POST /me/posts/{id}/media` · `GET /me/public-profile` · `PUT /me/public-profile` · `GET /me/slug/availability?slug=…` · `PUT /me/slug` · `PUT /me/settings` |
| **Admin** | `auth:sanctum` + rôle `admin` | `GET /admin/registration-requests` · `POST /admin/registration-requests/{id}/approve` · `.../reject` · `POST /admin/users` · `POST /admin/users/{id}/suspend` · `POST /admin/users/{id}/reset-slug` · `GET /admin/posts` · `POST /admin/posts/{id}/hide` · `GET /admin/reports` · `GET /admin/audit-log` |

- **Profil public et identifiant** : `GET /public/teachers/{slug}` répond selon trois cas — profil trouvé (200, champs publics filtrés selon §6.6) · ancien identifiant (réponse indiquant le nouvel identifiant, pour une redirection 301) · profil inexistant ou non approuvé (404, message identique dans tous les cas).
- **Publication publique** : `GET /public/posts/{id}` renvoie 404 pour un brouillon, une publication masquée ou celle d'un auteur non approuvé.
- Le **PDF** est généré côté serveur à partir des seuls champs publics ; le **QR code** peut être généré côté frontend à partir de l'URL canonique.
- Format de réponse uniforme : données, pagination (`meta`), et erreurs (`message`, `errors` par champ, code HTTP correct : 401, 403, 404, 422, 429).
- Documentation de l'API maintenue (fichier OpenAPI ou collection) : c'est le contrat entre les deux parties.

### 9.5 Le backend existe déjà : règle de travail

Le backend Laravel 12 est **déjà implémenté**. L'agent **ne le réécrit pas**. Sa première mission est de l'**analyser et d'en faire ressortir les incohérences** avec ce document (phase 0, §14). Il ne modifie le backend qu'après validation du rapport par le porteur du projet.

---

## 10. Plan des pages et routes du frontend (proposition)

| Zone | Route | Page |
|---|---|---|
| A | `/` | Accueil |
| A | `/enseignants` | Annuaire des enseignants |
| A | `/in/:slug` | Profil détaillé public (onglets : Profil · Publications) — **identique pour tous** ; si c'est son propre profil, l'enseignant connecté voit en plus un bouton « Modifier » |
| A | `/publications` | Fil public de toutes les publications |
| A | `/publications/:id` | Détail d'une publication |
| A | `/recherche` | Résultats de recherche (enseignants, publications) |
| A | `/inscription` | Demande d'inscription (multi-étapes) |
| A | `/connexion` | Page « Se connecter » (§5.3) |
| A | `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe` | Mot de passe oublié / nouveau mot de passe |
| A | `/confidentialite`, `/conditions` | Pages légales |
| B | `/espace` | Tableau de bord de l'enseignant : état du compte, raccourcis, ses dernières publications, alertes (publication masquée…) |
| B | `/espace/en-attente` | Écran du compte en attente / refusé / suspendu |
| B | `/espace/profil` | Modification de mon profil (tiroirs d'édition par section) |
| B | `/espace/publications` | Mes publications (brouillons, publiées, masquées) |
| B | `/espace/publications/nouvelle`, `/espace/publications/:id/modifier` | Rédaction / modification |
| B | `/espace/profil-public` | Mon profil public et mon URL (§6.6) |
| B | `/espace/parametres` | Compte, sécurité (mot de passe, sessions), langue |
| C | `/admin/...` | Administration |

Un visiteur qui ouvre une route B ou C est redirigé vers `/connexion` ; un enseignant non approuvé est redirigé vers `/espace/en-attente` ; un non-admin qui ouvre `/admin` reçoit une 403.

---

## 11. Modèle de données de référence (PostgreSQL)

> Le schéma réel est celui du backend existant. Ce tableau est la **référence fonctionnelle** : l'audit (phase 0) signale tout écart (table manquante, champ absent, statut non géré), sans exiger de reproduire ces noms à l'identique.

| Entité | Champs clés |
|---|---|
| `users` | id, email, mot de passe (haché), rôle (`teacher` / `admin`), statut (`pending` / `approved` / `rejected` / `suspended`), date de création |
| `profiles` | user_id, **slug (unique)**, nom, prénom, photo, bannière, grade_id, faculty_id, department_id, titre, bio, expertise, liens, email_public / phone_public / office_public (bool), **public_sections** (JSON : section → visible oui/non), **search_indexable** (bool) |
| `profile_slug_history` | profile_id, ancien slug (unique, jamais réattribué), date du changement, modifié par (enseignant ou admin) — redirections 301 et limite de 5 changements / 180 jours |
| `profile_*` | educations, experiences, courses, research_areas, scientific_publications, awards, languages |
| `registration_requests` | user_id, matricule, justificatif (fichier), statut, motif de refus, traité par, traité le |
| `grades`, `faculties`, `departments`, `post_categories` | listes gérées par l'admin |
| `posts` | id, auteur, titre (optionnel), contenu, catégorie, statut (`draft` / `published` / `hidden`), motif de masquage, publié le, modifié le |
| `post_media` | post_id, type (image / pdf / lien), fichier ou URL, texte alternatif, ordre |
| `reports` | cible (publication / profil), motif, commentaire, email du signaleur (optionnel), IP hachée, statut, traité par |
| `admin_audit_log` | admin, action, cible, motif, date |

**Hors périmètre** (ne pas créer) : mises en relation entre membres (réseau), abonnements, messages, conversations, réactions, commentaires, partages internes, fil personnalisé.

---

## 12. Sécurité, confidentialité et référencement

- **Contrôle d'accès côté serveur** sur chaque requête (middlewares, Policies et API Resources Laravel) ; le frontend ne fait que refléter ces règles.
- CORS limité au domaine du frontend ; configuration Sanctum (`SANCTUM_STATEFUL_DOMAINS`, cookies sécurisés) cohérente entre les deux parties.
- Aucun secret dans le frontend ni dans le dépôt Git (`.env` exclu).
- L'API publique ne renvoie **que** les champs publics des profils approuvés et les publications publiées — jamais les coordonnées ou sections masquées, les brouillons, les publications masquées, les matricules ni les justificatifs.
- **Justificatifs d'inscription** : stockage privé, accessible uniquement aux administrateurs, supprimés ou archivés après traitement.
- **Publications** : texte riche nettoyé côté serveur (XSS), types et tailles de fichiers contrôlés, images redimensionnées et débarrassées de leurs métadonnées (EXIF).
- Mots de passe hachés, vérification de l'email, limitation des tentatives de connexion, sessions révocables.
- Signalements publics protégés contre les abus (limite de fréquence, captcha).
- **SEO** : accueil, annuaire, profils et publications sont indexables (titre, description, URL canonique, sitemap) ; les profils et publications d'un enseignant ayant désactivé l'indexation (§6.6), ainsi que toutes les pages des zones B et C, sont en `noindex`.
- **Aperçus de lien (Open Graph)** : exigence centrale. Le HTML initial des pages publiques contient déjà les balises meta (titre, description, image, URL canonique), grâce au rendu côté serveur de Next.js (§9.3).
- Les redirections 301 des anciens identifiants sont faites **côté serveur** par Next.js, jamais seulement dans le navigateur.
- Respect de la vie privée : chaque enseignant contrôle ce qui est public ; une page de confidentialité explique quelles données sont publiques.

---

## 13. Identité visuelle

- **Logo PRO-LOOKUP** fourni, utilisé tel quel dans tous les headers. Mention « Université ZTF — Bertoua » sur l'accueil et dans le pied de page public.
- **Palette** :

| Rôle | Hex |
|---|---|
| Primaire (structure, header, boutons principaux) | `#0A2540` bleu nuit |
| Accent interactif (fonds de boutons, focus, état actif) | `#00A9A5` sarcelle — texte posé dessus en `#0A2540` |
| Sarcelle pour le texte (liens) | `#007F7C` |
| Badges de grade **uniquement** | `#D4A24C` or doux — texte posé dessus en `#0A2540` |
| Fond / cartes | `#F7F9FB` / `#FFFFFF` |
| Texte principal / secondaire | `#1A1A1A` / `#6B7280` |
| Bordures | `#E2E8F0` |
| Succès / attente / erreur | `#2F9E44` / `#B45309` / `#D64545` |

- Police **Inter** (Poppins possible pour les titres), cartes arrondies, ombres légères, beaucoup d'espace blanc.
- Contraste de texte ≥ 4,5:1 ; les états ne sont jamais indiqués par la seule couleur.
- **Header public** (tout le monde) : logo, Enseignants, Publications, recherche, FR/EN, puis les boutons **« Se connecter »** et « Demander un accès » — ou, pour un enseignant connecté, « Publier » et un menu avatar (Mon espace, Mon profil, Mes publications, Paramètres, Se déconnecter).
- **Espace enseignant** : même header + navigation latérale ou onglets de l'espace. **Zone C** : sidebar d'administration.
- Interface en **français**, bascule **FR / EN**.
- Responsive : desktop et mobile.

---

## 14. Plan de développement par phases

| Phase | Contenu | Résultat attendu |
|---|---|---|
| **0. Audit du backend existant** | Analyse complète du projet Laravel 12 et comparaison avec ce document (voir ci-dessous) | Rapport `AUDIT_BACKEND.md` validé par le porteur du projet |
| **1. Socle frontend** | Projet Next.js (React + TS), client API, authentification Sanctum, gardes de route, système de design, i18n | Connexion fonctionnelle de bout en bout, redirections selon le statut |
| **2. Inscription et administration** | Formulaire multi-étapes, upload du justificatif, file des demandes, approbation/refus, création directe, grades, facultés, catégories, journal d'audit | Un enseignant peut demander un accès, un admin peut l'approuver |
| **3. Profils et vitrine publique** | Édition du profil, accueil, annuaire avec filtres, profil public, URL personnalisable et redirections, « Mon profil public », copier le lien, partage mobile, QR code, PDF, aperçus Open Graph, badge, SEO | Les profils approuvés sont visibles dans le monde entier et partageables par un simple lien |
| **4. Publications** | Rédaction, brouillons, médias, modification, suppression, fil public, onglet du profil, page de détail, partage et aperçus, recherche | Les enseignants publient ; tout le monde lit et partage |
| **5. Modération et finitions** | Signalements publics, modération admin, pages légales, bilinguisme complet, tests, optimisation mobile et performances | Plateforme prête à la mise en production |

Pour les phases 2 à 5, l'agent branche le frontend sur les endpoints existants ; si un endpoint manque ou ne correspond pas, il le signale (ou le crée si le porteur l'a validé dans l'audit).

### Phase 0 — Audit du backend : ce qu'il faut vérifier

L'agent lit l'ensemble du projet Laravel (routes, contrôleurs, modèles, migrations, middlewares, policies, resources, form requests, config, tests) et le compare à ce document. Points de contrôle :

1. **Zones d'accès** : chaque route API appartient-elle au bon groupe (public / enseignant / enseignant approuvé / admin) avec le bon middleware ? Un compte `pending` ou `suspended` peut-il publier ?
2. **Fuites de données publiques** : les réponses publiques exposent-elles des champs privés (coordonnées ou sections masquées, matricule, justificatif, statut, mot de passe, tokens, brouillons, publications masquées) ? Les requêtes publiques filtrent-elles bien sur `approved` et `published` ?
3. **Cycle de vie du compte** : statuts `pending` / `approved` / `rejected` / `suspended`, transitions conformes au §5.2, motif obligatoire, création directe approuvée d'office, publications retirées à la suspension.
4. **Inscription** : réservée aux enseignants (matricule, justificatif) ? Justificatifs sur un disque privé ?
5. **Publications** : statuts `draft` / `published` / `hidden`, un enseignant ne peut modifier que ses propres publications, nettoyage XSS, contrôle des médias.
6. **Modèle de données** : écarts avec le §11 (tables, champs, relations, index, contraintes d'unicité, clés étrangères, suppression en cascade).
7. **Fonctionnalités hors périmètre** : si le backend contient des fonctions de réseau social (mise en relation entre membres, messagerie, commentaires, réactions, fil personnalisé), les **lister** comme « hors périmètre » avec une recommandation (désactiver les routes, conserver ou supprimer les tables). **Ne rien supprimer sans validation.**
8. **Rôles** : distinction `teacher` / `admin` fiable ; impossible de s'attribuer le rôle admin via l'inscription ou la mise à jour du profil (mass assignment).
9. **Validation** : Form Requests présentes sur chaque écriture ; règles cohérentes.
10. **Format de l'API** : préfixe et versionnement, format des réponses et des erreurs homogène, codes HTTP corrects, pagination.
11. **Sécurité** : CORS, Sanctum, limitation des tentatives (connexion, signalements), secrets dans le code, uploads.
12. **URL de profil** : slug unique, généré à l'approbation, règles du §6.4, historique et redirection, limite de changements, respect des réglages du §6.6 dans toutes les réponses publiques, y compris le PDF.
13. **Qualité** : code mort, doublons, nommage incohérent (FR/EN mélangés), requêtes N+1, absence de tests sur les règles d'accès, migrations incompatibles PostgreSQL.
14. **Fonctionnalités manquantes** : endpoints nécessaires aux écrans du §10 qui n'existent pas encore.

**Livrable : `AUDIT_BACKEND.md`**, avec pour chaque incohérence :

| # | Gravité | Fichier / ligne | Constat | Règle du document concernée | Correction proposée |
|---|---|---|---|---|---|

Gravités : **Bloquant** (faille de sécurité, fuite de données, règle d'accès non respectée) · **Important** (fonctionnalité manquante, incorrecte ou hors périmètre) · **Mineur** (qualité, nommage, confort).

Le rapport se termine par un **résumé en langage simple** (le porteur du projet n'est pas développeur) et par la liste des endpoints disponibles, qui servira de base au frontend.

---

## 15. Comment travailler (consignes pour l'agent)

- Tu enchaînes les étapes d'une phase **sans demander de permission** entre chaque écran ou fonctionnalité.
- Si un détail n'est pas précisé, tu prends **la décision la plus cohérente avec ce document**, tu continues, et tu la notes dans un fichier `DECISIONS.md`.
- Tu t'arrêtes pour demander **uniquement** avant une action irréversible (suppression de données, migration destructive, déploiement en production) ou si une demande contredit ce document.
- **Exception prévue : la phase 0.** Le backend Laravel existe déjà ; tu l'analyses sans le modifier, tu livres `AUDIT_BACKEND.md`, puis tu attends la validation du porteur du projet avant de toucher au backend.
- Tu ne réécris jamais une partie du backend qui fonctionne et respecte ce document : tu corriges de façon ciblée.
- Tu n'ajoutes **aucune fonction de réseau social** (mise en relation entre membres, abonnements, messagerie, commentaires, réactions), même si LinkedIn en possède. Le seul « Se connecter » est l'accès au compte.
- À la fin de chaque phase, tu vérifies les critères du §16 qui la concernent et tu fais un bref compte rendu : ce qui est fait, ce qui reste, les décisions prises.
- Tu écris un code lisible et commenté : le porteur du projet n'est pas développeur et doit pouvoir suivre l'avancement.

## 16. Critères d'acceptation

- [ ] Un visiteur non connecté voit l'accueil, l'annuaire, le profil de tout enseignant approuvé et **toutes les publications publiées**, sans créer de compte.
- [ ] Un visiteur ne voit **aucune** donnée privée (coordonnées ou sections masquées, brouillons, publications masquées, matricules, justificatifs), même via un lien direct ou l'API.
- [ ] Seul un enseignant peut déposer une demande d'inscription ; son profil n'apparaît nulle part publiquement avant approbation, et il ne peut pas publier.
- [ ] L'administrateur approuve ou refuse (avec motif) ; l'enseignant est notifié par email.
- [ ] Un compte suspendu disparaît immédiatement des pages publiques, avec toutes ses publications.
- [ ] L'administrateur peut créer un compte directement, approuvé d'office.
- [ ] Un enseignant approuvé peut rédiger, enregistrer en brouillon, publier, modifier et supprimer **ses** publications, et seulement les siennes.
- [ ] Chaque publication a sa propre page publique, partageable, avec un aperçu riche dans WhatsApp ou Facebook.
- [ ] Chaque enseignant approuvé possède une URL de profil unique `/in/…` ; il peut la personnaliser (règles du §6.4) et un ancien lien redirige vers le nouveau.
- [ ] « Copier le lien » fonctionne sur desktop et mobile, pour les profils comme pour les publications.
- [ ] Coller l'URL d'un profil dans WhatsApp ou Facebook affiche un aperçu avec photo, nom, grade et Université ZTF.
- [ ] Le QR code et le PDF d'un profil ne contiennent que les informations publiques.
- [ ] Une section ou coordonnée masquée dans « Mon profil public » n'apparaît ni sur la page, ni dans le PDF, ni dans l'API publique, ni dans l'aperçu de lien.
- [ ] Le bouton « Se connecter » est visible sur toutes les pages publiques, mène à `/connexion` et redirige chaque compte vers le bon espace après connexion.
- [ ] Il n'existe aucune fonction de mise en relation entre membres, de messagerie, de commentaire ou de réaction.
- [ ] Les pages publiques sont indexables ; les pages des zones B et C sont en `noindex`.
- [ ] Aucune modale ni popup dans l'administration.
- [ ] L'interface est utilisable sur mobile et respecte la palette et les contrastes.
- [ ] Toutes les incohérences **bloquantes** de `AUDIT_BACKEND.md` sont corrigées.
- [ ] Le frontend ne communique avec la base de données **que via l'API Laravel**, et les types TypeScript correspondent aux réponses réelles de l'API.
- [ ] Des tests automatisés (Laravel) couvrent les règles d'accès : visiteur, enseignant en attente, enseignant approuvé, admin.

---

## 17. Points à confirmer

1. **Vérification des enseignants** : l'université dispose-t-elle d'emails institutionnels (ex. `@...ztf...`) ? Si oui, l'inscription peut être limitée à ce domaine en plus de la validation par l'admin.
2. **Liste officielle** des facultés, départements, grades et catégories de publication.
3. **Validation des publications** : le document prévoit une publication **immédiate**, avec modération a posteriori par l'administrateur. L'université préfère-t-elle qu'un administrateur valide chaque publication **avant** sa mise en ligne ?
4. **Profil public obligatoire ?** L'en-tête du profil est toujours public et l'enseignant choisit les autres sections (§6.6). L'université souhaite-t-elle en plus permettre à un enseignant de se retirer complètement de l'annuaire ?
5. **Enseignants vacataires et émérites** : sont-ils éligibles ?
6. **Hébergement et nom de domaine** de la plateforme.
7. **Mode d'authentification Sanctum** : cookies de session (frontend et API sur le même domaine principal, ex. `prolookup…` et `api.prolookup…`) ou tokens — à aligner sur ce que le backend existant a déjà mis en place.