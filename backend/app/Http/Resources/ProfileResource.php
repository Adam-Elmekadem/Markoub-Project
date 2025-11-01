<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
        ];
    }
}
