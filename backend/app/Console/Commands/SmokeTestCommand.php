<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Profile;
use App\Models\Vehicle;
use App\Models\Ride;
use App\Http\Resources\RideResource;

class SmokeTestCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'markoub:smoke-test {--no-output : Create resources but do not print JSON}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a test driver, vehicle and ride and print the ride JSON (safe, idempotent).';

    public function handle(): int
    {
        $this->info('Starting smoke test — creating or finding test driver, vehicle and ride...');

        // Use a deterministic email so running multiple times is idempotent
        $email = 'smoke+driver@example.com';

        $driver = User::firstOrCreate(
            ['email' => $email],
            [
                'first_name' => 'Smoke',
                'last_name' => 'Driver',
                'password' => bcrypt('password'),
                'role' => 'driver',
                'phone' => '0000000000',
            ]
        );

        // Ensure profile exists
        $driver->profile()->firstOrCreate([
            'user_id' => $driver->id,
        ], [
            'phone' => $driver->phone,
            'city' => 'TestCity',
            'vehicle_model' => 'TestModel',
            'vehicle_color' => 'White',
            'vehicle_year' => '2020',
            'vehicle_number_plate' => 'SMOKE-001',
        ]);

        // Create or find a vehicle for the driver
        $vehicle = Vehicle::firstOrCreate([
            'user_id' => $driver->id,
            'number_plate' => 'SMOKE-001',
        ], [
            'model' => 'TestModel',
            'color' => 'White',
            'year' => '2020',
            'registration_number' => 'REG-SMOKE-001',
            'is_verified' => false,
        ]);

        // Create or update a ride
        $ride = Ride::updateOrCreate([
            'driver_id' => $driver->id,
            'from_location' => 'Test Origin',
            'to_location' => 'Test Destination',
        ], [
            'from_latitude' => 34.0,
            'from_longitude' => 9.0,
            'to_latitude' => 35.0,
            'to_longitude' => 10.0,
            'ride_date' => now()->addDays(2)->format('Y-m-d'),
            'ride_time' => '10:00',
            'ride_type' => 'one-time',
            'vehicle_id' => $vehicle->id,
            'seats_available' => 3,
            'price_per_seat' => 5.50,
            'allow_smoking' => false,
            'allow_pets' => false,
            'allow_music' => true,
            'distance' => 120.5,
            'status' => 'active',
        ]);

        // Reload relations for clean resource rendering
        $ride->load(['driver.profile', 'driver.vehicles', 'vehicle', 'bookings', 'comments']);

        if (!$this->option('no-output')) {
            $resource = new RideResource($ride);
            $this->line(json_encode($resource->resolve(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        }

        $this->info('Smoke test finished.');

        return 0;
    }
}
