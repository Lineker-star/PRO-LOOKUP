# Décisions prises pendant le développement

Ce fichier liste les choix faits là où le brief (`brief_projet_pro-lookup.md`) ne tranchait pas (brief §15). Chaque point peut être remis en cause par le porteur du projet.

## Architecture

| # | Décision | Raison |
|---|---|---|
| 1 | Le frontend est une application **Next.js 16** (App Router, React 19, TypeScript strict) dans `pro-lookup-frontend/`. L'ancien frontend Vite a été supprimé. | Imposé par le brief §9 (rendu serveur pour les aperçus de lien). |
| 2 | Authentification par **jeton Sanctum** (`Authorization: Bearer`), et non par cookie de session. | Déjà en place côté Laravel ; fonctionne quel que soit le domaine de l'API (brief §17 point 7). Le jeton est conservé dans un cookie `pl_token` (SameSite=Lax) ; un cookie `pl_session` = `rôle.statut` sert au proxy Next.js pour les redirections. Ces cookies ne protègent rien : l'API vérifie tout. |
| 3 | « Rester connecté » : jeton de 30 jours ; sinon 12 heures et cookie de session. | Brief §5.3. |
| 4 | Nouvelle API **`/api/v1`** ; les anciennes routes non versionnées (réseau social : connexions, likes, commentaires, notifications) sont conservées dans `routes/api_legacy.php` mais **ne sont plus chargées**. Les tables correspondantes sont conservées. | Brief §9.4 et §14 point 7 : ne rien supprimer sans validation. |
| 5 | Le profil est porté par la table `users` (pas de table `profiles` séparée) ; les sections répétables (diplômes, expériences, cours, axes de recherche, publications scientifiques, distinctions, langues) sont dans une table unique `profile_items`. | Le brief autorise des noms différents (§11) ; évite de migrer les comptes existants. |
| 6 | La table historique `ranks` sert de table des **grades**. Les 5 grades du brief sont créés ; les anciens rangs (Docteur, Ingénieur, Étudiant…) sont **désactivés**, pas supprimés. | Brief §6.3. |
| 7 | Le rôle enseignant garde la valeur `member` en base ; l'API l'expose sous le nom `teacher`. | Évite une migration destructive des données existantes. |
| 8 | Les tests Laravel tournent sur SQLite en mémoire ; la migration d'alignement ne touche `information_schema` que sous PostgreSQL. | Corrigeait 13 tests en échec. |
| 9 | Emails envoyés via une notification unique `PlatformNotification` mise en file (`ShouldQueue`). En local, `QUEUE_CONNECTION=sync` et `MAIL_MAILER=log` : les emails sont écrits dans `storage/logs/laravel.log`. | Brief §9.2. En production : `QUEUE_CONNECTION=database` + un `php artisan queue:work`. |
| 10 | Revalidation : Laravel appelle `POST /api/revalidate` (Next.js) avec les étiquettes concernées (`teachers`, `posts`, `teacher:<slug>`, `post:<id>`, `stats`, `references`) et un secret partagé. Cache public : 5 minutes. | Brief §9.2, §9.3. |

## Fonctionnel

| # | Décision | Raison |
|---|---|---|
| 11 | Les **facultés et départements** créés sont **provisoires** (4 facultés, 13 départements). L'administrateur peut les renommer, en ajouter ou les désactiver depuis « Grades, catégories, facultés ». | Liste officielle à fournir (brief §17 point 2). |
| 12 | Aucun domaine email n'est imposé à l'inscription. | Brief §17 point 1 non tranché ; la vérification repose sur l'administrateur (matricule + justificatif). |
| 13 | Publications : **publication immédiate**, modération a posteriori. | Option par défaut du brief §17 point 3. |
| 14 | Une publication **masquée** par l'administration peut être corrigée par son auteur mais reste masquée jusqu'à ce qu'un administrateur la rétablisse. | Évite qu'un auteur annule seul une décision de modération. |
| 15 | Les brouillons ne sont visibles **que** de leur auteur (pas de l'administration). | Brief §6.2 (« Brouillons : administrateur ❌ »). |
| 16 | L'identifiant d'URL est limité à 5 changements par 180 jours **pour l'enseignant** ; une réinitialisation par l'administrateur ne compte pas dans ce quota. | Brief §6.4. |
| 17 | Le **PDF du profil** est produit par une page imprimable (`/in/<slug>/pdf`) générée côté serveur à partir de l'API publique, que le navigateur enregistre en PDF (« Enregistrer au format PDF »). | Garantit qu'il ne contient que les champs publics, sans bibliothèque PDF côté serveur. Une génération PDF côté Laravel (`GET /public/teachers/{slug}/pdf`) pourra être ajoutée si un fichier téléchargeable direct est exigé. |
| 18 | Anti-abus des signalements : limite de fréquence (3/minute, 30/jour par IP) + champ piège invisible. Pas de captcha visuel. | Brief §7.6 ; un captcha (ex. hCaptcha, Turnstile) demande une clé de service externe à choisir. |
| 19 | Un signalement de profil désigne le profil par son **identifiant public** (slug), jamais par l'identifiant interne du compte. | N'expose pas d'identifiant interne dans l'API publique. |
| 20 | La suppression d'un compte par l'administrateur exige de **retaper l'email** du compte ; les signalements ouverts sur ce compte sont clos automatiquement. | Action irréversible (brief §15), confirmation intégrée à la page (brief §8). |
| 21 | Bilinguisme : l'interface commune (en-tête, pied de page, accueil) bascule FR/EN via un cookie `pl_lang`. Les pages intérieures et les contenus saisis par les enseignants restent en français. | Traduction complète à faire en phase 5 (brief §14). |
| 22 | Les fonctions sociales visibles dans les maquettes (réseau, invitations, messagerie, réactions, commentaires, fil personnalisé, notifications sociales) **ne sont pas reprises**. Seul le style visuel des maquettes l'est. | Brief §2 et §15. |
| 23 | Palette : sarcelle `#00A9A5` avec **texte bleu nuit** dessus, liens en `#007F7C`, or uniquement sur les badges de grade. | Brief §13 (prime sur les maquettes). |

## Comptes de démonstration (données fictives)

- Administrateur : `admin@iuztf.cm` / `Password123!`
- Enseignants approuvés : `amina.tchoumi@iuztf.cm`, `dieudonne.ndongo@iuztf.cm`, … / `Password123!`
- Demande en attente : `blaise.ngono@iuztf.cm` / `Password123!`

À remplacer avant toute mise en production.
