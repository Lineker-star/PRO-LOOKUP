<?php

namespace App\Http\Requests\V1;

use App\Models\Department;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Modification de son profil par l'enseignant. Le grade, le rôle, le statut,
 * le matricule et l'identifiant d'URL ne sont pas modifiables ici.
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
            'faculty_id' => ['sometimes', 'nullable', 'integer', Rule::exists('faculties', 'id')->where('is_active', true)],
            'department_id' => ['sometimes', 'nullable', 'integer', Rule::exists('departments', 'id')->where('is_active', true)],
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

    public function after(): array
    {
        return [function (Validator $validator) {
            if (! $this->filled('department_id')) {
                return;
            }
            $facultyId = $this->input('faculty_id', $this->user()->faculty_id);
            $department = Department::find($this->input('department_id'));
            if ($department && (int) $department->faculty_id !== (int) $facultyId) {
                $validator->errors()->add('department_id', 'Ce département n’appartient pas à la faculté choisie.');
            }
        }];
    }
}
