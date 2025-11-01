<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ride_id',
        'user_id',
        'seats_booked',
        'total_price',
        'payment_method',
        'payment_status',
        'status',
        'pickup_location',
        'dropoff_location',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'seats_booked' => 'integer',
            'total_price' => 'decimal:2',
        ];
    }

    /**
     * Relationships
     */

    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }

    public function passenger()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Scopes
     */

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Check if booking is confirmed
     */
    public function isConfirmed()
    {
        return $this->status === 'confirmed';
    }

    /**
     * Check if payment is completed
     */
    public function isPaid()
    {
        return $this->payment_status === 'paid';
    }

    /**
     * Cancel booking
     */
    public function cancel()
    {
        $this->status = 'cancelled';
        $this->save();
    }

    /**
     * Confirm booking
     */
    public function confirm()
    {
        $this->status = 'confirmed';
        $this->save();
    }
}
