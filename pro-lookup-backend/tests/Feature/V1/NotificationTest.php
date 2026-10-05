<?php

namespace Tests\Feature\V1;

use App\Models\InAppNotification;
use App\Models\User;
use App\Notifications\PlatformNotification;
use App\Services\Brevo\DailyQuota;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/** Emails via Brevo, centre de notifications, préférences et désabonnement. */
class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'mail.default' => 'brevo',
            'services.brevo.key' => 'cle-de-test',
            'services.brevo.sender_email' => 'noreply@example.cm',
            'services.brevo.sender_name' => 'PRO-LOOKUP',
            'services.brevo.optional_limit' => 250,
        ]);
        Http::fake(['api.brevo.com/*' => Http::response(['messageId' => 'abc'], 201)]);
        Cache::flush();
    }

    private function notification(string $category = 'account'): PlatformNotification
    {
        return new PlatformNotification('Titre de test', ['Première ligne.'], 'Voir', 'https://front.example/x', $category);
    }

    public function test_account_email_is_sent_through_brevo_and_kept_in_the_inbox(): void
    {
        $user = User::factory()->create(['email' => 'amina@example.cm']);

        $user->notify($this->notification());

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.brevo.com/v3/smtp/email'
                && $request->hasHeader('api-key', 'cle-de-test')
                && $request['to'][0]['email'] === 'amina@example.cm'
                && $request['sender']['email'] === 'noreply@example.cm';
        });
        $this->assertSame(1, DailyQuota::sentToday());
        $this->assertDatabaseHas('platform_notifications', ['user_id' => $user->id, 'title' => 'Titre de test', 'category' => 'account']);
    }

    public function test_optional_email_is_skipped_when_the_teacher_opted_out_but_still_in_inbox(): void
    {
        $user = User::factory()->create(['email_preferences' => ['profile' => false]]);

        $user->notify($this->notification('profile'));

        Http::assertNothingSent();
        $this->assertDatabaseHas('platform_notifications', ['user_id' => $user->id, 'category' => 'profile']);
    }

    public function test_optional_email_stops_when_the_daily_margin_is_reached(): void
    {
        $user = User::factory()->create();
        Cache::put('brevo:sent:'.now()->toDateString(), 250);

        $user->notify($this->notification('admin'));

        Http::assertNothingSent();
        $this->assertDatabaseHas('platform_notifications', ['user_id' => $user->id]);
    }

    public function test_signed_unsubscribe_link_switches_the_category_off(): void
    {
        $user = User::factory()->create();
        $url = URL::signedRoute('email.unsubscribe', ['user' => $user->id, 'category' => 'profile']);

        $this->get($url)->assertOk()->assertSee('Désabonnement enregistré');
        $this->assertFalse($user->fresh()->emailEnabled(\App\Enums\NotificationCategory::Profile));

        // Lien modifié à la main : refusé.
        $this->get(str_replace('/profile?', '/newsletter?', $url))->assertForbidden();
    }

    public function test_account_category_cannot_be_unsubscribed(): void
    {
        $user = User::factory()->create();
        $url = URL::signedRoute('email.unsubscribe', ['user' => $user->id, 'category' => 'account']);

        $this->get($url)->assertNotFound();
    }

    public function test_teacher_reads_and_marks_notifications(): void
    {
        $teacher = User::factory()->create();
        $first = InAppNotification::create(['user_id' => $teacher->id, 'category' => 'account', 'title' => 'Un', 'body' => 'x']);
        InAppNotification::create(['user_id' => $teacher->id, 'category' => 'account', 'title' => 'Deux', 'body' => 'y']);

        $this->actingAs($teacher)->getJson('/api/v1/me/notifications')
            ->assertOk()->assertJsonPath('unread_count', 2)->assertJsonCount(2, 'data');

        $this->actingAs($teacher)->postJson("/api/v1/me/notifications/{$first->id}/read")->assertOk()->assertJsonPath('unread_count', 1);
        $this->actingAs($teacher)->postJson('/api/v1/me/notifications/read-all')->assertOk()->assertJsonPath('unread_count', 0);
    }

    public function test_teacher_cannot_read_someone_elses_notification(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $notification = InAppNotification::create(['user_id' => $owner->id, 'category' => 'account', 'title' => 'Privé', 'body' => 'x']);

        $this->actingAs($other)->postJson("/api/v1/me/notifications/{$notification->id}/read")->assertNotFound();
    }

    public function test_teacher_updates_optional_email_preferences(): void
    {
        $teacher = User::factory()->create();

        $this->actingAs($teacher)->putJson('/api/v1/me/email-preferences', ['newsletter' => true])
            ->assertOk()
            ->assertJsonPath('data.newsletter', true)
            ->assertJsonPath('data.profile', true);

        $this->actingAs($teacher)->getJson('/api/v1/me/email-preferences')->assertJsonPath('data.newsletter', true);
    }
}
