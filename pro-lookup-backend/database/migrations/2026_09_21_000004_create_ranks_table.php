<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('ranks')) {
            Schema::create('ranks', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->unsignedInteger('order')->default(0);
                $table->string('badge_color')->nullable();
                $table->timestamps();
            });
        }

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'rank_id')) {
                $table->unsignedBigInteger('rank_id')->nullable();
            }
            $table->foreign('rank_id')->references('id')->on('ranks')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['rank_id']);
        });

        Schema::dropIfExists('ranks');
    }
};