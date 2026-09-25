# PRO-LOOKUP — frontend

Site Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS 4) de PRO-LOOKUP, la vitrine publique des enseignants de l'Université ZTF. Il ne communique qu'avec l'API Laravel (`/api/v1`).

Lancement, variables d'environnement et déploiement : voir `../DEPLOYMENT.md`. Choix de conception : `../DECISIONS.md`.

## Organisation

| Dossier | Contenu |
|---|---|
| `src/app/(public)` | Zone A, pages publiques rendues côté serveur : accueil, `/enseignants`, `/in/[slug]` (+ image d'aperçu), `/publications`, `/publications/[id]`, `/recherche`, connexion, inscription, mot de passe, pages légales |
| `src/app/(print)/in/[slug]/pdf` | Version imprimable / PDF d'un profil (champs publics uniquement) |
| `src/app/espace` | Zone B, espace enseignant (rendu dans le navigateur, `noindex`) |
| `src/app/admin` | Zone C, administration (aucune modale, confirmations intégrées aux pages) |
| `src/app/api/revalidate` | Signal de mise à jour envoyé par Laravel pour vider le cache des pages publiques |
| `src/proxy.ts` | Redirections selon l'état de connexion, le statut et le rôle (confort uniquement : la sécurité est dans l'API) |
| `src/lib/api/server.ts` | Appels à l'API publique depuis le serveur (cache 5 min, étiquettes de revalidation) |
| `src/lib/api/client.ts` | Client HTTP du navigateur (jeton Sanctum) |
| `src/lib/types.ts` | Types TypeScript reflétant exactement les réponses de l'API |
| `src/components` | Composants d'interface (`ui/`), du site public (`public/`), de l'espace (`space/`) et de l'administration (`admin/`) |

## Commandes

```bash
npm run dev      # développement sur http://localhost:3000
npm run build    # build de production
npm run start    # serveur de production
npm run lint     # ESLint
npx tsc --noEmit # vérification des types
```
