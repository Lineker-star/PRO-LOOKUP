<?php

namespace Database\Seeders;

use App\Models\Faculty;
use App\Models\ProfileItem;
use App\Models\ProfileSlugHistory;
use App\Models\Rank;
use App\Models\RegistrationRequest;
use App\Models\User;
use Database\Seeders\Concerns\CreatesDemoDocuments;
use Database\Seeders\Concerns\ResolvesDemoAffiliation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

/**
 * Demandes d'inscription EN ATTENTE, pour tester l'approbation et le refus.
 *
 *   php artisan db:seed --class=PendingRequestsSeeder
 *
 * Rejouable à volonté : chaque exécution remet ces comptes « en attente » avec une
 * demande neuve (même s'ils ont été approuvés ou refusés entre-temps).
 * Toutes les données sont fictives. Mot de passe de chaque compte : Password123!
 *
 * Les situations sont variées pour s'entraîner à décider :
 *  - dossiers complets et cohérents (à approuver) ;
 *  - justificatif en image plutôt qu'en PDF ;
 *  - justificatif douteux ou au nom d'une autre personne (à refuser) ;
 *  - adresse email personnelle, profil très incomplet, grade incohérent…
 */
class PendingRequestsSeeder extends Seeder
{
    use CreatesDemoDocuments;
    use ResolvesDemoAffiliation;

    public function run(): void
    {
        if (Rank::count() === 0 || Faculty::count() === 0) {
            $this->call(ReferenceSeeder::class);
        }

        $password = Hash::make('Password123!');

        foreach ($this->requests() as $index => $r) {
            $user = User::firstOrNew(['email' => $r['email']]);
            $user->fill([
                'first_name' => $r['first_name'],
                'last_name' => $r['last_name'],
                'password' => $password,
                'title' => $r['title'],
                'expertise' => $r['expertise'],
                'bio' => $r['bio'],
                'expertise_tags' => $r['tags'] ?? [],
                'rank_id' => Rank::where('slug', $r['grade'])->value('id'),
                ...$this->affiliation($r['department']),
                'department_id' => null,
                'matricule' => $r['matricule'],
                'phone' => $r['phone'] ?? null,
                'office' => $r['office'] ?? null,
            ]);
            // Remise à zéro : compte enseignant en attente, sans URL publique.
            $user->role = User::ROLE_TEACHER;
            $user->teaches = true;
            $user->status = 'pending';
            $user->slug = null;
            $user->approved_by = null;
            $user->approved_at = null;
            $user->rejection_reason = null;
            $user->suspension_reason = null;
            $user->suspended_at = null;
            $user->save();

            // Nettoie les traces d'un essai précédent.
            ProfileSlugHistory::where('user_id', $user->id)->delete();
            $user->posts()->delete();
            $user->tokens()->delete();
            foreach (RegistrationRequest::where('user_id', $user->id)->get() as $old) {
                if ($old->document_path) {
                    Storage::disk('local')->delete($old->document_path);
                }
                $old->delete();
            }

            // Brouillon de profil déjà rempli par certains candidats.
            ProfileItem::where('user_id', $user->id)->delete();
            foreach ($r['items'] ?? [] as $section => $items) {
                foreach ($items as $position => $item) {
                    ProfileItem::create(['user_id' => $user->id, 'section' => $section, 'position' => $position, ...$item]);
                }
            }

            // Justificatif sur le disque PRIVÉ.
            [$kind, $lines, $fileName] = $r['document'];
            $extension = $kind === 'png' ? 'png' : 'pdf';
            $path = "justificatifs/demo-{$user->id}-".now()->format('YmdHis').".{$extension}";
            Storage::disk('local')->put($path, $kind === 'png' ? $this->demoPng($lines) : $this->demoPdf($lines));

            $request = RegistrationRequest::create([
                'user_id' => $user->id,
                'matricule' => $r['matricule'],
                'document_path' => $path,
                'document_name' => $fileName,
                'document_mime' => $kind === 'png' ? 'image/png' : 'application/pdf',
                'status' => 'pending',
            ]);
            // Dates de dépôt échelonnées, pour une file d'attente réaliste.
            $request->created_at = now()->subHours(($index + 1) * 7);
            $request->updated_at = $request->created_at;
            $request->save();
        }

        $this->command?->info(count($this->requests()).' demandes en attente prêtes. Mot de passe des comptes : Password123!');
    }

