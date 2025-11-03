<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Ride;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class BookingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Return bookings for authenticated user (passenger)
        $bookings = Booking::with(['ride.driver.profile', 'ride.vehicle', 'passenger.profile', 'passenger.vehicles'])
            ->where('user_id', auth('api')->id())
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => \App\Http\Resources\BookingResource::collection($bookings),
            'meta' => [
                'total' => $bookings->total(),
                'per_page' => $bookings->perPage(),
                'current_page' => $bookings->currentPage(),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'ride_id' => 'required|integer|exists:rides,id',
            'seats_booked' => 'required|integer|min:1',
            'pickup_location' => 'nullable|string|max:255',
            'dropoff_location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500',
            'payment_method' => 'nullable|string',
        ]);

        $userId = auth('api')->id();

        return DB::transaction(function () use ($data, $userId) {
            $ride = Ride::lockForUpdate()->findOrFail($data['ride_id']);

            // Prevent a driver from booking their own ride
            if ($ride->driver_id === $userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot reserve your own ride',
                ], 403);
            }

            if ($ride->seats_available < $data['seats_booked']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not enough seats available',
                ], 422);
            }

            // Create booking (pending by default) and reserve seats immediately
            $booking = Booking::create([
                'ride_id' => $data['ride_id'],
                'user_id' => $userId,
                'seats_booked' => $data['seats_booked'],
                'total_price' => ($data['seats_booked'] * $ride->price_per_seat),
                'payment_method' => $data['payment_method'] ?? null,
                'payment_status' => 'pending',
                'status' => 'pending',
                'pickup_location' => $data['pickup_location'] ?? null,
                'dropoff_location' => $data['dropoff_location'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            // Reserve seats in the ride immediately so DB reflects reservations
            $ride->seats_available -= $data['seats_booked'];
            if ($ride->seats_available < 0) {
                // Shouldn't happen because we checked earlier, but guard anyway
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Not enough seats available',
                ], 422);
            }
            $ride->save();

            return response()->json([
                'success' => true,
                'message' => 'Booking created',
                'data' => new \App\Http\Resources\BookingResource($booking->load('ride.driver.profile','ride.vehicle','passenger.profile','passenger.vehicles')),
            ], 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
    $booking = Booking::with(['ride.driver.profile','ride.vehicle', 'passenger.profile', 'passenger.vehicles'])->findOrFail($id);
        // Ensure user owns the booking or is driver of the ride
        $userId = auth('api')->id();
        if ($booking->user_id !== $userId && $booking->ride->driver_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

    return response()->json(['success' => true, 'data' => new \App\Http\Resources\BookingResource($booking)]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $booking = Booking::findOrFail($id);
        $userId = auth('api')->id();
        if ($booking->user_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'seats_booked' => 'sometimes|integer|min:1',
            'pickup_location' => 'nullable|string|max:255',
            'dropoff_location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        // If changing seats, always adjust ride availability because seats were reserved on creation
        if (isset($data['seats_booked'])) {
            $ride = Ride::lockForUpdate()->findOrFail($booking->ride_id);
            $diff = $data['seats_booked'] - $booking->seats_booked; // positive => need more seats
            if ($diff > 0 && $ride->seats_available < $diff) {
                return response()->json(['success' => false, 'message' => 'Not enough seats available'], 422);
            }

            if ($diff !== 0) {
                // Decrease available seats when increasing reservation, increase when decreasing
                $ride->seats_available -= $diff;
                $ride->save();
            }
        }

        $booking->update($data);

    return response()->json(['success' => true, 'message' => 'Booking updated', 'data' => new \App\Http\Resources\BookingResource($booking->load('ride.driver.profile','ride.vehicle','passenger.profile','passenger.vehicles'))]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $booking = Booking::findOrFail($id);
        $userId = auth('api')->id();
        if ($booking->user_id !== $userId && $booking->ride->driver_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return DB::transaction(function () use ($booking) {
            // Release seats if this booking was not already cancelled/deleted
            if (($booking->status ?? '') !== 'cancelled') {
                $ride = Ride::lockForUpdate()->findOrFail($booking->ride_id);
                $ride->seats_available += $booking->seats_booked;
                $ride->save();
            }

            $booking->delete();

            return response()->json(['success' => true, 'message' => 'Booking deleted']);
        });
    }

    // Confirm booking (driver or admin)
    public function confirm(string $id): JsonResponse
    {
        $booking = Booking::with('ride')->findOrFail($id);
        $userId = auth('api')->id();
        // Two-step confirmation flow:
        // - Passenger can 'confirm' their attendance which will mark booking as 'passenger_confirmed'
        // - Driver (or admin) can fully confirm the booking (mark 'confirmed')

        // If the current user is the passenger -> mark as passenger_confirmed
        if ($booking->user_id === $userId) {
            return DB::transaction(function () use ($booking) {
                $booking->status = 'passenger_confirmed';
                $booking->save();

                return response()->json(['success' => true, 'message' => 'Booking confirmed by passenger (awaiting driver)', 'data' => $booking]);
            });
        }

        // Otherwise only the driver of the ride or admin can fully confirm
        if ($booking->ride->driver_id !== $userId && auth('api')->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Seats were reserved at booking creation, so here we only mark the booking confirmed
        return DB::transaction(function () use ($booking) {
            $booking->confirm();
            $booking->payment_status = 'paid';
            $booking->save();

            return response()->json(['success' => true, 'message' => 'Booking confirmed', 'data' => $booking]);
        });
    }

    // Cancel booking (passenger or driver)
    public function cancel(string $id): JsonResponse
    {
        $booking = Booking::with('ride')->findOrFail($id);
        $userId = auth('api')->id();

        if ($booking->user_id !== $userId && $booking->ride->driver_id !== $userId && auth('api')->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return DB::transaction(function () use ($booking) {
            // If not already cancelled, release reserved seats
            if (($booking->status ?? '') !== 'cancelled') {
                $ride = Ride::lockForUpdate()->findOrFail($booking->ride_id);
                $ride->seats_available += $booking->seats_booked;
                $ride->save();
            }

            $booking->cancel();

            return response()->json(['success' => true, 'message' => 'Booking cancelled', 'data' => $booking]);
        });
    }
}
