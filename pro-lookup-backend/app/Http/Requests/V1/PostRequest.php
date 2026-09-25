<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Création ou modification d'une publication (brief §7.2). */
class PostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['nullable', 'string', 'max:200'],
            'content' => ['required', 'string', 'max:20000'],
            'category_id' => ['required', 'integer', Rule::exists('post_categories', 'id')->where('is_active', true)],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'link_url' => ['nullable', 'url', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'content.required' => 'Le texte de la publication est obligatoire.',
            'category_id.required' => 'Choisissez une catégorie.',
        ];
    }
}
