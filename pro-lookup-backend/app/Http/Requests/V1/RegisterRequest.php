<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/** Inscription d'un enseignant (brief §5.1). */
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'school' => trim((string) $this->input('school')),
            'department' => trim((string) $this->input('department')),
        ]);
    }

    public function rules(): array
    {
        return [
            // 1. Compte
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            // 2. Rattachement : école supérieure et département / filière saisis librement
            'school' => ['required', 'string', 'max:150'],
            'department' => ['required', 'string', 'max:150'],
            'grade_id' => ['required', 'integer', Rule::exists('ranks', 'id')->where('is_active', true)],
            'matricule' => ['required', 'string', 'max:50'],
            'document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            // 3. Profil de base
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'title' => ['nullable', 'string', 'max:150'],
            'expertise' => ['nullable', 'string', 'max:150'],
            // 4. Récapitulatif
            'accept_terms' => ['accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Un compte existe déjà avec cette adresse email.',
            'school.required' => 'Indiquez l’école supérieure où vous enseignez.',
            'department.required' => 'Indiquez votre département ou votre filière.',
            'document.required' => 'Le justificatif est obligatoire.',
            'document.mimes' => 'Le justificatif doit être un PDF ou une image (JPG, PNG).',
            'document.max' => 'Le justificatif ne doit pas dépasser 5 Mo.',
            'accept_terms.accepted' => 'Vous devez accepter les conditions d’utilisation et la politique de confidentialité.',
            'password.confirmed' => 'Les deux mots de passe ne correspondent pas.',
        ];
    }
}
