<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Faculty extends Model
{
    protected $fillable = ['name', 'slug', 'position', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'position' => 'integer'];
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class)->orderBy('name');
    }
}
