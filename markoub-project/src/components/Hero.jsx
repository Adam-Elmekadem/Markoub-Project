import { Button } from './Button';
import { Facebook, Github, Linkedin, Twitter, MapPin, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RidesAPI } from '../utils/api';

// Centered hero without images — compact, creative, same blue/orange palette.
export const Hero = () => {
  const stats = [
    { label: 'Rides shared', value: '512K+' },
    { label: 'Active users', value: '120K+' },
    { label: 'Avg. rating', value: '4.8/5' },
  ];

  return (
    <section id="home" className="pt-24 pb-12 bg-linear-to-br from-blue-50 via-white to-orange-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-semibold text-sm mx-auto">
            <Users className="w-4 h-4" /> Community-driven
          </div>

          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold text-blue-700 leading-tight">
            Get there together — safer, cheaper, and friendly.
          </h1>

          <p className="mt-4 text-lg text-slate-600">
            Markoub connects drivers with empty seats to riders headed the same way. Save money, reduce traffic, and meet new people along the route.
          </p>

          {/* Centered Quick Search */}
          <SearchBlock />

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-xl font-bold text-blue-700">{s.value}</div>
                <div className="text-xs mt-0.5 text-slate-600">{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Link to="/find-ride">
              <Button variant="primary" size="lg">Find a ride</Button>
            </Link>
            <Link to="/offer-ride">
              <Button variant="secondary" size="lg">Offer a ride</Button>
            </Link>
          </div>

          {/* Social icons centered */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <a href="#" className="text-slate-600 hover:text-blue-700"><Facebook className="w-5 h-5" /></a>
            <a href="#" className="text-slate-600 hover:text-slate-900"><Github className="w-5 h-5" /></a>
            <a href="#" className="text-slate-600 hover:text-blue-700"><Linkedin className="w-5 h-5" /></a>
            <a href="#" className="text-slate-600 hover:text-blue-600"><Twitter className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </section>
  );
};
  // Small search block component used in hero — calls backend and shows modal results
  function SearchBlock() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [from, setFrom] = useState('Casablanca');
    const [to, setTo] = useState('Rabat');
    const [date, setDate] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const onSubmit = async (e) => {
      e && e.preventDefault();
      setIsSearching(true);
      try {
        const normalizedFrom = (from || '').trim();
        const normalizedTo = (to || '').trim();
        const params = {
          from: normalizedFrom,
          to: normalizedTo,
          from_location: normalizedFrom,
          to_location: normalizedTo,
        };
        if (date) {
          params.date = date;
          params.ride_date = date;
        }
        const list = await RidesAPI.list(params);
        const arr = Array.isArray(list) ? list : (list?.data || []);
        setResults(arr || []);
        setShowModal(true);
      } catch (err) {
        console.error('Search failed', err);
        setResults([]);
        setShowModal(true);
      } finally {
        setIsSearching(false);
      }
    };

    return (
      <>
        <form onSubmit={onSubmit} className="mt-6 bg-white rounded-lg shadow-sm border border-slate-100 p-3 flex flex-col sm:flex-row gap-3 items-stretch justify-center">
          <div className="flex-1 min-w-0">
            <label className="sr-only">From</label>
            <div className="flex items-center gap-2 px-3 py-2">
              <MapPin className="w-5 h-5 text-slate-400" />
              <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From (e.g. Casablanca)" className="w-full outline-none text-slate-700 text-center" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <label className="sr-only">To</label>
            <div className="flex items-center gap-2 px-3 py-2">
              <MapPin className="w-5 h-5 text-slate-400 rotate-180" />
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To (e.g. Marrakech)" className="w-full outline-none text-slate-700 text-center" />
            </div>
          </div>
          <div className="w-full sm:w-auto flex items-center">
            <button type="submit" disabled={isSearching} className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-md">
              {isSearching ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Search className="w-4 h-4" />}
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
            <div className="relative max-w-3xl w-full mx-4 bg-white rounded-xl shadow-xl p-6 z-10">
              <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">Matched results</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">✕</button>
              </div>

              <div className="mt-4">
                  {results.length === 0 ? (
                    <div className="text-center py-8 text-slate-600">No rides found in the database for <strong>{from}</strong> → <strong>{to}</strong>.</div>
                  ) : (
                  <div className="space-y-3 max-h-80 overflow-auto">
                    {results.map((r, idx) => {
                      const ride = r.ride || r; // in case API returns booking wrapper
                      const driver = ride.driver || ride.user || {};
                      const driverName = driver.name || (driver.profile ? `${driver.profile.first_name || ''} ${driver.profile.last_name || ''}`.trim() : `${driver.first_name || ''} ${driver.last_name || ''}`.trim()) || driver.email || 'Driver';
                      const phone = driver.phone || driver.profile?.phone || '—';
                      return (
                        <div key={idx} className="border border-slate-100 rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900">{ride.from_location || ride.from} → {ride.to_location || ride.to}</div>
                            <div className="text-xs text-slate-600">{ride.ride_date || ride.date} • {ride.ride_time || ride.time} • {ride.seats_available ?? ride.seats} seats</div>
                            <div className="text-xs text-slate-600">Driver: {driverName} • {phone}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-orange-500">${ride.price_per_seat ?? ride.price ?? 0}</div>
                            <div className="mt-2">
                              {isAuthenticated ? (
                                <button onClick={() => navigate(`/find-ride?ride=${ride.id}`)} className="inline-flex items-center px-3 py-1 bg-orange-500 text-white rounded-md">Book Now</button>
                              ) : (
                                <a href="/login" className="inline-flex items-center px-3 py-1 bg-blue-700 text-white rounded-md">Login to book</a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-6 text-center text-sm text-slate-600">
                {!isAuthenticated ? (
                  <div>Please <a href="/login" className="text-blue-700 underline">login</a> or <a href="/register" className="text-blue-700 underline">sign up</a> to book a ride.</div>
                ) : (
                  <div>You're signed in — click <span className="font-semibold">Book Now</span> on any result to proceed with booking.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
