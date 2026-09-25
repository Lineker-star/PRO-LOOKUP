# PRO-LOOKUP — Analyse des maquettes

> **Note (25 septembre 2026)** : cette analyse a été écrite pour la **première version** du brief (réseau social). Le brief actuel (`brief_projet_pro-lookup.md`) écarte les fonctions sociales (réseau, messagerie, réactions, commentaires, notifications) et la hiérarchie des rangs CAMES. Les maquettes ont été supprimées du dépôt (récupérables dans l'historique git) ; seul leur **style visuel** a été repris dans le frontend Next.js. Les écarts retenus sont listés dans `DECISIONS.md`.

Ce document remplace les ~50 dossiers de maquettes statiques (`code.html` + `screen.png`) qui étaient à la racine du dépôt. Il décrit, écran par écran, ce que les maquettes montrent, ce qu'elles impliquent pour le backend, et où elles se contredisent. Il sert de référence pour implémenter le frontend React.

Les maquettes restent récupérables dans l'historique git (commit `43501c6` et antérieurs).

Documents liés : [brief_projet_pro-lookup.md](../brief_projet_pro-lookup.md) (spécification), `docs/DESIGN.md` (charte « Academic Prestige Modern »).

---

## Sommaire

1. [Inventaire](#1-inventaire)
2. [Système visuel réellement utilisé](#2-système-visuel-réellement-utilisé)
3. [Gabarits de page (shells)](#3-gabarits-de-page-shells)
4. [Zone A — Écrans publics](#4-zone-a--écrans-publics)
5. [Zone B — Espace membre connecté](#5-zone-b--espace-membre-connecté)
6. [Espace « profil en attente »](#6-espace--profil-en-attente-)
7. [Zone C — Administration](#7-zone-c--administration)
8. [Données implicites (impact backend)](#8-données-implicites-impact-backend)
9. [Incohérences et décisions à prendre](#9-incohérences-et-décisions-à-prendre)
10. [Périmètre recommandé et routes](#10-périmètre-recommandé-et-routes)

---

## 1. Inventaire

Les maquettes ont été générées en **10 lots** (10 configurations Tailwind différentes mais aux jetons identiques). Les zones suivent la nomenclature des noms de dossiers : **A** = public, **B** = membre connecté, **C** = administration.

**Légende du statut** : ★ = variante de référence recommandée · ◇ = variante secondaire à piocher · ✗ = à ignorer (contenu générique ou doublon)

| Écran | Dossier(s) | Support | Statut |
|---|---|---|---|
| Accueil public | `accueil_public_desktop_pro_lookup_ztf_2` | Desktop | ★ |
| | `accueil_public_desktop_pro_lookup_ztf_1` | Desktop | ◇ (graphique annuel, carte du campus) |
| | `accueil_public_desktop_pro_lookup` | Desktop | ◇ |
| | `accueil_public_avec_bandeau_cookies_zone_a` | Desktop | ◇ (bandeau cookies, carte de connexion dans le hero) |
| | `accueil_public_pro_lookup` | Mobile | ✗ contenu générique (Sorbonne, CNRS…) — garder seulement la structure mobile |
| Classement général / annuaire | `classement_g_n_ral_desktop_pro_lookup_ztf` | Desktop | ★ |
| | `classement_g_n_ral_pro_lookup` | Mobile | ✗ contenu générique, logique « palmarès » |
| Classement par rang | `classement_par_rang_sp_cifique_desktop_pro_lookup_ztf` | Desktop | ★ |
| Résultats de recherche publique | `r_sultats_de_recherche_publique_zone_a` | Desktop | ★ |
| Profil public | `profil_individuel_public_desktop_pro_lookup` | Desktop | ★ |
| | `profil_membre_pro_lookup` | Mobile | ◇ structure mobile (contenu générique) |
| Permalien de publication | `permalien_de_publication_publique_zone_a` | Desktop | ★ |
| Connexion | `connexion_desktop_pro_lookup` | Desktop | ★ (sans la sidebar admin, voir §9) |
| | `connexion_mobile_pro_lookup` | Mobile | ★ |
| Inscription | `inscription_multi_tapes_desktop_pro_lookup` | Desktop | ★ (3 étapes) |
| | `inscription_multi_tapes_mobile_pro_lookup` | Mobile | ★ |
| | `inscription_multi_tapes_homologation_chercheur_zone_a` | Desktop | ◇ (variante 4 étapes, CAMES/ORCID) |
| Mot de passe oublié | `mot_de_passe_oubli_r_cup_ration_de_compte_zone_a` | Desktop | ★ |
| Fil d'actualité | `fil_d_actualit_connect_desktop_pro_lookup_ztf` | Desktop | ★ contenu · shell sidebar (voir §3) |
| | `fil_d_actualit_popover_r_actions_zone_b` | Desktop | ★ shell top-nav + popover réactions |
| | `fil_d_actualit_messagerie_flottante_zone_b` | Desktop | ★ widget messagerie flottante |
| | `fil_d_actualit_pro_lookup` | Mobile | ✗ contenu générique — structure mobile seulement |
| Modale « Créer une publication » | `fil_d_actualit_modale_composer_un_post_zone_b` | Desktop | ★ |
| Modale « Partager » | `fil_d_actualit_modale_de_partage_zone_b_2` | Desktop | ★ |
| | `fil_d_actualit_modale_de_partage_zone_b_1` | Desktop | ◇ |
| Lightbox image | `fil_d_actualit_lightbox_image_ouverte_zone_b_1` | Desktop | ★ (sans commentaires) |
| | `fil_d_actualit_lightbox_image_ouverte_zone_b_2` | Desktop | ◇ (avec commentaires) |
| Dropdown notifications | `header_dropdown_notifications_ouvert_zone_b_1` | Desktop | ★ |
| | `header_dropdown_notifications_ouvert_zone_b_2` | Desktop | ◇ |
| Dropdown recherche | `header_dropdown_recherche_avec_suggestions_zone_b` | Desktop | ★ |
| Page notifications | `notifications_page_compl_te_d_di_e_zone_b` | Desktop | ★ |
| Messagerie | `messagerie_vue_compl_te_double_volet_zone_b` | Desktop | ★ |
| Mon réseau | `mon_r_seau_connexions_et_invitations_zone_b` | Desktop | ★ |
| Modale invitation | `mon_r_seau_modale_invitation_avec_note_zone_b` | Desktop | ★ |
| Modale « Ajouter une expérience » | `profil_connect_modale_ajouter_une_exp_rience_zone_b` | Desktop | ★ |
| Paramètres du compte | `param_tres_du_compte_desktop_pro_lookup_ztf` | Desktop | ★ |
| Profil en attente | `espace_personnel_profil_en_attente_desktop_3` | Desktop | ★ (shell public, le plus simple) |
| | `espace_personnel_profil_en_attente_desktop_1` / `_2` | Desktop | ◇ |
| | `espace_personnel_profil_en_attente_mobile` | Mobile | ★ |
| Admin — tableau de bord | `tableau_de_bord_administrateur_vue_d_ensemble_zone_c` | Desktop | ★ |
| | `tableau_de_bord_administrateur_desktop_pro_lookup_1` / `_2` | Desktop | ◇ |
| | `tableau_de_bord_administrateur_mobile_pro_lookup` | Mobile | ★ |
| Admin — demandes en attente | `demandes_en_attente_arbitrage_pleine_page_zone_c` | Desktop | ★ |
| Admin — tous les membres | `tous_les_membres_annuaire_gestion_administrative_zone_c` | Desktop | ★ |
| Admin — création directe | `cr_ation_directe_de_membre_enr_lement_rectoral_zone_c` | Desktop | ★ |
| Admin — gestion des rangs | `gestion_des_rangs_acad_miques_pr_rogatives_zone_c` | Desktop | ★ |
| Logo | `logo_officiel_pro_lookup_ztf` (SVG), `logo_pro_lookup.png`, `pro_lookup_logo` | — | Symbole extrait vers `pro-lookup-frontend/public/logo/pro-lookup-symbole.png` |
| Portrait | `professional_portrait_photo_…` | — | Image d'illustration, sans usage |
| Charte | `academic_prestige_modern/DESIGN.md` | — | Déplacée vers `docs/DESIGN.md` |

---

## 2. Système visuel réellement utilisé

### 2.1 Couleurs

Les maquettes n'utilisent **pas** directement les hex de la charte : elles utilisent une palette Material 3 générée à partir de la charte. Les correspondances :

| Rôle | Charte (brief) | Jeton maquette | Usage observé |
|---|---|---|---|
| Primaire / structure | `#0A2540` | `primary-container` `#0a2540`, `primary` `#000f22` (plus sombre) | Headers sombres, boutons principaux, bulles de message envoyées, cartes d'identité admin |
| Accent interactif | `#00A9A5` | `secondary` `#006a67` (sarcelle **foncé**), `secondary-container` `#78f6f1` (cyan clair) | Boutons « Publier », « Se connecter », liens, pastilles actives. Le `#00A9A5` n'apparaît que dans le logo et les anneaux |
| Or (rangs) | `#D4A24C` | `tertiary-fixed` `#ffdeac` (fond badge), `on-tertiary-container` `#b28330` (texte) | Badges de rang, anneaux Professeur/Docteur, liserés « chaire » |
| Fond | `#F7F9FB` | `background`/`surface` `#f9f9ff` | Fond général (légèrement bleuté) |
| Cartes | `#FFFFFF` | `surface-container-lowest` | Cartes |
| Surfaces secondaires | — | `surface-container-low` `#f0f3ff`, `surface-container` `#e7eefe` | Champs de formulaire (remplis, sans bordure), encarts, pastilles |
| Texte | `#1A1A1A` / `#6B7280` | `on-surface` `#151c27` / `on-surface-variant` `#43474d` / `outline` `#74777e` | |
| Bordures | `#E2E8F0` | `outline-variant` `#c4c6ce` | |
| Erreur | `#D64545` | `error` `#ba1a1a` | Rejeter, suspendu, badges urgents |

➡ Le `tailwind.config.js` actuel du frontend mélange les deux (primary `#0A2540`, secondary `#00A9A5`). **Décision recommandée** : garder la charte du brief (`#00A9A5`) pour l'accent, mais utiliser `#006a67` pour les **fonds de boutons avec texte blanc** (contraste AA insuffisant sur `#00A9A5`). C'est ce que font les maquettes.

### 2.2 Arrondis — piège important

Les maquettes redéfinissent l'échelle Tailwind :

| Classe | Maquettes | Tailwind par défaut | Frontend actuel |
|---|---|---|---|
| `rounded` | 2px | 4px | 4px |
| `rounded-lg` | **4px** | 8px | 8px |
| `rounded-xl` | **8px** | 12px | 12px |
| `rounded-full` | **12px** (pas une pilule !) | 9999px | 9999px |

Donc une classe `rounded-full` recopiée d'une maquette donne une pilule dans notre projet, alors que la maquette voulait 12px. Les avatars sont carrés-arrondis (12px) dans la plupart des captures, **contrairement** à DESIGN.md qui les veut circulaires. **Décision recommandée** : suivre DESIGN.md (4px cartes/champs, 8px boutons, 12px modales, avatars et badges de rang en pilule) et **ne pas** copier les classes d'arrondi des maquettes.

### 2.3 Typographie et icônes

- **Inter** partout, avec l'échelle de DESIGN.md (`headline-xl` 40px … `caption` 11px, `label-rank` 11px gras majuscule +0.05em). Cette échelle est identique dans les 10 lots.
- Un lot (messagerie, réseau, notifications page, modales invitation/expérience, recherche) s'affiche en **police serif** : c'est un bug de génération (Inter non chargée), pas un choix de design.
- Icônes : **Material Symbols Outlined** (Google Fonts), comme dans le frontend actuel. Une icône cassée `pixel_7_pro` s'affiche en texte dans deux maquettes.
- Chiffres : les métriques sont affichées en gros chiffres gras ; le `tnum` demandé par DESIGN.md n'est jamais appliqué.

### 2.4 Composants récurrents

| Composant | Description |
|---|---|
| **Badge de rang** | Pastille fond or pâle `#ffdeac` + texte or foncé, majuscules, 10–11px gras. Variante sarcelle pâle (`secondary-container`) pour Ingénieur/Chercheur, grise pour Étudiant/Personnel. Souvent préfixée d'une icône (`workspace_premium`, `school`, `engineering`, `science`, `edit_note`, `shield`). |
| **Anneau d'avatar** | Or double anneau = Professeur/Docteur · sarcelle = Ingénieur/Chercheur · gris = Étudiant/Personnel. Petite pastille ronde en bas à droite de l'avatar : icône du rang ou coche « vérifié ». Point vert = en ligne. |
| **Coche « Approuvé ZTF »** | `check_circle` sarcelle + texte, sur toutes les cartes de membres approuvés. |
| **Carte membre** | Avatar + badge de rang en haut à droite, nom, spécialité, encart gris (département + laboratoire), 2–3 métriques, bouton principal « Consulter le profil » + bouton icône `link` (copie du lien → toast « Lien copié »). |
| **Carte KPI** | Libellé majuscule gris, grand chiffre, sous-texte coloré (tendance), parfois icône dans un coin teinté. |
| **Bandeau sombre (hero)** | Fond `#0a2540` → `#000f22` avec motif réseau discret en SVG, pastille or en haut (« RANG 01 — … »), titre blanc, KPIs en cartes translucides. |
| **Liseré d'accent** | Barre dégradée bleu nuit → sarcelle → or en haut des modales ; liseré gauche coloré sur les cartes non lues ou prioritaires. |
| **Champs de formulaire** | Remplis (`#f0f3ff`), sans bordure, icône à gauche, libellé gras au-dessus + aide/format à droite du libellé, compteur de caractères. |
| **Toast** | Petit bandeau bas avec `done_all`/`check_circle` : copie de lien, copie DOI, enregistrement. |
| **Timeline 3 étapes** | Cartes « Validé ✓ / Étape actuelle (bord or) / À venir (grisé, cadenas) ». Utilisée pour l'inscription et le profil en attente. |
| **Fonction verrouillée** | Carte grisée + cadenas + « Accessible dès validation… ». |

### 2.5 Mobile

- Header compact bleu nuit (logo + titre de page + cloche + avatar) et **barre de navigation basse** à 5 onglets : Accueil · Rangs · Explorer · Messages · Profil.
- Pour l'admin mobile : menu burger avec tiroir latéral.
- Listes en cartes empilées, carrousels horizontaux pour les suggestions.

---

## 3. Gabarits de page (shells)

Les maquettes utilisent **quatre** shells différents. Il faut en retenir trois.

### 3.1 Shell public (zone A) — ★
Header blanc fixe : logo + « PRO-LOOKUP / Institut Universitaire ZTF — Bertoua », loupe (ou champ de recherche), liens de navigation, « Connexion » (contour) et « S'inscrire » (plein), avatar si connecté. Footer bleu nuit ou clair à 4 colonnes : présentation + adresse (BP 450, Bertoua, Région de l'Est) · Navigation · Départements ou Gouvernance · Contact (emails, téléphone) + barre légale (Mentions légales, Charte, Confidentialité).

Liens de navigation vus (à harmoniser) : `Accueil · Classement par Rangs · Publications · Administration ZTF` ou `Accueil · Annuaire des Chercheurs · Classement Public · Publications en Accès Libre · À propos`. **Recommandé** : `Accueil · Annuaire · Classement par rangs · Publications`, plus `Administration` uniquement pour un admin connecté.

### 3.2 Shell membre à navigation haute (zone B) — ★
Header blanc : logo, champ « Rechercher un collègue, publication, laboratoire… », onglets `Accueil · Mon Réseau (badge) · Messagerie (badge) · Notifications (badge rouge)`, puis avatar + « Vous / rang ». Contenu en 3 colonnes (3/6/3) pour le fil.

### 3.3 Shell administration (zone C) — ★
Sidebar gauche blanche : « ZONE C • RECTORAT / PRO-LOOKUP », pastille « Instance active », liens `Tableau de bord · Demandes en attente (compteur or) · Tous les membres · Création directe · Gestion des rangs · Audit & Sécurité`, encart bas « Protocole TLS ». Header : logo, pastilles « Administration rectorale — Portail privé » / « Serveur sécurisé », nom et rôle de l'admin, réglages, déconnexion.

### 3.4 Shell sidebar sombre mixte — ✗ à ne pas retenir
Vu sur `fil_d_actualit_connect_desktop`, `param_tres_du_compte`, `connexion_desktop`, `inscription_desktop`, `espace_personnel_…_1/_2` : une sidebar bleu nuit qui mélange « Espaces & Gouvernance » (liens admin) et « Personnel & Réseau ». Elle apparaît même sur la **page de connexion** et sur l'**inscription** (utilisateur « Dr. Admin ZTF Superviseur » affiché) : c'est une erreur de génération. Pour les membres, utiliser le shell 3.2 ; les liens admin n'apparaissent que pour `role = admin`.

---

## 4. Zone A — Écrans publics

### 4.1 Accueil public (★ `…ztf_2`)

Ordre des sections :
1. **Bandeau d'annonce** discret (optionnel, `…ztf_1`) : « Index officiel 2025 … — Homologation scientifique active » + « Campus régional de Bertoua » + « Accès libre public ».
2. **Hero sombre** : pastille « Répertoire académique officiel • Bertoua », titre « Le réseau professionnel & académique de l'Institut Universitaire ZTF. », paragraphe (consultation libre / adhésion réservée), boutons **Consulter les profils** (sarcelle) et **Rejoindre l'Institut (Membres ZTF)** (contour). 3 KPIs : corps académiques indexés (6), profils vérifiés, communications. À droite : carte « Sceau d'accréditation ZTF 2024-2025 » avec photo du campus et 2 mini-profils.
3. **Moteur de recherche public** (carte blanche chevauchant le hero) : champ « Nom, Prénom ou Spécialité », select **Rang académique**, select **Département d'affiliation**, bouton filtre ; ligne « Filtres rapides » en pastilles.
4. **Hiérarchie académique & classification** : 6 cartes de rang (icône, pastille « Rang 0X • Honneur/Magistère/Technique/Recherche/Relève/Gouvernance », titre, sous-titre, description, **effectif**, lien « Explorer l'annuaire → »).
5. **Publications récentes & communications** (8 colonnes) : articles avec liseré gauche, catégorie, date, DOI, titre, résumé, auteur, vues, taille PDF. À droite (4 colonnes) : « Avis du Conseil scientifique » (appels à communications, soutenances) et un donut « Répartition de la recherche » par département.
6. **Membres remarquables** : 4 cartes (photo, badge de rang, nom, fonction, spécialité, 3 métriques, « Voir le profil public »).
7. **Comment rejoindre le réseau ?** : texte + CTA « Initier ma demande d'adhésion ZTF » + 3 étapes (Matricule/Référence RH → Dépôt du dossier scientifique → Certification & publication).
8. Footer.

Variantes à piocher :
- `…ztf_1` : graphique en barres « Volume annuel des recherches validées » (2021-2024) et **carte du campus** (adresse, horaires du secrétariat).
- `…avec_bandeau_cookies` : **bandeau cookies** fixe en bas (titre « Intégrité académique & conformité CAMES / RGPD », texte, boutons `Personnaliser les préférences` · `Refuser non-essentiels` · `Accepter tout`) ; **carte de connexion dans le hero** ; section « Classement d'élite » avec rangs #1/#2/#3 et barre h-index (voir §9 sur la logique de palmarès) ; modale « Notice détaillée » d'une publication (auteurs, affiliation, résumé complet, `Télécharger le PDF homologué`).

Données nécessaires : effectifs par rang, compteurs globaux (membres approuvés, publications), derniers posts/publications publics, sélection de membres en vedette, liste des départements.

### 4.2 Classement général / annuaire (★)

- Bandeau clair : pastille « Index institutionnel ouvert », titre « Répertoire & Classement académique général », texte « **sans hiérarchie de valeur personnelle** », encart logo, 4 KPIs (membres, publications, laboratoires, % certifiés).
- Carte de filtres : recherche texte (nom, laboratoire, mot-clé), **Trier par** (`Ordre alphabétique` · `Ancienneté d'affiliation` · `Nombre de travaux indexés`), pastilles **Corps & rangs** (Tous + 6 rangs), pastilles **Départements**.
- Bandeau de contexte « Régime institutionnel ZTF — Corps professoral et chercheurs certifiés ».
- Grille 3 colonnes de **cartes membre** (voir §2.4) avec 2 métriques adaptées au rang (publications/collaborations, brevets/projets, dossiers homologués…).
- Pagination « Affichage des résultats 1 à 6 sur 108 » + pages + Précédent/Suivant.

### 4.3 Classement par rang (★)

- Fil d'Ariane : Accueil › Classements institutionnels › Rang 01 — Professeurs titulaires & émérites.
- Bandeau sombre propre au rang : pastille or « Rang 01 — Honneur & direction scientifique », titre du corps, description, **sélecteur « Changer de niveau statutaire »** (dropdown listant les rangs avec effectifs), 3 KPIs (chaires actives, publications, % homologation).
- Barre d'outils : recherche, select département, select tri (`Nombre de publications` · `Ancienneté d'accréditation` · `Volume de thèses dirigées` · `A-Z`), bouton **Réinitialiser** ; ligne « Critères actifs » en pastilles + « Affichage de 6 sur 38 ».
- Cartes « prestige » : pastille « Titulaire émérite » + « Chaire active », avatar double anneau or, nom, diplôme, « Inst. Univ. ZTF • Réf. ZTF-P001 », encart **Chaire spécialisée** + laboratoire, 3 métriques (thèses, articles, brevets), « Consulter le profil » + copie de lien.
- Pagination.
- Section **Prérogatives du rang** (texte + 4 cartes) : alimentée par la configuration du rang (§7.5).
- Toast « Lien du profil académique copié ».

### 4.4 Résultats de recherche publique (★)

- En-tête : titre « Annuaire & registre public des chercheurs », champ de recherche avec effacement, select domaine, bouton **Actualiser** ; ligne « 38 résultats pour « … » (0.042s) » + tri actuel.
- **Sidebar de filtres** : Type d'entité (Chercheurs & équipes / Publications & articles DOI / Projets de laboratoire, avec compteurs), Rang académique (cases à cocher), Faculté (boutons radio), Statut d'engagement (jurys, comités de lecture, collaborations), bouton Réinitialiser, widget indicateur.
- Colonne résultats : pastilles « Filtres actifs » supprimables + « Effacer tout ». Résultats **mixtes** : cartes chercheur (avatar, rang, spécialité, établissement, disponibilité, ID CAMES, bande de 4 métriques, extrait de bio, mots-clés, « Consulter le profil public ») intercalées avec des cartes publication/brevet (liseré, type, revue, citations, titre, résumé, auteurs, DOI, « Consulter l'article »).
- Pagination, puis encart sombre « Vous êtes chercheur à l'IU ZTF et vous n'apparaissez pas ? » → « Soumettre mon dossier ».

### 4.5 Profil public (★ desktop)

- **Hero sombre** : fil d'Ariane (« Annuaire officiel ZTF / Département / Dossier titulaire #ZTF-8842 »), pastille « Matricule actif • Session 2024-2025 », grande photo cadre or + coche, badge de rang or + badge chaire sarcelle, **nom + suffixe (Ph.D.)**, département — institut. Actions : **Copier le lien du profil** (blanc, toast) et **Se connecter / Message direct** (sarcelle).
- **Bande de métriques** (4) : publications indexées, projets de recherche, collaborateurs, citations.
- **Onglets** : `Vue d'ensemble & Bio` · `Travaux & Publications (24)` · `Enseignements & Jurys` · `Parcours académique`.
- Vue d'ensemble : **Biographie** (date de mise à jour) + **Domaines d'expertise** (pastilles) ; **Dernières publications remarquables** (type : Journal Q1 / Conférence / Ouvrage, date, titre, auteurs, revue, DOI, « Tiré à part (PDF) »).
- Colonne droite : **Affiliations & rôles ZTF** (liste icône + rôle + mandat), **Coordonnées institutionnelles** (courriel vérifié, bureau, ORCID), carte sombre **Validation institutionnelle**.
- Onglet publications : filtres `Toutes / Revues Q1 / Actes / Monographies`, liste complète.
- Onglet enseignements : cours (code, intitulé, volume horaire), présidences de jurys (docteur, titre de thèse, date).
- Onglet parcours : frise chronologique (période, titre, établissement).

Mobile (`profil_membre_pro_lookup`) : même contenu empilé, boutons `Se connecter` + `Message`, onglets défilants, sections « Distinctions d'honneur » et « Curriculum & habilitations ».

### 4.6 Permalien de publication (★)

Page publique d'**une publication scientifique** (entité distincte d'un post, voir §9) :
- Bandeau d'incitation pour visiteurs : « Dépôt institutionnel certifié… Rejoignez le réseau » → « Créer mon profil certifié ».
- Fil d'Ariane (Accueil › Publications › Catégorie › Réf. ZTF-2025-084), boutons **Citer l'article** et **Partager**.
- En-tête : badges (Validé par les pairs, Homologation n°, licence CC-BY), titre, auteurs (avatars + liens profil), revue / volume / date / indexation, **DOI**.
- **Résumé bilingue** (onglets Français / English) + mots-clés.
- Figure avec légende ; « Structure du manuscrit » (4 sections).
- Sidebar : **Télécharger le PDF intégral** (taille), **Impact scientifique** (lectures, téléchargements, citations, courbe mensuelle), **À propos du premier auteur**, **Publications connexes**.
- Encart verrouillé « Débats scientifiques & discussion par les pairs » → « Se connecter pour participer ».

### 4.7 Connexion (★)

- Carte centrale : pastille « Accès sécurisé », titre « Espace Membre ZTF — Connexion sécurisée », sous-titre.
- Champs : **Email institutionnel** (aide « Matricule ou identifiant @ztf-univ.cm »), **Mot de passe** avec bouton œil, case **Se souvenir de moi**, lien **Mot de passe oublié ?**, bouton sarcelle **Se connecter à PRO-LOOKUP**.
- Séparateur « OU » + bouton **Connexion via le portail académique ZTF (CAS / Shibboleth)** → hors périmètre (§10).
- Encart « Nouveau à l'Institut ZTF ? → Créer votre dossier membre ».
- Colonne droite (desktop) : présentation + 2 KPIs + photo du campus ; carte sombre **Assistance & Décanat** (permanence, email scolarité).

### 4.8 Inscription (★ 3 étapes)

Stepper : **1. Identifiants de compte** → **2. Informations personnelles** → **3. Statut académique & affiliation**, avec barre de progression. Seule l'étape 3 est maquettée :
- Colonne gauche : **photo d'identité** (upload, aperçu cadré, guide de cadrage 70 %, JPG/PNG carré ≥ 600px, 4 Mo max) ; **aperçu du badge** qui se met à jour en direct (rang, nom, département, « Statut : Éligible », « Matricule : Provisoire »).
- Formulaire : **Rang académique** (select, obligatoire), **Département / laboratoire** (select, obligatoire), **Matricule ZTF ou CAMES** (obligatoire, avec aide), **Courriel institutionnel** (marqué « Vérifié »), **Bio académique** (500 caractères max, compteur), **Pièce justificative** (PDF uniquement, 10 Mo, glisser-déposer).
- Encart « Procédure de validation administrative » (statut « En attente de validation »).
- Boutons **Étape précédente** / **Soumettre mon dossier pour validation**.
- Confirmation : « Dossier transmis… référence #ZTF-HOMOL-9842… courriel récapitulatif ».

Contenu déduit des étapes 1-2 : email, mot de passe + confirmation (étape 1) ; civilité/titre, prénom, nom, téléphone (étape 2).

Variante 4 étapes (`…homologation_chercheur_zone_a`) : Identité & affiliation → **Grade & statut CAMES** (cartes radio : Professeur titulaire — Rang A / Maître de conférences — Rang B / Docteur-chercheur senior / Doctorant R&D ; faculté, département, n° CAMES, **ORCID**, **Scopus/Google Scholar**, case d'attestation sur l'honneur) → Production scientifique → Pièces & signature. Sidebar « Pourquoi certifier votre profil ? ».

### 4.9 Mot de passe oublié (★)

- Carte avec liseré bicolore bleu nuit/or : titre « Récupération de compte & clé d'accès académique », texte (domaines acceptés), champ **Adresse email académique ou identifiant chercheur**, case « Confirmation par SMS » (hors périmètre), bouton **Recevoir le lien d'authentification sécurisé**.
- Message de succès : « Un jeton à usage unique valide 15 minutes a été envoyé… ».
- Notice d'assistance (DSI, secrétariat), liens **Retour à la connexion** / **Créer un nouveau compte**.
- Sidebar : carte du campus, **FAQ en accordéon** (4 questions), contact DSI.

---

## 5. Zone B — Espace membre connecté

### 5.1 Fil d'actualité (★)

Trois colonnes :
- **Gauche** : carte mini-profil (bannière, avatar avec anneau de rang, nom + coche, badge de rang, département ; stats *Pairs connectés* / *Publications* ou *Articles / h-index / Citations*) ; liens « Accéder au dossier académique », « Articles enregistrés (n) » ; **thématiques suivies** en pastilles.
- **Centre** :
  - **Compositeur** : avatar + champ « Partagez un preprint, une trouvaille… » (ouvre la modale), raccourcis `Schéma / Image` · `Dépôt DOI / PDF` · `Mentionner un pair` (ou `Preprint · Données · Colloque`), bouton **Publier**.
  - **Onglets de filtre** : `Tous les flux · Préprints & Articles · R&D & Terrain` (ou `Publications & débats pairs · Prépublications récentes · Chaires partenaires`) + tri (`Ordre chronologique` / `Pertinence`).
  - **Carte de post** : avatar (anneau), nom, badge de rang, affiliation, horodatage relatif, menu `⋯` ; **titre optionnel** ; texte ; hashtags ; média avec légende (clic → lightbox) ; ou encart **pièce jointe** (dataset/PDF/rapport de thèse avec DOI et bouton Consulter) ; compteurs (*87 recommandations • 14 commentaires • 4 partages*) ; actions `Recommander (n)` · `Commenter (n)` · `Partager (n)` · `Citer DOI` / `Tirer à part PDF` ; aperçu du dernier commentaire.
  - **Popover de réactions** au survol de « J'aime » : 5 réactions — **J'aime** (bleu nuit), **Bravo** (vert), **Soutien** (cœur rouge), **Instructif** (ampoule or), **Intéressant** (cerveau sarcelle).
- **Droite** : **Pairs recommandés** (regroupés par rang : professeurs du pôle, chercheurs associés, doctorants de la promotion) avec bouton `person_add` ; **Événements & colloques** (date en bloc, titre, lieu/heure) ; **Charte éthique**.
- **Messagerie flottante** (bas droite) : pastille « Messagerie (2) » repliable ; fenêtre de conversation 360px (en-tête avec statut en ligne + « Voir dossier », séparateur de date, bulles, champ + pièce jointe + emoji + envoyer) ; lien « Ouvrir la vue complète ».

### 5.2 Modale « Créer une publication » (★)

- Titre « Créer une publication », fermeture.
- Auteur (avatar, nom, badge de rang) + **sélecteur de visibilité** (« Public (tous les visiteurs) » ▾).
- Zone de texte (placeholder long), **puces de tags** supprimables (`#hashtag`, `@mention`).
- Barre « Joindre au dossier » : `Schéma` (image) · `Document PDF` · `Pair` (@mention) · `Tag` · graphique.
- Pied : compteur **« 236 / 3 000 caractères »**, **Enregistrer en brouillon**, **Publier**.

### 5.3 Modale « Partager » (★ variante 2)

- Titre « Republier / partager la publication ».
- Auteur + sélecteur de visibilité : `Tout le monde / Réseau ZTF` · `Pairs académiques uniquement` · `Chaires & directeurs`.
- Onglets **Avec vos pensées** / **Instantané** (repartage sans commentaire).
- Zone de texte (gras, italique, mention, lien ; **600 caractères**).
- Aperçu de la publication d'origine (auteur, rang, titre, résumé, pièces, compteurs).
- Pied : « Votre partage sera indexé… », **Annuler**, **Publier le partage**.

### 5.4 Lightbox image (★ variante 1)

Superposition sombre plein écran :
- Barre d'outils : pastille « ZTF Archive-HD », titre, DOI + n° de figure + résolution ; **zoom −/+ et ajuster**, **Exporter HD ▾** (PDF vectoriel / PNG 4K / CSV — hors périmètre), partager, fermer.
- Image avec flèches **précédent / suivant** (plusieurs médias par post).
- Volet droit : carte auteur, **légende**, métadonnées, **DOI copiable** (toast), résumé des réactions, boutons `J'aime` · `Discuter` · `Citer BibTeX`, « Signaler une anomalie ».
- Variante 2 : fil de commentaires dans le volet + champ de réponse.

### 5.5 Dropdowns du header

**Notifications (★ v1)** : titre + compteur, **Tout marquer comme lu**, réglages ; onglets `Toutes (5) · Citations DOI · Mentions · Réseau` ; éléments avec point « non lu » à gauche et fond teinté ; types : citation (avatar + DOI), **homologation officielle** (icône or, « Le Rectorat ZTF a validé votre accréditation au rang de… », n° de dossier), **demande de connexion** avec boutons **Accepter / Ignorer** en ligne, jalon (1 000 lectures + lien rapport) ; pied « Voir toutes les notifications (page complète) → ».

**Recherche (★)** : panneau sous le champ ; « Recherche : "Bertoua" », « ESC pour fermer » ; **Recherches récentes** (pastilles + « Effacer l'historique ») ; **Membres et chercheurs** (3 résultats : avatar, nom, badge, affiliation, **Voir profil**) ; **Publications & DOI** ; filtre de rang ; pied « Affichage de 5 suggestions instantanées » + « Voir tous les résultats pour "…" (42) → ».

### 5.6 Page notifications (★)

- En-tête : « Centre de notifications académiques », « Synchronisé il y a 2 min », **Tout marquer comme lu**.
- Gauche : filtres avec compteurs (`Toutes · Mentions & citations DOI · Activité du réseau · Homologations & décrets`), liens `Paramètres des notifications`, `Archivage des arrêtés` ; carte sombre « Accréditation active ».
- Centre, groupé par période (**Aujourd'hui & récent** avec « 3 non lues » / **Plus tôt cette semaine** « Archivé après 30 jours ») : cartes avec liseré gauche si non lues. Types : citation (bouton « Voir la citation »), **homologation** (encart « Décret rectoral n°… » + **Consulter l'attestation**), demande de connexion (note citée, **Accepter / Ignorer**, co-auteurs communs), jalon (vues, téléchargements, « Statistiques détaillées »), réaction (« A réagi avec « Bravo »… » + lien), invitation à un colloque (**Confirmer la participation**, **Télécharger l'appel**).
- Droite : « Impact ce mois-ci » (sparkline + 4 métriques), colloques, assistance.

### 5.7 Messagerie (★)

- Bandeau « Espace d'échanges académiques sécurisés ».
- **Volet gauche (360px)** : titre + compteur, bouton nouveau message, recherche (« messages, pairs, DOI »), onglets `Toutes · Non lues • · Archivées`, fils (avatar + point en ligne, nom, badge rang/affiliation, extrait, heure ; fil actif avec liseré sarcelle). Un fil peut être institutionnel (« Secrétariat académique ZTF »). Pied « Archivage automatique certifié ».
- **Volet droit** : en-tête (avatar, nom, badge, fonction, « En ligne »), actions (voir profil, visio, favori, menu) ; bandeau optionnel « Projet rattaché » ; séparateur de date ; bulles reçues (blanches, nom + heure) et envoyées (bleu nuit, « Vous »), **pièce jointe PDF** avec Télécharger, accusé « Distribué & lu » ; compositeur avec mise en forme (gras, italique, citation, formule, lien), boutons `PDF / Manuscrit` · `Schéma / Graphique` · `Données DOI` · emoji, **Envoyer**, « Entrée pour envoyer ».

### 5.8 Mon réseau (★)

- En-tête « Collège académique & relations inter-instituts » + 2 indicateurs.
- Gauche : **Gérer mon réseau** avec compteurs (`Connexions · Contacts du répertoire · Pairs suivis · Chaires & groupes de recherche · Événements & colloques · Pages institutionnelles`), jauge « Cohérence thématique », carte « Appel à communications ».
- **Invitations en attente (3)** + « Gérer tout » : avatar, nom, badge, affiliation, motif, **note attachée** (citation), relations communes, **Ignorer / Accepter**.
- **Membres que vous pourriez connaître** : grille 3×2 (avatar à anneau, badge, nom, affiliation, relations communes, **Se connecter**) + « Voir tout l'annuaire (64) ».
- **Dernières activités de votre réseau** : nouvelles publications, nominations (« Féliciter », « Envoyer un message »).

### 5.9 Modale d'invitation (★)

Liseré dégradé ; titre « Inviter à rejoindre votre collège de pairs » ; carte destinataire (avatar, nom, badge, affiliation, relations communes) ; encart d'aide ; cartes radio **Envoyer sans note** / **Ajouter une note** (recommandé) ; **Message d'introduction** (obligatoire si note, **300 caractères**) ; boutons Annuler / Envoyer.

### 5.10 Modale « Ajouter une expérience » (★)

- Titre « Ajouter une expérience académique & recherche ».
- Champs : **Poste / titre** (obligatoire) ; **Type d'engagement** (`Mission de recherche · Temps plein · Chaire partenariale · Professeur invité · Chercheur postdoctoral`) ; **Établissement** ; **Faculté / département / unité** ; **Période** (case « J'occupe actuellement ce poste », mois + année de début, mois + année de fin désactivés si en cours) ; **Description** (éditeur riche : gras, italique, listes, lien DOI, formule LaTeX) ; **Compétences** (pastilles + « Ajouter une compétence ») ; **Pièce justificative** (PDF, 10 Mo, marquée *obligatoire*).
- Pied : **Supprimer cette section** (rouge), **Enregistrer en brouillon**, **Enregistrer l'expérience**.

### 5.11 Paramètres du compte (★)

En-tête « Paramètres du compte & préférences académiques », pastilles matricule et « Compte certifié ». Onglets-ancres : `Édition du profil · Sécurité & accès · Confidentialité & visibilité · Gouvernance & archivage`.

1. **Profil** : photo (Changer / Retirer, 4 Mo) ; encart verrouillé **Statut & rang actuel** (« la modification du rang requiert un dossier d'avenant auprès du secrétariat ») ; titre + nom complet ; département (select) ; **ORCID** ; **matricule** (lecture seule, « géré par l'administration ») ; email institutionnel (vérifié, non modifiable) ; **email secondaire de récupération** ; biographie (**1 000 caractères**) ; Annuler / Enregistrer.
2. **Sécurité** : changement de mot de passe (actuel, nouveau avec **jauge de robustesse**, confirmation ; règle *12 caractères min. avec majuscules, minuscules, chiffres, spéciaux*) ; **2FA** (statut, reconfigurer) ; **sessions actives** (appareil, lieu/IP, date, bouton déconnexion par session, « Déconnecter les autres »).
3. **Confidentialité** : interrupteurs *Indexation dans l'annuaire public*, *Afficher le lien ORCID*, *Masquer le matricule aux tiers* ; notifications email : *demandes de mise en relation*, *citations (hebdomadaire)*, *annonces rectorales (non désactivable)*.
4. **Gouvernance** : **Exporter mes données** (archive ZIP) ; **Suspension temporaire ou transfert** (demande au secrétariat).
- Toast « Modifications enregistrées avec succès ».

⚠ Le brief demande « suppression du compte » : aucune maquette ne la montre (seulement suspension/export).

---

## 6. Espace « profil en attente »

Référence : `…desktop_3` (shell public) et `…mobile`. Contenu commun aux 4 variantes :

1. **Bandeau d'alerte** (liseré rouge ou or) : « Votre profil est actuellement en cours de vérification par l'administration de l'Institut Universitaire ZTF », pastille « Examen en cours / Dossier soumis », texte (non visible publiquement, notification par email), **délai estimé 24 à 48 h**.
2. **Progression en 3 étapes** : ① Inscription soumise ✓ (horodatage) → ② **Contrôle de l'affiliation** (étape actuelle, « En cours de traitement ») → ③ Activation publique du profil (verrouillée : badge, classement, droits d'auteur).
3. **Aperçu du dossier transmis** (« visible uniquement par vous ») : photo avec pastille « En attente », nom, rang sollicité, département, email, diplôme, matricule soumis/temporaire, laboratoire, ORCID ; bouton **Modifier les informations soumises**.
4. **Pièces versées au dossier** : liste de fichiers (nom, taille, statut « Réceptionné » / coche).
5. **Fonctionnalités temporairement indisponibles** : cartes grisées « Créer une communication / post » et « Publier un article / indexer un DOI » avec cadenas.
6. **Contact du secrétariat** (adresse, email, téléphone, horaires) + **Écrire au secrétariat** ; FAQ (« Quels documents valident mon rang ? », « Puis-je modifier mes affiliations plus tard ? »).

Le header public affiche une bande « Espace académique personnel — Compte en cours de vérification — Dr. X — ID: ZTF-2025-084B ».

---

## 7. Zone C — Administration

Principe affiché explicitement dans les maquettes de la zone C : **« aucune modale, aucun popup »** — les décisions se prennent dans la page (formulaires intégrés, panneaux maître-détail). Seule `tableau_de_bord_…_2` utilise une modale de rejet ; ne pas la retenir.

### 7.1 Tableau de bord (★ `vue_d_ensemble_zone_c`)

- En-tête : pastille « Plateforme d'agrément », titre « Tableau de bord rectoral — Pilotage & homologation », session académique, sélecteur de période (« Derniers 30 jours »), actualiser, **Exporter rapport** (PDF).
- **4 KPIs** : Demandes en attente (12, « 4 urgents », « Examiner les dossiers → ») · Membres homologués (438, +14 ce mois) · Publications indexées · Conformité (%).
- **Activité récente & flux d'homologation** : lignes candidat (avatar, nom, badge du rang demandé, faculté, ORCID/pièces, **statut** : *En attente d'arbitrage* (or), *Pré-validation labo* (sarcelle), *Auto-validé* (créé par un admin), date, bouton ouvrir le dossier) + « Voir tout l'historique ».
- **Répartition des membres par rang** : barre empilée 4 couleurs + légende (effectif, %).
- Droite : **Alertes** (urgentes, synchronisations, prochaine session) ; **Journal d'audit** en temps réel (validation de compte, création directe, sauvegarde) + lien vers les journaux complets.

Mobile : KPIs en grille 2×2, onglets `Demandes en attente (14)` / `Tous les membres (482)`, cartes de dossier avec pièces et **décision en ligne** (motif + Rejeter / Approuver), formulaire de création directe condensé.

### 7.2 Demandes en attente (★ maître-détail)

- En-tête : fil d'Ariane, titre « Dossiers d'homologation en attente d'arbitrage », pastilles compteur/session, **Rapport de session**.
- Filtres : pastilles par rang avec compteurs (`Tous (12) · Rang A (3) · Rang B (5) · Doctorants / R&D (4)`), select **Faculté**, select **Tri** (`Ancienneté du dépôt` · `Grade décroissant` · `Statut de conformité`).
- **Liste gauche (40 %)** : « 4 urgents • 8 réguliers » ; cartes (avatar ou initiales, nom, badge du rang demandé, fonction, référence, **état** : *Visa en attente* / *En cours* / *Prioritaire* / *Pièce à compléter*, date de dépôt, résumé des pièces : « 3/3 pièces vérifiées », « Avis directeur de thèse requis », « Décret d'affectation manquant ») ; pagination.
- **Détail droit (60 %)** :
  - Carte candidat : photo, nom, **rang sollicité**, faculté/laboratoire, encart d'audit ; email, téléphone, date de prise de fonction.
  - **Pièces justificatives** : cartes document (type, nom, taille, statut *Authentifié / Conforme / Synchronisé*, **Inspecter / Consulter**) + bande d'indicateurs (thèses, revues indexées, brevets).
  - **Décision de la commission** : 3 options radio — **Approuver et certifier** · **Demander un complément** (met le dossier en suspens et notifie) · **Rejeter** ; **motif officiel** (obligatoire, archivé au dossier) ; cases *Envoyer la notification par email* ✓, *Inscrire dans l'annuaire public* ✓ ; boutons **Suspendre pour enquête**, **Confirmer le rejet avec motif**, **Valider l'homologation et activer le compte**.
- Motifs de rejet prédéfinis (vus dans `…desktop_2`) : *Pièces ou diplômes non authentifiés* · *Courriel hors domaine officiel* · *Incohérence de rang / profil incomplet* + commentaire libre.

### 7.3 Tous les membres (★)

- En-tête : titre « Annuaire & gouvernance des membres (438) », 4 mini-KPIs par corps ; carte sombre **Exports** (`Exporter CSV / XLSX`, `Historique des modifications`).
- Barre : recherche (nom, matricule, laboratoire, email, ID CAMES), select tri (`Rang` · `H-index` · `Publications` · `A-Z` · `Statut`), actualiser ; pastilles `Tous · Professeurs · Maîtres de conf. · Docteurs · Doctorants · **Suspendus (3)**` (rouge).
- **Tableau** : Membre & identité (avatar, nom, email, référence, fonction) · Rang & badge · Département / chaire · Publications & h-index · **Statut** (*Actif & certifié* vert / *Suspendu (non-conformité)* rouge, ligne teintée, nom barré) · Actions (`Modifier rang`, `Voir dossier`, `Suspendre`, `Promouvoir`, `Réintégrer`, `Consulter PV`, **`Supprimer définitivement`**).
- Pagination.
- **Inspecteur intégré** (sous le tableau, pour la ligne sélectionnée) : identité + statut ; 3 quadrants (sessions & dernière IP, validations statutaires, journal de surveillance) ; boutons **Générer une clé d'accès provisoire**, **Changer le rang**, **Journal des audits du membre**, **Suspendre les prérogatives** ; bandeau de confirmation en ligne.

### 7.4 Création directe (★)

Titre « Enrôlement direct & attribution de prérogatives », pastille « Procédure d'exception ». Formulaire en 4 blocs :
1. **Identité & coordonnées** : civilité/titre (`Pr. · Dr. · Ing. · MCF · M. · Mme`), nom, prénoms, nationalité, **email** (domaines admis `@ztf-univ.cm` / `@univ-bertoua.cm`), **téléphone**, **faculté** (select), **département / laboratoire**.
2. **Qualification & rang** : cartes radio (Professeur titulaire — Rang A / Maître de conférences — Rang B / Chercheur senior-Docteur / Doctorant-Ingénieur R&D), **matricule CAMES / référence d'arrêté**, **date de prise de fonction**, ORCID, Scopus/Scholar.
3. **Prérogatives & accès** (cases) : *Validation & certification immédiate* ✓ · *Générer une clé d'accès provisoire par email (valide 72 h)* ✓ · *Habilitation jurys* ✓ · *Inscription à l'annuaire public & classement* ☐.
4. **Motif légal** (obligatoire, figure sur l'attestation) + carte « Signataire institutionnel » (admin connecté).
- Actions : **Réinitialiser**, **Enregistrer comme brouillon**, **Créer et homologuer le profil immédiatement** ; confirmation en ligne avec identifiant de certificat.

### 7.5 Gestion des rangs (★)

- **Cartes des corps** : pour chaque rang — pastille (« Rang A • Hors-échelle »), titre, sous-titre, **effectif**, 2 critères (h-index minimal, labo requis, publications minimum, statut de thèse…).
- **Matrice des prérogatives** (tableau rangs × droits) : direction de jurys, signature de conventions, dépôt sans modération (*Activé / Sous dérogation / Soumis à validation / Désactivé*), poids de vote en peer-review, accès aux fonds, **badge visuel** (*Or étoilé / Or classique / Émeraude / Bleu cyan*).
- **Panneau d'édition du rang sélectionné** : intitulé FR, intitulé EN, seuil de publications, seuil h-index, quota annuel de jurys, interrupteur « validation par commission obligatoire » ; **Restaurer les valeurs par défaut** / **Enregistrer**.

➡ Le brief ne demande qu'un **CRUD des rangs** (nom, slug, ordre, couleur de badge). La matrice de prérogatives est un raffinement V2.

---

## 8. Données implicites (impact backend)

Écart entre ce que les maquettes affichent et le modèle de données actuel (`users`, `ranks`, `posts`, `comments`, `likes`, `connections`, `notifications`).

### 8.1 `users` — champs à ajouter
| Champ | Vu dans | Priorité |
|---|---|---|
| `title` (civilité : Pr., Dr., Ing., M., Mme) | partout (« Pr. Augustin Kamga ») | V1 |
| `phone` | création directe, profil en attente | V1 |
| `faculty` / `laboratory` (en plus de `department`) | cartes membre, filtres | V1 (ou table `departments`) |
| `specialty` / intitulé de chaire | cartes membre, profil | V1 (le seeder a déjà `specialty` mais la colonne n'existe pas) |
| `matricule` (ZTF/CAMES) | inscription, paramètres, admin | V1 |
| `orcid`, `scopus_url` | inscription variante, profil, paramètres | V1.5 |
| `secondary_email` | paramètres | V2 |
| `expertise_tags` (json) | profil | V1.5 |
| `office` (bureau) | profil | V2 |
| `privacy` (json : indexation publique, ORCID visible, matricule masqué) | paramètres | V1.5 |
| `status` + **`needs_info`** (complément demandé) | décision admin | V1 |
| `approval_note` / motif, `suspended_reason` | admin | V1 |
| `last_login_at`, `last_ip` | inspecteur admin | V2 |

### 8.2 Nouvelles tables
| Table | Rôle | Priorité |
|---|---|---|
| `user_documents` | Pièces justificatives (PDF 10 Mo) : type, chemin, taille, statut (*reçu / conforme / rejeté*) | **V1** (inscription + arbitrage) |
| `experiences` | Parcours : poste, type d'engagement, établissement, unité, début, fin, en cours, description, compétences, justificatif | V1.5 |
| `publications` | Publications scientifiques (≠ posts) : titre, résumé FR/EN, mots-clés, revue, volume, date, DOI, licence, PDF, co-auteurs, lectures, téléchargements, citations | V2 (voir §9.4) |
| `post_media` | Plusieurs images/pièces par post | V1.5 |
| `reactions` (remplace `likes`) | type ∈ {like, bravo, soutien, instructif, interessant} | V1.5 |
| `shares` / `reposts` | Repartage avec ou sans commentaire | V2 |
| `bookmarks` | Articles enregistrés | V2 |
| `conversations`, `messages`, `message_attachments` | Messagerie | V2 (brief) |
| `events` | Colloques / soutenances (widgets fil, notifications) | V2 |
| `audit_logs` | Journal d'audit admin | V1.5 |
| `rank_privileges` | Matrice des droits | V2 |

### 8.3 Champs à ajouter aux tables existantes
- `posts` : `title` (optionnel), `tags` (json), `status` (brouillon / publié), visibilité étendue (voir §9.3). Limite de texte : **3 000 caractères** (backend : 2 000).
- `connections` : note limitée à **300 caractères** (backend : 500).
- `notifications` : types utilisés — `citation`, `mention`, `homologation` (approbation), `connection_request`, `connection_accepted`, `comment`, `reaction`, `milestone`, `event_invitation`, `registration_pending` (admin). Le frontend doit pouvoir afficher des **actions en ligne** (accepter/ignorer) ; le payload doit donc porter l'`id` de la connexion.
- `ranks` : `description`, `short_label` (« Rang 01 • Honneur »), `icon`, et en V2 : seuils, intitulé anglais.

### 8.4 Endpoints impliqués (au-delà de l'existant)
Upload avatar ; upload pièces ; `GET /stats/public` (KPIs d'accueil) ; recherche globale (membres + posts) avec suggestions ; filtres/tri/pagination de l'annuaire ; `GET /ranks/{slug}` avec effectifs ; profil complet (expériences, publications) ; mot de passe oublié / réinitialisation ; changement de mot de passe ; admin : liste des membres avec filtres, suspendre / réintégrer / supprimer / changer le rang, création directe, demande de complément, CRUD des rangs, journal d'audit.

---

## 9. Incohérences et décisions à prendre

### 9.1 Nomenclature des rangs ⚠ décision requise
Trois systèmes coexistent :

| Source | Rangs |
|---|---|
| Brief + seeder + maquettes publiques ZTF | **6** : Professeur · Docteur (& Enseignant) · Ingénieur (R&D) · Chercheur · Étudiant (& Doctorant) · Personnel administratif |
| Inscription variante, arbitrage, création directe, gestion des rangs | **4 grades CAMES** : Professeur titulaire (Rang A) · Maître de conférences (Rang B) · Docteur / Chercheur senior · Doctorant / Ingénieur R&D — *sans personnel administratif* |
| `tableau_de_bord_…_1` | **6** : Prof. titulaires · Maîtres de conf. · Docteurs/Chercheurs · Ingénieurs R&D · Doctorants chercheurs · Étudiants Master 2 — *sans personnel administratif* |

**Recommandation** : garder les 6 rangs du brief comme table `ranks` administrable (c'est déjà en base), et traiter « Rang A/B CAMES » comme un **libellé ou grade optionnel**, pas comme un rang distinct.

### 9.2 Classement « palmarès » ou annuaire neutre ⚠ décision requise
- Les maquettes mobiles génériques et la variante cookies montrent un **palmarès** (podium #1/#2/#3, « Classé #4 au palmarès national », tri par h-index).
- Les maquettes ZTF récentes affirment « **sans hiérarchie de valeur personnelle** » et trient par ordre alphabétique, ancienneté ou nombre de travaux.

**Recommandation** : annuaire neutre filtré par rang (conforme au brief, « classement » = regroupement par rang). Aucune donnée fiable de h-index ou de citations n'existe dans le projet.

### 9.3 Visibilité des posts
Le backend connaît `public | connections`. Les maquettes montrent 4 niveaux : *Public (tous les visiteurs)* · *Tout le réseau ZTF* (membres connectés) · *Pairs académiques uniquement* (mes connexions) · *Chaires & directeurs*. **Recommandation** : 3 niveaux `public | members | connections` ; abandonner « Chaires & directeurs ».

### 9.4 Posts vs publications scientifiques
Les maquettes distinguent un **post** (fil, texte + médias) et une **publication scientifique** (permalien avec DOI, résumé bilingue, co-auteurs, PDF, impact). Le brief ne parle que de posts. **Recommandation V1** : un seul modèle `posts` avec `title` optionnel + pièce jointe PDF + DOI optionnel ; le permalien `/publications/{id}` affiche un post. Entité `publications` séparée en V2.

### 9.5 Métriques non disponibles
Les maquettes affichent partout h-index, citations, lectures, téléchargements, index de conformité, « 98,6 % », etc. Aucune source ne fournit ces données (pas d'intégration Scopus/ORCID/CrossRef). **Ne pas afficher de chiffres inventés** : remplacer par des métriques calculables — nombre de publications (posts), de connexions, de commentaires reçus, date d'adhésion. Les KPIs publics doivent venir d'un endpoint de statistiques réel.

### 9.6 Éléments décoratifs ou hors périmètre
À ne pas implémenter tels quels (texte « sécuritaire » sans réalité technique) : SSO CAS/Shibboleth, confirmation SMS, 2FA/TOTP, « signature cryptographique SHA-256 », « registre distribué », « empreinte ZTF-ID », synchronisation CAMES/MINESUP, export PDF vectoriel/PNG 4K, visioconférence, « chiffrement peer-to-peer ». Les garder éventuellement en V3 ou les retirer du texte d'interface.

### 9.7 Autres incohérences
- **Domaines email** : `@ztf-univ.cm`, `@ztf-bertoua.cm`, `@univ-bertoua.cm`, `@iuztf.cm` (seeder). ⚠ À fixer : quel(s) domaine(s) accepter à l'inscription ?
- **Page de connexion et d'inscription avec la sidebar admin** (erreur de génération) : ne pas reproduire.
- **Utilisateur incohérent sur un même écran** (fil desktop : sidebar « Dr. F. Ebanda — Doyen » et carte « Dr. Marc Valérien »).
- **Logo du header** en zone B : c'est la planche des 4 logos écrasée (`logo-pro-lookup.png`). Utiliser le symbole extrait + le texte, ou le SVG officiel.
- **Contenu générique non ZTF** dans le premier lot mobile (Sorbonne, Inria, CNRS, Thales, Nature Medicine) : ne pas reprendre.
- **Noms de personnalités réelles** dans les données fictives (« Félix Eto'o », « Samuel Eto'o Bekolo », « Amphi Thomas Sankara ») : à éviter dans les seeders et placeholders — le `RegisterPage` actuel utilise « Dr. Samuel Eto'o ».
- **Longueurs incohérentes** : bio 500 (inscription) / 600 (inscription mobile) / 1 000 (paramètres, backend) ; note d'invitation 300 (maquette) / 500 (backend) ; post 3 000 (maquette) / 2 000 (backend).
- **Suppression de compte** (brief) absente des maquettes.
- **Modération des publications signalées** (brief) absente des maquettes : seul un lien « Signaler une anomalie » existe (lightbox), aucun écran de modération côté admin.
- **Police serif** sur un lot (bug de rendu) ; **icône cassée** `pixel_7_pro`.

---

## 10. Périmètre recommandé et routes

### 10.1 Découpage

| Version | Écrans |
|---|---|
| **V1 (MVP du brief)** | Accueil · Annuaire/classement général · Classement par rang · Profil public (onglet vue d'ensemble) · Connexion · Inscription 3 étapes (avec photo + pièce justificative) · Mot de passe oublié · Profil en attente · Fil d'actualité (compositeur, posts avec image, commentaires, réaction simple) · Modale « Créer une publication » · Lightbox simple · Dropdown et page notifications · Paramètres (profil + mot de passe) · Admin : tableau de bord, demandes en attente (maître-détail avec approuver / complément / rejeter), tous les membres (suspendre / réintégrer / changer le rang), création directe, CRUD des rangs · Bandeau cookies |
| **V1.5** | Recherche globale (dropdown + page de résultats) · Réactions à 5 types · Expériences (modale) · Onglets complets du profil · Confidentialité · Journal d'audit |
| **V2 (brief)** | Mon réseau + modale invitation (le backend existe déjà) · Messagerie complète + widget flottant · Partage/repartage · Publications scientifiques et permalien · Événements/colloques · Matrice des prérogatives |

### 10.2 Routes proposées (React Router)

| Route | Écran | Accès |
|---|---|---|
| `/` | Accueil | public |
| `/annuaire` | Classement général | public |
| `/classement/:rankSlug` | Classement par rang | public |
| `/recherche?q=` | Résultats de recherche | public |
| `/p/:slug` | Profil public (URL stable du brief) | public |
| `/publications/:id` | Permalien de publication | public |
| `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/reinitialiser/:token` | Authentification | invité |
| `/mon-dossier` | Profil en attente | pending |
| `/fil` | Fil d'actualité | approved |
| `/reseau` | Mon réseau | approved |
| `/messagerie`, `/messagerie/:conversationId` | Messagerie | approved |
| `/notifications` | Notifications | connecté |
| `/parametres` | Paramètres | connecté |
| `/admin`, `/admin/demandes`, `/admin/demandes/:userId`, `/admin/membres`, `/admin/creation`, `/admin/rangs` | Administration | admin |

### 10.3 Correspondance avec le frontend actuel

| Page actuelle (`src/pages`) | Maquette de référence |
|---|---|
| `HomePage` | §4.1 |
| `DirectoryPage` | §4.2 |
| `RankingPage` | §4.3 (actuellement tri par `citationIndex` toujours à 0) |
| `ProfilePage` | §4.5 |
| `LoginPage` | §4.7 |
| `RegisterPage` | §4.8 (l'étape 3 « Justificatifs » actuelle n'envoie pas le fichier ; le rang choisi n'est pas transmis) |
| `ForgotPasswordPage` | §4.9 (pas d'API) |
| `PendingProfilePage` | §6 (contient un bouton « Démo admin » à retirer) |
| `FeedPage` | §5.1 |
| `NetworkPage` | §5.8 (données codées en dur) |
| `MessagingPage` | §5.7 (données locales) |
| `NotificationsPage` | §5.6 |
| `AdminDashboardPage` | §7.1–7.5 (un seul écran à onglets aujourd'hui) |
| — | Paramètres §5.11 : page manquante |
| — | Résultats de recherche §4.4, permalien §4.6 : pages manquantes |
| `components/modals/*` | §5.2 (création de post), §5.9 (invitation), §5.10 (expérience), §5.4 (lightbox) |
| `components/layout/CookieBanner` | §4.1 variante cookies |
