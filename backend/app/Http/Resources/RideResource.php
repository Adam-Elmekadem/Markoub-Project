<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;

class RideResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            // include driver_id explicitly for clients that compare user.id === driver_id
            'driver_id' => $this->driver_id,
            'driver' => new UserResource($this->whenLoaded('driver')),
            'from_location' => $this->from_location,
            'to_location' => $this->to_location,
            'from_latitude' => $this->from_latitude,
            'from_longitude' => $this->from_longitude,
            'to_latitude' => $this->to_latitude,
            'to_longitude' => $this->to_longitude,
            'ride_date' => $this->ride_date?->format('Y-m-d'),
            'ride_time' => $this->ride_time,
            'ride_type' => $this->ride_type,
            // Prefer an explicitly linked vehicle, fall back to the driver's first vehicle when available.
            'vehicle' => new VehicleResource(
                $this->when(
                    true,
                    // If vehicle relation is loaded or exists, use it; otherwise try to resolve by driver
                    $this->vehicle ?? (
                        // If driver relation is loaded and vehicles are eager, use first
                        ($this->relationLoaded('driver') && isset($this->driver->vehicles) && count($this->driver->vehicles) ? $this->driver->vehicles->first() : (
                            // Last resort: query the DB for a vehicle owned by the driver
                            ($this->driver_id ? \App\Models\Vehicle::where('user_id', $this->driver_id)->orderByDesc('is_verified')->first() : null)
                        ))
                    )
                )
            ),
            'seats_available' => $this->seats_available,
            'remaining_seats' => $this->remaining_seats,
            'price_per_seat' => (float) $this->price_per_seat,
            // Seats metadata
            'seats_remaining' => $this->seats_available,
            'seats_taken' => $this->whenLoaded('bookings')
                ? collect($this->bookings)->where('status', '!=', 'cancelled')->sum('seats_booked')
                : $this->bookings()->where('status', '!=', 'cancelled')->sum('seats_booked'),
            'seats_offered' => (
                ($this->seats_available ?? 0) + (
                    $this->whenLoaded('bookings')
                        ? collect($this->bookings)->where('status', '!=', 'cancelled')->sum('seats_booked')
                        : $this->bookings()->where('status', '!=', 'cancelled')->sum('seats_booked')
                )
            ),
            'allow_smoking' => $this->allow_smoking,
            'allow_pets' => $this->allow_pets,
            'allow_music' => $this->allow_music,
            'distance' => (float) $this->distance,
            'status' => $this->status,
            'bookings' => BookingResource::collection($this->whenLoaded('bookings')),
            'comments' => CommentResource::collection($this->whenLoaded('comments')),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
