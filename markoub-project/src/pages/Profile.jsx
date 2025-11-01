import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Car, Users, DollarSign, Clock, Edit2, Save, X, Palette, Plus } from 'lucide-react';
import { useToast } from '../components/Toast';
import { RidesAPI, BookingsAPI } from '../utils/api';

// Will load offered and reserved rides from backend APIs

export const Profile = () => {
  const { isAuthenticated, user, logout, isAuthLoading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('offered'); // 'info', 'offered', 'reserved'
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    bio: '',
    // vehicle fields
    driver_license_number: '',
    vehicle_model: '',
    vehicle_number_plate: '',
    vehicle_color: '',
    vehicle_year: ''
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);
  const [rides, setRides] = useState({ offered: [], reserved: [] });
  const [isLoadingRides, setIsLoadingRides] = useState(true);
  const [actionLoading, setActionLoading] = useState({ id: null, type: null });

  // Small inline spinner used for buttons and loading placeholders
  const Spinner = ({ className = '' }) => (
    <div className={`inline-block ${className}`}>
      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  useEffect(() => {
    if (isAuthLoading) return; // wait for auth initialization
    if (!isAuthenticated) {
      showToast('Please login to view your profile', 'error');
      navigate('/login');
      return;
    }

    // Load profile data from localStorage or use auth user data (populate vehicle fields too)
    try {
      const savedProfile = localStorage.getItem(`profile_${user?.email}`);
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      } else {
        // Prefer explicit first/last from API, fall back to profile fields, then split full name
        let fn = user?.first_name || user?.profile?.first_name || '';
        let ln = user?.last_name || user?.profile?.last_name || '';
        const fullName = user?.name || '';
        if (!fn && !ln && fullName) {
          const parts = fullName.trim().split(/\s+/);
          fn = parts.shift() || '';
          ln = parts.join(' ') || '';
        } else if (fn && !ln && fullName) {
          // try to derive last name from full name when only first exists
          const parts = fullName.trim().split(/\s+/);
          if (parts.length > 1) {
            // remove matching firstName from start if present
            if (parts[0] === fn) parts.shift();
            ln = parts.join(' ');
          }
        }
        setProfileData({
          firstName: fn,
          lastName: ln,
          email: user?.email || '',
          phone: user?.profile?.phone || user?.phone || '',
          city: user?.profile?.city || '',
          bio: user?.profile?.bio || '',
          driver_license_number: user?.profile?.driver_license_number || '',
          vehicle_model: user?.profile?.vehicle_model || '',
          vehicle_number_plate: user?.profile?.vehicle_number_plate || user?.profile?.vehicle_number || '',
          vehicle_color: user?.profile?.vehicle_color || '',
          vehicle_year: user?.profile?.vehicle_year || ''
        });
        setAvatarPreview(user?.profile?.avatar_url || null);
      }
    } catch {
      // Fallback initialization if parsing failed — try to populate first/last where possible
      const fallbackFirst = user?.first_name || user?.profile?.first_name || (user?.name ? (user.name.split(/\s+/)[0] || '') : '');
      const fallbackLast = user?.last_name || user?.profile?.last_name || (user?.name ? (user.name.split(/\s+/).slice(1).join(' ') || '') : '');
      setProfileData({
        firstName: fallbackFirst,
        lastName: fallbackLast,
        email: user?.email || '',
        phone: user?.profile?.phone || user?.phone || '',
        city: user?.profile?.city || '',
        bio: user?.profile?.bio || '',
        driver_license_number: user?.profile?.driver_license_number || '',
        vehicle_model: user?.profile?.vehicle_model || '',
        vehicle_number_plate: user?.profile?.vehicle_number_plate || user?.profile?.vehicle_number || '',
        vehicle_color: user?.profile?.vehicle_color || '',
        vehicle_year: user?.profile?.vehicle_year || ''
      });
    }

    // Load user rides from API
    async function loadRides() {
      setIsLoadingRides(true);
      try {
        const [offeredRes, reservedRes] = await Promise.all([
          RidesAPI.myRides(),
          BookingsAPI.list(),
        ]);

        // Normalize shapes to match existing UI expectations
        const rawOffered = Array.isArray(offeredRes?.data || offeredRes) ? (offeredRes.data || offeredRes) : [];
        // Filter out cancelled or soft-deleted offers and normalize, include bookings
        const offered = rawOffered
          .filter(r => {
            const s = (r.status || '').toLowerCase();
            return s !== 'cancelled' && s !== 'done' && s !== 'completed' && !r.deleted_at;
          })
          .map(r => ({
            id: r.id,
            from: r.from_location || r.from || '',
            to: r.to_location || r.to || '',
            date: r.ride_date || r.date || '',
            time: r.ride_time || r.time || '',
            seats: r.seats_available ?? r.seats ?? 0,
            price: r.price_per_seat ?? r.price ?? 0,
            vehicle: {
              model: r.vehicle_model || (r.vehicle?.model ?? ''),
              number: r.vehicle_number || (r.vehicle?.number ?? ''),
            },
              bookings: Array.isArray(r.bookings || []) ? (r.bookings || []).map(b => ({
              status: b.status,
              booking_id: b.id,
              passenger_name: (b.passenger?.first_name || '') + (b.passenger?.last_name ? ` ${b.passenger.last_name}` : ''),
              passenger_phone: b.passenger?.phone || '',
              seats_booked: b.seats_booked,
              status: b.status,
            })) : [],
          }));
        const reservedRaw = Array.isArray(reservedRes?.data || reservedRes) ? (reservedRes.data || reservedRes) : [];
        // Filter out cancelled bookings and ones without a ride
        const reserved = (reservedRaw || []).filter(b => {
          const status = (b.status || '').toLowerCase();
          const rideStatus = (b.ride?.status || '').toLowerCase();
          return status !== 'cancelled' && status !== 'deleted' && b.ride && rideStatus !== 'done' && rideStatus !== 'completed';
        }).map(b => {
          const drv = b.ride?.driver || {};
          const driverName = drv.name || (drv.profile ? (`${drv.profile.first_name || ''} ${drv.profile.last_name || ''}`).trim() : '') || (`${drv.first_name || ''} ${drv.last_name || ''}`).trim() || '';
          const driverPhone = drv.phone || drv.profile?.phone || '';
          const rideDriverId = b.ride?.driver?.id || b.ride?.driver_id || null;
          const canConfirm = (rideDriverId && user?.id && rideDriverId === user.id) || (user?.role === 'admin');

          return {
            id: b.id,
            from: b.ride?.from_location || b.ride?.from || '',
            to: b.ride?.to_location || b.ride?.to || '',
            date: b.ride?.ride_date || b.ride?.date || '',
            time: b.ride?.ride_time || b.ride?.time || '',
            driver: { name: driverName, phone: driverPhone },
            price: b.total_price ? (b.total_price / (b.seats_booked || 1)) : b.ride?.price_per_seat || 0,
            seatsReserved: b.seats_booked,
            booking_id: b.id,
            ride_driver_id: rideDriverId,
            canConfirm,
            status: b.status || '',
          };
        });

        setRides({ offered, reserved });
      } catch (err) {
        // Keep empty arrays on error
        setRides({ offered: [], reserved: [] });
      } finally {
        setIsLoadingRides(false);
      }
    }

    if (user?.email) loadRides();
  }, [isAuthenticated, user, navigate, showToast]);

  const handleSave = () => {
    (async () => {
      try {
        // If user selected an avatar file, use FormData
        let payload;
        if (avatarFile) {
          payload = new FormData();
          payload.append('avatar', avatarFile);
          payload.append('first_name', profileData.firstName);
          payload.append('last_name', profileData.lastName);
          payload.append('phone', profileData.phone || '');
          payload.append('city', profileData.city || '');
          payload.append('bio', profileData.bio || '');
          if (profileData.driver_license_number) payload.append('driver_license_number', profileData.driver_license_number);
          if (profileData.vehicle_model) payload.append('vehicle_model', profileData.vehicle_model);
          if (profileData.vehicle_number_plate) payload.append('vehicle_number_plate', profileData.vehicle_number_plate);
          if (profileData.vehicle_color) payload.append('vehicle_color', profileData.vehicle_color);
          if (profileData.vehicle_year) payload.append('vehicle_year', profileData.vehicle_year);
        } else {
          payload = {
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            phone: profileData.phone,
            city: profileData.city,
            bio: profileData.bio,
            driver_license_number: profileData.driver_license_number || undefined,
            vehicle_model: profileData.vehicle_model || undefined,
            vehicle_number_plate: profileData.vehicle_number_plate || undefined,
            vehicle_color: profileData.vehicle_color || undefined,
            vehicle_year: profileData.vehicle_year || undefined,
          };
        }

        if (updateProfile) {
          await updateProfile(payload);
        }
        // persist a local copy as well
        try { localStorage.setItem(`profile_${user?.email}`, JSON.stringify(profileData)); } catch {}
        showToast('Profile updated successfully!', 'success');
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update profile', error);
        showToast('Failed to update profile', 'error');
      }
    })();
  };

  const handleCancel = () => {
    // Reload from localStorage
    try {
      const savedProfile = localStorage.getItem(`profile_${user?.email}`);
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      }
    } catch {}
    setIsEditing(false);
  };

  const updateField = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const cancelRide = async (rideId, type, bookingId = null) => {
    const actionId = bookingId || rideId;
    const actionType = type === 'reserved' ? 'reservation-cancel' : 'offered-cancel';
    setActionLoading({ id: actionId, type: actionType });
    try {
      if (type === 'reserved') {
        // Cancel booking via API
        if (!bookingId) {
          showToast('Missing booking id', 'error');
          return;
        }
        await BookingsAPI.cancel(bookingId);
        showToast('Reservation cancelled', 'success');
      } else {
        // Offered ride - delete ride via API
        await RidesAPI.delete(rideId);
        showToast('Offer cancelled', 'success');
      }

      // Refresh lists
      const [offeredRes, reservedRes] = await Promise.all([RidesAPI.myRides(), BookingsAPI.list()]);
      const rawOffered = Array.isArray(offeredRes?.data || offeredRes) ? (offeredRes.data || offeredRes) : [];
      const rawReserved = Array.isArray(reservedRes?.data || reservedRes) ? (reservedRes.data || reservedRes) : [];

      const offered = rawOffered
        .filter(r => {
          const s = (r.status || '').toLowerCase();
          return s !== 'cancelled' && s !== 'done' && s !== 'completed' && !r.deleted_at;
        })
        .map(r => ({
          id: r.id,
          from: r.from_location || r.from || '',
          to: r.to_location || r.to || '',
          date: r.ride_date || r.date || '',
          time: r.ride_time || r.time || '',
          seats: r.seats_available ?? r.seats ?? 0,
          price: r.price_per_seat ?? r.price ?? 0,
          vehicle: {
            model: r.vehicle_model || (r.vehicle?.model ?? ''),
            number: r.vehicle_number || (r.vehicle?.number ?? ''),
          },
        }));

      let reserved = (rawReserved || []).filter(b => {
        const status = (b.status || '').toLowerCase();
        const rideStatus = (b.ride?.status || '').toLowerCase();
        return status !== 'cancelled' && status !== 'deleted' && b.ride && rideStatus !== 'done' && rideStatus !== 'completed';
      }).map(b => {
        const drv = b.ride?.driver || {};
        const driverName = drv.name || drv.email || (drv.profile ? (`${drv.profile.first_name || ''} ${drv.profile.last_name || ''}`).trim() : '') || '';
        return {
          id: b.id,
          from: b.ride?.from_location || b.ride?.from || '',
          to: b.ride?.to_location || b.ride?.to || '',
          date: b.ride?.ride_date || b.ride?.date || '',
          time: b.ride?.ride_time || b.ride?.time || '',
          driver: driverName,
          price: b.total_price ? (b.total_price / (b.seats_booked || 1)) : b.ride?.price_per_seat || 0,
          seatsReserved: b.seats_booked,
          status: b.status || '',
          booking_id: b.id,
        };
      });

      setRides({ offered, reserved });
  // preserve optimistic statuses
  const mergedReserved = mergePreservedStatuses(reserved, rides.reserved || []);
  setRides({ offered, reserved: mergedReserved });
    } catch (error) {
      showToast('Failed to cancel ride', 'error');
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  // Helpers for timed cancellation/penalty logic
  const parseRideDateTime = (dateStr, timeStr) => {
    try {
      // Try to build a Date from date + time parts
      // dateStr expected like '2025-10-31' or '31/10/2025' (best-effort)
      const d = new Date(dateStr);
      if (!isNaN(d.getTime()) && timeStr) {
        // Extract hours and minutes from timeStr (handles '08:30', '8:30 AM', '08:30 AM')
        const m = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/);
        if (m) {
          let hours = parseInt(m[1], 10);
          const mins = parseInt(m[2] || '0', 10);
          const ampm = m[3];
          if (ampm) {
            const up = ampm.toUpperCase();
            if (up === 'PM' && hours < 12) hours += 12;
            if (up === 'AM' && hours === 12) hours = 0;
          }
          d.setHours(hours, mins, 0, 0);
          return d;
        }
      }
      // fallback: try Date.parse of combined string
      const combined = `${dateStr} ${timeStr || ''}`;
      const parsed = new Date(combined);
      if (!isNaN(parsed.getTime())) return parsed;
    } catch (e) {
      // ignore
    }
    return null;
  };

  const getCancellationCutoffHours = (timeUntilHours) => {
    // Tiered cutoff logic (in hours)
    // If ride is within 24h -> cutoff = 1 hour
    // If ride is between 24h and 36h -> cutoff = 12 hours
    // If ride is more than 36h -> cutoff = 24 hours
    if (timeUntilHours <= 24) return 1;
    if (timeUntilHours <= 36) return 12;
    return 24;
  };

  // Preserve optimistic statuses (e.g. passenger_confirmed) across refreshes
  const mergePreservedStatuses = (newReserved, prevReserved) => {
    try {
      const statusMap = new Map((prevReserved || []).map(p => [(p.booking_id || p.id), p.status]));
      return (newReserved || []).map(b => {
        const key = b.booking_id || b.id;
        const prevStatus = statusMap.get(key);
        // Preserve the passenger_confirmed optimistic status only if the server result did not provide a status
        if (prevStatus === 'passenger_confirmed' && (!b.status || b.status === '')) {
          return { ...b, status: prevStatus };
        }
        return b;
      });
    } catch (e) {
      return newReserved;
    }
  };

  const confirmAndCancelReservation = async (ride) => {
    // ride object comes from reserved map and includes booking_id, date, time
    const bookingId = ride.booking_id || ride.id;
    if (!bookingId) {
      showToast('Missing booking id for cancellation', 'error');
      console.error('confirmAndCancelReservation called without booking id', ride);
      return;
    }
    const dt = parseRideDateTime(ride.date, ride.time);
    let timeUntilHours = null;
    if (dt) {
      const diffMs = dt.getTime() - Date.now();
      timeUntilHours = diffMs / (1000 * 60 * 60);
    }

    const cutoff = (typeof timeUntilHours === 'number') ? getCancellationCutoffHours(timeUntilHours) : null;
    const willPenalty = (cutoff !== null && timeUntilHours !== null) ? (timeUntilHours <= cutoff) : false;

    // Build message
    let message = '';
    if (cutoff === null) {
      message = 'Are you sure you want to cancel this reservation? A penalty may apply depending on timing.';
    } else {
      message = `Cancellation policy:\n- Free cancellation until ${cutoff} hour(s) before departure.\n` +
        `You are ${timeUntilHours.toFixed(1)} hour(s) away from departure.`;
      if (willPenalty) {
        message += '\n\nCancelling now WILL incur a penalty fee. Do you want to continue?';
      } else {
        message += '\n\nCancelling now will NOT incur a penalty. Do you want to continue?';
      }
    }

    const proceed = window.confirm(message);
    if (!proceed) return;

    setActionLoading({ id: bookingId, type: 'reservation-cancel' });
    try {
      await BookingsAPI.cancel(bookingId);
      showToast('Reservation cancelled', 'success');
      // Refresh lists
      const [offeredRes, reservedRes] = await Promise.all([RidesAPI.myRides(), BookingsAPI.list()]);
      const rawOffered = Array.isArray(offeredRes?.data || offeredRes) ? (offeredRes.data || offeredRes) : [];
      const rawReserved = Array.isArray(reservedRes?.data || reservedRes) ? (reservedRes.data || reservedRes) : [];

      const offered = rawOffered
        .filter(r => {
          const s = (r.status || '').toLowerCase();
          return s !== 'cancelled' && s !== 'done' && s !== 'completed' && !r.deleted_at;
        })
        .map(r => ({
          id: r.id,
          from: r.from_location || r.from || '',
          to: r.to_location || r.to || '',
          date: r.ride_date || r.date || '',
          time: r.ride_time || r.time || '',
          seats: r.seats_available ?? r.seats ?? 0,
          price: r.price_per_seat ?? r.price ?? 0,
          vehicle: {
            model: r.vehicle_model || (r.vehicle?.model ?? ''),
            number: r.vehicle_number || (r.vehicle?.number ?? ''),
          },
        }));

      const reserved = (rawReserved || []).filter(b => {
        const status = (b.status || '').toLowerCase();
        const rideStatus = (b.ride?.status || '').toLowerCase();
        return status !== 'cancelled' && status !== 'deleted' && b.ride && rideStatus !== 'done' && rideStatus !== 'completed';
      }).map(b => {
        const drv = b.ride?.driver || {};
        const driverName = drv.name || (drv.profile ? (`${drv.profile.first_name || ''} ${drv.profile.last_name || ''}`).trim() : '') || (`${drv.first_name || ''} ${drv.last_name || ''}`).trim() || '';
        const driverPhone = drv.phone || drv.profile?.phone || '';
        return {
          id: b.id,
          from: b.ride?.from_location || b.ride?.from || '',
          to: b.ride?.to_location || b.ride?.to || '',
          date: b.ride?.ride_date || b.ride?.date || '',
          time: b.ride?.ride_time || b.ride?.time || '',
          driver: { name: driverName, phone: driverPhone },
          price: b.total_price ? (b.total_price / (b.seats_booked || 1)) : b.ride?.price_per_seat || 0,
          seatsReserved: b.seats_booked,
          booking_id: b.id,
          status: b.status || '',
        };
      });

  const mergedReserved = mergePreservedStatuses(reserved, rides.reserved || []);
  setRides({ offered, reserved: mergedReserved });
    } catch (err) {
      console.error('Failed to cancel reservation', err);
      const msg = err?.message || err?.data?.message || 'Failed to cancel reservation';
      showToast(msg, 'error');
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const confirmReservation = async (ride) => {
    const bookingId = ride.booking_id || ride.id;
    if (!bookingId) {
      showToast('Missing booking id for confirmation', 'error');
      console.error('confirmReservation called without booking id', ride);
      return;
    }

    setActionLoading({ id: bookingId, type: 'confirm' });
    try {
      const res = await BookingsAPI.confirm(bookingId);
      // If passenger confirmed, backend returns status 'passenger_confirmed'
      const newStatus = res?.data?.status || res?.status || null;
      // Update the local reserved ride immediately so UI shows "Waiting for driver" without waiting for a full refresh
      setRides(prev => {
        try {
          const updatedReserved = (prev.reserved || []).map(r => {
            const idMatch = (r.booking_id || r.id) === bookingId || r.id === bookingId;
            if (idMatch) {
              return { ...r, status: newStatus || 'passenger_confirmed' };
            }
            return r;
          });
          return { ...prev, reserved: updatedReserved };
        } catch (e) {
          return prev;
        }
      });

      if (newStatus === 'passenger_confirmed') {
        showToast('You confirmed your reservation — waiting for driver to accept', 'success');
      } else {
        showToast('Reservation confirmed', 'success');
      }
      // refresh
      const [offeredRes, reservedRes] = await Promise.all([RidesAPI.myRides(), BookingsAPI.list()]);
      const rawOffered = Array.isArray(offeredRes?.data || offeredRes) ? (offeredRes.data || offeredRes) : [];
      const rawReserved = Array.isArray(reservedRes?.data || reservedRes) ? (reservedRes.data || reservedRes) : [];

      const offered = rawOffered
        .filter(r => {
          const s = (r.status || '').toLowerCase();
          return s !== 'cancelled' && s !== 'done' && s !== 'completed' && !r.deleted_at;
        })
        .map(r => ({
          id: r.id,
          from: r.from_location || r.from || '',
          to: r.to_location || r.to || '',
          date: r.ride_date || r.date || '',
          time: r.ride_time || r.time || '',
          seats: r.seats_available ?? r.seats ?? 0,
          price: r.price_per_seat ?? r.price ?? 0,
          vehicle: {
            model: r.vehicle_model || (r.vehicle?.model ?? ''),
            number: r.vehicle_number || (r.vehicle?.number ?? ''),
          },
          bookings: Array.isArray(r.bookings || []) ? (r.bookings || []).map(b => ({
            booking_id: b.id,
            passenger_name: (b.passenger?.first_name || '') + (b.passenger?.last_name ? ` ${b.passenger.last_name}` : ''),
            passenger_phone: b.passenger?.phone || '',
            seats_booked: b.seats_booked,
            status: b.status,
          })) : [],
        }));

      const reserved = (rawReserved || []).filter(b => {
        const status = (b.status || '').toLowerCase();
        const rideStatus = (b.ride?.status || '').toLowerCase();
        return status !== 'cancelled' && status !== 'deleted' && b.ride && rideStatus !== 'done' && rideStatus !== 'completed';
      }).map(b => {
        const drv = b.ride?.driver || {};
        const driverName = drv.name || (drv.profile ? (`${drv.profile.first_name || ''} ${drv.profile.last_name || ''}`).trim() : '') || (`${drv.first_name || ''} ${drv.last_name || ''}`).trim() || '';
        const driverPhone = drv.phone || drv.profile?.phone || '';
        return {
          id: b.id,
          from: b.ride?.from_location || b.ride?.from || '',
          to: b.ride?.to_location || b.ride?.to || '',
          date: b.ride?.ride_date || b.ride?.date || '',
          time: b.ride?.ride_time || b.ride?.time || '',
          driver: { name: driverName, phone: driverPhone },
          price: b.total_price ? (b.total_price / (b.seats_booked || 1)) : b.ride?.price_per_seat || 0,
          seatsReserved: b.seats_booked,
          booking_id: b.id,
          status: b.status || '',
        };
      });

  const mergedReserved = mergePreservedStatuses(reserved, rides.reserved || []);
  setRides({ offered, reserved: mergedReserved });
    } catch (err) {
      console.error('Failed to confirm reservation', err);
      const msg = err?.message || err?.data?.message || 'Failed to confirm reservation';
      showToast(msg, 'error');
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const acceptBooking = async (bookingId) => {
    setActionLoading({ id: bookingId, type: 'accept' });
    try {
      await BookingsAPI.confirm(bookingId);
      showToast('Booking accepted', 'success');
      // Refresh
      const [offeredRes, reservedRes] = await Promise.all([RidesAPI.myRides(), BookingsAPI.list()]);
      const rawOffered = Array.isArray(offeredRes?.data || offeredRes) ? (offeredRes.data || offeredRes) : [];
      const rawReserved = Array.isArray(reservedRes?.data || reservedRes) ? (reservedRes.data || reservedRes) : [];

      const offered = rawOffered
        .filter(r => (r.status || '').toLowerCase() !== 'cancelled' && !r.deleted_at)
        .map(r => ({
          id: r.id,
          from: r.from_location || r.from || '',
          to: r.to_location || r.to || '',
          date: r.ride_date || r.date || '',
          time: r.ride_time || r.time || '',
          seats: r.seats_available ?? r.seats ?? 0,
          price: r.price_per_seat ?? r.price ?? 0,
          vehicle: {
            model: r.vehicle_model || (r.vehicle?.model ?? ''),
            number: r.vehicle_number || (r.vehicle?.number ?? ''),
          },
          bookings: Array.isArray(r.bookings || []) ? (r.bookings || []).map(b => ({
            booking_id: b.id,
            passenger_name: (b.passenger?.first_name || '') + (b.passenger?.last_name ? ` ${b.passenger.last_name}` : ''),
            passenger_phone: b.passenger?.phone || '',
            seats_booked: b.seats_booked,
            status: b.status,
          })) : [],
        }));

      const reserved = (rawReserved || []).filter(b => {
        const status = (b.status || '').toLowerCase();
        return status !== 'cancelled' && status !== 'deleted' && b.ride;
      }).map(b => {
        const drv = b.ride?.driver || {};
        const driverName = drv.name || (drv.profile ? (`${drv.profile.first_name || ''} ${drv.profile.last_name || ''}`).trim() : '') || (`${drv.first_name || ''} ${drv.last_name || ''}`).trim() || '';
        const driverPhone = drv.phone || drv.profile?.phone || '';
        return {
          id: b.id,
          from: b.ride?.from_location || b.ride?.from || '',
          to: b.ride?.to_location || b.ride?.to || '',
          date: b.ride?.ride_date || b.ride?.date || '',
          time: b.ride?.ride_time || b.ride?.time || '',
          driver: { name: driverName, phone: driverPhone },
          price: b.total_price ? (b.total_price / (b.seats_booked || 1)) : b.ride?.price_per_seat || 0,
          seatsReserved: b.seats_booked,
          booking_id: b.id,
          status: b.status || '',
        };
      });

  const mergedReserved = mergePreservedStatuses(reserved, rides.reserved || []);
  setRides({ offered, reserved: mergedReserved });
    } catch (err) {
      console.error('Failed to accept booking', err);
      const msg = err?.message || err?.data?.message || 'Failed to accept booking';
      showToast(msg, 'error');
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const refuseBooking = async (bookingId) => {
    setActionLoading({ id: bookingId, type: 'refuse' });
    try {
      await BookingsAPI.cancel(bookingId);
      showToast('Booking refused', 'success');
      // Refresh lists (reuse cancelRide refresh logic by calling load via effect by touching state)
      const [offeredRes, reservedRes] = await Promise.all([RidesAPI.myRides(), BookingsAPI.list()]);
      const rawOffered = Array.isArray(offeredRes?.data || offeredRes) ? (offeredRes.data || offeredRes) : [];
      const rawReserved = Array.isArray(reservedRes?.data || reservedRes) ? (reservedRes.data || reservedRes) : [];

      const offered = rawOffered
        .filter(r => (r.status || '').toLowerCase() !== 'cancelled' && !r.deleted_at)
        .map(r => ({
          id: r.id,
          from: r.from_location || r.from || '',
          to: r.to_location || r.to || '',
          date: r.ride_date || r.date || '',
          time: r.ride_time || r.time || '',
          seats: r.seats_available ?? r.seats ?? 0,
          price: r.price_per_seat ?? r.price ?? 0,
          vehicle: {
            model: r.vehicle_model || (r.vehicle?.model ?? ''),
            number: r.vehicle_number || (r.vehicle?.number ?? ''),
          },
          bookings: Array.isArray(r.bookings || []) ? (r.bookings || []).map(b => ({
            booking_id: b.id,
            passenger_name: (b.passenger?.first_name || '') + (b.passenger?.last_name ? ` ${b.passenger.last_name}` : ''),
            passenger_phone: b.passenger?.phone || '',
            seats_booked: b.seats_booked,
            status: b.status,
          })) : [],
        }));

      const reserved = (rawReserved || []).filter(b => {
        const status = (b.status || '').toLowerCase();
        return status !== 'cancelled' && status !== 'deleted' && b.ride;
      }).map(b => {
        const drv = b.ride?.driver || {};
        const driverName = drv.name || (drv.profile ? (`${drv.profile.first_name || ''} ${drv.profile.last_name || ''}`).trim() : '') || (`${drv.first_name || ''} ${drv.last_name || ''}`).trim() || '';
        const driverPhone = drv.phone || drv.profile?.phone || '';
        return {
          id: b.id,
          from: b.ride?.from_location || b.ride?.from || '',
          to: b.ride?.to_location || b.ride?.to || '',
          date: b.ride?.ride_date || b.ride?.date || '',
          time: b.ride?.ride_time || b.ride?.time || '',
          driver: { name: driverName, phone: driverPhone },
          price: b.total_price ? (b.total_price / (b.seats_booked || 1)) : b.ride?.price_per_seat || 0,
          seatsReserved: b.seats_booked,
          booking_id: b.id,
          status: b.status || '',
        };
      });

  const mergedReserved = mergePreservedStatuses(reserved, rides.reserved || []);
  setRides({ offered, reserved: mergedReserved });
    } catch (err) {
      console.error('Failed to refuse booking', err);
      const msg = err?.message || err?.data?.message || 'Failed to refuse booking';
      showToast(msg, 'error');
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

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

  return (
    <section className="py-8 md:py-16 bg-linear-to-br from-blue-50 via-white to-orange-50 min-h-screen">
      <div className="container mx-auto px-4 mt-16">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-700 mb-2">My Profile</h1>
          <p className="text-slate-600">Manage your account and rides</p>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === 'info'
                  ? 'text-blue-700 border-blue-700'
                  : 'text-slate-500 border-transparent hover:text-blue-700'
              }`}
            >
              Personal Info
            </button>
            <button
              onClick={() => setActiveTab('offered')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === 'offered'
                  ? 'text-blue-700 border-blue-700'
                  : 'text-slate-500 border-transparent hover:text-blue-700'
              } cursor-pointer`}
            >
              My Offered Rides ({rides.offered.length})
            </button>
            <button
              onClick={() => setActiveTab('reserved')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === 'reserved'
                  ? 'text-blue-700 border-blue-700'
                  : 'text-slate-500 border-transparent hover:text-blue-700'
              } cursor-pointer`}
            >
              My Reserved Rides ({rides.reserved.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          {/* Personal Info Tab */
          }
          {activeTab === 'info' && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              {/* Header with Edit Button */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-700">Personal Information</h2>
                {!isEditing ? (
                  <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                    >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Avatar */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-linear-to-br from-blue-700 to-orange-500 flex items-center justify-center text-white text-5xl font-bold shadow-lg overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="uppercase">{(profileData.firstName || profileData.lastName || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { if (fileInputRef) fileInputRef.current?.click(); }}
                    className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-2 shadow-md border border-slate-200 hover:bg-slate-50"
                    aria-label="Add profile picture"
                  >
                    <Plus className="w-4 h-4 text-blue-700" />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setAvatarFile(f);
                        setAvatarPreview(URL.createObjectURL(f));
                      }
                    }}
                  />
                </div>
              </div>

              {/* Form Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-blue-700 mb-2">First Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-700 mb-2">Last Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-300 bg-slate-100 text-slate-600"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      disabled={!isEditing}
                      placeholder="+212 XXX XXX XXX"
                      className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-700 mb-2">City</label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={profileData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Casablanca, Rabat, etc."
                      className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                    />
                  </div>
                </div>

                {/* Gender (from API profile, read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-blue-700 mb-2">Gender</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={user?.profile?.gender ? (user.profile.gender.charAt(0).toUpperCase() + user.profile.gender.slice(1)) : ''}
                      disabled
                      placeholder="—"
                      className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-300 bg-slate-100 text-slate-600"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-blue-700 mb-2">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full px-3 py-3 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-600 resize-none"
                  />
                </div>
              </div>
                {/* Vehicle Section: show existing vehicle info for drivers, otherwise allow passengers to add vehicle details */}
                <div className="mt-8 border-t border-slate-200 pt-6">
                  <h3 className="text-xl font-semibold text-blue-700 mb-4">Vehicle Details</h3>
                  {user?.profile?.driver_license_number ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-blue-700 mb-2">Vehicle Model</label>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Car className="w-5 h-5 text-slate-400" />
                          <span>{user?.profile?.vehicle_model || '—'}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-blue-700 mb-2">License Plate</label>
                        <div className="flex items-center gap-2 text-slate-700">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-semibold">#</span>
                          <span>{user?.profile?.vehicle_number_plate || '—'}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-blue-700 mb-2">Vehicle Color</label>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Palette className="w-5 h-5 text-slate-400" />
                          <span>{user?.profile?.vehicle_color || '—'}</span>
                          {user?.profile?.vehicle_color && (
                            <span
                              className="inline-block w-4 h-4 rounded-full border border-slate-300"
                              style={{ backgroundColor: (user?.profile?.vehicle_color || '').toLowerCase() }}
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-blue-700 mb-2">Vehicle Year</label>
                        <div className="flex items-center gap-2 text-slate-700">
                          <span>{user?.profile?.vehicle_year || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-blue-700 mb-2">Driver License Number</label>
                        <input
                          type="text"
                          value={profileData.driver_license_number}
                          onChange={(e) => updateField('driver_license_number', e.target.value)}
                          placeholder="e.g. D1234567"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-blue-700 mb-2">Vehicle Model</label>
                        <input
                          type="text"
                          value={profileData.vehicle_model}
                          onChange={(e) => updateField('vehicle_model', e.target.value)}
                          placeholder="Toyota Camry"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-blue-700 mb-2">License Plate</label>
                        <input
                          type="text"
                          value={profileData.vehicle_number_plate}
                          onChange={(e) => updateField('vehicle_number_plate', e.target.value)}
                          placeholder="ABC123"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-blue-700 mb-2">Vehicle Color</label>
                        <input
                          type="text"
                          value={profileData.vehicle_color}
                          onChange={(e) => updateField('vehicle_color', e.target.value)}
                          placeholder="Blue"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-blue-700 mb-2">Vehicle Year</label>
                        <input
                          type="text"
                          value={profileData.vehicle_year}
                          onChange={(e) => updateField('vehicle_year', e.target.value)}
                          placeholder="2020"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-center gap-3">
                        <button
                          onClick={handleSave}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Save Vehicle Details
                        </button>
                        <p className="text-sm text-slate-500">Adding vehicle details will allow you to offer rides.</p>
                      </div>
                    </div>
                  )}
                </div>
            </div>
          )}

          {/* Offered Rides Tab */}
          {activeTab === 'offered' && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-6">My Offered Rides</h2>
              {isLoadingRides ? (
                <div className="text-center py-12">
                  <div className="mx-auto mb-4">
                    <Spinner className="w-12 h-12" />
                  </div>
                  <p className="text-slate-500 mt-4">Loading your offered rides...</p>
                </div>
              ) : rides.offered.length === 0 ? (
                <div className="text-center py-12">
                  <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">You haven't offered any rides yet</p>
                  <button
                    onClick={() => navigate('/offer-ride')}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Offer a Ride
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rides.offered.map((ride) => {
                    const isCancellingOffer = actionLoading.id === ride.id && actionLoading.type === 'offered-cancel';
                    return (
                    <div key={ride.id} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
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
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{ride.seats} seats</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span>${ride.price}/seat</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => cancelRide(ride.id, 'offered')}
                          disabled={isCancellingOffer}
                          className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors ${isCancellingOffer ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {isCancellingOffer ? (<><span className="inline-block align-middle mr-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /></span>Cancelling</>) : 'Cancel'}
                        </button>
                      </div>
                      {ride.vehicle && (
                        <div className="pt-4 border-t border-slate-200">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Car className="w-4 h-4" />
                            <span>{ride.vehicle.model} - {ride.vehicle.number}</span>
                          </div>
                        </div>
                      )}

                      {/* Bookings for this offered ride (visible to driver) */}
                      {Array.isArray(ride.bookings) && ride.bookings.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">Reservations</h4>
                          <div className="space-y-3">
                            {ride.bookings.map(b => {
                              const isAccepting = actionLoading.id === b.booking_id && actionLoading.type === 'accept';
                              const isRefusing = actionLoading.id === b.booking_id && actionLoading.type === 'refuse';
                              return (
                              <div key={b.booking_id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div>
                                  <div className="text-sm font-medium text-slate-900">{b.passenger_name || 'Passenger'}</div>
                                  <div className="text-xs text-slate-600">Phone: {b.passenger_phone || '—'}</div>
                                  <div className="text-xs text-slate-600">Seats: {b.seats_booked}</div>
                                  <div className="text-xs text-slate-500">Status: {b.status || 'pending'}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {(!b.status || b.status === 'pending' || b.status === 'passenger_confirmed') && (
                                    <>
                                      <button
                                        onClick={() => acceptBooking(b.booking_id)}
                                        disabled={isAccepting}
                                        className={`bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm ${isAccepting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                      >
                                        {isAccepting ? (<><div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"/>Accepting</>) : 'Accept'}
                                      </button>
                                      <button
                                        onClick={() => refuseBooking(b.booking_id)}
                                        disabled={isRefusing}
                                        className={`bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm ${isRefusing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                      >
                                        {isRefusing ? (<><div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"/>Refusing</>) : 'Refuse'}
                                      </button>
                                    </>
                                  )}

                                  {b.status === 'confirmed' && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-green-100 text-green-800">Accepted</span>
                                  )}

                                  {b.status === 'cancelled' && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-red-100 text-red-800">Refused</span>
                                  )}
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reserved Rides Tab */}
          {activeTab === 'reserved' && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-6">My Reserved Rides</h2>
              {rides.reserved.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">You haven't reserved any rides yet</p>
                  <button
                    onClick={() => navigate('/find-ride')}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Find a Ride
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rides.reserved.map((ride) => (
                    <div key={ride.id} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
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
                        <div className="flex items-center gap-2">
                          {ride.status === 'confirmed' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-green-100 text-green-800">Confirmed</span>
                          ) : ride.status === 'passenger_confirmed' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-yellow-100 text-yellow-800">Waiting for driver</span>
                          ) : (
                            <button
                                onClick={() => confirmReservation(ride)}
                                disabled={actionLoading.id === (ride.booking_id || ride.id) && actionLoading.type === 'confirm'}
                                className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ${actionLoading.id === (ride.booking_id || ride.id) && actionLoading.type === 'confirm' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                              {actionLoading.id === (ride.booking_id || ride.id) && actionLoading.type === 'confirm' ? (
                                <><div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle"/>Waiting...</>
                              ) : 'Confirm'}
                            </button>
                          )}

                            <button
                              onClick={() => confirmAndCancelReservation(ride)}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                            >
                            Cancel
                          </button>
                        </div>
                      </div>
                      {ride.seatsReserved && (
                        <div className="pt-4 border-t border-slate-200">
                          <p className="text-sm text-slate-600">
                            You reserved <span className="font-semibold text-blue-700">{ride.seatsReserved}</span> seat(s)
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
