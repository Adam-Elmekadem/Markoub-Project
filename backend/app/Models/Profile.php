<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'phone',
        'city',
        'bio',
        'date_of_birth',
        'gender',
        'driver_license_number',
        'vehicle_model',
        'vehicle_color',
        'vehicle_year',
        'vehicle_number_plate',
        'profile_picture',
        'is_driver_verified',
        'verification_document',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'is_driver_verified' => 'boolean',
        ];
    }

    /**
     * Relationships
     */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if user has complete profile
     */
    public function isComplete()
    {
        return !empty($this->phone) &&
               !empty($this->city) &&
               !empty($this->date_of_birth) &&
               !empty($this->gender);
    }

    /**
     * Check if user is verified as driver
     */
    public function isVerifiedDriver()
    {
        return $this->is_driver_verified &&
               !empty($this->driver_license_number) &&
               !empty($this->vehicle_model);
    }

    /**
     * Get full vehicle information
     */
    public function getVehicleInfoAttribute()
    {
        if (!$this->vehicle_model) {
            return null;
        }

        return sprintf(
            '%s %s (%s) - %s',
            $this->vehicle_year ?? '',
            $this->vehicle_model,
            $this->vehicle_color ?? 'N/A',
            $this->vehicle_number_plate ?? 'N/A'
        );
    }
}
