<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostCategory extends Model
{
    protected $fillable = ['name', 'slug', 'position', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'position' => 'integer'];
    }
}
