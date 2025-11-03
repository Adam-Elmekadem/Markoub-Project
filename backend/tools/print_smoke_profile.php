<?php

// Bootstraps Laravel and prints a JWT token + ProfileResource JSON for the smoke-test user
// Run: php tools/print_smoke_profile.php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

// Bootstrap the Console Kernel to initialize the framework
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Http\Resources\ProfileResource;
use Tymon\JWTAuth\Facades\JWTAuth;

$email = 'smoke+driver@example.com';

$user = User::where('email', $email)->first();
if (!$user) {
    echo json_encode(['error' => 'smoke user not found'], JSON_PRETTY_PRINT);
    exit(1);
}

// Ensure relations are loaded
$user->load('profile', 'vehicles');

$token = null;
try {
    $token = JWTAuth::fromUser($user);
} catch (\Exception $e) {
    $token = null;
}

$profile = $user->profile;
if ($profile) {
    $profile->setRelation('user', $user);
}

$out = [
    'token' => $token,
    'profile' => $profile ? (new ProfileResource($profile))->resolve() : null,
    'user' => [
        'id' => $user->id,
        'email' => $user->email,
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'vehicles' => $user->vehicles->map(function($v){
            return [
                'id' => $v->id,
                'model' => $v->model,
                'number_plate' => $v->number_plate,
                'color' => $v->color,
                'year' => $v->year,
            ];
        })->values()->all(),
    ],
];

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
