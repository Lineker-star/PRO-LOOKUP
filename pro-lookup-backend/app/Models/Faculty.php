<?php

namespace App\Models;

use App\Support\Names;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * École supérieure de la liste gérée par l'administration (table historique « faculties »).
 * Sert de suggestions à la saisie et de filtre dans l'annuaire ; l'enseignant, lui, saisit
 * librement le nom de son école.
 */
class Faculty extends Model
{
    protected $fillable = ['name', 'slug', 'position', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'position' => 'integer'];
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class)->orderBy('name');
    }

    /** Identifiant de l'école de la liste dont le nom correspond (casse et apostrophes ignorées) au texte saisi. */
    public static function idForName(?string $name): ?int
    {
        if (Names::normalize($name) === '') {
            return null;
        }

        return static::query()->get(['id', 'name'])->first(fn (Faculty $f) => Names::same($f->name, $name))?->id;
    }
}
