import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Car, Users, MapPin, Calendar, Clock, DollarSign, User, Send, Phone } from 'lucide-react';
import { Spinner } from '../components/Spinner';
import { useToast } from '../components/Toast';
import { RidesAPI, BookingsAPI } from '../utils/api';

export const MyRides = () => {
  const { isAuthenticated, user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [rides, setRides] = useState({ offered: [], reserved: [] });
  const [ratings, setRatings] = useState({});
  const [isLoadingRides, setIsLoadingRides] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return; // wait for auth initialization
    if (!isAuthenticated) {
      showToast('Please login to view your rides', 'error');
      navigate('/login');
      return;
    }

    const load = async () => {
      setIsLoadingRides(true);
      try {
  // Offered rides (driver)
  const offeredRes = await RidesAPI.myRides();
  const offered = Array.isArray(offeredRes?.data) ? offeredRes.data : (offeredRes || []);

        // Reserved rides (bookings by user)
        const bookingsRes = await BookingsAPI.list();
        const bookings = Array.isArray(bookingsRes?.data) ? bookingsRes.data : (bookingsRes || []);

        // Normalize for UI
        const offeredNormalized = offered.map(r => ({
          id: r.id,
          from: r.from_location,
          to: r.to_location,
          date: r.ride_date,
          time: r.ride_time,
          seats: r.seats_available,
          price: r.price_per_seat,
          vehicle: r.vehicle_model ? { model: r.vehicle_model, number: r.vehicle_number } : null,
          status: r.status || r.ride_status || 'upcoming',
          driver_id: r.driver_id || r.driver?.id || null,
        }));

        const reservedNormalized = bookings.map(b => {
          const drv = b.ride?.driver || {};
          const driverName = `${drv.first_name || drv.firstName || ''} ${drv.last_name || drv.lastName || ''}`.trim() || drv.name || '';
          const driverPhone = drv.phone || drv.profile?.phone || '';
          return {
            id: b.id,
            from: b.pickup_location || b.ride?.from_location,
            to: b.dropoff_location || b.ride?.to_location,
            date: b.ride?.ride_date || null,
            time: b.ride?.ride_time || null,
            driver: { name: driverName, phone: driverPhone },
            price: b.total_price,
            seatsReserved: b.seats_booked
          };
        });

        setRides({ offered: offeredNormalized, reserved: reservedNormalized });
      } catch (err) {
        console.error('Failed loading my rides', err);
        showToast('Failed to load your rides', 'error');
      } finally {
        setIsLoadingRides(false);
      }
    };

    load();

    // load saved ratings (local key: my_ride_ratings)
    try {
      const store = JSON.parse(localStorage.getItem('my_ride_ratings') || '{}');
      setRatings(store);
    } catch (e) {
      console.warn('Failed to load saved ratings', e);
    }
  }, [isAuthenticated, user, navigate, showToast]);

  const cancelRide = (rideId, type) => {
    try {
      const storageKey = type === 'offered' ? 'user_offered_rides' : 'user_reserved_rides';
      const allRides = JSON.parse(localStorage.getItem(storageKey) || '{}');
      
      if (allRides[user.email]) {
        allRides[user.email] = allRides[user.email].filter(r => r.id !== rideId);
        localStorage.setItem(storageKey, JSON.stringify(allRides));
        setRides(getUserRides(user.email));
        showToast(`Ride ${type === 'offered' ? 'offer' : 'reservation'} cancelled`, 'success');
      }
    } catch (error) {
      showToast('Failed to cancel ride', 'error');
    }
  };

  const refreshLists = async () => {
    setIsLoadingRides(true);
    try {
      const offeredRes = await RidesAPI.myRides();
      const offered = Array.isArray(offeredRes?.data) ? offeredRes.data : (offeredRes || []);
      const bookingsRes = await BookingsAPI.list();
      const bookings = Array.isArray(bookingsRes?.data) ? bookingsRes.data : (bookingsRes || []);

      const offeredNormalized = offered.map(r => ({
        id: r.id,
        from: r.from_location,
        to: r.to_location,
        date: r.ride_date,
        time: r.ride_time,
        seats: r.seats_available,
        price: r.price_per_seat,
        vehicle: r.vehicle_model ? { model: r.vehicle_model, number: r.vehicle_number } : null,
        status: r.status || r.ride_status || 'upcoming',
        driver_id: r.driver_id || r.driver?.id || null,
      }));

      const reservedNormalized = bookings.map(b => {
        const drv = b.ride?.driver || {};
        const driverName = `${drv.first_name || drv.firstName || ''} ${drv.last_name || drv.lastName || ''}`.trim() || drv.name || '';
        const driverPhone = drv.phone || drv.profile?.phone || '';
        return {
          id: b.id,
          from: b.pickup_location || b.ride?.from_location,
          to: b.dropoff_location || b.ride?.to_location,
          date: b.ride?.ride_date || null,
          time: b.ride?.ride_time || null,
          driver: { name: driverName, phone: driverPhone },
          price: b.total_price,
          seatsReserved: b.seats_booked
        };
      });

      setRides({ offered: offeredNormalized, reserved: reservedNormalized });
    } catch (err) {
      console.error('Failed refreshing my rides', err);
    } finally {
      setIsLoadingRides(false);
    }
  }

  const markRideStatus = async (rideId, newStatus) => {
    setIsLoadingRides(true);
    try {
      await RidesAPI.update(rideId, { status: newStatus });

      // Optimistically update local state so the Kanban immediately reflects the change
      setRides(prev => {
        if (!prev) return prev;
        const offered = (prev.offered || []).map(r => (r.id === rideId ? { ...r, status: newStatus } : r));
        return { ...prev, offered };
      });

      showToast(`Ride marked as ${newStatus}`, 'success');

      // Refresh lists in background to reconcile server state (don't block UI)
      refreshLists().catch(err => console.warn('Background refresh failed', err));
    } catch (err) {
      console.error('Failed to update ride status', err);
      showToast('Failed to update ride status', 'error');
    } finally {
      setIsLoadingRides(false);
    }
  }

  // Local UI helpers to start/finish ride inside the Kanban and briefly highlight the moved card
  const [highlightedRide, setHighlightedRide] = useState(null);
  const startRide = async (rideId) => {
    try {
      await markRideStatus(rideId, 'in_road');
      setHighlightedRide({ id: rideId, status: 'in_road' });
      setTimeout(() => setHighlightedRide(null), 4000);
    } catch (e) {
      // handled in markRideStatus
    }
  };

  const finishRide = async (rideId) => {
    try {
      await markRideStatus(rideId, 'done');
      setHighlightedRide({ id: rideId, status: 'done' });
      setTimeout(() => setHighlightedRide(null), 4000);
    } catch (e) {
      // handled in markRideStatus
    }
  };

  const saveRating = (rideId, ratingValue, comment) => {
    try {
      const store = JSON.parse(localStorage.getItem('my_ride_ratings') || '{}');
      store[rideId] = { rating: Number(ratingValue) || 0, comment: comment || '' };
      localStorage.setItem('my_ride_ratings', JSON.stringify(store));
      setRatings(store);
      showToast('Rating saved', 'success');
    } catch (e) {
      console.error('Failed to save rating', e);
      showToast('Unable to save rating', 'error');
    }
  }

  // Parse the ride date and time into a Date object (best-effort).
  const parseRideDateTime = (dateStr, timeStr) => {
    if (!dateStr) return null;
    try {
      // Try a robust manual parse to avoid timezone quirks.
      // Expected dateStr formats: YYYY-MM-DD or YYYY/MM/DD
      // Expected timeStr formats: HH:mm, H:mm, HH:mm:ss, or with AM/PM like 2:30 PM
      const dateMatch = String(dateStr).trim().match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
      let hour = 0, minute = 0, second = 0;

      if (timeStr) {
        const t = String(timeStr).trim();
        // Match HH:MM(:SS)? with optional AM/PM
        const tm = t.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
        if (tm) {
          hour = parseInt(tm[1], 10);
          minute = parseInt(tm[2], 10);
          second = parseInt(tm[3] || '0', 10);
          const ampm = tm[4];
          if (ampm) {
            const a = ampm.toLowerCase();
            if (a === 'pm' && hour < 12) hour += 12;
            if (a === 'am' && hour === 12) hour = 0;
          }
        }
      }

      if (dateMatch) {
        const y = parseInt(dateMatch[1], 10);
        const m = parseInt(dateMatch[2], 10) - 1;
        const d = parseInt(dateMatch[3], 10);
        const constructed = new Date(y, m, d, hour, minute, second);
        if (!isNaN(constructed)) return constructed;
      }

      // Last resort: try Date parsing of an ISO-like string
      const iso = timeStr ? `${dateStr}T${timeStr}` : dateStr;
      const parsed = new Date(iso);
      if (!isNaN(parsed)) return parsed;
      return null;
    } catch (e) {
      return null;
    }
  };

  // Only allow starting a ride when the current time is at or after the scheduled date/time.
  // Allow starting a ride within a small pre-start window before scheduled departure (for testing).
  // If no valid scheduled time is available, we fall back to allowing the action so it doesn't block the driver.
  const PRE_START_MINUTES = 5; // change this to 3 for 3 minutes, 5 for 5 minutes, etc.
  const canStartRide = (ride) => {
    const scheduled = parseRideDateTime(ride.date, ride.time);
    const now = new Date();
    const windowStart = scheduled ? new Date(scheduled.getTime() - PRE_START_MINUTES * 60 * 1000) : null;

    // Debug: print scheduling info to browser console for troubleshooting
    try {
      const scheduledISO = scheduled ? scheduled.toISOString() : 'invalid';
      const windowStartISO = windowStart ? windowStart.toISOString() : 'n/a';
      const nowISO = now.toISOString();
      const canStart = scheduled ? (now.getTime() >= windowStart.getTime()) : true;
      console.log(`[MyRides] ride=${ride?.id} scheduled=${scheduledISO} startWindow=${windowStartISO} now=${nowISO} preStartMin=${PRE_START_MINUTES} canStart=${canStart}`);
    } catch (e) {
      // ignore logging errors
    }

    if (!scheduled) return true;
    return now.getTime() >= windowStart.getTime();
  };

  // (removed temporary debug-only logging for cleaner UI)

  if (isAuthLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4"><div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const totalRides = rides.offered.length + rides.reserved.length;

  return (
    <section className="py-8 md:py-16 bg-linear-to-br from-blue-50 via-white to-orange-50 min-h-screen">
      <div className="container mx-auto px-4 mt-16">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-700 mb-2">My Rides</h1>
          <p className="text-slate-600">View and manage all your rides</p>
        </div>

        {/* Stats Cards */}
        <div className="max-w-6xl mx-auto mb-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">Total Rides</p>
                <p className="text-3xl font-bold text-blue-700">{totalRides}</p>
              </div>
              <Car className="w-12 h-12 text-blue-700 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">Offered</p>
                <p className="text-3xl font-bold text-orange-500">{rides.offered.length}</p>
              </div>
              <Car className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">Reserved</p>
                <p className="text-3xl font-bold text-green-600">{rides.reserved.length}</p>
              </div>
              <Users className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* All Rides Section */}
              {/* Offered Rides as a Kanban board (Planned / In Road / Finished) */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
                  <Car className="w-6 h-6" />
                  My Offered Rides — Board
                </h2>

                <div className="grid gap-4 md:grid-cols-3">
                  {(() => {
                    // Group rides by status
                    const planned = (rides.offered || []).filter(r => !r.status || ['upcoming', 'active', 'planned'].includes(String(r.status).toLowerCase()));
                    const inRoad = (rides.offered || []).filter(r => String(r.status).toLowerCase() === 'in_road');
                    const finished = (rides.offered || []).filter(r => String(r.status).toLowerCase() === 'done');
                    const columns = [
                      { key: 'planned', title: 'Planned', items: planned, accent: 'blue' },
                      { key: 'in_road', title: 'In Road', items: inRoad, accent: 'yellow' },
                      { key: 'done', title: 'Finished', items: finished, accent: 'green' },
                    ];
                    return columns.map(col => (
                      <div key={col.key} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-slate-800">{col.title}</h3>
                          <span className="text-sm text-slate-500">{col.items.length}</span>
                        </div>
                        <div className="space-y-3">
                          {col.items.map(ride => (
                            <div key={ride.id} className="bg-white rounded-lg p-4 shadow-sm">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-semibold text-slate-900">{ride.from} → {ride.to}</div>
                                  <div className="text-sm text-slate-500">{ride.date} • {ride.time}</div>
                                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-600">
                                    <div>{ride.seats} seats</div>
                                    <div>${ride.price}/seat</div>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 ml-4">
                                  {String(ride.status || '').toLowerCase() === 'in_road' && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-yellow-100 text-yellow-800">In Road</span>
                                  )}
                                  {String(ride.status || '').toLowerCase() === 'done' && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-green-100 text-green-800">Done</span>
                                  )}
                                </div>
                              </div>

                              {ride.vehicle && (
                                <div className="pt-3 text-sm text-slate-600">{ride.vehicle.model} — {ride.vehicle.number}</div>
                              )}

                              <div className="pt-4 flex items-center gap-2">
                                {/* Driver controls */}
                                {user?.id && ride.driver_id && Number(user.id) === Number(ride.driver_id) ? (
                                  <>
                                    {/* Start button for planned items */}
                                    {(['upcoming', 'active', 'planned'].includes(String(ride.status).toLowerCase()) && canStartRide(ride)) && (
                                      <button
                                        onClick={async () => { await startRide(ride.id); }}
                                        className={`bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-md text-lg font-semibold ${highlightedRide && highlightedRide.id === ride.id && highlightedRide.status === 'in_road' ? 'ring-4 ring-orange-200' : ''}`}
                                      >
                                        Start Ride
                                      </button>
                                    )}

                                    {/* Mark Done for in_road items */}
                                    {String(ride.status || '').toLowerCase() === 'in_road' && (
                                      <button
                                        onClick={async () => { await finishRide(ride.id); }}
                                        className={`bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm ${highlightedRide && highlightedRide.id === ride.id && highlightedRide.status === 'done' ? 'ring-4 ring-green-200' : ''}`}
                                      >
                                        Mark Done
                                      </button>
                                    )}

                                    {/* When not yet in start window */}
                                    {(['upcoming', 'active', 'planned'].includes(String(ride.status).toLowerCase()) && !canStartRide(ride)) && (
                                      <span className="text-xs text-slate-500">Available at {ride.time}</span>
                                    )}
                                  </>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
                

              {/* Reserved Rides */}
              {rides.reserved.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    My Reserved Rides
                  </h2>
                  <div className="space-y-4">
                    {rides.reserved.map((ride) => (
                      <div key={ride.id} className="rounded-xl p-6 hover:shadow-md transition-shadow bg-linear-to-r from-orange-50/50 to-white">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-5 h-5 text-green-600" />
                              <span className="font-semibold text-slate-900">{ride.from}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="w-5 h-5 text-red-600" />
                              <span className="font-semibold text-slate-900">{ride.to}</span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{ride.date}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{ride.time}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  <span>Driver: {ride.driver?.name || 'Driver'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  <span>{ride.driver?.phone || '—'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                <span>${ride.price}/seat</span>
                              </div>
                            </div>
                          </div>
                          {/* Read-only: ratings/comments below (no cancel button) */}
                        </div>
                        {ride.seatsReserved && (
                          <div className="pt-4">
                            <p className="text-sm text-slate-600">
                              You reserved <span className="font-semibold text-orange-600">{ride.seatsReserved}</span> seat(s)
                            </p>
                          </div>
                        )}
                        {/* Rating & comment (stored locally) — vertical layout with send icon */}
                        <div className="pt-4 mt-4">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Your rating</label>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-1" aria-hidden>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => {
                                    const cur = ratings[ride.id] || { rating: 0, comment: '' };
                                    saveRating(ride.id, n, cur.comment || '');
                                  }}
                                  aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                                  className={`text-2xl leading-none transition-colors focus:outline-none cursor-pointer ${((ratings[ride.id] && ratings[ride.id].rating) || 0) >= n ? 'text-yellow-400' : 'text-slate-300'}`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>

                            <div className="relative w-full">
                              <textarea
                                value={(ratings[ride.id] && ratings[ride.id].comment) || ''}
                                placeholder="Leave a comment (optional)"
                                onChange={(e) => setRatings(prev => ({ ...(prev || {}), [ride.id]: { rating: (prev && prev[ride.id] && prev[ride.id].rating) || 0, comment: e.target.value } }))}
                                onBlur={(e) => saveRating(ride.id, (ratings[ride.id] && ratings[ride.id].rating) || 0, e.target.value)}
                                className="w-full px-3 py-3 pr-12 rounded border-transparent min-h-16 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />

                              <button
                                type="button"
                                onClick={() => {
                                  const cur = ratings[ride.id] || { rating: 0, comment: '' };
                                  saveRating(ride.id, cur.rating || 0, cur.comment || '');
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center p-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
                                aria-label="Send comment"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-slate-500">Ratings are stored locally on your device.</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
      </div>
    </section>
  );
};
