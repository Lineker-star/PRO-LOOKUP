<?php

namespace App\Models;

use App\Enums\NotificationCategory;
use App\Enums\ProfileSection;
use App\Enums\UserStatus;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

/**
 * Compte d'un enseignant (role = member) ou d'un administrateur (role = admin).
 * Le profil public de l'enseignant est porté directement par ce modèle.
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_TEACHER = 'member';
    public const ROLE_ADMIN = 'admin';

    /**
     * Attributs modifiables en masse. Le rôle, le statut et `teaches` n'y figurent pas :
     * ils ne sont jamais pris directement dans une requête (protection contre
     * l'auto-attribution du rôle administrateur).
     *
     * `school` (école supérieure) et `department` (département / filière) sont du texte libre ;
     * `faculty_id` relie l'école à la liste gérée par l'administration quand le nom correspond.
     */
    protected $fillable = [
        'first_name', 'last_name', 'email', 'password',
        'avatar_path', 'banner_path', 'bio', 'title', 'expertise', 'expertise_tags',
        'school', 'department', 'faculty_id', 'department_id', 'rank_id',
        'matricule', 'phone', 'office', 'links',
        'show_email', 'show_phone', 'show_office', 'public_sections', 'search_indexable',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'approved_at' => 'datetime',
            'suspended_at' => 'datetime',
            'password' => 'hashed',
            'rank_id' => 'integer',
            'faculty_id' => 'integer',
            'department_id' => 'integer',
            'expertise_tags' => 'array',
            'email_preferences' => 'array',
            'links' => 'array',
            'public_sections' => 'array',
            'show_email' => 'boolean',
            'show_phone' => 'boolean',
            'show_office' => 'boolean',
            'search_indexable' => 'boolean',
            'teaches' => 'boolean',
            'cv_size' => 'integer',
            'cv_updated_at' => 'datetime',
        ];
    }

    /** Le fichier du CV (disque privé) disparaît avec le compte. */
    protected static function booted(): void
    {
        static::deleting(function (User $user) {
            if ($user->cv_path) {
                Storage::disk('local')->delete($user->cv_path);
            }
        });
    }

    /** CV déposé ET section « CV » visible (le profil lui-même doit en plus être public). */
    public function hasPublicCv(): bool
    {
        return (bool) $this->cv_path && $this->sectionIsPublic(ProfileSection::Cv);
    }

    // ---------------------------------------------------------------- Accesseurs

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isApproved(): bool
    {
        return $this->status === UserStatus::Approved->value;
    }

    /** Envoi par email autorisé pour cette catégorie (les emails de compte ne se règlent pas). */
    public function emailEnabled(NotificationCategory $category): bool
    {
        if ($category->isTransactional()) {
            return true;
        }

        return (bool) ($this->email_preferences[$category->value] ?? $category->defaultEnabled());
    }

    public function avatarUrl(): ?string
    {
        return $this->avatar_path ? Storage::disk('public')->url($this->avatar_path) : null;
    }

    public function bannerUrl(): ?string
    {
        return $this->banner_path ? Storage::disk('public')->url($this->banner_path) : null;
    }

    /** Visibilité effective de chaque section (valeurs par défaut complétées). */
    public function sectionVisibility(): array
    {
        return array_merge(ProfileSection::defaults(), array_map('boolval', $this->public_sections ?? []));
    }

    public function sectionIsPublic(ProfileSection $section): bool
    {
        return $this->sectionVisibility()[$section->value] ?? true;
    }

    // ---------------------------------------------------------------- Portées

    /**
     * Profils publics : comptes approuvés qui enseignent. Un administrateur qui est aussi
     * enseignant (teaches = true) y figure, sans que son rôle soit jamais exposé.
     */
    public function scopePublicTeachers(Builder $query): Builder
    {
        return $query->whereIn('role', [self::ROLE_TEACHER, self::ROLE_ADMIN])
            ->where('status', UserStatus::Approved->value)
            ->where('teaches', true)
            ->whereNotNull('slug');
    }

    /**
     * Filtre « école supérieure » : compte rattaché à l'école de la liste,
     * ou dont l'école saisie librement contient son nom.
     */
    public function scopeInSchool(Builder $query, Faculty $school): Builder
    {
        $operator = $query->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

        return $query->where(fn (Builder $q) => $q
            ->where('faculty_id', $school->id)
            ->orWhere('school', $operator, '%'.$school->name.'%'));
    }

    // ---------------------------------------------------------------- Relations

    /** Grade de l'enseignant (table historique « ranks »). */
    public function rank(): BelongsTo
    {
        return $this->belongsTo(Rank::class);
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function departmentRef(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /** Publications publiées (utilisé pour les compteurs publics). */
    public function publishedPosts(): HasMany
    {
        return $this->hasMany(Post::class)->where('status', 'published');
    }

    public function profileItems(): HasMany
    {
        return $this->hasMany(ProfileItem::class)->orderBy('position')->orderBy('id');
    }

    public function inAppNotifications(): HasMany
    {
        return $this->hasMany(InAppNotification::class);
    }

    public function slugHistory(): HasMany
    {
        return $this->hasMany(ProfileSlugHistory::class);
    }

    public function registrationRequest(): HasOne
    {
        return $this->hasOne(RegistrationRequest::class)->latestOfMany();
    }

    public function sentConnections(): HasMany
    {
        return $this->hasMany(Connection::class, 'requester_id');
    }

    public function receivedConnections(): HasMany
    {
        return $this->hasMany(Connection::class, 'addressee_id');
    }
}
