<?php

namespace Tests\Feature\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** CV en PDF : dépôt par l'enseignant ; consultable (pas téléchargeable en un clic) par un visiteur. */
class CvTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    private function pdf(string $name = 'mon-cv.pdf'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, "%PDF-1.4\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF");
    }

    public function test_teacher_uploads_a_cv_that_visitors_can_only_view(): void
    {
        $teacher = User::factory()->create(['first_name' => 'Amina', 'last_name' => 'Tchoumi', 'slug' => 'amina']);

        $this->getJson('/api/v1/public/teachers/amina')->assertJsonPath('data.cv', null);

        $this->actingAs($teacher)->post('/api/v1/me/cv', ['cv' => $this->pdf()], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.cv.name', 'mon-cv.pdf');

        $teacher->refresh();
        Storage::disk('local')->assertExists($teacher->cv_path);
        $this->assertStringStartsWith('cvs/', $teacher->cv_path);

        $this->getJson('/api/v1/public/teachers/amina')->assertJsonPath('data.cv.size', $teacher->cv_size);

        // Un visiteur ne peut que consulter le CV (disposition « inline »), pas le télécharger en un clic.
        $view = $this->get('/api/v1/public/teachers/amina/cv')->assertOk();
        $this->assertStringContainsString('application/pdf', $view->headers->get('Content-Type'));
        $this->assertStringContainsString('inline', $view->headers->get('Content-Disposition'));
        $this->assertStringContainsString('cv-amina-tchoumi.pdf', $view->headers->get('Content-Disposition'));

        // Le propriétaire, lui, peut réellement le télécharger (disposition « attachment »).
        $download = $this->actingAs($teacher)->get('/api/v1/me/cv')->assertOk();
        $this->assertStringContainsString('attachment', $download->headers->get('Content-Disposition'));
    }

    public function test_only_real_pdfs_are_accepted(): void
    {
        $teacher = User::factory()->create();

        $fake = UploadedFile::fake()->createWithContent('cv.pdf', '<script>alert(1)</script>');
        $this->actingAs($teacher)->post('/api/v1/me/cv', ['cv' => $fake], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('cv');

        $image = UploadedFile::fake()->image('cv.png');
        $this->actingAs($teacher)->post('/api/v1/me/cv', ['cv' => $image], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('cv');

        $this->assertNull($teacher->fresh()->cv_path);
    }

    public function test_cv_is_not_downloadable_when_hidden_suspended_or_pending(): void
    {
        $teacher = User::factory()->create(['slug' => 'prof-cv']);
        $this->actingAs($teacher)->post('/api/v1/me/cv', ['cv' => $this->pdf()], ['Accept' => 'application/json'])->assertOk();

        // Section « CV » masquée par l'enseignant.
        $this->actingAs($teacher)->putJson('/api/v1/me/public-profile', ['sections' => ['cv' => false]])->assertOk();
        $this->getJson('/api/v1/public/teachers/prof-cv')->assertJsonPath('data.cv', null);
        $this->get('/api/v1/public/teachers/prof-cv/cv')->assertNotFound();

        $this->actingAs($teacher)->putJson('/api/v1/me/public-profile', ['sections' => ['cv' => true]])->assertOk();
        $this->get('/api/v1/public/teachers/prof-cv/cv')->assertOk();

        // Compte suspendu : plus rien de public.
        $teacher->forceFill(['status' => 'suspended'])->save();
        $this->get('/api/v1/public/teachers/prof-cv/cv')->assertNotFound();

        // Compte en attente : il peut déposer et relire son CV, mais personne d'autre.
        $pending = User::factory()->pending()->create();
        $this->actingAs($pending)->post('/api/v1/me/cv', ['cv' => $this->pdf()], ['Accept' => 'application/json'])->assertOk();
        $this->actingAs($pending)->get('/api/v1/me/cv')->assertOk();
    }

    public function test_replacing_and_removing_the_cv_deletes_old_files(): void
    {
        $teacher = User::factory()->create();
        $this->actingAs($teacher)->post('/api/v1/me/cv', ['cv' => $this->pdf('v1.pdf')], ['Accept' => 'application/json'])->assertOk();
        $first = $teacher->fresh()->cv_path;

        $this->actingAs($teacher)->post('/api/v1/me/cv', ['cv' => $this->pdf('v2.pdf')], ['Accept' => 'application/json'])->assertOk();
        $second = $teacher->fresh()->cv_path;
        Storage::disk('local')->assertMissing($first);
        Storage::disk('local')->assertExists($second);

        $this->actingAs($teacher)->deleteJson('/api/v1/me/cv')->assertOk()->assertJsonPath('data.cv', null);
        Storage::disk('local')->assertMissing($second);

        // Suppression du compte : le fichier part avec lui.
        $this->actingAs($teacher)->post('/api/v1/me/cv', ['cv' => $this->pdf()], ['Accept' => 'application/json'])->assertOk();
        $path = $teacher->fresh()->cv_path;
        $teacher->fresh()->delete();
        Storage::disk('local')->assertMissing($path);
    }
}
