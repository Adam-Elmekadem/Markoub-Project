import { useEffect, useMemo, useState } from 'react';
import { AdminAPI } from '../../utils/adminApi';
import { useToast } from '../../components/Toast';
import { Spinner } from '../../components/Spinner';
import { Plus, Pencil, Trash } from 'lucide-react';

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

const RidesTable = ({ rides, onEdit, onDelete }) => (
  <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto rounded-xl border border-slate-200 no-scrollbar touch-scroll">
    <table className="w-full table-auto divide-y divide-slate-200">
      <thead className="bg-slate-100">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Driver</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">From</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">To</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Date</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Seats</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Price</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-slate-200">
        {rides.map((r, idx) => (
          <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50 hover:bg-slate-100'}>
            <td className="px-4 py-3 font-medium text-slate-900">{r.driver}</td>
            <td className="px-4 py-3 text-slate-700">{r.from}</td>
            <td className="px-4 py-3 text-slate-700">{r.to}</td>
            <td className="px-4 py-3 text-slate-700">{r.date}</td>
            <td className="px-4 py-3 text-slate-700">{r.seats}</td>
            <td className="px-4 py-3 text-slate-700">${r.price}</td>
            <td className="px-4 py-3 text-right">
              <div className="flex items-center gap-2 justify-end">
                <button onClick={()=>onEdit(r)} className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1"><Pencil className="w-4 h-4"/> Edit</button>
                <button onClick={()=>onDelete(r)} className="px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1"><Trash className="w-4 h-4"/> Delete</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const Rides = () => {
  const [rides, setRides] = useState([]);
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

  const filtered = useMemo(() => rides.filter(r =>
    [r.driver, r.from, r.to, r.date].join(' ').toLowerCase().includes(query.toLowerCase())
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-700">Rides</h1>
          <p className="text-slate-600">Manage rides</p>
        </div>
        <button onClick={startCreate} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4"/> New Ride
        </button>
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
        <RidesTable rides={filtered} onEdit={startEdit} onDelete={handleDelete} />
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-blue-700 mb-4">{editing ? 'Edit Ride' : 'New Ride'}</h2>
            <RideForm initial={editing} onCancel={()=>{setShowForm(false); setEditing(null);}} onSave={handleSave} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Rides;
