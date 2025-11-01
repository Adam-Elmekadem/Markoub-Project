import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminAPI } from '../../utils/adminApi';
import { useToast } from '../../components/Toast';
import { Plus, Pencil, Trash } from 'lucide-react';
import { Spinner } from '../../components/Spinner';

const UserForm = ({ initial, onCancel, onSave }) => {
  const [form, setForm] = useState(initial || { name: '', email: '', role: 'user' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!['user', 'driver', 'admin'].includes(form.role)) e.role = 'Invalid role';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => { e.preventDefault(); if (!validate()) return; onSave(form); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Role</label>
        <select value={form.role} onChange={(e)=>setForm({...form,role:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2">
          <option value="user">User</option>
          <option value="driver">Driver</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role && <p className="text-sm text-red-600 mt-1">{errors.role}</p>}
      </div>
      <div className="flex gap-3">
        <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-lg">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border">Cancel</button>
      </div>
    </form>
  );
};

const UsersTable = ({ users, onEdit, onDelete }) => {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onPointerDown = (e) => {
      isDown = true;
      startX = e.pageX - el.getBoundingClientRect().left;
      scrollLeft = el.scrollLeft;
      el.classList.add('cursor-grabbing');
      if (e.pointerId) el.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.getBoundingClientRect().left;
      const walk = x - startX;
      el.scrollLeft = scrollLeft - walk;
    };

    const onPointerUp = (e) => {
      isDown = false;
      el.classList.remove('cursor-grabbing');
      if (e.pointerId) el.releasePointerCapture?.(e.pointerId);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto rounded-xl border border-slate-200 no-scrollbar touch-scroll">
      <table className="w-full table-auto divide-y divide-slate-200">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Email</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Role</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {users.map((u, idx) => (
            <tr key={u.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50 hover:bg-slate-100'}>
              <td className="px-4 py-3 font-medium text-slate-900">{(u.name || u.full_name || u.fullName || `${u.first_name||u.firstName||''} ${u.last_name||u.lastName||''}`.trim() || u.email)}</td>
              <td className="px-4 py-3 text-slate-700">{u.email}</td>
              <td className="px-4 py-3 capitalize text-slate-700">{u.role}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={()=>onEdit(u)} className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1"><Pencil className="w-4 h-4"/> Edit</button>
                  <button onClick={()=>onDelete(u)} className="px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1"><Trash className="w-4 h-4"/> Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const { showToast } = useToast();

  const getDisplayName = (u) => {
    // Prefer common shapes returned by different backends: try several fields
    if (!u) return '';
    if (u.name) return u.name;
    if (u.full_name) return u.full_name;
    if (u.fullName) return u.fullName;
    const first = u.first_name || u.firstName || '';
    const last = u.last_name || u.lastName || '';
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;
    return u.email || '';
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoadingUsers(true);
      try {
        const res = await AdminAPI.listUsers();
        if (mounted) setUsers(Array.isArray(res) ? res : (res || []));
      } catch (err) {
        console.error('Failed to load users', err);
        showToast && showToast('Failed to load users', 'error');
      } finally {
        setIsLoadingUsers(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => users.filter(u =>
    [getDisplayName(u), u.email, u.role].join(' ').toLowerCase().includes(query.toLowerCase())
  ), [users, query]);

  const startCreate = () => { setEditing(null); setShowForm(true); };
  const startEdit = (u) => { setEditing(u); setShowForm(true); };
  const handleDelete = async (u) => {
    if (!confirm(`Delete ${u.name}?`)) return;
    try {
      await AdminAPI.deleteUser(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      showToast('User deleted', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete user', 'error');
    }
  };

  const handleSave = async (data) => {
    try {
      if (editing) {
        const updated = await AdminAPI.updateUser(editing.id, data);
        setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
        showToast('User updated', 'success');
      } else {
        const created = await AdminAPI.createUser(data);
        setUsers(prev => [created, ...(prev || [])]);
        showToast('User created', 'success');
      }
      setShowForm(false); setEditing(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to save user', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-700">Users</h1>
          <p className="text-slate-600">Manage user accounts and roles</p>
        </div>
        <button onClick={startCreate} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4"/> New User
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search users..." className="flex-1 border border-slate-300 rounded-lg px-3 py-2 placeholder-slate-400"/>
      </div>

      {isLoadingUsers ? (
        <div className="text-center py-12">
          <div className="mx-auto mb-4"><Spinner className="w-10 h-10" /></div>
          <p className="text-slate-500">Loading users...</p>
        </div>
      ) : (
        <UsersTable users={filtered} onEdit={startEdit} onDelete={handleDelete} />
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-blue-700 mb-4">{editing ? 'Edit User' : 'New User'}</h2>
            <UserForm initial={editing} onCancel={()=>{setShowForm(false); setEditing(null);}} onSave={handleSave} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
