<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'model',
        'color',
        'year',
        'number_plate',
        'registration_number',
        'is_verified',
        'verification_document',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function rides()
    {
        return $this->hasMany(Ride::class, 'vehicle_id');
    }
}
