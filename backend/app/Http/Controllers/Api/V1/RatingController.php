<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Rating;
use App\Http\Resources\ProfileResource;

class RatingController extends Controller
{
    /**
     * Store a new rating for a booking/ride.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'booking_id' => 'required|integer|exists:bookings,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        $booking = Booking::with('ride')->find($data['booking_id']);
        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        // Ensure the authenticated user is the passenger who made the booking
        if ($booking->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized to rate this booking'], 403);
        }

        $ride = $booking->ride;
        if (!$ride) {
            return response()->json(['message' => 'Ride not found for booking'], 404);
        }

        // Prevent rating if reviewer is the same as driver
        if ($ride->driver_id === $user->id) {
            return response()->json(['message' => 'Cannot rate yourself'], 400);
        }

        // Only allow rating after the driver marked the ride as completed
        // Accept multiple synonyms used across the codebase (e.g. 'done', 'completed', 'finished')
        $rideStatus = strtolower((string) ($ride->status ?? ''));
        $completedStates = ['done', 'completed', 'finished'];
        if (!in_array($rideStatus, $completedStates, true)) {
            return response()->json(['message' => 'Ride is not completed yet. You can rate only after the driver marks the ride as completed.'], 400);
        }

        // Prevent duplicate rating for the same booking by this reviewer
        $exists = Rating::where('booking_id', $booking->id)->where('reviewer_id', $user->id)->exists();
        if ($exists) {
            return response()->json(['message' => 'You already rated this booking'], 400);
        }

        $rating = Rating::create([
            'ride_id' => $ride->id,
            'booking_id' => $booking->id,
            'reviewer_id' => $user->id,
            'reviewee_id' => $ride->driver_id,
            'rating' => (int)$data['rating'],
            'comment' => $data['comment'] ?? null,
        ]);

        // Optionally return updated profile summary for the reviewee
        $reviewee = $rating->reviewee()->first();
        $ratingSummary = [
            'average' => round((float) Rating::where('reviewee_id', $reviewee->id)->avg('rating'), 2),
            'count' => Rating::where('reviewee_id', $reviewee->id)->count(),
        ];

        return response()->json(['data' => $rating, 'reviewee_rating' => $ratingSummary], 201);
    }
}
