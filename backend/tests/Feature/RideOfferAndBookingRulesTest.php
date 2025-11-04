<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Ride;
use App\Models\Booking;
use Carbon\Carbon;

class RideOfferAndBookingRulesTest extends TestCase
{
    use RefreshDatabase;

    protected function ridePayload(): array
    {
        return [
            'from_location' => 'City A',
            'to_location' => 'City B',
            'ride_date' => Carbon::now()->addDay()->format('Y-m-d'),
            'ride_time' => '10:00',
            'seats_available' => 3,
            'price_per_seat' => 5.0,
        ];
    }

    public function test_driver_cannot_offer_if_has_active_offer()
    {
        $driver = User::factory()->create(['role' => 'driver']);

        // existing active ride
        Ride::create(array_merge($this->ridePayload(), ['driver_id' => $driver->id, 'status' => 'active']));

        $response = $this->actingAs($driver, 'api')->postJson('/api/v1/rides', $this->ridePayload());
        $response->assertStatus(403);
        $response->assertJsonFragment(['message' => 'You already have active or planned rides. Finish them before offering a new ride.']);
    }

    public function test_driver_can_offer_when_no_active_offers()
    {
        $driver = User::factory()->create(['role' => 'driver']);

        $response = $this->actingAs($driver, 'api')->postJson('/api/v1/rides', $this->ridePayload());
        $response->assertStatus(201);
        $response->assertJsonPath('data.from_location', 'City A');
    }

    public function test_user_cannot_book_if_has_active_offer()
    {
        // user is also a driver with an active offer
        $user = User::factory()->create();
        Ride::create(array_merge($this->ridePayload(), ['driver_id' => $user->id, 'status' => 'active']));

        // another ride offered by different driver
        $otherDriver = User::factory()->create(['role' => 'driver']);
        $ride = Ride::create(array_merge($this->ridePayload(), ['driver_id' => $otherDriver->id, 'status' => 'active']));

        $response = $this->actingAs($user, 'api')->postJson('/api/v1/bookings', ['ride_id' => $ride->id, 'seats_booked' => 1]);
        $response->assertStatus(403);
        $response->assertJsonFragment(['message' => 'You cannot reserve a place while you have active offered rides. Finish or close your offers first.']);
    }

    public function test_user_cannot_book_if_has_active_booking()
    {
        $user = User::factory()->create();
        $driver = User::factory()->create(['role' => 'driver']);
        $ride1 = Ride::create(array_merge($this->ridePayload(), ['driver_id' => $driver->id, 'status' => 'active']));
        // create an existing booking for user on ride1
        Booking::create(['ride_id' => $ride1->id, 'user_id' => $user->id, 'seats_booked' => 1, 'total_price' => 5.0, 'status' => 'pending', 'payment_status' => 'pending']);

        // try to book another ride
        $ride2 = Ride::create(array_merge($this->ridePayload(), ['driver_id' => $driver->id, 'status' => 'active']));
        $response = $this->actingAs($user, 'api')->postJson('/api/v1/bookings', ['ride_id' => $ride2->id, 'seats_booked' => 1]);
        $response->assertStatus(403);
        $response->assertJsonFragment(['message' => 'You already have an active reservation. You cannot reserve another place until your existing reservation is completed or cancelled.']);
    }

    public function test_user_can_book_when_no_conflicts()
    {
        $user = User::factory()->create();
        $driver = User::factory()->create(['role' => 'driver']);
        $ride = Ride::create(array_merge($this->ridePayload(), ['driver_id' => $driver->id, 'status' => 'active']));

        $response = $this->actingAs($user, 'api')->postJson('/api/v1/bookings', ['ride_id' => $ride->id, 'seats_booked' => 1]);
        $response->assertStatus(201);
        $response->assertJsonFragment(['message' => 'Booking created']);
    }
}