    private function requests(): array
    {
        return [
            [
                // Dossier complet et cohérent → à approuver.
                'first_name' => 'Hélène', 'last_name' => 'Ngo Bassa', 'email' => 'helene.ngobassa@iuztf.cm',
                'grade' => 'maitre-de-conferences', 'department' => 'chimie', 'matricule' => 'ENS-0512',
                'title' => 'Maîtresse de conférences en chimie organique', 'expertise' => 'Chimie des substances naturelles',
                'tags' => ['Chimie organique', 'Phytochimie'], 'phone' => '+237 6 91 22 33 44', 'office' => 'Bâtiment A, bureau 118',
                'bio' => 'Enseignante-chercheuse en chimie organique, spécialisée dans l’extraction et la caractérisation des molécules issues des plantes de la région de l’Est.',
                'document' => ['pdf', ['ATTESTATION DE PRISE DE SERVICE', 'Universite ZTF - Bertoua', 'Mme Helene NGO BASSA', 'Maitre de conferences - Departement de Chimie', 'Matricule : ENS-0512', 'Date de prise de service : 01/10/2019'], 'attestation-prise-de-service.pdf'],
                'items' => [
                    'education' => [['title' => 'Doctorat en chimie organique', 'organization' => 'Université de Yaoundé I', 'period' => '2015']],
                    'course' => [['title' => 'Chimie organique générale', 'organization' => 'Licence 2 — Chimie']],
                ],
            ],
            [
                // Dossier complet, justificatif scanné en image → à approuver.
                'first_name' => 'Samuel', 'last_name' => 'Owona', 'email' => 'samuel.owona@iuztf.cm',
                'grade' => 'charge-de-cours', 'department' => 'genie-civil', 'matricule' => 'ENS-0533',
                'title' => 'Chargé de cours en génie civil', 'expertise' => 'Hydraulique et assainissement',
                'bio' => 'Chargé de cours au département de génie civil, il enseigne l’hydraulique et encadre les projets de fin d’études sur l’assainissement urbain.',
                'document' => ['png', ['ARRETE DE NOMINATION', 'M. Samuel OWONA', 'Charge de cours - Departement de Genie civil', 'Matricule : ENS-0533', 'Fait a Bertoua, le 15/09/2021'], 'arrete-nomination-scan.png'],
            ],
            [
                // Jeune assistante, profil minimal mais dossier correct → à approuver.
                'first_name' => 'Nadège', 'last_name' => 'Fouda', 'email' => 'nadege.fouda@iuztf.cm',
                'grade' => 'assistant', 'department' => 'informatique', 'matricule' => 'ENS-0547',
                'title' => 'Assistante en informatique', 'expertise' => 'Bases de données', 'bio' => null,
                'document' => ['pdf', ['CONTRAT D ENSEIGNEMENT', 'Universite ZTF - Bertoua', 'Mme Nadege FOUDA', 'Assistante - Departement d Informatique', 'Matricule : ENS-0547', 'Annee academique 2025-2026'], 'contrat-enseignement-2025.pdf'],
            ],
            [
                // Vacataire, adresse email personnelle → à vérifier.
                'first_name' => 'Rodrigue', 'last_name' => 'Mballa', 'email' => 'rodrigue.mballa.prof@gmail.com',
                'grade' => 'enseignant-vacataire', 'department' => 'gestion-et-comptabilite', 'matricule' => 'VAC-2025-031',
                'title' => 'Enseignant vacataire en comptabilité', 'expertise' => 'Comptabilité et audit',
                'bio' => 'Expert-comptable, intervient comme vacataire en comptabilité générale et en audit auprès des étudiants de Licence.',
                'document' => ['pdf', ['CONTRAT DE VACATION', 'Universite ZTF - Bertoua', 'M. Rodrigue MBALLA', 'Enseignant vacataire - Gestion et comptabilite', 'Volume horaire : 60 heures', 'Semestre 1 - 2025-2026'], 'contrat-vacation.pdf'],
            ],
            [
                // Justificatif au nom d'une AUTRE personne → à refuser.
                'first_name' => 'Kevin', 'last_name' => 'Ateba', 'email' => 'kevin.ateba@iuztf.cm',
                'grade' => 'maitre-de-conferences', 'department' => 'economie', 'matricule' => 'ENS-0561',
                'title' => 'Maître de conférences en économie', 'expertise' => 'Économie du développement',
                'bio' => 'Économiste du développement.',
                'document' => ['pdf', ['ATTESTATION DE SERVICE', 'Universite ZTF - Bertoua', 'M. Joseph NDZANA', 'Charge de cours - Departement d Economie', 'Matricule : ENS-0402'], 'attestation.pdf'],
            ],
            [
                // Grade revendiqué incohérent avec le justificatif (assistant → professeur) → à refuser ou faire corriger.
                'first_name' => 'Brice', 'last_name' => 'Manga', 'email' => 'brice.manga@iuztf.cm',
                'grade' => 'professeur', 'department' => 'physique', 'matricule' => 'ENS-0578',
                'title' => 'Professeur de physique', 'expertise' => 'Physique des matériaux',
                'bio' => 'Enseignant de physique.',
                'document' => ['pdf', ['DECISION DE RECRUTEMENT', 'Universite ZTF - Bertoua', 'M. Brice MANGA', 'Recrute en qualite d ASSISTANT', 'Departement de Physique', 'Matricule : ENS-0578'], 'decision-recrutement.pdf'],
            ],
            [
                // Document sans rapport (reçu de paiement) → à refuser.
                'first_name' => 'Linda', 'last_name' => 'Essomba', 'email' => 'linda.essomba@iuztf.cm',
                'grade' => 'charge-de-cours', 'department' => 'langues-et-litteratures', 'matricule' => 'ENS-0590',
                'title' => 'Chargée de cours en littérature', 'expertise' => 'Littératures africaines',
                'bio' => 'Enseignante de littératures africaines francophones.',
                'document' => ['pdf', ['RECU DE PAIEMENT', 'Frais de scolarite 2025-2026', 'Montant : 150 000 FCFA', 'Etudiant : ESSOMBA Linda'], 'recu.pdf'],
            ],
            [
                // Dossier complet, profil détaillé → à approuver.
                'first_name' => 'Gaston', 'last_name' => 'Nkoulou', 'email' => 'gaston.nkoulou@iuztf.cm',
                'grade' => 'professeur', 'department' => 'histoire-et-geographie', 'matricule' => 'ENS-0154',
                'title' => 'Professeur d’histoire contemporaine', 'expertise' => 'Histoire de l’Afrique centrale',
                'tags' => ['Histoire contemporaine', 'Afrique centrale', 'Archives orales'], 'office' => 'Bâtiment D, bureau 302',
                'bio' => 'Historien spécialiste de l’Afrique centrale au XXe siècle, il dirige des travaux sur les archives orales de la région de l’Est.',
                'document' => ['pdf', ['ARRETE DE NOMINATION', 'Universite ZTF - Bertoua', 'M. Gaston NKOULOU', 'Professeur - Departement d Histoire et geographie', 'Matricule : ENS-0154', 'Date d effet : 01/01/2012'], 'arrete-professeur.pdf'],
                'items' => [
                    'education' => [['title' => 'Doctorat d’histoire', 'organization' => 'Université de Yaoundé I', 'period' => '2004']],
                    'experience' => [['title' => 'Chef du département d’histoire', 'organization' => 'Université ZTF', 'period' => '2016 — 2022']],
                    'course' => [['title' => 'Histoire de l’Afrique contemporaine', 'organization' => 'Licence 3 — Histoire']],
                ],
            ],
        ];
    }
}
