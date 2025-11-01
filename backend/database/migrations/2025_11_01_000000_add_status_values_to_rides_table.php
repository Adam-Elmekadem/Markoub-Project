<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add new status values to the rides.status enum
        DB::statement("ALTER TABLE `rides` MODIFY `status` ENUM('active','completed','cancelled','in_road','done','planned','upcoming') NOT NULL DEFAULT 'active'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to the original enum values
        DB::statement("ALTER TABLE `rides` MODIFY `status` ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active'");
    }
};
