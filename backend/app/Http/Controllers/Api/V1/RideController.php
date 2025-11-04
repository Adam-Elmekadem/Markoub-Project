<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\RideResource;
use App\Models\Ride;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RideController extends Controller
{
    /**
     * Display a listing of available rides.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ride::with(['driver.profile', 'driver.vehicles', 'bookings.passenger.profile', 'vehicle'])
            ->available()
            ->upcoming();
        // Filter by location
        if ($request->filled('from')) {
            $query->where('from_location', 'like', '%' . $request->from . '%');
        }
        if ($request->filled('to')) {
            $query->where('to_location', 'like', '%' . $request->to . '%');
        }

        // Filter by date
        if ($request->filled('date')) {
            $query->whereDate('ride_date', $request->date);
        }

        // Filter by seats
        if ($request->filled('seats')) {
            $query->where('seats_available', '>=', (int) $request->seats);
        }

        // Filter by ride type (e.g., city-to-city, one-time, recurring)
        if ($request->filled('ride_type')) {
            $query->where('ride_type', $request->ride_type);
        }

        // Filter by vehicle model (use vehicles table)
        if ($request->filled('vehicle_model')) {
            $query->whereHas('vehicle', function ($q) use ($request) {
                $q->where('model', 'like', '%' . $request->vehicle_model . '%');
            });
        }

        // Filter by price range
        if ($request->filled('price_min')) {
            $query->where('price_per_seat', '>=', (float) $request->price_min);
        }
        if ($request->filled('price_max')) {
            $query->where('price_per_seat', '<=', (float) $request->price_max);
        }

        // Filter by boolean preferences
        if ($request->filled('allow_smoking')) {
            $query->where('allow_smoking', (bool) $request->allow_smoking);
        }
        if ($request->filled('allow_pets')) {
            $query->where('allow_pets', (bool) $request->allow_pets);
        }
        if ($request->filled('allow_music')) {
            $query->where('allow_music', (bool) $request->allow_music);
        }

        // Filter by driver gender (profile.gender)
        if ($request->filled('driver_gender')) {
            $query->whereHas('driver.profile', function ($q) use ($request) {
                $q->where('gender', $request->driver_gender);
            });
        }

        // Filter by ride time range (time_from, time_to in HH:MM)
        if ($request->filled('time_from')) {
            $query->whereTime('ride_time', '>=', $request->time_from);
        }
        if ($request->filled('time_to')) {
            $query->whereTime('ride_time', '<=', $request->time_to);
        }

        $rides = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data' => RideResource::collection($rides),
            'meta' => [
                'total' => $rides->total(),
                'per_page' => $rides->perPage(),
                'current_page' => $rides->currentPage(),
                'last_page' => $rides->lastPage(),
            ],
        ]);
    }

    /**
     * Store a newly created ride.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_location' => 'required|string|max:255',
            'to_location' => 'required|string|max:255',
            'from_latitude' => 'nullable|numeric',
            'from_longitude' => 'nullable|numeric',
            'to_latitude' => 'nullable|numeric',
            'to_longitude' => 'nullable|numeric',
            'ride_date' => 'required|date|after_or_equal:today',
            'ride_time' => 'required',
            'seats_available' => 'required|integer|min:1|max:8',
            'price_per_seat' => 'required|numeric|min:0',
            'vehicle_model' => 'nullable|string',
            'vehicle_number' => 'nullable|string',
            'allow_smoking' => 'boolean',
            'allow_pets' => 'boolean',
            'allow_music' => 'boolean',
        ]);

        // Extract vehicle-related inputs so we don't persist legacy flat fields on the rides table
        $vehicleModel = $request->input('vehicle_model');
        $vehicleNumber = $request->input('vehicle_number');
        $vehicleColor = $request->input('vehicle_color');
        $vehicleYear = $request->input('vehicle_year');

        // Remove vehicle_* from the data used to create the ride itself
        unset($validated['vehicle_model'], $validated['vehicle_number']);

        $driver = auth('api')->user();

        // Prevent drivers from offering a new ride if they already have non-completed offers
        $hasActiveOffers = \App\Models\Ride::where('driver_id', $driver->id)
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', '!=', 'done');
            })->exists();
        if ($hasActiveOffers) {
            return response()->json([
                'success' => false,
                'message' => 'You already have active or planned rides. Finish them before offering a new ride.',
            ], 403);
        }

        $validated['driver_id'] = $driver->id;
        $validated['status'] = 'active';

        $ride = Ride::create($validated);

        // Attempt to associate a Vehicle to the ride when possible (best-effort):
        try {
            $userId = auth('api')->id();
            if (!empty($vehicleNumber)) {
                $plate = $vehicleNumber;
                $veh = Vehicle::where('number_plate', $plate)->first();
                if (!$veh) {
                    $veh = Vehicle::create([
                        'user_id' => $userId,
                        'model' => $vehicleModel ?? null,
                        'color' => $vehicleColor ?? null,
                        'year' => $vehicleYear ?? null,
                        'number_plate' => $plate,
                        'is_verified' => 0,
                    ]);
                }
                if ($veh) {
                    $ride->vehicle_id = $veh->id;
                    $ride->save();
                }
            } else {
                // No plate provided; try to use driver's existing vehicles
                $firstVeh = Vehicle::where('user_id', $userId)->orderByDesc('is_verified')->first();
                if ($firstVeh) {
                    $ride->vehicle_id = $firstVeh->id;
                    $ride->save();
                }
            }
        } catch (\Throwable $e) {
            // Don't block ride creation for vehicle association failures; log and continue
            logger()->error('Failed to associate vehicle to ride: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Ride created successfully',
            'data' => new RideResource($ride->load('driver.profile')),
        ], 201);
    }

    /**
     * Display the specified ride.
     */
    public function show(string $id): JsonResponse
    {
    $ride = Ride::with(['driver.profile', 'driver.vehicles', 'bookings.passenger.profile', 'comments.user', 'vehicle'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new RideResource($ride),
        ]);
    }

    /**
     * Update the specified ride.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $ride = Ride::findOrFail($id);

        // Check if user is the driver
        if ($ride->driver_id !== auth('api')->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'from_location' => 'sometimes|string|max:255',
            'to_location' => 'sometimes|string|max:255',
            'ride_date' => 'sometimes|date|after_or_equal:today',
            'ride_time' => 'sometimes',
            'seats_available' => 'sometimes|integer|min:1|max:8',
            'price_per_seat' => 'sometimes|numeric|min:0',
            'allow_smoking' => 'boolean',
            'allow_pets' => 'boolean',
            'allow_music' => 'boolean',
            // allow drivers to update status via API (restricted values)
            // include both legacy and new status values
            'status' => 'sometimes|in:active,in_road,done,completed,planned,upcoming,cancelled',
        ]);

        $ride->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Ride updated successfully',
            'data' => new RideResource($ride->load('driver.profile')),
        ]);
    }

    /**
     * Remove the specified ride.
     */
    public function destroy(string $id): JsonResponse
    {
        $ride = Ride::findOrFail($id);

        // Check if user is the driver
        if ($ride->driver_id !== auth('api')->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $ride->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ride deleted successfully',
        ]);
    }

    /**
     * Get rides offered by the authenticated driver
     */
    public function myRides(): JsonResponse
    {
        $rides = Ride::where('driver_id', auth('api')->id())
            // ensure the driver relation is loaded so resources include driver info
            ->with(['bookings.passenger.profile', 'driver.profile', 'driver.vehicles', 'vehicle'])
            ->latest()
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => RideResource::collection($rides),
            'meta' => [
                'total' => $rides->total(),
                'per_page' => $rides->perPage(),
                'current_page' => $rides->currentPage(),
            ],
        ]);
    }
}
