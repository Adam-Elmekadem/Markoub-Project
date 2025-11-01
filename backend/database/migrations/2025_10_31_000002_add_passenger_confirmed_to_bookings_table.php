<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'passenger_confirmed' to the bookings.status enum
        // MySQL requires redefining the enum with the new set
        DB::statement("ALTER TABLE `bookings` MODIFY `status` ENUM('pending','confirmed','cancelled','completed','passenger_confirmed') NOT NULL DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum values
        DB::statement("ALTER TABLE `bookings` MODIFY `status` ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending'");
    }
};
