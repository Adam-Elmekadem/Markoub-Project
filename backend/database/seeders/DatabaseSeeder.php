<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Profile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@markoub.com',
            'password' => Hash::make('admin123'),
            'phone' => '+1234567890',
            'city' => 'New York',
            'birthday' => '1990-01-01',
            'role' => 'admin',
            'is_verified' => true,
            'email_verified_at' => now(),
        ]);

        Profile::create([
            'user_id' => $admin->id,
            'phone' => '+1234567890',
            'city' => 'New York',
            'date_of_birth' => '1990-01-01',
        ]);

        // Create test driver
        $driver = User::create([
            'first_name' => 'John',
            'last_name' => 'Driver',
            'email' => 'driver@markoub.com',
            'password' => Hash::make('driver123'),
            'phone' => '+1234567891',
            'city' => 'Boston',
            'birthday' => '1985-05-15',
            'role' => 'driver',
            'is_verified' => true,
            'email_verified_at' => now(),
        ]);

        Profile::create([
            'user_id' => $driver->id,
            'phone' => '+1234567891',
            'city' => 'Boston',
            'date_of_birth' => '1985-05-15',
            'driver_license_number' => 'D1234567',
            'vehicle_model' => 'Toyota Camry',
            'vehicle_color' => 'Blue',
            'vehicle_year' => '2020',
            'vehicle_number_plate' => 'ABC123',
            'is_driver_verified' => true,
        ]);

        // Create test passenger
        $passenger = User::create([
            'first_name' => 'Jane',
            'last_name' => 'Passenger',
            'email' => 'passenger@markoub.com',
            'password' => Hash::make('passenger123'),
            'phone' => '+1234567892',
            'city' => 'Philadelphia',
            'birthday' => '1992-08-20',
            'role' => 'passenger',
            'is_verified' => true,
            'email_verified_at' => now(),
        ]);

        Profile::create([
            'user_id' => $passenger->id,
            'phone' => '+1234567892',
            'city' => 'Philadelphia',
            'date_of_birth' => '1992-08-20',
        ]);

        $this->command->info('Test users created successfully!');
        $this->command->info('Admin: admin@markoub.com / admin123');
        $this->command->info('Driver: driver@markoub.com / driver123');
        $this->command->info('Passenger: passenger@markoub.com / passenger123');
    }
}
