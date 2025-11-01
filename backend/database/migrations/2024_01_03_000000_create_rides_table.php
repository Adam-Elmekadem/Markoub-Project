<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('users')->onDelete('cascade');
            $table->string('from_location');
            $table->string('to_location');
            $table->decimal('from_latitude', 10, 8)->nullable();
            $table->decimal('from_longitude', 11, 8)->nullable();
            $table->decimal('to_latitude', 10, 8)->nullable();
            $table->decimal('to_longitude', 11, 8)->nullable();
            $table->date('ride_date');
            $table->time('ride_time');
            $table->enum('ride_type', ['one-time', 'recurring'])->default('one-time');
            $table->string('vehicle_model')->nullable();
            $table->string('vehicle_number')->nullable();
            $table->integer('seats_available');
            $table->decimal('price_per_seat', 8, 2);
            $table->boolean('allow_smoking')->default(false);
            $table->boolean('allow_pets')->default(false);
            $table->boolean('allow_music')->default(true);
            $table->decimal('distance', 8, 2)->nullable();
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->timestamps();
            $table->softDeletes();

            // Indexes for better query performance
            $table->index('driver_id');
            $table->index('ride_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rides');
    }
};
