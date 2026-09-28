/**
 * Types reflétant exactement les réponses de l'API Laravel v1 (brief §9.3).
 * Toute modification d'une API Resource côté Laravel doit être répercutée ici.
 */

export type Ref = { id: number; name: string; slug: string };
/** École supérieure de la liste gérée par l'administration (filtre de l'annuaire). */
export type School = Ref & { teachers_count: number };
/** Suggestions des champs libres « École supérieure » et « Département / Filière ». */
export type Suggestions = { schools: string[]; departments: string[] };

export type AccountStatus = "pending" | "approved" | "rejected" | "suspended";
export type Role = "teacher" | "admin";
export type PostStatus = "draft" | "published" | "hidden";

export type ItemSection =
  | "education"
  | "experience"
  | "course"
  | "research_area"
  | "scientific_publication"
  | "award"
  | "language";

export type VisibilitySection =
  | "about"
  | "expertise"
  | "courses"
  | "education"
  | "experience"
  | "research"
  | "awards"
  | "languages"
  | "links"
  | "cv";

/** CV en PDF : métadonnées seulement (le fichier est servi par l'API). */
export type CvInfo = { size: number | null; updated_at: string | null };

export type ProfileItem = {
  id: number;
  title: string;
  organization: string | null;
  period: string | null;
  description: string | null;
  url: string | null;
  position: number;
};

export type Items = Record<ItemSection, ProfileItem[]>;

export type Links = {
  orcid: string | null;
  google_scholar: string | null;
  researchgate: string | null;
  linkedin: string | null;
  website: string | null;
};

/** Carte d'un enseignant (en-tête toujours public). */
export type TeacherCard = {
  slug: string;
  first_name: string;
  last_name: string;
  full_name: string;
  title: string | null;
  expertise: string | null;
  avatar_url: string | null;
  grade: Ref | null;
  /** École supérieure saisie par l'enseignant (texte libre). */
  school: string | null;
  /** Département / Filière saisi par l'enseignant (texte libre). */
  department: string | null;
  posts_count?: number;
};

/** Profil public complet (GET /public/teachers/{slug}). */
export type PublicTeacher = TeacherCard & {
  banner_url: string | null;
  bio: string | null;
  expertise_tags: string[];
  items: Items;
  links: Links;
  contacts: { email: string | null; phone: string | null; office: string | null };
  /** CV téléchargeable, ou null (pas de CV, ou section masquée). */
  cv: CvInfo | null;
  visible_sections: VisibilitySection[];
  search_indexable: boolean;
  updated_at: string | null;
};

export type PostMedia = {
  id: number;
  type: "image" | "pdf" | "link";
  url: string | null;
  alt: string | null;
  original_name: string | null;
  size: number | null;
};

export type Post = {
  id: number;
  title: string | null;
  content: string;
  excerpt: string;
  category: Ref | null;
  media: PostMedia[];
  published_at: string | null;
  edited_at: string | null;
  author: (TeacherCard & { id?: number; status?: AccountStatus; email?: string }) | null;
};

/** Publication vue par son auteur ou par l'administration. */
export type OwnedPost = Post & {
  status: PostStatus;
  hidden_reason: string | null;
  category_id: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Paginated<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; per_page?: number; total: number };
  links?: unknown;
};

export type Registration = {
  id: number;
  status: "pending" | "approved" | "rejected";
  reason: string | null;
  matricule: string;
  document_name: string | null;
  has_document: boolean;
  submitted_at: string | null;
  processed_at: string | null;
};

