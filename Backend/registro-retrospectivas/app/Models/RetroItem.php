<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RetroItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sprint_id',
        'categoria',
        'descripcion',
        'cumplida',
        'fecha_revision'
    ];

    public function sprint()
    {
        return $this->belongsTo(Sprint::class);
    }
}