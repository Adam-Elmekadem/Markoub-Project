<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\ProfileResource;
use App\Http\Resources\VehicleResource;

class ProfileController extends Controller
{
    //
    /**
     * Show the authenticated user's profile along with their vehicles.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        // Eager-load profile and vehicles to avoid N+1. `loadMissing` will not overwrite
        // already-loaded relations but will load them if absent.
        $user->loadMissing(['profile', 'vehicles']);

        $profile = $user->profile;

        // If the user has no profile yet, return an object containing vehicles so the
        // frontend can still display the user's vehicles list.
        if (!$profile) {
            return response()->json([
                'profile' => null,
                'vehicles' => VehicleResource::collection($user->vehicles),
            ], 200);
        }

        // Ensure profile has the loaded user relation so ProfileResource can access it
        // without additional queries.
        $profile->setRelation('user', $user);

        // Also ensure user's vehicles are loaded on the user model attached to profile
        $profile->loadMissing('user.vehicles');

        return new ProfileResource($profile);
    }

    /**
     * Update the authenticated user's profile and optionally their primary vehicle.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        // Basic profile fields we support
        $payload = $request->only(['first_name', 'last_name', 'phone', 'city', 'bio', 'driver_license_number', 'vehicle_model', 'vehicle_number_plate', 'vehicle_color', 'vehicle_year']);

        // Update or create profile
        $profile = $user->profile;
        if (!$profile) {
            $profile = $user->profile()->create(array_filter([
                'phone' => $payload['phone'] ?? null,
                'city' => $payload['city'] ?? null,
                'bio' => $payload['bio'] ?? null,
                'driver_license_number' => $payload['driver_license_number'] ?? null,
                'vehicle_model' => $payload['vehicle_model'] ?? null,
                'vehicle_number_plate' => $payload['vehicle_number_plate'] ?? null,
                'vehicle_color' => $payload['vehicle_color'] ?? null,
                'vehicle_year' => $payload['vehicle_year'] ?? null,
            ]));
        } else {
            $profile->fill(array_filter([
                'phone' => $payload['phone'] ?? null,
                'city' => $payload['city'] ?? null,
                'bio' => $payload['bio'] ?? null,
                'driver_license_number' => $payload['driver_license_number'] ?? null,
                'vehicle_model' => $payload['vehicle_model'] ?? null,
                'vehicle_number_plate' => $payload['vehicle_number_plate'] ?? null,
                'vehicle_color' => $payload['vehicle_color'] ?? null,
                'vehicle_year' => $payload['vehicle_year'] ?? null,
            ]));
            $profile->save();
        }

        // If vehicle fields provided, upsert the user's primary vehicle (first vehicle)
        $hasVehicleFields = $request->filled('vehicle_model') || $request->filled('vehicle_number_plate') || $request->filled('vehicle_color') || $request->filled('vehicle_year');
        if ($hasVehicleFields) {
            $vehicleData = array_filter([
                'model' => $payload['vehicle_model'] ?? null,
                'number_plate' => $payload['vehicle_number_plate'] ?? null,
                'color' => $payload['vehicle_color'] ?? null,
                'year' => $payload['vehicle_year'] ?? null,
            ]);

            $vehicle = $user->vehicles()->first();
            if ($vehicle) {
                $vehicle->fill($vehicleData);
                $vehicle->save();
            } else {
                $user->vehicles()->create(array_merge($vehicleData, ['registration_number' => null, 'is_verified' => false]));
            }
        }

        // Optionally update user's first/last name on the user model
        if ($request->filled('first_name') || $request->filled('last_name')) {
            $u = [];
            if ($request->filled('first_name')) $u['first_name'] = $request->input('first_name');
            if ($request->filled('last_name')) $u['last_name'] = $request->input('last_name');
            if (!empty($u)) $user->update($u);
        }

        // Return the updated profile resource
        $user->loadMissing(['profile', 'vehicles']);
        $profile = $user->profile; // refresh
        if ($profile) $profile->setRelation('user', $user);

        return new ProfileResource($profile ?? null);
    }
}
