<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
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
            'ride' => new RideResource($this->whenLoaded('ride')),
            'passenger' => new UserResource($this->whenLoaded('passenger')),
            'seats_booked' => $this->seats_booked,
            'total_price' => (float) $this->total_price,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'status' => $this->status,
            'pickup_location' => $this->pickup_location,
            'dropoff_location' => $this->dropoff_location,
            'notes' => $this->notes,
            'is_confirmed' => $this->isConfirmed(),
            'is_paid' => $this->isPaid(),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
