import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { MapPin, Calendar, Clock, Car, Users, DollarSign, Navigation } from 'lucide-react';
import useActionAvailability from '../hooks/useActionAvailability';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom component to handle map clicks
function MapClickHandler({ onLocationSelect, selectingFor }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng, selectingFor);
    },
  });
  return null;
}

function MapBoundsFitter({ pickUp, dropOff }) {
  const map = useMap();
  
  useEffect(() => {
    if (pickUp && dropOff) {
      const bounds = L.latLngBounds([
        [pickUp.lat, pickUp.lng],
        [dropOff.lat, dropOff.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pickUp, dropOff, map]);
  
  return null;
}

export const OfferRide = () => {
  const { isAuthenticated, user } = useAuth();
  const { loading: availabilityLoading, canOffer, reason: availabilityReason } = useActionAvailability();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [selectingFor, setSelectingFor] = useState(null); // 'pickUp' or 'dropOff'
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]); // Default center (London)
  const [formData, setFormData] = useState({
    // Step 1
    pickUp: '',
    dropOff: '',
    pickUpCoords: null,
    dropOffCoords: null,
    rideType: 'city-to-city',
    rideDate: '',
    hour: '',
    minute: '',
    period: 'AM',
    // Step 2
    vehicleModel: '',
    vehicleNumber: '',
    seats: '1',
    // Step 3
    pricePerSeat: '',
    allowSmoking: false,
    allowPets: false,
    allowMusic: true,
  });

  // Detect whether the authenticated user is already a registered driver
  // Consider both legacy profile fields and the new `vehicles` relation
  const isDriver = !!(
    user?.profile?.driver_license_number ||
    user?.profile?.is_driver_verified ||
    user?.profile?.vehicle_model ||
    (Array.isArray(user?.vehicles) && user.vehicles.length > 0)
  );

  // If the user is a driver, pre-fill vehicle details from their profile
  useEffect(() => {
    if (!user) return;
    if (isDriver) {
      setFormData(prev => ({
        ...prev,
        vehicleModel: prev.vehicleModel || user.profile?.vehicle_model || user.profile?.vehicleModel || user?.vehicles?.[0]?.model || '',
        vehicleNumber: prev.vehicleNumber || user.profile?.vehicle_number_plate || user.profile?.vehicle_number || user.profile?.vehicleNumber || user?.vehicles?.[0]?.number_plate || user?.vehicles?.[0]?.number || '',
      }));
    }
  }, [user]);

  // Validation patterns
  const patterns = {
    vehicleNumber: /^[A-Z0-9]{4,12}$/i,
    vehicleModel: /^[a-zA-Z0-9\s]{2,50}$/,
    // Location regex: letters, numbers, spaces, and basic punctuation (.,-'()) up to 399 chars
    // Examples: "123 Main Street, New York", "Chitkara University, Rajpura", "-33.865, 151.209"
    location: /^[a-zA-Z0-9\s,\.\-'()]{1,399}$/,
    price: /^\d+(\.\d{1,2})?$/,
  };

  const validateField = (field, value) => {
    let error = '';

    switch(field) {
      case 'pickUp':
      case 'dropOff': {
        const coordsKey = field === 'pickUp' ? 'pickUpCoords' : 'dropOffCoords';
        if (formData[coordsKey]) {
          // If coordinates are set (via map), consider valid regardless of input text
          error = '';
        } else if (!value.trim()) {
          error = 'This field is required';
        } else if (value.trim().length > 399) {
          error = 'Location must be less than 400 characters';
        } else if (!patterns.location.test(value.trim())) {
          error = "Invalid location format. Use letters, numbers, spaces, and basic punctuation (.,-'())";
        }
        break;
      }
      
      case 'rideDate':
        if (!value) {
          error = 'Please select a date';
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate < today) {
            error = 'Date cannot be in the past';
          }
        }
        break;

      case 'hour':
        const h = parseInt(value);
        if (!value || h < 1 || h > 12) {
          error = 'Hour must be between 1-12';
        }
        break;

      case 'minute':
        const m = parseInt(value);
        if (value === '' || m < 0 || m > 59) {
          error = 'Minute must be between 0-59';
        }
        break;

      case 'vehicleModel':
        if (!value.trim()) {
          error = 'Vehicle model is required';
        } else if (!patterns.vehicleModel.test(value)) {
          error = 'Invalid vehicle model format';
        }
        break;

      case 'vehicleNumber':
        if (!value.trim()) {
          error = 'Vehicle number is required';
        } else if (!patterns.vehicleNumber.test(value)) {
          error = 'Invalid format (e.g., PB10XX1234)';
        }
        break;

      case 'pricePerSeat':
        if (!value) {
          error = 'Price is required';
        } else if (!patterns.price.test(value) || parseFloat(value) <= 0) {
          error = 'Please enter a valid price';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const validateStep = (step) => {
    let isValid = true;
    const fieldsToValidate = {
      1: ['pickUp', 'dropOff', 'rideDate', 'hour', 'minute'],
      // Only require vehicle fields when the user is NOT already a driver
      2: isDriver ? [] : ['vehicleModel', 'vehicleNumber'],
      3: ['pricePerSeat'],
    };

    fieldsToValidate[step]?.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });

    return isValid;
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const startLocationSelection = (field) => {
    setSelectingFor(field);
    showToast(`Click on the map to select ${field === 'pickUp' ? 'pick-up' : 'drop-off'} location`, 'info');
  };

  const handleLocationSelect = async (latlng, field) => {
    if (!selectingFor) return;

    // Optimistically set coords and a short lat,lng string so validation passes immediately
    setFormData(prev => ({
      ...prev,
      [field]: `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`,
      [`${field}Coords`]: { lat: latlng.lat, lng: latlng.lng }
    }));
    setErrors(prev => ({ ...prev, [field]: '' }));

    try {
      // Reverse geocoding to get address from coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = await response.json();
      const address = (data.display_name || 'Selected location').slice(0, 399);

      setFormData(prev => ({
        ...prev,
        [field]: address,
        [`${field}Coords`]: { lat: latlng.lat, lng: latlng.lng }
      }));
      setErrors(prev => ({ ...prev, [field]: '' }));

      setSelectingFor(null);
      showToast(`${field === 'pickUp' ? 'Pick-up' : 'Drop-off'} location set!`, 'success');
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      // Keep optimistic lat,lng text as fallback
      setErrors(prev => ({ ...prev, [field]: '' }));
      setSelectingFor(null);
      showToast('Location set!', 'success');
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) setCurrentStep(currentStep + 1);
    } else {
      showToast('Please fill in all required fields correctly', 'error');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep === 3) {
      if (validateStep(3)) {
        if (!isAuthenticated) {
          showToast('Please login to create a ride', 'error');
          navigate('/login', { state: { from: '/offer-ride' } });
          return;
        }

        // Build payload matching backend expectations (snake_case)
        const hour = parseInt(formData.hour || '0', 10);
        let hh = hour;
        if (formData.period === 'PM' && hour < 12) hh = hour + 12;
        if (formData.period === 'AM' && hour === 12) hh = 0;
        const mm = String(parseInt(formData.minute || '0', 10)).padStart(2, '0');
        const timeStr = `${String(hh).padStart(2, '0')}:${mm}`;

        const payload = {
          from_location: formData.pickUp,
          to_location: formData.dropOff,
          from_latitude: formData.pickUpCoords?.lat ?? null,
          from_longitude: formData.pickUpCoords?.lng ?? null,
          to_latitude: formData.dropOffCoords?.lat ?? null,
          to_longitude: formData.dropOffCoords?.lng ?? null,
          ride_date: formData.rideDate,
          ride_time: timeStr,
          seats_available: parseInt(formData.seats || '1', 10),
          price_per_seat: parseFloat(formData.pricePerSeat || 0),
          vehicle_model: formData.vehicleModel || null,
          vehicle_number: formData.vehicleNumber || null,
          allow_smoking: !!formData.allowSmoking,
          allow_pets: !!formData.allowPets,
          allow_music: !!formData.allowMusic,
        };

        try {
          const res = await api('/rides', { method: 'POST', body: payload });
          // Backend returns data => { ride: ... } wrapped in data
          console.log('Ride created response:', res);
          showToast('Ride offer created successfully! 🎉', 'success');
          // Redirect to profile or my rides
          setTimeout(() => {
            navigate('/profile');
          }, 1200);
        } catch (err) {
          console.error('Error creating ride:', err);
          if (err?.status === 422 && err?.data) {
            // Show first validation error
            const errors = err.data.errors || err.data;
            const firstKey = errors && Object.keys(errors)[0];
            const firstMsg = firstKey ? (errors[firstKey][0] || errors[firstKey]) : err.message;
            showToast(`Failed: ${firstMsg}`, 'error');
          } else if (err?.status === 401) {
            showToast('Unauthorized. Please login again.', 'error');
            navigate('/login', { state: { from: '/offer-ride' } });
          } else {
            showToast('Failed to create ride. Please try again.', 'error');
          }
        }
      }
    }
  };

  const steps = [
    { number: 1, label: 'Route' },
    { number: 2, label: 'Vehicle' },
    { number: 3, label: 'Details' },
  ];

  const showAvailabilityModal = !availabilityLoading && !canOffer;

  return (
    <>
      <section className="py-8 md:py-16 bg-white/80 min-h-screen">
        <div className="container mx-auto px-4">
          {/* Hero Title */}
          <div className="text-center mt-10 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-700 mb-2">Offer A Ride On Your Journey</h1>
            <Navigation className="w-6 h-6 text-white mx-auto" />
          </div>

          {/* Step Indicator (hidden when user cannot offer) */}
          {!showAvailabilityModal && (
            <div className="flex justify-center items-center mb-8 max-w-md mx-auto">
              {steps.map((step, idx) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                        currentStep >= step.number
                          ? 'bg-orange-500 text-white'
                          : 'bg-white border border-orange-500 text-slate-400'
                      }`}
                    >
                      {step.number}
                    </div>
                    <span className="text-white text-xs mt-1">{step.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 ${currentStep > step.number ? 'bg-orange-500' : 'bg-white/30'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Form Container */}
          <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_400px] gap-6">
            {/* Left: Form Card */}
            <div className={(!availabilityLoading && !canOffer)
              ? 'rounded-2xl p-0 bg-transparent shadow-none'
              : 'bg-white rounded-2xl shadow-xl p-6 md:p-8'}>
              {/* If user cannot offer, show the blocking message in place of the form */}
              {(!availabilityLoading && !canOffer) ? (
                <>
                  {/* keep the left column height so layout doesn't jump */}
                  <div className="min-h-[420px]" />

                  {/* Full-viewport centered blocking message (no shadow) */}
                  <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" style={{padding: '1rem'}}>
                    <div role="alert" aria-live="polite" className="pointer-events-auto max-w-md w-[min(92%,420px)] bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center gap-4 text-center">
                      <div className="text-4xl animate-pulse">😡</div>
                      <h3 className="text-xl font-semibold text-red-700">Sorry — you can't offer another ride yet</h3>
                      <p className="text-sm text-red-600">{availabilityReason || "You can't offer two rides until finishing the previous one."}</p>
                      <div className="mt-2">
                        <button
                          onClick={() => navigate('/profile')}
                          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold"
                        >
                          Manage my rides
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSubmit}>
                {/* Step 1: Route & Time */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Pick Up</label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={formData.pickUp}
                            onChange={(e) => updateField('pickUp', e.target.value)}
                            onBlur={(e) => validateField('pickUp', e.target.value)}
                            placeholder="Enter location or click map"
                            className={`w-full pl-10 pr-3 py-3 rounded-lg border ${errors.pickUp ? 'border-red-500' : 'border-slate-300'} placeholder-slate-400 focus:outline-none focus:ring-2 ${errors.pickUp ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => startLocationSelection('pickUp')}
                          className={`px-4 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors ${
                            selectingFor === 'pickUp' ? 'bg-blue-100 border-blue-500' : ''
                          } cursor-pointer`}
                        >
                          <MapPin className="w-5 h-5" />
                        </button>
                      </div>
                      {errors.pickUp && <p className="mt-1 text-xs text-red-600">{errors.pickUp}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Drop-Off</label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={formData.dropOff}
                            onChange={(e) => updateField('dropOff', e.target.value)}
                            onBlur={(e) => validateField('dropOff', e.target.value)}
                            placeholder="Drop location or click map"
                            className={`w-full pl-10 pr-3 py-3 rounded-lg border ${errors.dropOff ? 'border-red-500' : 'border-slate-300'} placeholder-slate-400 focus:outline-none focus:ring-2 ${errors.dropOff ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => startLocationSelection('dropOff')}
                          className={`px-4 py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors ${
                            selectingFor === 'dropOff' ? 'bg-blue-100 border-blue-500' : ''
                          } cursor-pointer`}
                        >
                          <MapPin className="w-5 h-5" />
                        </button>
                      </div>
                      {errors.dropOff && <p className="mt-1 text-xs text-red-600">{errors.dropOff}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Ride Type</label>
                      <select
                        value={formData.rideType}
                        onChange={(e) => updateField('rideType', e.target.value)}
                        className="w-full px-3 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="city-to-city">City to City</option>
                        <option value="city-to-neighborhood">City to Neighborhood</option>
                        <option value="home-to-work">Home to Work</option>
                        <option value="general">General</option>
                      </select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-blue-700 mb-2">Ride Date</label>
                        <div className="relative">
                          <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="date"
                            value={formData.rideDate}
                            onChange={(e) => updateField('rideDate', e.target.value)}
                            onBlur={(e) => validateField('rideDate', e.target.value)}
                            className={`w-full pl-10 pr-3 py-3 rounded-lg border ${errors.rideDate ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.rideDate ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                          />
                        </div>
                        {errors.rideDate && <p className="mt-1 text-xs text-red-600">{errors.rideDate}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-blue-700 mb-2">Ride Time</label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <input
                              type="number"
                              min="1"
                              max="12"
                              value={formData.hour}
                              onChange={(e) => updateField('hour', e.target.value)}
                              onBlur={(e) => validateField('hour', e.target.value)}
                              placeholder="HH"
                              className={`w-16 px-2 py-3 rounded-lg border ${errors.hour ? 'border-red-500' : 'border-slate-300'} placeholder-slate-400 text-center focus:outline-none focus:ring-2 ${errors.hour ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                            />
                          </div>
                          <span className="flex items-center">:</span>
                          <div className="flex-1">
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={formData.minute}
                              onChange={(e) => updateField('minute', e.target.value)}
                              onBlur={(e) => validateField('minute', e.target.value)}
                              placeholder="MM"
                              className={`w-16 px-2 py-3 rounded-lg border ${errors.minute ? 'border-red-500' : 'border-slate-300'} placeholder-slate-400 text-center focus:outline-none focus:ring-2 ${errors.minute ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                            />
                          </div>
                          <select
                            value={formData.period}
                            onChange={(e) => updateField('period', e.target.value)}
                            className="px-3 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option>AM</option>
                            <option>PM</option>
                          </select>
                        </div>
                        {(errors.hour || errors.minute) && (
                          <p className="mt-1 text-xs text-red-600">{errors.hour || errors.minute}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Steps 2 & 3 remain the same */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    {isDriver ? (
                      // For existing drivers: show their vehicle info read-only but allow seats selection
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">Your Vehicle</h3>
                        <div className="flex flex-col gap-2 text-slate-700">
                          <div className="flex items-center gap-2">
                            <Car className="w-5 h-5 text-slate-400" />
                            <span className="font-medium">{formData.vehicleModel || user?.vehicles?.[0]?.model || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-semibold">#</span>
                            <span className="font-medium">{formData.vehicleNumber || user?.vehicles?.[0]?.number_plate || user?.vehicles?.[0]?.number || '—'}</span>
                          </div>
                          <div className="text-sm text-slate-500">These details are taken from your profile. If you need to use a different vehicle, update your profile first.</div>

                          {/* Seats selection: drivers can still choose how many seats to offer */}
                          <div className="mt-3">
                            <label className="block text-sm font-semibold text-blue-700 mb-2">Available Seats</label>
                            <div className="relative">
                              <Users className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <select
                                value={formData.seats}
                                onChange={(e) => updateField('seats', e.target.value)}
                                className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="1">1 Seat</option>
                                <option value="2">2 Seats</option>
                                <option value="3">3 Seats</option>
                                <option value="4">4 Seats</option>
                                <option value="5">5+ Seats</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // For passengers or non-driver users: show inputs to add vehicle details
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-blue-700 mb-2">Vehicle Model</label>
                          <div className="relative">
                            <Car className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={formData.vehicleModel}
                              onChange={(e) => updateField('vehicleModel', e.target.value)}
                              onBlur={(e) => validateField('vehicleModel', e.target.value)}
                              placeholder="e.g., Honda City 2020"
                              className={`w-full pl-10 pr-3 py-3 rounded-lg border ${errors.vehicleModel ? 'border-red-500' : 'border-slate-300'} placeholder-slate-400 focus:outline-none focus:ring-2 ${errors.vehicleModel ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                            />
                          </div>
                          {errors.vehicleModel && <p className="mt-1 text-xs text-red-600">{errors.vehicleModel}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-blue-700 mb-2">Vehicle Number</label>
                          <input
                            type="text"
                            value={formData.vehicleNumber}
                            onChange={(e) => updateField('vehicleNumber', e.target.value.toUpperCase())}
                            onBlur={(e) => validateField('vehicleNumber', e.target.value)}
                            placeholder="e.g., PB10XX1234"
                            className={`w-full px-3 py-3 rounded-lg border ${errors.vehicleNumber ? 'border-red-500' : 'border-slate-300'} placeholder-slate-400 focus:outline-none focus:ring-2 ${errors.vehicleNumber ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                          />
                          {errors.vehicleNumber && <p className="mt-1 text-xs text-red-600">{errors.vehicleNumber}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-blue-700 mb-2">Available Seats</label>
                          <div className="relative">
                            <Users className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <select
                              value={formData.seats}
                              onChange={(e) => updateField('seats', e.target.value)}
                              className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="1">1 Seat</option>
                              <option value="2">2 Seats</option>
                              <option value="3">3 Seats</option>
                              <option value="4">4 Seats</option>
                              <option value="5">5+ Seats</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Price Per Seat</label>
                      <div className="relative">
                        <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.pricePerSeat}
                          onChange={(e) => updateField('pricePerSeat', e.target.value)}
                          onBlur={(e) => validateField('pricePerSeat', e.target.value)}
                          placeholder="0.00"
                          className={`w-full pl-10 pr-3 py-3 rounded-lg border ${errors.pricePerSeat ? 'border-red-500' : 'border-slate-300'} placeholder-slate-400 focus:outline-none focus:ring-2 ${errors.pricePerSeat ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                        />
                      </div>
                      {errors.pricePerSeat && <p className="mt-1 text-xs text-red-600">{errors.pricePerSeat}</p>}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-blue-700">Preferences</h3>
                      <label className="flex items-center gap-3 text-slate-700">
                        <input
                          type="checkbox"
                          checked={formData.allowSmoking}
                          onChange={(e) => updateField('allowSmoking', e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                        />
                        <span>Allow smoking</span>
                      </label>
                      <label className="flex items-center gap-3 text-slate-700">
                        <input
                          type="checkbox"
                          checked={formData.allowPets}
                          onChange={(e) => updateField('allowPets', e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                        />
                        <span>Allow pets</span>
                      </label>
                      <label className="flex items-center gap-3 text-slate-700">
                        <input
                          type="checkbox"
                          checked={formData.allowMusic}
                          onChange={(e) => updateField('allowMusic', e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                        />
                        <span>Allow music</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 mt-08">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                  {currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="mt-4 flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer"
                      >
                        Continue
                      </button>
                    ) : (
                      <div className="w-full">
                        {/* Show availability message when loaded */}
                        {!availabilityLoading && !canOffer && (
                          <div role="alert" aria-live="polite" className="mb-3">
                            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="text-2xl animate-pulse">😡</div>
                              <div>
                                <div className="font-semibold text-red-700">Sorry — you can't offer another ride yet</div>
                                <div className="text-sm text-red-600">{availabilityReason || "You can't offer two rides until finishing the previous one."}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={!canOffer}
                          className={`flex-1 w-full ${!canOffer ? 'opacity-50 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800'} text-white font-semibold py-3 rounded-lg transition-colors`}
                        >
                          {availabilityLoading ? 'Checking...' : 'Create Ride'}
                        </button>
                      </div>
                    )}
                </div>
              </form>
              )}
            </div>

            {/* Right: Interactive Map (hidden when user cannot offer) */}
            {!showAvailabilityModal && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="w-full h-96 md:h-full">
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {selectingFor && (
                      <MapClickHandler 
                        onLocationSelect={handleLocationSelect} 
                        selectingFor={selectingFor}
                      />
                    )}
                    {formData.pickUpCoords && (
                      <Marker 
                        position={[formData.pickUpCoords.lat, formData.pickUpCoords.lng]}
                        icon={pickupIcon}
                      />
                    )}
                    {formData.dropOffCoords && (
                      <Marker 
                        position={[formData.dropOffCoords.lat, formData.dropOffCoords.lng]}
                        icon={dropoffIcon}
                      />
                    )}
                    {formData.pickUpCoords && formData.dropOffCoords && (
                      <Polyline
                        positions={[
                          [formData.pickUpCoords.lat, formData.pickUpCoords.lng],
                          [formData.dropOffCoords.lat, formData.dropOffCoords.lng]
                        ]}
                        color="#0000cd"
                        weight={6}
                        opacity={0.8}
                      />
                    )}
                    <MapBoundsFitter 
                      pickUp={formData.pickUpCoords} 
                      dropOff={formData.dropOffCoords} 
                    />
                  </MapContainer>
                </div>
                <div className="p-4 bg-slate-50 border-t">
                  <p className="text-sm text-slate-600 text-center">
                    {selectingFor 
                      ? `Click on the map to select ${selectingFor === 'pickUp' ? 'pick-up' : 'drop-off'} location`
                      : 'Click the map pin buttons to select locations'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        
      </section>
    </>
  );
};