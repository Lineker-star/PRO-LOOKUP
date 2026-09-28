<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CV de l'enseignant (PDF), déposé depuis son espace et téléchargeable sur son profil public.
 * Le fichier est rangé sur le disque PRIVÉ et servi par l'API, qui vérifie à chaque demande
 * que le profil est public et que la section « CV » n'est pas masquée.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('cv_path')->nullable();
            $table->string('cv_name')->nullable();
            $table->unsignedInteger('cv_size')->nullable();
            $table->timestamp('cv_updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['cv_path', 'cv_name', 'cv_size', 'cv_updated_at']);
        });
    }
};
