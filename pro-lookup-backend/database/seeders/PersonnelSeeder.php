<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\ProfileItem;
use App\Models\Rank;
use App\Models\RegistrationRequest;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

/**
 * Enseignants de démonstration (données fictives). Mot de passe : Password123!
 */
class PersonnelSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('Password123!');
        $grade = fn (string $slug) => Rank::where('slug', $slug)->value('id');
        $dept = fn (string $slug) => Department::where('slug', $slug)->first();
        $category = fn (string $slug) => PostCategory::where('slug', $slug)->value('id');

        foreach ($this->teachers() as $index => $t) {
            $department = $dept($t['department']);

            $user = User::updateOrCreate(['email' => $t['email']], [
                'first_name' => $t['first_name'],
                'last_name' => $t['last_name'],
                'password' => $password,
                'bio' => $t['bio'],
                'title' => $t['title'],
                'expertise' => $t['expertise'],
                'expertise_tags' => $t['tags'],
                'rank_id' => $grade($t['grade']),
                'faculty_id' => $department?->faculty_id,
                'department_id' => $department?->id,
                'department' => $department?->name,
                'matricule' => 'ENS-'.str_pad((string) ($index + 101), 4, '0', STR_PAD_LEFT),
                'phone' => '+237 6 90 00 '.str_pad((string) (10 + $index), 2, '0').' '.str_pad((string) (20 + $index), 2, '0'),
                'office' => $t['office'],
                'links' => $t['links'] ?? [],
                'show_email' => true,
                'show_office' => true,
            ]);
            $user->role = User::ROLE_TEACHER;
            $user->status = 'approved';
            $user->slug = $t['slug'];
            $user->approved_at ??= now()->subDays(60 - $index);
            $user->email_verified_at ??= now();
            $user->save();

            // Sections du profil (remplacées à chaque exécution).
            ProfileItem::where('user_id', $user->id)->delete();
            foreach ($t['items'] as $section => $items) {
                foreach ($items as $position => $item) {
                    ProfileItem::create(['user_id' => $user->id, 'section' => $section, 'position' => $position, ...$item]);
                }
            }

            // Publications (créées une seule fois).
            foreach ($t['posts'] as $offset => $p) {
                $post = Post::firstOrNew(['user_id' => $user->id, 'title' => $p['title']]);
                if (! $post->exists) {
                    $post->fill([
                        'content' => $p['content'],
                        'category_id' => $category($p['category']),
                        'status' => 'published',
                        'visibility' => 'public',
                    ]);
                    $post->user_id = $user->id;
                    $post->published_at = now()->subDays(($index * 3) + $offset + 1)->subHours($offset * 5);
                    $post->save();
                }
            }
        }

        $this->pendingRequest($password, $dept('informatique'), $grade('assistant'));
    }

    /** Une demande en attente, pour tester la file d'approbation. */
    private function pendingRequest(string $password, ?Department $department, ?int $gradeId): void
    {
        $user = User::updateOrCreate(['email' => 'blaise.ngono@iuztf.cm'], [
            'first_name' => 'Blaise',
            'last_name' => 'Ngono',
            'password' => $password,
            'title' => 'Assistant en informatique',
            'expertise' => 'Réseaux informatiques',
            'rank_id' => $gradeId,
            'faculty_id' => $department?->faculty_id,
            'department_id' => $department?->id,
            'department' => $department?->name,
            'matricule' => 'ENS-0450',
        ]);
        $user->role = User::ROLE_TEACHER;
        $user->status = 'pending';
        $user->slug = null;
        $user->save();

        if (! RegistrationRequest::where('user_id', $user->id)->exists()) {
            $path = 'justificatifs/demo-attestation-blaise-ngono.pdf';
            Storage::disk('local')->put($path, $this->demoPdf('Attestation de service - Blaise Ngono (document de demonstration)'));
            RegistrationRequest::create([
                'user_id' => $user->id,
                'matricule' => 'ENS-0450',
                'document_path' => $path,
                'document_name' => 'attestation-de-service.pdf',
                'document_mime' => 'application/pdf',
                'status' => 'pending',
            ]);
        }
    }

    /** Petit PDF valide d'une page, pour la démonstration. */
    private function demoPdf(string $text): string
    {
        $stream = "BT /F1 16 Tf 60 760 Td ({$text}) Tj ET";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            '<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $i => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($i + 1)." 0 obj\n{$object}\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= str_pad((string) $offset, 10, '0', STR_PAD_LEFT)." 00000 n \n";
        }

        return $pdf."trailer\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }

    private function teachers(): array
    {
        return [
            [
                'first_name' => 'Dieudonné', 'last_name' => 'Ndongo', 'email' => 'dieudonne.ndongo@iuztf.cm', 'slug' => 'dieudonne-ndongo',
                'grade' => 'professeur', 'department' => 'genie-electrique-et-energetique', 'office' => 'Bâtiment B, bureau 204',
                'title' => 'Professeur de génie énergétique', 'expertise' => 'Systèmes énergétiques',
                'tags' => ['Énergie solaire', 'Automatique', 'Réseaux électriques'],
                'bio' => 'Enseignant-chercheur spécialisé dans les systèmes énergétiques et l’automatique. Il coordonne la formation des ingénieurs en génie électrique et encadre plusieurs travaux de recherche sur l’électrification rurale dans la région de l’Est.',
                'links' => ['orcid' => '0000-0002-1825-0097', 'google_scholar' => 'https://scholar.google.com/'],
                'items' => [
                    'course' => [
                        ['title' => 'Conversion d’énergie', 'organization' => 'Licence 3 — Génie électrique', 'description' => 'Cours magistral et travaux dirigés.'],
                        ['title' => 'Systèmes photovoltaïques', 'organization' => 'Master 1 — Énergétique'],
                    ],
                    'education' => [
                        ['title' => 'Doctorat en génie électrique', 'organization' => 'Université de Yaoundé I', 'period' => '2008'],
                        ['title' => 'Master en énergétique', 'organization' => 'École Nationale Supérieure Polytechnique', 'period' => '2003'],
                    ],
                    'experience' => [
                        ['title' => 'Chef du département de génie électrique', 'organization' => 'Université ZTF', 'period' => '2019 — aujourd’hui'],
                        ['title' => 'Ingénieur d’études', 'organization' => 'Bureau d’études énergétiques', 'period' => '2004 — 2009'],
                    ],
                    'research_area' => [
                        ['title' => 'Micro-réseaux solaires en zone forestière', 'description' => 'Dimensionnement et pilotage de micro-réseaux pour les villages isolés.'],
                    ],
                    'scientific_publication' => [
                        ['title' => 'Dimensionnement de micro-réseaux photovoltaïques pour l’électrification rurale', 'organization' => 'Revue africaine des sciences de l’ingénieur', 'period' => '2022', 'url' => 'https://doi.org/10.0000/demo.2022.001'],
                    ],
                    'award' => [['title' => 'Prix de l’innovation pédagogique', 'organization' => 'Université ZTF', 'period' => '2021']],
                    'language' => [['title' => 'Français', 'organization' => 'Langue maternelle'], ['title' => 'Anglais', 'organization' => 'Courant']],
                ],
                'posts' => [
                    ['title' => 'Ouverture du laboratoire d’énergies renouvelables', 'category' => 'actualite', 'content' => '<p>Le département de génie électrique inaugure son <strong>laboratoire d’énergies renouvelables</strong>. Les étudiants de Licence et de Master y réaliseront leurs travaux pratiques sur des installations solaires réelles.</p><p>Le laboratoire est ouvert aux partenariats avec les entreprises de la région.</p>'],
                    ['title' => 'Résultats de la campagne de mesures solaires 2025', 'category' => 'travaux-de-recherche', 'content' => '<p>Notre équipe publie les résultats de douze mois de mesures d’ensoleillement à Bertoua.</p><ul><li>Rayonnement moyen journalier mesuré sur site</li><li>Comparaison avec les données satellitaires</li><li>Recommandations pour le dimensionnement</li></ul>'],
                ],
            ],
            [
                'first_name' => 'Jeanne', 'last_name' => 'Mvondo', 'email' => 'jeanne.mvondo@iuztf.cm', 'slug' => 'jeanne-mvondo',
                'grade' => 'professeur', 'department' => 'biologie', 'office' => 'Bâtiment A, bureau 112',
                'title' => 'Professeure de biotechnologies végétales', 'expertise' => 'Biotechnologies végétales',
                'tags' => ['Biotechnologies', 'Plantes médicinales', 'Agriculture durable'],
                'bio' => 'Professeure et directrice de recherche en biotechnologies végétales. Ses travaux portent sur la valorisation des ressources végétales locales et l’amélioration des cultures vivrières.',
                'items' => [
                    'course' => [['title' => 'Biologie végétale', 'organization' => 'Licence 2 — Biologie'], ['title' => 'Biotechnologies appliquées', 'organization' => 'Master 2 — Biologie']],
                    'education' => [['title' => 'Doctorat en biologie végétale', 'organization' => 'Université de Dschang', 'period' => '2006']],
                    'experience' => [['title' => 'Directrice du laboratoire de biotechnologies', 'organization' => 'Université ZTF', 'period' => '2015 — aujourd’hui']],
                    'research_area' => [['title' => 'Valorisation des plantes médicinales de l’Est-Cameroun']],
                    'language' => [['title' => 'Français', 'organization' => 'Langue maternelle'], ['title' => 'Anglais', 'organization' => 'Courant']],
                ],
                'posts' => [
                    ['title' => 'Séminaire : les plantes médicinales de l’Est', 'category' => 'evenement', 'content' => '<p>Le laboratoire de biotechnologies organise un séminaire ouvert au public le <strong>mois prochain</strong> à l’amphithéâtre principal.</p><p>Au programme : inventaire des espèces, méthodes d’extraction et perspectives de valorisation.</p>'],
                ],
            ],
            [
                'first_name' => 'Jean-Pierre', 'last_name' => 'Mvondo', 'email' => 'jean-pierre.mvondo@iuztf.cm', 'slug' => 'jean-pierre-mvondo',
                'grade' => 'maitre-de-conferences', 'department' => 'genie-civil', 'office' => 'Bâtiment C, bureau 015',
                'title' => 'Maître de conférences en génie civil', 'expertise' => 'Matériaux de construction',
                'tags' => ['Matériaux locaux', 'Structures', 'Construction durable'],
                'bio' => 'Enseignant en génie civil, il travaille sur les matériaux de construction locaux et les infrastructures adaptées au climat tropical humide.',
                'items' => [
                    'course' => [['title' => 'Résistance des matériaux', 'organization' => 'Licence 2 — Génie civil'], ['title' => 'Béton armé', 'organization' => 'Licence 3 — Génie civil']],
                    'education' => [['title' => 'Doctorat en génie civil', 'organization' => 'Université de Douala', 'period' => '2014']],
                    'scientific_publication' => [['title' => 'Propriétés mécaniques des briques de terre compressée stabilisée', 'organization' => 'Journal of Building Materials', 'period' => '2023']],
                ],
                'posts' => [
                    ['title' => 'Les briques de terre compressée, une solution d’avenir', 'category' => 'article', 'content' => '<p>Les briques de terre compressée stabilisée offrent une alternative économique et écologique au parpaing de ciment.</p><p>Dans cet article, je présente les résultats de nos essais mécaniques réalisés avec les étudiants de Licence 3.</p>'],
                ],
            ],
            [
                'first_name' => 'Amina', 'last_name' => 'Tchoumi', 'email' => 'amina.tchoumi@iuztf.cm', 'slug' => 'amina-tchoumi',
                'grade' => 'maitre-de-conferences', 'department' => 'informatique', 'office' => 'Bâtiment A, bureau 203',
                'title' => 'Maître de conférences en informatique', 'expertise' => 'Intelligence artificielle',
                'tags' => ['Apprentissage automatique', 'Données', 'Traitement du langage'],
                'bio' => 'Chercheuse en intelligence artificielle appliquée aux services publics et à l’éducation. Elle enseigne la programmation et la science des données.',
                'links' => ['linkedin' => 'https://www.linkedin.com/', 'website' => 'https://example.org/'],
                'items' => [
                    'course' => [['title' => 'Programmation Python', 'organization' => 'Licence 1 — Informatique'], ['title' => 'Apprentissage automatique', 'organization' => 'Master 1 — Informatique']],
                    'education' => [['title' => 'Doctorat en informatique', 'organization' => 'Université de Yaoundé I', 'period' => '2016']],
                    'research_area' => [['title' => 'Traitement automatique des langues camerounaises']],
                    'language' => [['title' => 'Français', 'organization' => 'Courant'], ['title' => 'Anglais', 'organization' => 'Courant'], ['title' => 'Fulfulde', 'organization' => 'Langue maternelle']],
                ],
                'posts' => [
                    ['title' => 'Hackathon étudiant sur l’intelligence artificielle', 'category' => 'annonce', 'content' => '<p>Les inscriptions au <strong>hackathon étudiant</strong> du département d’informatique sont ouvertes.</p><p>Thème de cette année : des outils numériques au service des communes rurales.</p>'],
                    ['title' => 'Un corpus pour les langues locales', 'category' => 'travaux-de-recherche', 'content' => '<p>Nous lançons la constitution d’un corpus de textes en langues locales, destiné à entraîner des outils de traduction automatique.</p>'],
                ],
            ],
            [
                'first_name' => 'Paul', 'last_name' => 'Etoa', 'email' => 'paul.etoa@iuztf.cm', 'slug' => 'paul-etoa',
                'grade' => 'charge-de-cours', 'department' => 'economie', 'office' => 'Bâtiment D, bureau 108',
                'title' => 'Chargé de cours en économie', 'expertise' => 'Économie agricole',
                'tags' => ['Agroéconomie', 'Sécurité alimentaire'],
                'bio' => 'Chargé de cours en économie, il accompagne les filières agricoles et étudie les dynamiques économiques rurales de la région de l’Est.',
                'items' => [
                    'course' => [['title' => 'Microéconomie', 'organization' => 'Licence 1 — Économie']],
                    'education' => [['title' => 'Master en économie du développement', 'organization' => 'Université de Yaoundé II', 'period' => '2012']],
                ],
                'posts' => [
                    ['title' => 'Journée d’étude sur les filières agricoles', 'category' => 'evenement', 'content' => '<p>Une journée d’étude réunira enseignants, étudiants et producteurs autour des filières cacao et manioc.</p>'],
                ],
            ],
            [
                'first_name' => 'Clarisse', 'last_name' => 'Abena', 'email' => 'clarisse.abena@iuztf.cm', 'slug' => 'clarisse-abena',
                'grade' => 'assistant', 'department' => 'genie-electrique-et-energetique', 'office' => 'Bâtiment B, bureau 110',
                'title' => 'Assistante en génie énergétique', 'expertise' => 'Énergie solaire',
                'tags' => ['Stockage d’énergie', 'Photovoltaïque'],
                'bio' => 'Assistante au département de génie électrique, elle encadre les travaux pratiques sur les installations solaires et le stockage d’énergie.',
                'items' => [
                    'course' => [['title' => 'Travaux pratiques d’électrotechnique', 'organization' => 'Licence 2 — Génie électrique']],
                    'education' => [['title' => 'Master en énergies renouvelables', 'organization' => 'Université de Ngaoundéré', 'period' => '2019']],
                ],
                'posts' => [],
            ],
            [
                'first_name' => 'Michel', 'last_name' => 'Biloa', 'email' => 'michel.biloa@iuztf.cm', 'slug' => 'michel-biloa',
                'grade' => 'maitre-de-conferences', 'department' => 'mathematiques', 'office' => 'Bâtiment A, bureau 305',
                'title' => 'Maître de conférences en mathématiques appliquées', 'expertise' => 'Modélisation et statistique',
                'tags' => ['Statistique', 'Modélisation', 'Épidémiologie'],
                'bio' => 'Ses travaux portent sur la modélisation mathématique des phénomènes complexes et la statistique appliquée à la santé publique.',
                'items' => [
                    'course' => [['title' => 'Probabilités et statistique', 'organization' => 'Licence 2 — Mathématiques'], ['title' => 'Analyse numérique', 'organization' => 'Licence 3 — Mathématiques']],
                    'education' => [['title' => 'Doctorat en mathématiques appliquées', 'organization' => 'Université de Yaoundé I', 'period' => '2013']],
                ],
                'posts' => [
                    ['title' => 'Cours de mise à niveau en statistique', 'category' => 'annonce', 'content' => '<p>Un cours de mise à niveau en statistique est proposé aux étudiants de Master, chaque samedi matin pendant six semaines.</p>'],
                ],
            ],
            [
                'first_name' => 'Estelle', 'last_name' => 'Nkomo', 'email' => 'estelle.nkomo@iuztf.cm', 'slug' => 'estelle-nkomo',
                'grade' => 'enseignant-vacataire', 'department' => 'sciences-de-leducation', 'office' => null,
                'title' => 'Enseignante vacataire en sciences de l’éducation', 'expertise' => 'Pédagogie',
                'tags' => ['Didactique', 'Pédagogie universitaire'],
                'bio' => 'Enseignante vacataire, elle intervient en didactique et en pédagogie universitaire auprès des futurs enseignants.',
                'items' => [
                    'course' => [['title' => 'Didactique générale', 'organization' => 'Licence 3 — Sciences de l’éducation']],
                ],
                'posts' => [],
            ],
        ];
    }
}
