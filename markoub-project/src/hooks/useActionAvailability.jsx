import { useEffect, useState } from 'react';
import { RidesAPI, BookingsAPI } from '../utils/api';

const CACHE_KEY = 'action_availability_cache_v1';
const CACHE_TTL_MS = 60 * 1000; // 60s

export function useActionAvailability() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canOffer, setCanOffer] = useState(true);
  const [canReserve, setCanReserve] = useState(true);
  const [reason, setReason] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Try cache first
        try {
          // Use a short fingerprint of the current auth token so cache is scoped to the logged-in user.
          // This prevents returning another user's cached availability when switching accounts.
          const token = (() => {
            try {
              return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || null;
            } catch (e) {
              return null;
            }
          })();

          const key = `${CACHE_KEY}:${token ? String(token).slice(0,8) : 'anon'}`;
          const raw = sessionStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && Date.now() - parsed.ts < CACHE_TTL_MS) {
              if (!cancelled) {
                setCanOffer(parsed.canOffer);
                setCanReserve(parsed.canReserve);
                setReason(parsed.reason || null);
                setLoading(false);
              }
              return;
            }
          }
        } catch (e) {
          // ignore cache errors
        }

        // Fetch both endpoints in parallel
        const [ridesRes, bookingsRes] = await Promise.allSettled([
          RidesAPI.myRides(),
          BookingsAPI.list(),
        ]);

        // Determine active offered rides
        let hasActiveOffered = false;
        if (ridesRes.status === 'fulfilled' && Array.isArray(ridesRes.value?.data || ridesRes.value)) {
          const items = Array.isArray(ridesRes.value?.data) ? ridesRes.value.data : ridesRes.value;
          hasActiveOffered = items.some(r => !r.status || r.status === 'active' || r.status === 'planned' || r.status === 'pending');
        }

        // Determine active bookings
        let hasActiveBooking = false;
        let activeBookingExample = null;
        if (bookingsRes.status === 'fulfilled' && Array.isArray(bookingsRes.value?.data || bookingsRes.value)) {
          const items = Array.isArray(bookingsRes.value?.data) ? bookingsRes.value.data : bookingsRes.value;

          // A booking should be considered "active" only if the related ride is not completed.
          // Prefer ride.status when available (backend includes ride relation in the BookingResource).
          const completedStates = ['done', 'completed', 'finished'];

          for (const b of items) {
            const bookingStatus = (b.status || '')?.toLowerCase?.() || '';
            const rideStatus = (b.ride && b.ride.status) ? String(b.ride.status).toLowerCase() : null;

            const rideIsCompleted = rideStatus ? completedStates.includes(rideStatus) : false;
            const bookingIsCompleted = bookingStatus ? (bookingStatus === 'completed' || bookingStatus === 'cancelled') : false;

            // If ride exists and is completed, this booking is not active regardless of booking.status
            if (rideIsCompleted) continue;

            // If booking itself is cancelled/completed, ignore
            if (bookingIsCompleted) continue;

            // Otherwise treat as active
            hasActiveBooking = true;
            activeBookingExample = b;
            break;
          }
        }

        const computedCanOffer = !hasActiveOffered;
        const computedCanReserve = !hasActiveOffered && !hasActiveBooking;
        let computedReason = null;
        if (!computedCanOffer) computedReason = 'You have active offered rides. Finish them before offering another.';
        else if (!computedCanReserve) {
          if (hasActiveBooking && activeBookingExample) {
            // Prefer to reference ride date/driver when available to be specific
            const ride = activeBookingExample.ride;
            const rideWhen = ride?.ride_date ? `on ${ride.ride_date}` : '';
            const driverName = activeBookingExample.passenger?.first_name ? `${activeBookingExample.passenger.first_name}` : '';
            computedReason = `Your current reservation${rideWhen ? ` for the ride ${rideWhen}` : ''} is not completed yet. Complete or cancel it before booking another.`;
          } else {
            computedReason = 'You already have an active reservation. Complete or cancel it before booking another.';
          }
        }

        // Cache (scoped to current auth token fingerprint)
        try {
          const token = (() => {
            try {
              return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || null;
            } catch (e) {
              return null;
            }
          })();
          const key = `${CACHE_KEY}:${token ? String(token).slice(0,8) : 'anon'}`;
          sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), canOffer: computedCanOffer, canReserve: computedCanReserve, reason: computedReason }));
        } catch (e) {
          // ignore sessionStorage errors
        }

        if (!cancelled) {
          setCanOffer(computedCanOffer);
          setCanReserve(computedCanReserve);
          setReason(computedReason);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to determine action availability');
          setLoading(false);
        }
      }
    }

    load();

    return () => { cancelled = true; };
  }, []);

  return { loading, error, canOffer, canReserve, reason };
}

export default useActionAvailability;
