<?php

use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()->toISOString()]);
});

// Public routes
Route::prefix('v1')->group(function () {
    // Authentication routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    
    // Public rides search (no auth required)
    Route::get('/rides', [\App\Http\Controllers\Api\V1\RideController::class, 'index']);
    Route::get('/rides/{id}', [\App\Http\Controllers\Api\V1\RideController::class, 'show']);
    
    // Public blogs
    Route::get('/blogs', [\App\Http\Controllers\Api\V1\BlogController::class, 'index']);
    Route::get('/blogs/{slug}', [\App\Http\Controllers\Api\V1\BlogController::class, 'show']);
});

// Protected routes (JWT authentication required)
Route::prefix('v1')->middleware(['auth:api'])->group(function () {
    // Auth user routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // User profile routes
    Route::get('/profile', [\App\Http\Controllers\Api\V1\ProfileController::class, 'show']);
    Route::put('/profile', [\App\Http\Controllers\Api\V1\ProfileController::class, 'update']);
    Route::post('/profile/upload-picture', [\App\Http\Controllers\Api\V1\ProfileController::class, 'uploadPicture']);
    
    // Ride routes (driver)
    Route::post('/rides', [\App\Http\Controllers\Api\V1\RideController::class, 'store']);
    Route::put('/rides/{id}', [\App\Http\Controllers\Api\V1\RideController::class, 'update']);
    Route::delete('/rides/{id}', [\App\Http\Controllers\Api\V1\RideController::class, 'destroy']);
    Route::get('/my-rides', [\App\Http\Controllers\Api\V1\RideController::class, 'myRides']);
    
    // Booking routes (passenger)
    Route::get('/bookings', [\App\Http\Controllers\Api\V1\BookingController::class, 'index']);
    Route::post('/bookings', [\App\Http\Controllers\Api\V1\BookingController::class, 'store']);
    Route::get('/bookings/{id}', [\App\Http\Controllers\Api\V1\BookingController::class, 'show']);
    Route::put('/bookings/{id}', [\App\Http\Controllers\Api\V1\BookingController::class, 'update']);
    Route::delete('/bookings/{id}', [\App\Http\Controllers\Api\V1\BookingController::class, 'destroy']);
    Route::post('/bookings/{id}/confirm', [\App\Http\Controllers\Api\V1\BookingController::class, 'confirm']);
    Route::post('/bookings/{id}/cancel', [\App\Http\Controllers\Api\V1\BookingController::class, 'cancel']);
    
    // Comment routes
    Route::post('/comments', [\App\Http\Controllers\Api\V1\CommentController::class, 'store']);
    Route::put('/comments/{id}', [\App\Http\Controllers\Api\V1\CommentController::class, 'update']);
    Route::delete('/comments/{id}', [\App\Http\Controllers\Api\V1\CommentController::class, 'destroy']);
    
    // Blog routes (admin only for create/update/delete)
    Route::middleware(['role:admin'])->group(function () {
        Route::post('/blogs', [\App\Http\Controllers\Api\V1\BlogController::class, 'store']);
        Route::put('/blogs/{id}', [\App\Http\Controllers\Api\V1\BlogController::class, 'update']);
        Route::delete('/blogs/{id}', [\App\Http\Controllers\Api\V1\BlogController::class, 'destroy']);
        // Admin user management
        Route::get('/users', [\App\Http\Controllers\Api\V1\UserController::class, 'index']);
        Route::post('/users', [\App\Http\Controllers\Api\V1\UserController::class, 'store']);
        Route::put('/users/{id}', [\App\Http\Controllers\Api\V1\UserController::class, 'update']);
        Route::delete('/users/{id}', [\App\Http\Controllers\Api\V1\UserController::class, 'destroy']);

        // Admin comments listing
        Route::get('/comments', [\App\Http\Controllers\Api\V1\CommentController::class, 'index']);
    });
});
