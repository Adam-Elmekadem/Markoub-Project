<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VehiclesBackfillSeeder extends Seeder
{
    
    public function run(): void
    {
        $rides = DB::table('rides')->whereNotNull('vehicle_number')->where('vehicle_number', '!=', '')->get();
        foreach ($rides as $r) {
            $exists = DB::table('vehicles')->where('number_plate', $r->vehicle_number)->first();
            if (!$exists) {
                $vehicleId = DB::table('vehicles')->insertGetId([
                    'user_id' => $r->driver_id,
                    'model' => $r->vehicle_model,
                    'color' => null,
                    'year' => null,
                    'number_plate' => $r->vehicle_number,
                    'registration_number' => null,
                    'is_verified' => 0,
                    'verification_document' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $profiles = DB::table('profiles')->whereNotNull('vehicle_number_plate')->where('vehicle_number_plate', '!=', '')->get();
        foreach ($profiles as $p) {
            $exists = DB::table('vehicles')->where('number_plate', $p->vehicle_number_plate)->first();
            if (!$exists) {
                DB::table('vehicles')->insert([
                    'user_id' => $p->user_id,
                    'model' => $p->vehicle_model,
                    'color' => $p->vehicle_color,
                    'year' => $p->vehicle_year,
                    'number_plate' => $p->vehicle_number_plate,
                    'registration_number' => null,
                    'is_verified' => $p->is_driver_verified ? 1 : 0,
                    'verification_document' => $p->verification_document,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 3) Link rides to vehicles by matching vehicle_number -> number_plate
        $allRides = DB::table('rides')->get();
        foreach ($allRides as $r) {
            if ($r->vehicle_number) {
                $veh = DB::table('vehicles')->where('number_plate', $r->vehicle_number)->first();
                if ($veh && $r->vehicle_id != $veh->id) {
                    DB::table('rides')->where('id', $r->id)->update(['vehicle_id' => $veh->id]);
                }
            }
        }

        $this->command->info('Vehicles backfill completed.');
    }
}
