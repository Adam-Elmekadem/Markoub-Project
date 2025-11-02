import { useEffect, useMemo, useState } from 'react';
import { AdminAPI } from '../../utils/adminApi';
import { useToast } from '../../components/Toast';
import { Plus, Pencil, Trash } from 'lucide-react';
import { Spinner } from '../../components/Spinner';

const UserForm = ({ initial, onCancel, onSave }) => {
  const isEditing = !!initial?.id;
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        first_name: initial.first_name || '',
        last_name: initial.last_name || '',
        email: initial.email || '',
        password: '',
        role: initial.role || 'passenger'
      };
    } else {
      return { first_name: '', last_name: '', email: '', password: '', role: 'passenger' };
    }
  });
  const [errors, setErrors] = useState({});

  // Keep form in sync when `initial` changes (avoid uncontrolled -> controlled warnings)
  useEffect(() => {
    setForm({
      first_name: initial?.first_name || '',
      last_name: initial?.last_name || '',
      email: initial?.email || '',
      password: '',
      role: initial?.role || 'passenger',
    });
  }, [initial]);

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required';
    if (!form.last_name.trim()) e.last_name = 'Last name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!isEditing && !form.password.trim()) e.password = 'Password is required for new users';
    if (form.password && form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!['passenger', 'driver', 'admin'].includes(form.role)) e.role = 'Invalid role';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => { e.preventDefault(); if (!validate()) return; onSave(form); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">First Name</label>
        <input value={form.first_name} onChange={(e)=>setForm({...form,first_name:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
        {errors.first_name && <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Last Name</label>
        <input value={form.last_name} onChange={(e)=>setForm({...form,last_name:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
        {errors.last_name && <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Password {isEditing ? '(leave blank to keep current)' : ''}</label>
        <input type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
        {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Role</label>
        <select value={form.role} onChange={(e)=>setForm({...form,role:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2">
          <option value="passenger">Passenger</option>
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

/* Table view removed per request: users will be rendered as cards only. */

// Helper to prefer a full name when available (first+last, profile name, etc.)
const formatUserName = (u) => {
  if (!u) return '';
  const first = u.first_name || u.firstName || '';
  const last = u.last_name || u.lastName || '';
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  if (u.name) return u.name;
  if (u.full_name) return u.full_name;
  if (u.fullName) return u.fullName;
  // fallback to email if nothing else
  return u.email || '';
};

const UsersCardList = ({ users, onEdit, onDelete, onView }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
    {users.map((u) => (
      <div key={u.id} onClick={() => onView && onView(u)} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 cursor-pointer hover:shadow-lg transition">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">Name</div>
            <div className="font-medium text-slate-900">{formatUserName(u)}</div>
            <div className="text-sm text-slate-600">{u.email}</div>
            <div className="mt-2">
              {/* Role badge with color */}
              {u.role ? (
                (() => {
                  const roleRaw = (u.role || '').toLowerCase();
                  const role = roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1);
                  const cls = roleRaw === 'admin' ? 'bg-red-100 text-red-800' : roleRaw === 'driver' ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-700';
                  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{role}</span>;
                })()
              ) : null}
            </div>
          </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit(u); }} className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(u); }} className="px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-2">
              <Trash className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const { showToast } = useToast();

  const getDisplayName = (u) => {
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
  const startDelete = (u) => { setDeletingUser(u); };
  const handleView = (u) => { setSelectedUser(u); setShowUserDetails(true); };
  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await AdminAPI.deleteUser(deletingUser.id);
      setUsers(prev => prev.filter(x => x.id !== deletingUser.id));
      showToast('User deleted', 'info');
      setDeletingUser(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete user', 'error');
    }
  };

  const handleSave = async (data) => {
    const payload = { ...data };
    if (editing && !payload.password) {
      delete payload.password;
    }
    try {
      if (editing) {
        const updated = await AdminAPI.updateUser(editing.id, payload);
        setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
        showToast('User updated', 'success');
      } else {
        const created = await AdminAPI.createUser(payload);
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
        <UsersCardList users={filtered} onEdit={startEdit} onDelete={startDelete} onView={handleView} />
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-blue-700 mb-4">{editing ? 'Edit User' : 'New User'}</h2>
            <UserForm initial={editing} onCancel={()=>{setShowForm(false); setEditing(null);}} onSave={handleSave} />
          </div>
        </div>
      )}

      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-blue-700">{formatUserName(selectedUser)}</h2>
                <div className="text-sm text-slate-500">{selectedUser.email || ''}</div>
                <div className="mt-1 text-sm text-slate-600">{selectedUser.phone || selectedUser.mobile || selectedUser.profile?.phone ? `Phone: ${selectedUser.phone || selectedUser.mobile || selectedUser.profile?.phone}` : null}</div>
                <div className="text-sm text-slate-600">{selectedUser.gender || selectedUser.profile?.gender ? `Gender: ${selectedUser.gender || selectedUser.profile?.gender}` : null}</div>
              </div>
              <div className="text-sm text-slate-500">{selectedUser.created_at || selectedUser.createdAt || '-'} <div>ID: {selectedUser.id}</div></div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
              <div>
                <div className="font-medium text-slate-600">Email</div>
                <div className="text-slate-700">{selectedUser.email || '-'}</div>
                <div className="mt-2 font-medium text-slate-600">Phone</div>
                <div className="text-slate-700">{selectedUser.phone || selectedUser.mobile || selectedUser.profile?.phone || '-'}</div>
                <div className="mt-2 font-medium text-slate-600">Gender</div>
                <div className="text-slate-700">{selectedUser.gender || selectedUser.profile?.gender || '-'}</div>
              </div>
              <div>
                <div className="font-medium text-slate-600">Role</div>
                <div className="text-slate-700 capitalize">{selectedUser.role || '-'}</div>
                <div className="mt-2 font-medium text-slate-600">Created</div>
                <div className="text-slate-700">{selectedUser.created_at || selectedUser.createdAt || '-'}</div>
                <div className="mt-2 font-medium text-slate-600">Last login</div>
                <div className="text-slate-700">{selectedUser.last_login || selectedUser.lastLogin || '-'}</div>
              </div>
              <div className="md:col-span-2">
                {selectedUser.profile && (
                  <div className="mt-2 border-t pt-2">
                    <div className="text-sm font-medium text-slate-600 mb-1">Profile</div>
                    {Object.entries(selectedUser.profile).map(([k,v]) => (
                      <div key={k} className="text-sm text-slate-700"><span className="font-medium text-slate-600">{k}: </span>{String(v)}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowUserDetails(false); setSelectedUser(null); }} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Close</button>
              <button onClick={() => { setShowUserDetails(false); setEditing(selectedUser); setShowForm(true); }} className="px-4 py-2 rounded-lg bg-blue-700 text-white">Edit</button>
            </div>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-9999 bg-black/50 overflow-y-auto flex items-start justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md my-8">
            <h2 className="text-xl font-bold text-red-700 mb-4">Delete User</h2>
            <p className="text-slate-700 mb-6">Are you sure you want to delete <strong>{getDisplayName(deletingUser)}</strong>? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingUser(null)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
