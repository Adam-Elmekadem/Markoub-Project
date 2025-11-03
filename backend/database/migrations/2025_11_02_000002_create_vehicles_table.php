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
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('model')->nullable();
            $table->string('color')->nullable();
            $table->string('year')->nullable();
            $table->string('number_plate')->nullable();
            $table->string('registration_number')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->string('verification_document')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('number_plate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
