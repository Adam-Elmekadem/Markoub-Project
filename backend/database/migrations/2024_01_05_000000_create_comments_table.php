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
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('ride_id')->constrained()->onDelete('cascade');
            $table->tinyInteger('rating')->unsigned()->default(5);
            $table->text('comment_text');
            $table->boolean('is_approved')->default(true);
            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index('ride_id');
            $table->index('rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
