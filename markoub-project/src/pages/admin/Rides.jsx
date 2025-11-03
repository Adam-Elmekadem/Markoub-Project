import { useEffect, useMemo, useState } from 'react';
import { AdminAPI } from '../../utils/adminApi';
import { useToast } from '../../components/Toast';
import { Spinner } from '../../components/Spinner';
import { Plus, Pencil, Trash, Users as UsersIcon, DollarSign } from 'lucide-react';

const RideForm = ({ initial, onCancel, onSave }) => {
  const [form, setForm] = useState(initial || { driver: '', from: '', to: '', date: '', seats: 1, price: 0 });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.driver.trim()) e.driver = 'Driver is required';
    if (!form.from.trim()) e.from = 'From is required';
    if (!form.to.trim()) e.to = 'To is required';
    if (!form.date) e.date = 'Date is required';
    if (form.seats < 1) e.seats = 'At least 1 seat';
    if (form.price < 0) e.price = 'Non-negative price';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => { e.preventDefault(); if (!validate()) return; onSave({ ...form, seats: Number(form.seats), price: Number(form.price) }); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Driver</label>
          <input value={form.driver} onChange={(e)=>setForm({...form,driver:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
          {errors.driver && <p className="text-sm text-red-600 mt-1">{errors.driver}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Date</label>
          <input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
          {errors.date && <p className="text-sm text-red-600 mt-1">{errors.date}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">From</label>
          <input value={form.from} onChange={(e)=>setForm({...form,from:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
          {errors.from && <p className="text-sm text-red-600 mt-1">{errors.from}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">To</label>
          <input value={form.to} onChange={(e)=>setForm({...form,to:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
          {errors.to && <p className="text-sm text-red-600 mt-1">{errors.to}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Seats</label>
          <input type="number" min={1} value={form.seats} onChange={(e)=>setForm({...form,seats:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
          {errors.seats && <p className="text-sm text-red-600 mt-1">{errors.seats}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Price</label>
          <input type="number" min={0} value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
          {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price}</p>}
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-lg">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border">Cancel</button>
      </div>
    </form>
  );
};

/* Table view removed per request: rides will be rendered as cards only. */

// Prefer a full driver name when available; do not fall back to email for display
const formatDriverName = (d) => {
  if (!d) return 'Driver';
  if (typeof d === 'string') return d;
  const profileFirst = d.profile?.first_name || d.profile?.firstName || '';
  const profileLast = d.profile?.last_name || d.profile?.lastName || '';
  const full = `${profileFirst} ${profileLast}`.trim();
  const firstLast = `${d.first_name || d.firstName || ''} ${d.last_name || d.lastName || ''}`.trim();
  if (full) return full;
  if (firstLast) return firstLast;
  if (d.name) return d.name;
  if (d.full_name) return d.full_name;
  if (d.fullName) return d.fullName;
  return 'Driver';
};

const RidesCardList = ({ rides, onEdit, onDelete, onView }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
    {rides.map((r, idx) => {
      const driver = formatDriverName(r.driver);
  // Use the explicitly linked vehicle only
  const vehicle = r.vehicle ? (r.vehicle.model || r.vehicle.number || '-') : '-';
      const from = r.from_location || r.from || r.pickup || '-';
      const to = r.to_location || r.to || r.dropoff || '-';
      const date = r.ride_date || r.date || '-';
      const time = r.ride_time || r.time || '-';
      const seats = (typeof r.seats_available !== 'undefined') ? r.seats_available : (r.seats || '-');
      const price = (typeof r.price_per_seat !== 'undefined') ? r.price_per_seat : (r.price || '-');
      const distance = r.distance || r.km || '-';
      const status = r.status || r.state || 'unknown';
      return (
        <div key={r.id || idx} onClick={() => onView && onView(r)} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 cursor-pointer hover:shadow-lg transition">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-sm text-slate-500">Driver</div>
              <div className="font-medium text-slate-900">{driver}</div>
              <div className="mt-2 text-sm"> <span className="text-orange-600 font-medium">{from}</span> <span className="text-slate-400">→</span> <span className="text-orange-600 font-medium">{to}</span> </div>
              <div className="mt-2 text-xs text-slate-500 space-y-1">
                <div className="">{date} {time}</div>
                <div className="flex items-center gap-2 text-slate-700">
                  <UsersIcon className="w-4 h-4 text-slate-400" />
                  <span>{seats} seats (left)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span>{price}</span>
                </div>
                <div className="text-slate-500">{distance}</div>
              </div>
              <div className="mt-2 text-xs">Status: {
                (() => {
                  const s = (status || '').toLowerCase();
                  if (['active','open','confirmed','ongoing','available'].includes(s)) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">{status}</span>;
                  if (['pending','scheduled','waiting'].includes(s)) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 capitalize">{status}</span>;
                  if (['cancelled','canceled','closed','rejected'].includes(s)) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize">{status}</span>;
                  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">{status}</span>;
                })()
              }</div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              <button onClick={(e) => { e.stopPropagation(); onEdit(r); }} className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Pencil className="w-4 h-4"/> Edit</button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(r); }} className="px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-2"><Trash className="w-4 h-4"/> Delete</button>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export const Rides = () => {
  const [rides, setRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [showRideDetails, setShowRideDetails] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoadingRides, setIsLoadingRides] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoadingRides(true);
      try {
        const res = await AdminAPI.listRides();
        if (mounted) setRides(Array.isArray(res) ? res : (res || []));
      } catch (err) {
        console.error('Failed to load rides', err);
      } finally {
        setIsLoadingRides(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toDriverString = (d) => {
    if (!d) return '';
    if (typeof d === 'string') return d;
    return d.name || (d.profile ? `${d.profile.first_name || ''} ${d.profile.last_name || ''}`.trim() : `${d.first_name || ''} ${d.last_name || ''}`.trim()) || d.email || '';
  };

  const filtered = useMemo(() => rides.filter(r =>
    [toDriverString(r.driver), r.from, r.to, r.date].join(' ').toLowerCase().includes(query.toLowerCase())
  ), [rides, query]);

  const startCreate = () => { setEditing(null); setShowForm(true); };
  const startEdit = (r) => { setEditing(r); setShowForm(true); };
  const handleDelete = async (r) => {
    if (!confirm(`Delete ride ${r.from} → ${r.to}?`)) return;
    try {
      await AdminAPI.deleteRide(r.id);
      setRides(prev => prev.filter(x => x.id !== r.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleView = (r) => { setSelectedRide(r); setShowRideDetails(true); };

  const handleSave = async (data) => {
    try {
      if (editing) {
        const updated = await AdminAPI.updateRide(editing.id, data);
        setRides(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      } else {
        const created = await AdminAPI.createRide(data);
        setRides(prev => [created, ...(prev || [])]);
      }
      setShowForm(false); setEditing(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-700">Rides</h1>
          <p className="text-slate-600">Manage rides</p>
        </div>
        {/* Keep the New Ride button visually fixed to the right of this header area
            so it doesn't move when wide tables cause horizontal scrolling. */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pr-2">
          <button onClick={startCreate} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4"/> New Ride
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search rides..." className="flex-1 border border-slate-300 rounded-lg px-3 py-2 placeholder-slate-400"/>
      </div>

      {isLoadingRides ? (
        <div className="text-center py-12">
          <div className="mx-auto mb-4"><Spinner className="w-12 h-12" /></div>
          <p className="text-slate-500">Loading rides...</p>
        </div>
      ) : (
        <>
          <RidesCardList rides={filtered} onEdit={startEdit} onDelete={handleDelete} onView={handleView} />
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-blue-700 mb-4">{editing ? 'Edit Ride' : 'New Ride'}</h2>
            <RideForm initial={editing} onCancel={()=>{setShowForm(false); setEditing(null);}} onSave={handleSave} />
          </div>
        </div>
      )}
      {showRideDetails && selectedRide && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-blue-700">{formatDriverName(selectedRide.driver)}</h2>
                <div className="text-sm text-slate-500">Ride ID: {selectedRide.id || '-'}</div>
                <div className="mt-1 text-sm text-slate-600">{selectedRide.driver?.phone || selectedRide.driver?.mobile || selectedRide.driver?.profile?.phone ? `Phone: ${selectedRide.driver?.phone || selectedRide.driver?.mobile || selectedRide.driver?.profile?.phone}` : null}</div>
                <div className="text-sm text-slate-600">{selectedRide.driver?.gender || selectedRide.driver?.profile?.gender ? `Gender: ${selectedRide.driver?.gender || selectedRide.driver?.profile?.gender}` : null}</div>
              </div>
              <div className="text-sm text-slate-500">{selectedRide.created_at || selectedRide.createdAt || '-'}</div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
              <div>
                <div className="font-medium text-slate-600">From</div>
                <div className="text-orange-600 font-medium">{selectedRide.from_location || selectedRide.from || selectedRide.pickup || '-'}</div>
                <div className="mt-2 font-medium text-slate-600">To</div>
                <div className="text-orange-600 font-medium">{selectedRide.to_location || selectedRide.to || selectedRide.dropoff || '-'}</div>
                <div className="mt-2"><span className="font-medium text-slate-600">Vehicle: </span>{selectedRide.vehicle?.model || selectedRide.vehicle?.number || '-'}</div>
              </div>
              <div>
                <div><span className="font-medium text-slate-600">Date / Time: </span>{selectedRide.ride_date || selectedRide.date || '-'} {selectedRide.ride_time || selectedRide.time || ''}</div>
                <div className="mt-2"><span className="font-medium text-slate-600">Seats: </span>{(typeof selectedRide.seats_available !== 'undefined') ? selectedRide.seats_available : (selectedRide.seats || '-')}</div>
                <div className="mt-2"><span className="font-medium text-slate-600">Price: </span>{selectedRide.price_per_seat || selectedRide.price || '-'}</div>
                <div className="mt-2"><span className="font-medium text-slate-600">Distance: </span>{selectedRide.distance || selectedRide.km || '-'}</div>
              </div>
              <div className="md:col-span-2">
                <div className="mt-2"><span className="font-medium text-slate-600">Preferences: </span>{[selectedRide.allow_smoking ? 'Smoking' : null, selectedRide.allow_pets ? 'Pets' : null, selectedRide.allow_music ? 'Music' : null].filter(Boolean).join(', ') || '-'}</div>
                <div className="mt-2"><span className="font-medium text-slate-600">Status: </span>{(() => {
                    const status = (selectedRide.status || selectedRide.state || '').toLowerCase();
                    if (['active','open','confirmed','ongoing','available'].includes(status)) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">{selectedRide.status || selectedRide.state}</span>;
                    if (['pending','scheduled','waiting'].includes(status)) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 capitalize">{selectedRide.status || selectedRide.state}</span>;
                    if (['cancelled','canceled','closed','rejected'].includes(status)) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize">{selectedRide.status || selectedRide.state}</span>;
                    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">{selectedRide.status || selectedRide.state || 'unknown'}</span>;
                  })()}</div>
                {selectedRide.notes && <div className="mt-2"><span className="font-medium text-slate-600">Notes: </span>{selectedRide.notes}</div>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowRideDetails(false); setSelectedRide(null); }} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Close</button>
              <button onClick={() => { setShowRideDetails(false); setEditing(selectedRide); setShowForm(true); }} className="px-4 py-2 rounded-lg bg-blue-700 text-white">Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rides;
