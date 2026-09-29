<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Faculty;
use App\Models\ProfileItem;
use App\Models\User;
use App\Services\ImageStore;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Logique de mise à jour d'un profil enseignant, partagée entre l'enseignant lui-même
 * (MeController, sur son propre compte) et l'administration (Admin\UserController,
 * sur le compte d'un enseignant — DECISIONS.md, point 11 ter révisé).
 */
trait ManagesTeacherProfile
{
    /** Normalise et applique les champs de profil (grade, école, liens, mots-clés) puis enregistre. */
    private function applyProfileFields(User $user, array $data): void
    {
        if (array_key_exists('links', $data)) {
            $data['links'] = array_intersect_key($data['links'] ?? [], array_flip(['orcid', 'google_scholar', 'researchgate', 'linkedin', 'website']));
        }
        if (array_key_exists('expertise_tags', $data)) {
            $data['expertise_tags'] = array_values(array_unique(array_filter(array_map('trim', $data['expertise_tags']))));
        }
        if (array_key_exists('grade_id', $data)) {
            $data['rank_id'] = $data['grade_id'];
            unset($data['grade_id']);
        }
        if (array_key_exists('school', $data)) {
            $data['school'] = trim($data['school']);
            $data['faculty_id'] = Faculty::idForName($data['school']);
        }
        if (array_key_exists('department', $data)) {
            $data['department'] = trim($data['department']);
        }

        $user->fill($data);
        $user->save();
    }

    /** Photo de profil ou bannière (image ré-encodée, sans métadonnées). */
    private function storeTeacherImage(User $user, ImageStore $images, UploadedFile $file, string $kind): void
    {
        $column = $kind === 'avatar' ? 'avatar_path' : 'banner_path';
        $images->delete($user->{$column});
        $user->{$column} = $images->store($file, $kind === 'avatar' ? 'avatars' : 'banners', $kind === 'avatar' ? 800 : 1800);
        $user->save();
    }

    private function removeTeacherImage(User $user, ImageStore $images, string $kind): void
    {
        $column = $kind === 'avatar' ? 'avatar_path' : 'banner_path';
        $images->delete($user->{$column});
        $user->{$column} = null;
        $user->save();
    }

    /** Dépôt du CV : PDF uniquement, vérifié sur sa signature « %PDF ». Rangé sur le disque privé. */
    private function storeTeacherCv(User $user, UploadedFile $file): void
    {
        $handle = fopen($file->getRealPath(), 'rb');
        $signature = $handle ? fread($handle, 5) : '';
        if ($handle) {
            fclose($handle);
        }
        if ($signature !== '%PDF-') {
            throw ValidationException::withMessages(['cv' => 'Ce fichier n’est pas un PDF valide.']);
        }

        $old = $user->cv_path;
        $user->cv_path = $file->storeAs('cvs', Str::uuid().'.pdf', 'local');
        $user->cv_name = Str::limit($file->getClientOriginalName(), 180, '');
        $user->cv_size = $file->getSize();
        $user->cv_updated_at = now();
        $user->save();
        if ($old) {
            Storage::disk('local')->delete($old);
        }
    }

    private function removeTeacherCv(User $user): void
    {
        if ($user->cv_path) {
            Storage::disk('local')->delete($user->cv_path);
        }
        $user->forceFill(['cv_path' => null, 'cv_name' => null, 'cv_size' => null, 'cv_updated_at' => null])->save();
    }

    /** Ajoute un élément de profil (diplôme, publication scientifique…) à la position suivante. */
    private function addTeacherProfileItem(User $user, array $data): ProfileItem
    {
        $data['position'] ??= (int) $user->profileItems()->where('section', $data['section'])->max('position') + 1;

        return $user->profileItems()->create($data);
    }
}
