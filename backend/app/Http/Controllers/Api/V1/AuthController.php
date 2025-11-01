<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $user = User::create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'phone' => $request->phone,
                'city' => $request->city,
                'birthday' => $request->birthday,
                'role' => $request->role ?? 'passenger',
            ]);

            // Create profile with additional fields
            $profileData = [
                'user_id' => $user->id,
                'phone' => $request->phone,
                'city' => $request->city,
                'date_of_birth' => $request->birthday,
            ];

            // Add address if provided
            if ($request->address) {
                $profileData['bio'] = $request->address; // Store address in bio for now
            }

            // Add gender if provided
            if ($request->filled('gender')) {
                $profileData['gender'] = $request->gender;
            }

            // If driver, add driver-specific fields
            if ($request->role === 'driver') {
                $profileData['driver_license_number'] = $request->license_number;
                $profileData['vehicle_model'] = $request->vehicle_model;
                $profileData['vehicle_number_plate'] = $request->vehicle_number;
                if ($request->filled('vehicle_color')) {
                    $profileData['vehicle_color'] = $request->vehicle_color;
                }
                if ($request->filled('vehicle_year')) {
                    $profileData['vehicle_year'] = $request->vehicle_year;
                }
            }

            Profile::create($profileData);

            $token = JWTAuth::fromUser($user);

            // Load profile relationship before returning
            $user->load('profile');

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'data' => [
                    'user' => new UserResource($user),
                    'token' => $token,
                    'token_type' => 'bearer',
                    'expires_in' => config('jwt.ttl') * 60,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Login user
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password',
            ], 401);
        }

        /** @var User $user */
        $user = auth('api')->user();
        $user->load('profile');

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => config('jwt.ttl') * 60,
            ],
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();
        $user->load('profile');

        return response()->json([
            'success' => true,
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Logout user
     */
    public function logout(): JsonResponse
    {
        auth('api')->logout();

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out',
        ]);
    }

    /**
     * Refresh JWT token
     */
    public function refresh(): JsonResponse
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());

            return response()->json([
                'success' => true,
                'data' => [
                    'token' => $token,
                    'token_type' => 'bearer',
                    'expires_in' => config('jwt.ttl') * 60,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token refresh failed',
                'error' => $e->getMessage(),
            ], 401);
        }
    }
}
