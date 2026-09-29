<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Auteur(s) d'une publication scientifique (citation), distinct de la revue/éditeur
 * déjà porté par `organization`. Utilisé quand l'administration ajoute une publication
 * pour le compte d'un enseignant (DECISIONS.md, point 11 sexies).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profile_items', function (Blueprint $table) {
            $table->string('author')->nullable()->after('organization');
        });
    }

    public function down(): void
    {
        Schema::table('profile_items', function (Blueprint $table) {
            $table->dropColumn('author');
        });
    }
};
