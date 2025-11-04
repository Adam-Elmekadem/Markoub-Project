import { useEffect, useMemo, useState } from 'react';
import { Spinner } from '../components/Spinner';
import { MapPin, Calendar, Clock, Users, Star, Filter, Search, Car, ChevronDown, X, CreditCard, Wallet, DollarSign, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { RidesAPI, BookingsAPI } from '../utils/api';
import useActionAvailability from '../hooks/useActionAvailability';

export const FindRide = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const { loading: availabilityLoading, canReserve, reason: availabilityReason } = useActionAvailability();
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    date: '',
    time: '',
    passengers: '1',
    priceRange: 'all',
    driverPreference: 'all',
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [bookingModal, setBookingModal] = useState({
    isOpen: false,
    ride: null,
    step: 1, // 1: Details, 2: Payment
    paymentMethod: 'cash',
    seatsToBook: 1,
    paymentDetails: {
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
      paypalEmail: ''
    }
  });

  // Start with an empty rides list; rely on backend data. Removed hardcoded demo rides.
  const [rides, setRides] = useState([]);
  const [isLoadingRides, setIsLoadingRides] = useState(true);
  const [ridesError, setRidesError] = useState(null);
  const [bookingActionLoading, setBookingActionLoading] = useState(false);

  // Try fetching rides from backend
  useEffect(() => {
    refreshRides();
  }, []);
  // Map API ride objects to UI shape
  const mapApiRides = (items) => {
    return items.map((r) => ({
      id: r.id,
      driver: (() => {
        const rawGender = r.driver?.profile?.gender || r.driver?.gender || '';
        const genderNorm = rawGender ? String(rawGender).toLowerCase() : 'unknown';
        const displayGender = genderNorm === 'female' ? 'Female' : genderNorm === 'male' ? 'Male' : (rawGender || 'Other');
        return {
          name: `${r.driver?.first_name ?? 'Driver'} ${r.driver?.last_name ?? ''}`.trim(),
          initials: ((r.driver?.first_name?.[0] || '') + (r.driver?.last_name?.[0] || '')).toUpperCase() || 'DR',
          rating: 4.7,
          trips: 0,
          gender: genderNorm,
          displayGender,
              // Prefer nested vehicle resource when available
              vehicle: r.vehicle?.model || 'Vehicle',
          verified: !!r.driver?.profile?.is_driver_verified,
        };
      })(),
      from: r.from_location,
      to: r.to_location,
      departTime: r.ride_time || '08:00',
      arriveTime: '',
      distance: '',
      price: r.price_per_seat || r.price || 0,
      // Prefer seats_remaining from API resource, fallback to seats_available
      seatsLeft: (typeof r.seats_remaining !== 'undefined') ? r.seats_remaining : (r.seats_available ?? 1),
      seatsTaken: (typeof r.seats_taken !== 'undefined') ? r.seats_taken : ((r.seats_offered ?? 0) - (r.seats_available ?? (r.seats_remaining ?? 0))),
      preferences: [
        r.allow_smoking ? 'Smoking OK' : 'No Smoking',
        r.allow_pets ? 'Pets OK' : 'No Pets',
        r.allow_music ? 'Music OK' : 'No Music',
      ],
    }));
  };

  // Refresh rides from the backend using current filters
  const refreshRides = async () => {
      setIsLoadingRides(true);
      setRidesError(null);
      try {
        // Build server query params from UI filters
        const params = {};
        if (filters.from) params.from = filters.from;
        if (filters.to) params.to = filters.to;
        if (filters.date) params.date = filters.date;
        if (filters.time) params.time = filters.time;
        if (filters.passengers) params.seats_min = filters.passengers;
        // driverPreference -> driver_gender
        if (filters.driverPreference && filters.driverPreference !== 'all') {
          params.driver_gender = filters.driverPreference;
        }
        // priceRange -> map to min/max
        if (filters.priceRange === 'low') {
          params.price_max = 75;
        } else if (filters.priceRange === 'medium') {
          params.price_min = 75;
          params.price_max = 120;
        } else if (filters.priceRange === 'high') {
          params.price_min = 120;
        }

  const res = await RidesAPI.list(params);
  // Debug: show outgoing params and backend response in browser console
  console.log('[FindRide] RidesAPI.list params ->', params);
  console.log('[FindRide] RidesAPI.list response ->', res);
  const items = Array.isArray(res?.data) ? res.data : res;
        if (Array.isArray(items)) {
          const mapped = mapApiRides(items);
          // Additional client-side filter: if driverPreference is set, ensure we show matching driver genders
          if (filters.driverPreference && filters.driverPreference !== 'all') {
            const pref = (filters.driverPreference || '').toString().toLowerCase();
            const clientFiltered = mapped.filter(m => (m.driver?.gender || '').toString().toLowerCase() === pref);
            setRides(clientFiltered);
          } else {
            setRides(mapped);
          }
        } else {
          setRides([]);
        }
      } catch (e) {
        // If refresh fails, keep existing rides and show a toast
        console.error('Failed to refresh rides:', e);
        setRides([]);
        setRidesError(e?.message || 'Failed to load rides. Please try again later.');
        showToast('Failed to load rides. Please try again later.', 'error');
      } finally {
        setIsLoadingRides(false);
      }

  };

  // Update a single filter key
    const updateFilter = (key, value) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    };

    // Compute filtered rides from current rides & filters
    const filteredRides = useMemo(() => {
      if (!Array.isArray(rides)) return [];
      return rides.filter((ride) => {
        if (filters.from && !ride.from.toLowerCase().includes(filters.from.toLowerCase())) return false;
        if (filters.to && !ride.to.toLowerCase().includes(filters.to.toLowerCase())) return false;
        if (filters.passengers !== '1' && ride.seatsLeft < parseInt(filters.passengers)) return false;
        if (filters.priceRange === 'low' && ride.price > 75) return false;
        if (filters.priceRange === 'medium' && (ride.price <= 75 || ride.price > 120)) return false;
        if (filters.priceRange === 'high' && ride.price <= 120) return false;
  if (filters.driverPreference === 'female' && (ride.driver.gender || '').toString().toLowerCase() !== 'female') return false;
  if (filters.driverPreference === 'male' && (ride.driver.gender || '').toString().toLowerCase() !== 'male') return false;
        return true;
      });
    }, [rides, filters]);
  const handleBook = (ride) => {
    if (isAuthLoading) {
      showToast('Checking authentication, please wait...', 'info');
      return;
    }

    if (!isAuthenticated) {
      showToast('Please login to book a ride', 'error');
      navigate('/login', { state: { from: '/find-ride' } });
      return;
    }
    // Client-side pre-check: avoid opening booking modal if server would block the action
    if (!availabilityLoading && !canReserve) {
      showToast(availabilityReason || 'You cannot book a ride right now. Finish or cancel existing reservations/offers.', 'error');
      return;
    }
    
    // Open booking modal
    setBookingModal({
      isOpen: true,
      ride,
      step: 1,
      paymentMethod: 'cash',
      seatsToBook: 1,
      paymentDetails: {
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
        paypalEmail: ''
      }
    });
  };

  const closeBookingModal = () => {
    setBookingModal({
      isOpen: false,
      ride: null,
      step: 1,
      paymentMethod: 'cash',
      seatsToBook: 1,
      paymentDetails: {
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
        paypalEmail: ''
      }
    });
  };

  const handleNextStep = () => {
    if (bookingModal.seatsToBook < 1 || bookingModal.seatsToBook > bookingModal.ride.seatsLeft) {
      showToast('Please select a valid number of seats', 'error');
      return;
    }
    setBookingModal(prev => ({ ...prev, step: 2 }));
  };

  const handleBackStep = () => {
    setBookingModal(prev => ({ ...prev, step: 1 }));
  };

  const handlePaymentMethodChange = (method) => {
    setBookingModal(prev => ({ ...prev, paymentMethod: method }));
  };

  const handleSeatsChange = (seats) => {
    setBookingModal(prev => ({ ...prev, seatsToBook: seats }));
  };

  const handlePaymentDetailChange = (field, value) => {
    setBookingModal(prev => ({
      ...prev,
      paymentDetails: {
        ...prev.paymentDetails,
        [field]: value
      }
    }));
  };

  const validatePaymentDetails = () => {
    const { paymentMethod, paymentDetails } = bookingModal;
    
    if (paymentMethod === 'credit-card') {
      if (!paymentDetails.cardNumber || paymentDetails.cardNumber.replace(/\s/g, '').length !== 16) {
        showToast('Please enter a valid 16-digit card number', 'error');
        return false;
      }
      if (!paymentDetails.cardName || paymentDetails.cardName.trim().length < 3) {
        showToast('Please enter cardholder name', 'error');
        return false;
      }
      if (!paymentDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentDetails.expiryDate)) {
        showToast('Please enter expiry date in MM/YY format', 'error');
        return false;
      }
      if (!paymentDetails.cvv || paymentDetails.cvv.length !== 3) {
        showToast('Please enter a valid 3-digit CVV', 'error');
        return false;
      }
    }
    
    if (paymentMethod === 'paypal') {
      if (!paymentDetails.paypalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentDetails.paypalEmail)) {
        showToast('Please enter a valid PayPal email', 'error');
        return false;
      }
    }
    
    return true;
  };

  const confirmBooking = async () => {
    if (!validatePaymentDetails()) {
      return;
    }

    const ride = bookingModal.ride;
    const payload = {
      ride_id: ride.id,
      seats_booked: bookingModal.seatsToBook,
      pickup_location: ride.from,
      dropoff_location: ride.to,
      payment_method: bookingModal.paymentMethod,
      notes: ''
    };

    setBookingActionLoading(true);
    try {
      const res = await BookingsAPI.create(payload);
      console.log('Booking created:', res);
      // Refresh from backend to reflect DB-reserved seats
      await refreshRides();

      closeBookingModal();
      showToast(`Successfully requested booking (${bookingModal.seatsToBook} seat(s))`, 'success');
      // Redirect to profile or bookings page
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      console.error('Error booking ride:', err);
      if (err?.status === 422 && err?.data) {
        const errors = err.data.errors || err.data;
        const firstKey = errors && Object.keys(errors)[0];
        const firstMsg = firstKey ? (errors[firstKey][0] || errors[firstKey]) : err.message;
        showToast(`Failed: ${firstMsg}`, 'error');
      } else if (err?.status === 401) {
        showToast('Please login to book rides', 'error');
        navigate('/login', { state: { from: '/find-ride' } });
      } else {
        showToast('Failed to book ride. Please try again.', 'error');
      }
    } finally {
      setBookingActionLoading(false);
    }
  };

  const FiltersCard = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-5 h-5 text-blue-700" />
        <h2 className="text-xl font-semibold text-blue-700">Filters</h2>
      </div>

      <div className="space-y-4">
        {/* From */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">From</label>
          <div className="relative">
            <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.from}
              onChange={(e) => updateFilter('from', e.target.value)}
              placeholder="Enter pickup location"
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* To */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">To</label>
          <div className="relative">
            <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.to}
              onChange={(e) => updateFilter('to', e.target.value)}
              placeholder="Enter dropoff location"
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
          <div className="relative">
            <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={filters.date}
              onChange={(e) => updateFilter('date', e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
          <div className="relative">
            <Clock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="time"
              value={filters.time}
              onChange={(e) => updateFilter('time', e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Passengers */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Passengers</label>
          <div className="relative">
            <Users className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={filters.passengers}
              onChange={(e) => updateFilter('passengers', e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">1 Passenger</option>
              <option value="2">2 Passengers</option>
              <option value="3">3 Passengers</option>
              <option value="4">4 Passengers</option>
            </select>
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Price Range</label>
          <select
            value={filters.priceRange}
            onChange={(e) => updateFilter('priceRange', e.target.value)}
            className="w-full px-3 py-3 rounded-lg bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Prices</option>
            <option value="low">Low ($0-75)</option>
            <option value="medium">Medium ($75-120)</option>
            <option value="high">High ($120+)</option>
          </select>
        </div>

        {/* Driver Preference */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Driver Preference</label>
          <select
            value={filters.driverPreference}
            onChange={(e) => updateFilter('driverPreference', e.target.value)}
            className="w-full px-3 py-3 rounded-lg bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Drivers</option>
            <option value="female">Female Drivers</option>
            <option value="male">Male Drivers</option>
          </select>
        </div>

        {/* Search Button */}
        <button onClick={() => refreshRides()} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md cursor-pointer">
          <Search className="w-5 h-5" />
          Search Rides
        </button>
      </div>
    </div>
  );

  return (
    <>
      <section className="py-8 md:py-16 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 mt-16">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-700 mb-2">Find Your Ride</h1>
          <p className="text-slate-600">Discover available rides from your location and quickly, no matter your destination.</p>
        </div>

        <div className="grid lg:grid-cols-[350px_1fr] gap-6">
          {/* Mobile Filters Toggle */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((v) => !v)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm cursor-pointer"
            >
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <Filter className="w-5 h-5 text-blue-700" />
                personalise
              </span>
              <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileFiltersOpen && (
              <div className="mt-3">
                <FiltersCard />
              </div>
            )}
          </div>

          {/* Filters Panel - Sidebar (Desktop) */}
          <div className="hidden lg:block lg:sticky lg:top-24 h-fit">
            <FiltersCard />
          </div>

          {/* Results Section */}
          <div>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-slate-600">
                Found <span className="font-semibold text-blue-700 text-lg">{filteredRides.length}</span> available rides
              </p>
            </div>

            {/* Rides List */}
            <div className="space-y-4">
              {isLoadingRides ? (
                <div className="text-center py-12">
                  <div className="mx-auto mb-4">
                    <Spinner className="w-12 h-12" />
                  </div>
                  <p className="text-slate-500">Loading available rides...</p>
                </div>
              ) : (
                <>
                  {filteredRides.map((ride) => (
                    <div key={ride.id} className="bg-white rounded-2xl shadow-md p-6 border border-slate-200 hover:shadow-lg hover:border-blue-300 transition-all">
                      {/* Driver Info */}
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-md">
                          {ride.driver.initials}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-slate-900">{ride.driver.name}</h3>
                              {ride.driver?.gender && (
                                (() => {
                                  const g = (ride.driver.gender || '').toString().toLowerCase();
                                  const label = g === 'female' ? 'Female' : g === 'male' ? 'Male' : (ride.driver.gender || 'Other');
                                  const cls = g === 'female' ? 'bg-pink-100 text-pink-700' : g === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600';
                                  return (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
                                      {label}
                                    </span>
                                  );
                                })()
                              )}
                            </div>
                            {ride.driver.verified && (
                              <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded font-medium">
                                {ride.driver.displayGender} Driver
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                              <span className="font-medium">{ride.driver.rating}</span>
                            </div>
                            <span>•</span>
                            <span>{ride.driver.trips} trips</span>
                            <span>•</span>
                            <span className="text-slate-500">{ride.driver.vehicle}</span>
                          </div>
                        </div>
                      </div>

                      {/* Route Info */}
                      <div className="mb-6 bg-gray-50 rounded-xl p-4">
                        {/* Times Row */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-2xl font-bold text-blue-700 mb-1">{ride.departTime}</p>
                            <p className="text-sm text-slate-600 font-medium">{ride.from}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-700 mb-1">{ride.arriveTime}</p>
                            <p className="mt-8 text-sm text-slate-600 font-medium">{ride.to}</p>
                          </div>
                        </div>

                        {/* Route Line */}
                        <div className="flex flex-col items-center">
                          <div className="w-full h-0.5 bg-slate-300 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 rounded-full p-1.5">
                              <Car className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-4 font-medium">{ride.distance}</p>
                        </div>
                      </div>

                      {/* Price and Book - responsive: stack on mobile, inline on md+ */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                        <div className="flex gap-2 flex-wrap">
                          {ride.preferences.map((pref, idx) => (
                            <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium border border-blue-200">
                              {pref}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between w-full md:w-auto gap-4">
                          <div className="flex-1 flex items-center justify-between md:justify-end">
                            <div>
                              <p className="text-3xl font-bold text-orange-500">${ride.price}</p>
                              <p className="text-xs text-slate-500">{ride.seatsLeft} seats left</p>
                            </div>
                          </div>

                          <div className="w-full md:w-auto">
                            <button
                              onClick={() => handleBook(ride)}
                              disabled={!canReserve}
                              className={`w-full md:w-auto px-6 py-3 rounded-lg transition-colors shadow-md ${!canReserve ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white font-semibold cursor-pointer'}`}
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* No results / error */}
            {!isLoadingRides && ridesError ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center border border-slate-200">
                <Car className="w-16 h-16 text-red-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-600 mb-2">Failed to load rides</h3>
                <p className="text-slate-600">{ridesError}</p>
              </div>
            ) : (!isLoadingRides && filteredRides.length === 0) ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center border border-slate-200">
                <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No rides found</h3>
                <p className="text-slate-600">Try adjusting your filters to see more results</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModal.isOpen && bookingModal.ride && (
        <div className="fixed inset-0 z-9999 bg-black/50 overflow-y-auto flex items-start justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-blue-700">
                {bookingModal.step === 1 ? 'Ride Details' : 'Payment Method'}
              </h2>
              <button
                onClick={closeBookingModal}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    bookingModal.step === 1 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-green-600 text-white'
                  }`}>
                    {bookingModal.step === 1 ? '1' : <Check className="w-5 h-5" />}
                  </div>
                  <span className={`text-sm font-medium ${
                    bookingModal.step === 1 ? 'text-blue-700' : 'text-green-600'
                  }`}>Details</span>
                </div>
                <div className={`w-16 h-1 ${
                  bookingModal.step === 2 ? 'bg-blue-700' : 'bg-slate-300'
                }`} />
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    bookingModal.step === 2 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-slate-300 text-slate-600'
                  }`}>
                    2
                  </div>
                  <span className={`text-sm font-medium ${
                    bookingModal.step === 2 ? 'text-blue-700' : 'text-slate-600'
                  }`}>Payment</span>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6">
              {/* Step 1: Ride Details */}
              {bookingModal.step === 1 && (
                <div className="space-y-6">
                  {/* Driver Info */}
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Driver Information</h3>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                        {bookingModal.ride.driver.initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-3">
                            <h4 className="text-xl font-bold text-slate-900">{bookingModal.ride.driver.name}</h4>
                            {bookingModal.ride.driver?.gender && (
                              (() => {
                                const g = (bookingModal.ride.driver.gender || '').toString().toLowerCase();
                                const label = g === 'female' ? 'Female' : g === 'male' ? 'Male' : (bookingModal.ride.driver.gender || 'Other');
                                const cls = g === 'female' ? 'bg-pink-100 text-pink-700' : g === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600';
                                return (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
                                    {label}
                                  </span>
                                );
                              })()
                            )}
                          </div>
                          {bookingModal.ride.driver.verified && (
                            <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded font-medium">
                              {bookingModal.ride.driver.displayGender} Driver
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                            <span className="font-medium">{bookingModal.ride.driver.rating}</span>
                          </div>
                          <span>•</span>
                          <span>{bookingModal.ride.driver.trips} trips</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Car className="w-4 h-4" />
                          <span>{bookingModal.ride.driver.vehicle}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route Details */}
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Trip Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-green-600 mt-1" />
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Pick-up</p>
                          <p className="font-semibold text-slate-900">{bookingModal.ride.from}</p>
                          <p className="text-sm text-blue-700 font-medium mt-1">{bookingModal.ride.departTime}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-red-600 mt-1" />
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Drop-off</p>
                          <p className="font-semibold text-slate-900">{bookingModal.ride.to}</p>
                          <p className="text-sm text-blue-700 font-medium mt-1">{bookingModal.ride.arriveTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-700" />
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Date</p>
                          <p className="font-semibold text-slate-900">
                            {filters.date || new Date().toISOString().slice(0, 10)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-700" />
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Distance</p>
                          <p className="font-semibold text-slate-900">{bookingModal.ride.distance}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Summary */}
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Booking Summary</h3>
                    <div className="space-y-4">
                      {/* Seat Selection */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Select Number of Seats (Max: {bookingModal.ride.seatsLeft})
                        </label>
                        <select
                          value={bookingModal.seatsToBook}
                          onChange={(e) => handleSeatsChange(parseInt(e.target.value))}
                          className="w-full px-4 py-3 rounded-lg border border-blue-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from({ length: bookingModal.ride.seatsLeft }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>
                              {num} {num === 1 ? 'Seat' : 'Seats'}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Price per seat</span>
                        <span className="font-semibold text-slate-900">${bookingModal.ride.price}</span>
                      </div>
                      <div className="h-px bg-blue-200"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-blue-900">Total Amount</span>
                        <span className="text-2xl font-bold text-orange-500">
                          ${bookingModal.ride.price * bookingModal.seatsToBook}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  {bookingModal.ride.preferences && bookingModal.ride.preferences.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">Ride Preferences</h3>
                      <div className="flex gap-2 flex-wrap">
                        {bookingModal.ride.preferences.map((pref, idx) => (
                          <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium border border-blue-200">
                            {pref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Payment Method */}
              {bookingModal.step === 2 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mb-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Amount</h3>
                    <p className="text-3xl font-bold text-orange-500">
                      ${bookingModal.ride.price * bookingModal.seatsToBook}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {bookingModal.seatsToBook} {bookingModal.seatsToBook === 1 ? 'seat' : 'seats'} × ${bookingModal.ride.price}
                    </p>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Payment Method</h3>
                  
                  <div className="space-y-3">
                    {/* Cash */}
                    <button
                      onClick={() => handlePaymentMethodChange('cash')}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        bookingModal.paymentMethod === 'cash'
                          ? 'border-blue-700 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      } cursor-pointer`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          bookingModal.paymentMethod === 'cash'
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Wallet className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-slate-900">Cash</h4>
                          <p className="text-sm text-slate-600">Pay the driver directly</p>
                        </div>
                        {bookingModal.paymentMethod === 'cash' && (
                          <Check className="w-6 h-6 text-blue-700" />
                        )}
                      </div>
                    </button>

                    {/* Credit Card */}
                    <button
                      onClick={() => handlePaymentMethodChange('credit-card')}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        bookingModal.paymentMethod === 'credit-card'
                          ? 'border-blue-700 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      } cursor-pointer`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          bookingModal.paymentMethod === 'credit-card'
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-slate-900">Credit Card</h4>
                          <p className="text-sm text-slate-600">Pay securely with your card</p>
                        </div>
                        {bookingModal.paymentMethod === 'credit-card' && (
                          <Check className="w-6 h-6 text-blue-700" />
                        )}
                      </div>
                    </button>

                    {/* Credit Card Form */}
                    {bookingModal.paymentMethod === 'credit-card' && (
                      <div className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-200">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Card Number
                          </label>
                          <input
                            type="text"
                            value={bookingModal.paymentDetails.cardNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                              const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                              handlePaymentDetailChange('cardNumber', formatted);
                            }}
                            placeholder="1234 5678 9012 3456"
                            maxLength="19"
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            value={bookingModal.paymentDetails.cardName}
                            onChange={(e) => handlePaymentDetailChange('cardName', e.target.value)}
                            placeholder="John Doe"
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              value={bookingModal.paymentDetails.expiryDate}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, '');
                                if (value.length >= 2) {
                                  value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                }
                                handlePaymentDetailChange('expiryDate', value);
                              }}
                              placeholder="MM/YY"
                              maxLength="5"
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              CVV
                            </label>
                            <input
                              type="text"
                              value={bookingModal.paymentDetails.cvv}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                handlePaymentDetailChange('cvv', value);
                              }}
                              placeholder="123"
                              maxLength="3"
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PayPal */}
                    <button
                      onClick={() => handlePaymentMethodChange('paypal')}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        bookingModal.paymentMethod === 'paypal'
                          ? 'border-blue-700 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      } cursor-pointer`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          bookingModal.paymentMethod === 'paypal'
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <DollarSign className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-slate-900">PayPal</h4>
                          <p className="text-sm text-slate-600">Pay with your PayPal account</p>
                        </div>
                        {bookingModal.paymentMethod === 'paypal' && (
                          <Check className="w-6 h-6 text-blue-700" />
                        )}
                      </div>
                    </button>

                    {/* PayPal Form */}
                    {bookingModal.paymentMethod === 'paypal' && (
                      <div className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-200">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            PayPal Email
                          </label>
                          <input
                            type="email"
                            value={bookingModal.paymentDetails.paypalEmail}
                            onChange={(e) => handlePaymentDetailChange('paypalEmail', e.target.value)}
                            placeholder="your.email@example.com"
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            You will be redirected to PayPal to complete the payment securely.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex gap-3 rounded-b-2xl">
              {bookingModal.step === 1 ? (
                <>
                    <button
                      onClick={closeBookingModal}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition-colors cursor-pointer"
                    >
                    Cancel
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleBackStep}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={confirmBooking}
                    disabled={bookingActionLoading}
                    className={`flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors ${bookingActionLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {bookingActionLoading ? (
                      <><div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"/>Processing</>
                    ) : 'Confirm Booking'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
    </>
  );
};
