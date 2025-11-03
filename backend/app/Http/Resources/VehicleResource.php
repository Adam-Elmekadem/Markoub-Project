<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleResource extends JsonResource
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
            'user_id' => $this->user_id,
            'model' => $this->model,
            'color' => $this->color,
            'year' => $this->year,
            'number_plate' => $this->number_plate,
            'registration_number' => $this->registration_number,
            'is_verified' => (bool) $this->is_verified,
            'verification_document' => $this->verification_document,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
