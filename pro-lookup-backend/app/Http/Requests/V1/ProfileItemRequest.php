<?php

namespace App\Http\Requests\V1;

use App\Enums\ProfileSection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Élément de profil : diplôme, expérience, cours, axe de recherche, publication scientifique, distinction, langue. */
class ProfileItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'section' => [$this->isMethod('post') ? 'required' : 'sometimes', Rule::in(ProfileSection::itemSections())],
            'title' => ['required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'organization' => ['nullable', 'string', 'max:255'],
            'period' => ['nullable', 'string', 'max:60'],
            'description' => ['nullable', 'string', 'max:2000'],
            'url' => ['nullable', 'string', 'max:500'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
