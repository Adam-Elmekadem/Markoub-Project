<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Vehicle;

class Ride extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'driver_id',
        'from_location',
        'to_location',
        'from_latitude',
        'from_longitude',
        'to_latitude',
        'to_longitude',
        'ride_date',
        'ride_time',
        'ride_type',
        'vehicle_id',
        
        'seats_available',
        'price_per_seat',
        'allow_smoking',
        'allow_pets',
        'allow_music',
        'distance',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'ride_date' => 'date',
            'price_per_seat' => 'decimal:2',
            'seats_available' => 'integer',
            'allow_smoking' => 'boolean',
            'allow_pets' => 'boolean',
            'allow_music' => 'boolean',
            'from_latitude' => 'decimal:8',
            'from_longitude' => 'decimal:8',
            'to_latitude' => 'decimal:8',
            'to_longitude' => 'decimal:8',
        ];
    }

    /**
     * Relationships
     */

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Scopes
     */

    public function scopeAvailable($query)
    {
        return $query->where('status', 'active')
                     ->where('seats_available', '>', 0)
                     ->whereDate('ride_date', '>=', today());
    }

    public function scopeUpcoming($query)
    {
        return $query->whereDate('ride_date', '>=', today())
                     ->orderBy('ride_date', 'asc')
                     ->orderBy('ride_time', 'asc');
    }

    /**
     * Calculate remaining seats
     */
    public function getRemainingSeatsAttribute()
    {
        $bookedSeats = $this->bookings()
                            ->where('status', 'confirmed')
                            ->sum('seats_booked');
        
        return $this->seats_available - $bookedSeats;
    }
}
