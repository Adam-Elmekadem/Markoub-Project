<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\VehicleResource;

class ProfileResource extends JsonResource
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
            'phone' => $this->phone,
            'city' => $this->city,
            'bio' => $this->bio,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'gender' => $this->gender,
            'driver_license_number' => $this->driver_license_number,
            'vehicle_model' => $this->vehicle_model,
            'vehicle_color' => $this->vehicle_color,
            'vehicle_year' => $this->vehicle_year,
            'vehicle_number_plate' => $this->vehicle_number_plate,
            'vehicle_info' => $this->vehicle_info,
            'profile_picture' => $this->profile_picture,
            'is_driver_verified' => $this->is_driver_verified,
            'is_complete' => $this->isComplete(),
            'is_verified_driver' => $this->isVerifiedDriver(),
            // Ratings: include summary only if the user has offered rides before.
            // If they offered rides but have no ratings yet, return average=0 and count=0
            'ratings' => (function () {
                try {
                    $user = $this->whenLoaded('user') ? $this->user : ($this->user ?? null);
                    if (!$user) return null;
                    $hasOffers = $user->offeredRides()->exists();
                    if (!$hasOffers) return null;
                    $count = \App\Models\Rating::where('reviewee_id', $user->id)->count();
                    $avg = $count ? round((float) \App\Models\Rating::where('reviewee_id', $user->id)->avg('rating'), 2) : 0;
                    return ['average' => $avg, 'count' => $count];
                } catch (\Throwable $e) {
                    return null;
                }
            })(),
            // Include the user's vehicles (if available). The controller should eager-load
            // the `user` relation with `vehicles` to avoid N+1. We still guard here so the
            // resource won't fail if no user or vehicles are present.
            'vehicles' => VehicleResource::collection(
                $this->whenLoaded('user') ? $this->user->vehicles : ($this->user?->vehicles ?? [])
            ),
        ];
    }
}
