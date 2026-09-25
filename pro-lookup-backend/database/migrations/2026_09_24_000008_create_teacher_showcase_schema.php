<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Modèle de données de la « vitrine des enseignants » (brief §11).
 *
 * Migration purement additive : les tables de l'ancien modèle « réseau social »
 * (connections, likes, comments, notifications) sont conservées mais ne sont plus
 * exposées par l'API v1 (voir DECISIONS.md).
 */
return new class extends Migration
{
    public function up(): void
    {
        // Référentiels gérés par l'administrateur.
        Schema::create('faculties', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained('faculties')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['faculty_id', 'slug']);
        });

        Schema::create('post_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // La table « ranks » existante sert de table des grades.
        Schema::table('ranks', function (Blueprint $table) {
            $table->boolean('is_active')->default(true);
        });

        // Champs du profil enseignant (brief §6.1) et réglages de visibilité (§6.6).
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'email_verified_at')) {
                $table->timestamp('email_verified_at')->nullable();
            }
            $table->string('title')->nullable();              // titre professionnel
            $table->string('expertise')->nullable();          // domaine d'expertise principal
            $table->json('expertise_tags')->nullable();       // spécialités
            $table->foreignId('faculty_id')->nullable()->constrained('faculties')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('banner_path')->nullable();
            $table->string('matricule')->nullable();
            $table->string('phone')->nullable();
            $table->string('office')->nullable();
            $table->json('links')->nullable();                // ORCID, Scholar, ResearchGate, LinkedIn, site
            $table->boolean('show_email')->default(false);
            $table->boolean('show_phone')->default(false);
            $table->boolean('show_office')->default(false);
            $table->json('public_sections')->nullable();      // section => visible (bool)
            $table->boolean('search_indexable')->default(true);
            $table->text('suspension_reason')->nullable();
            $table->timestamp('suspended_at')->nullable();
        });

        // Sections répétables du profil : diplômes, expériences, cours, axes de recherche,
        // publications scientifiques, distinctions, langues.
        Schema::create('profile_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('section', 40);
            $table->string('title');
            $table->string('organization')->nullable();   // établissement, revue, organisme, niveau…
            $table->string('period')->nullable();         // année ou période libre (« 2019 — 2023 »)
            $table->text('description')->nullable();
            $table->string('url')->nullable();            // lien ou DOI
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->index(['user_id', 'section']);
        });

        // Historique des identifiants de profil : redirections 301 et limite de changements.
        Schema::create('profile_slug_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('by_admin')->default(false);
            $table->timestamps();
        });

        Schema::create('registration_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('matricule');
            $table->string('document_path')->nullable();   // disque privé
            $table->string('document_name')->nullable();
            $table->string('document_mime')->nullable();
            $table->string('status', 20)->default('pending');
            $table->text('reason')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->index('status');
        });

        // Publications : titre, catégorie, statut brouillon / publiée / masquée.
        Schema::table('posts', function (Blueprint $table) {
            $table->string('title')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('post_categories')->nullOnDelete();
            $table->string('status', 20)->default('published');
            $table->text('hidden_reason')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('edited_at')->nullable();
            $table->index(['status', 'published_at']);
        });
        DB::table('posts')->whereNull('published_at')->update(['published_at' => DB::raw('created_at')]);

        Schema::create('post_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
            $table->string('type', 10);                   // image | pdf | link
            $table->string('path')->nullable();
            $table->string('url')->nullable();
            $table->string('alt')->nullable();
            $table->string('original_name')->nullable();
            $table->unsignedInteger('size')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('target_type', 20);            // post | profile
            $table->unsignedBigInteger('target_id');
            $table->string('reason', 60);
            $table->text('comment')->nullable();
            $table->string('email')->nullable();
            $table->string('ip_hash', 64)->nullable();
            $table->string('status', 20)->default('open'); // open | dismissed | actioned
            $table->string('resolution')->nullable();
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('handled_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
            $table->index(['target_type', 'target_id']);
        });

        Schema::create('admin_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 60);
            $table->string('target_type', 30)->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->string('target_label')->nullable();
            $table->text('reason')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['target_type', 'target_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_audit_logs');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('post_media');
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex(['status', 'published_at']);
            $table->dropConstrainedForeignId('category_id');
            $table->dropColumn(['title', 'status', 'hidden_reason', 'published_at', 'edited_at']);
        });
        Schema::dropIfExists('registration_requests');
        Schema::dropIfExists('profile_slug_histories');
        Schema::dropIfExists('profile_items');
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('faculty_id');
            $table->dropConstrainedForeignId('department_id');
            $table->dropColumn([
                'title', 'expertise', 'expertise_tags', 'banner_path', 'matricule', 'phone', 'office',
                'links', 'show_email', 'show_phone', 'show_office', 'public_sections', 'search_indexable',
                'suspension_reason', 'suspended_at',
            ]);
        });
        Schema::table('ranks', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
        Schema::dropIfExists('post_categories');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('faculties');
    }
};
