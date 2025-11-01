<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
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
            'user' => new UserResource($this->whenLoaded('user')),
            'ride' => new RideResource($this->whenLoaded('ride')),
            'rating' => $this->rating,
            'comment_text' => $this->comment_text,
            'is_approved' => $this->is_approved,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
