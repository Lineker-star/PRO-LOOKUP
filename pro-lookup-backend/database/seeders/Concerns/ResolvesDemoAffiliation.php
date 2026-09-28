<?php

namespace Database\Seeders\Concerns;

use App\Models\Faculty;

/**
 * École supérieure et département / filière des comptes de démonstration.
 * Les deux sont du texte libre (saisi par l'enseignant) ; le lien à la liste des écoles
 * supérieures est retrouvé par le nom, comme à l'inscription.
 */
trait ResolvesDemoAffiliation
{
    private const DEMO_DEPARTMENTS = [
        'informatique' => ['École Supérieure des Sciences et Technologies', 'Informatique'],
        'mathematiques' => ['École Supérieure des Sciences et Technologies', 'Mathématiques'],
        'physique' => ['École Supérieure des Sciences et Technologies', 'Physique'],
        'chimie' => ['École Supérieure des Sciences et Technologies', 'Chimie'],
        'biologie' => ['École Supérieure des Sciences et Technologies', 'Biologie'],
        'genie-civil' => ['École Supérieure des Sciences de l’Ingénieur', 'Génie civil'],
        'genie-electrique-et-energetique' => ['École Supérieure des Sciences de l’Ingénieur', 'Génie électrique et énergétique'],
        'economie' => ['École Supérieure des Sciences Économiques et de Gestion', 'Économie'],
        'gestion-et-comptabilite' => ['École Supérieure des Sciences Économiques et de Gestion', 'Gestion et comptabilité'],
        'langues-et-litteratures' => ['École Supérieure des Lettres et Sciences Humaines', 'Langues et littératures'],
        'histoire-et-geographie' => ['École Supérieure des Lettres et Sciences Humaines', 'Histoire et géographie'],
        'sciences-de-leducation' => ['École Supérieure des Lettres et Sciences Humaines', 'Sciences de l’éducation'],
    ];

    /** @return array{school: string|null, faculty_id: int|null, department: string|null} */
    private function affiliation(string $key): array
    {
        [$school, $department] = self::DEMO_DEPARTMENTS[$key] ?? [null, null];

        return ['school' => $school, 'faculty_id' => Faculty::idForName($school), 'department' => $department];
    }
}
