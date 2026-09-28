<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Modification de son profil par l'enseignant (ou par un administrateur qui enseigne).
 * L'administration ne modifie jamais le profil d'un enseignant : c'est donc l'enseignant
 * qui tient à jour son grade, son école supérieure et son département / filière.
 * Le rôle, le statut, le matricule et l'identifiant d'URL ne sont pas modifiables ici.
 */
class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'title' => ['sometimes', 'nullable', 'string', 'max:150'],
            'expertise' => ['sometimes', 'nullable', 'string', 'max:150'],
            'expertise_tags' => ['sometimes', 'array', 'max:20'],
            'expertise_tags.*' => ['string', 'max:60'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'grade_id' => ['sometimes', 'required', 'integer', Rule::exists('ranks', 'id')->where('is_active', true)],
            'school' => ['sometimes', 'required', 'string', 'max:150'],
            'department' => ['sometimes', 'required', 'string', 'max:150'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'office' => ['sometimes', 'nullable', 'string', 'max:150'],
            'links' => ['sometimes', 'array'],
            'links.orcid' => ['nullable', 'string', 'max:255'],
            'links.google_scholar' => ['nullable', 'url', 'max:255'],
            'links.researchgate' => ['nullable', 'url', 'max:255'],
            'links.linkedin' => ['nullable', 'url', 'max:255'],
            'links.website' => ['nullable', 'url', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'school.required' => 'Indiquez l’école supérieure où vous enseignez.',
            'department.required' => 'Indiquez votre département ou votre filière.',
        ];
    }
}
