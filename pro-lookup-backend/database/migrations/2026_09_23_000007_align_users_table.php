<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name')->nullable();
            }
            if (! Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name')->nullable();
            }
            if (! Schema::hasColumn('users', 'avatar_path')) {
                $table->string('avatar_path')->nullable();
            }
            if (! Schema::hasColumn('users', 'bio')) {
                $table->text('bio')->nullable();
            }
            if (! Schema::hasColumn('users', 'department')) {
                $table->string('department')->nullable();
            }
            if (! Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('member');
            }
            if (! Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('pending');
            }
            if (! Schema::hasColumn('users', 'slug')) {
                $table->string('slug')->nullable()->unique();
            }
            if (! Schema::hasColumn('users', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable();
            }
            if (! Schema::hasColumn('users', 'approved_at')) {
                $table->timestamp('approved_at')->nullable();
            }
            if (! Schema::hasColumn('users', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable();
            }
        });

        if (Schema::hasColumn('users', 'name')) {
            DB::table('users')->whereNull('first_name')->get(['id', 'name'])->each(function (object $user): void {
                $parts = preg_split('/\s+/', trim((string) $user->name), 2);
                DB::table('users')->where('id', $user->id)->update([
                    'first_name' => $parts[0] ?? 'Membre',
                    'last_name' => $parts[1] ?? 'ZTF',
                ]);
            });
        }

        DB::table('users')->whereNull('first_name')->update(['first_name' => 'Membre']);
        DB::table('users')->whereNull('last_name')->update(['last_name' => 'ZTF']);

        // information_schema n'existe que sous PostgreSQL : sur SQLite (tests), la clé étrangère
        // est déjà créée par la migration initiale, il n'y a donc rien à rattraper.
        if (DB::getDriverName() === 'pgsql'
            && Schema::hasColumn('users', 'approved_by')
            && ! $this->foreignKeyExists('users', 'users_approved_by_foreign')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        // Compatibility columns are intentionally retained on rollback to avoid data loss.
    }

    private function foreignKeyExists(string $table, string $constraint): bool
    {
        return DB::table('information_schema.table_constraints')
            ->where('constraint_schema', DB::raw('current_schema()'))
            ->where('table_name', $table)
            ->where('constraint_name', $constraint)
            ->exists();
    }
};
