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
        Schema::table('rides', function (Blueprint $table) {
            // Only drop columns if they exist to be safe
            if (Schema::hasColumn('rides', 'vehicle_model') || Schema::hasColumn('rides', 'vehicle_number')) {
                $cols = [];
                if (Schema::hasColumn('rides', 'vehicle_model')) $cols[] = 'vehicle_model';
                if (Schema::hasColumn('rides', 'vehicle_number')) $cols[] = 'vehicle_number';
                if (!empty($cols)) {
                    $table->dropColumn($cols);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rides', function (Blueprint $table) {
            if (!Schema::hasColumn('rides', 'vehicle_model')) {
                $table->string('vehicle_model')->nullable()->after('ride_type');
            }
            if (!Schema::hasColumn('rides', 'vehicle_number')) {
                $table->string('vehicle_number')->nullable()->after('vehicle_model');
            }
        });
    }
};