/** Compte connecté (GET /me) — aussi utilisé par l'administration. */
export type Me = TeacherCard & {
  id: number;
  email: string;
  role: Role;
  /** Profil enseignant public ? Toujours vrai pour un enseignant ; au choix pour un administrateur. */
  teaches: boolean;
  /** École de la liste à laquelle le texte saisi correspond, le cas échéant. */
  school_id: number | null;
  status: AccountStatus;
  slug: string | null;
  banner_url: string | null;
  bio: string | null;
  expertise_tags: string[];
  matricule: string | null;
  phone: string | null;
  office: string | null;
  links: Links;
  items: Items;
  cv: (CvInfo & { name: string | null }) | null;
  visibility: {
    sections: Record<VisibilitySection, boolean>;
    show_email: boolean;
    show_phone: boolean;
    show_office: boolean;
    search_indexable: boolean;
  };
  slug_changes_remaining: number | null;
  slug_next_change_at: string | null;
  registration: Registration | null;
  suspension_reason: string | null;
  approved_at: string | null;
  created_at: string | null;
};

export type AdminUserDetail = Me & {
  posts_count: number;
  published_posts_count: number;
  slug_history: { slug: string; by_admin: boolean; created_at: string }[];
  approved_by: number | null;
  suspended_at: string | null;
  admins_count: number;
  history: AuditEntry[];
};

export type PublicProfileSettings = {
  slug: string | null;
  teaches: boolean;
  can_toggle_teaches: boolean;
  sections: Record<VisibilitySection, boolean>;
  show_email: boolean;
  show_phone: boolean;
  show_office: boolean;
  search_indexable: boolean;
  slug_changes_remaining: number;
  slug_next_change_at: string | null;
  slug_rules: { min: number; max: number; max_changes: number; window_days: number };
};

export type Session = {
  id: number;
  name: string;
  last_used_at: string | null;
  created_at: string | null;
  expires_at: string | null;
  current: boolean;
};

export type Stats = { teachers: number; posts: number; schools: number; departments: number };

export type SearchResults = {
  query: string;
  teachers: TeacherCard[];
  posts: Post[];
  totals: { teachers: number; posts: number };
};

export type AuditEntry = {
  id: number;
  action: string;
  label: string;
  admin: string | null;
  target_type: string | null;
  target_id: number | null;
  target_label: string | null;
  reason: string | null;
  meta: Record<string, unknown> | null;
  created_at: string | null;
};

export type RegistrationSummary = {
  id: number;
  status: "pending" | "approved" | "rejected";
  matricule: string;
  submitted_at: string | null;
  processed_at: string | null;
  reason: string | null;
  document_name: string | null;
  has_document: boolean;
  user: (TeacherCard & { id: number; email: string; status: AccountStatus }) | null;
};

export type RegistrationDetail = RegistrationSummary & {
  document_mime: string | null;
  processed_by: string | null;
  profile: AdminUserDetail;
};

export type AdminUserRow = TeacherCard & {
  id: number;
  email: string;
  role: Role;
  teaches: boolean;
  status: AccountStatus;
  matricule: string | null;
  created_at: string | null;
  approved_at: string | null;
  posts_count: number;
};

export type ReportSummary = {
  id: number;
  target_type: "post" | "profile";
  target_id: number;
  reason: string;
  reason_label: string;
  comment: string | null;
  email: string | null;
  status: "open" | "dismissed" | "actioned";
  resolution: string | null;
  created_at: string | null;
  handled_at: string | null;
  handled_by: string | null;
  target:
    | { exists: false }
    | {
        exists: true;
        label: string;
        status: string;
        post_id: number | null;
        author_id: number | null;
        author_name: string | null;
        author_slug: string | null;
        author_status: AccountStatus | null;
      };
};

export type ReferenceType = "grades" | "categories" | "schools";
export type ReferenceItem = { id: number; name: string; slug: string; usage: number };
export type References = Record<ReferenceType, ReferenceItem[]>;

export type Dashboard = {
  stats: {
    active_teachers: number;
    admins: number;
    pending_requests: number;
    suspended_teachers: number;
    posts_last_30_days: number;
    published_posts: number;
    hidden_posts: number;
    open_reports: number;
  };
  latest_requests: RegistrationSummary[];
  latest_reports: ReportSummary[];
  latest_audit: AuditEntry[];
};
