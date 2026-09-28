<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * - L'enseignant saisit librement son école supérieure (`school`) et son département / filière
 *   (colonne existante `department`). La table `faculties` devient la liste des écoles supérieures
 *   gérée par l'administration (suggestions et filtres).
 * - `teaches` : un administrateur peut aussi être enseignant et avoir un profil public.
 */
return new class extends Migration
{
    /** Anciennes « facultés » provisoires → écoles supérieures provisoires. */
    private const RENAMES = [
        'faculte-des-sciences-et-technologies' => 'École Supérieure des Sciences et Technologies',
        'faculte-des-sciences-de-lingenieur' => 'École Supérieure des Sciences de l’Ingénieur',
        'faculte-des-sciences-economiques-et-de-gestion' => 'École Supérieure des Sciences Économiques et de Gestion',
        'faculte-des-lettres-et-sciences-humaines' => 'École Supérieure des Lettres et Sciences Humaines',
    ];

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('school')->nullable();
            $table->boolean('teaches')->default(true);
        });

        // Un administrateur existant n'a pas de profil public tant qu'il ne l'active pas.
        DB::table('users')->where('role', 'admin')->update(['teaches' => false]);

        foreach (self::RENAMES as $oldSlug => $name) {
            $newSlug = Str::slug(Str::ascii($name));
            if (! DB::table('faculties')->where('slug', $newSlug)->exists()) {
                DB::table('faculties')->where('slug', $oldSlug)->update(['name' => $name, 'slug' => $newSlug]);
            }
        }

        // L'école et le département deviennent du texte libre : on recopie les valeurs existantes.
        $faculties = DB::table('faculties')->pluck('name', 'id');
        $departments = DB::table('departments')->pluck('name', 'id');
        DB::table('users')->select(['id', 'faculty_id', 'department_id', 'department', 'school'])->orderBy('id')
            ->each(function (object $user) use ($faculties, $departments) {
                $changes = [];
                if (! $user->school && $user->faculty_id && isset($faculties[$user->faculty_id])) {
                    $changes['school'] = $faculties[$user->faculty_id];
                }
                if (! $user->department && $user->department_id && isset($departments[$user->department_id])) {
                    $changes['department'] = $departments[$user->department_id];
                }
                if ($changes) {
                    DB::table('users')->where('id', $user->id)->update($changes);
                }
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['school', 'teaches']);
        });
    }
};
