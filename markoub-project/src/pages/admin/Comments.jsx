import { useEffect, useMemo, useState } from 'react';
import { AdminAPI } from '../../utils/adminApi';
import { useToast } from '../../components/Toast';
import { Plus, Pencil, Trash } from 'lucide-react';
import { Spinner } from '../../components/Spinner';

const CommentForm = ({ initial, onCancel, onSave }) => {
  const [rides, setRides] = useState([]);
  const [isLoadingRides, setIsLoadingRides] = useState(false);
  const [isRidesError, setIsRidesError] = useState(false);
  const { showToast } = useToast();
  const [form, setForm] = useState(initial || { author: '', text: '', rideId: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.author.trim()) e.author = 'Author is required';
    if (!form.text.trim()) e.text = 'Text is required';
    if (!form.rideId) e.rideId = 'Select a ride';
    setErrors(e); return Object.keys(e).length === 0;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoadingRides(true);
        const res = await AdminAPI.listRides();
        if (mounted) setRides(Array.isArray(res) ? res : (res || []));
      } catch (err) {
        console.error('Failed to load rides for comments', err);
        showToast && showToast('Failed to load rides', 'error');
        setIsRidesError(true);
        if (mounted) setRides([]);
      } finally {
        setIsLoadingRides(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = (e) => { e.preventDefault(); if (!validate()) return; onSave(form); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Author</label>
          <input value={form.author} onChange={(e)=>setForm({...form,author:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
          {errors.author && <p className="text-sm text-red-600 mt-1">{errors.author}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Ride</label>
          <select value={form.rideId} onChange={(e)=>setForm({...form,rideId:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2">
            {isLoadingRides ? (
              <option value="" disabled>Loading rides...</option>
            ) : isRidesError ? (
              <option value="" disabled>Failed to load rides</option>
            ) : (
              (rides && rides.length) ? rides.map(r => (
                <option key={r.id} value={r.id}>{r.from} → {r.to} ({r.date})</option>
              )) : <option value="" disabled>No rides available</option>
            )}
          </select>
          {errors.rideId && <p className="text-sm text-red-600 mt-1">{errors.rideId}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Text</label>
        <textarea value={form.text} onChange={(e)=>setForm({...form,text:e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" rows={4} />
        {errors.text && <p className="text-sm text-red-600 mt-1">{errors.text}</p>}
      </div>
      <div className="flex gap-3">
        <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-lg">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border">Cancel</button>
      </div>
    </form>
  );
};

const CommentsTable = ({ comments, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
    <div className="overflow-x-auto force-scrollbar touch-scroll max-w-full px-4 sm:px-0">
      <table className="w-full table-auto divide-y divide-slate-200">
      <thead className="bg-slate-100">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Author</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Text</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Ride</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Date</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-slate-200">
        {comments.map((c, idx) => (
          <tr key={c.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50 hover:bg-slate-100'}>
            <td className="px-4 py-3 font-medium text-slate-900">{c.author}</td>
            <td className="px-4 py-3 max-w-xl truncate text-slate-700" title={c.text}>{c.text}</td>
            <td className="px-4 py-3 text-slate-700">{c.rideId}</td>
            <td className="px-4 py-3 text-slate-700">{new Date(c.createdAt).toLocaleString()}</td>
            <td className="px-4 py-3 text-right">
              <div className="flex items-center gap-2 justify-end">
                <button onClick={()=>onEdit(c)} className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1"><Pencil className="w-4 h-4"/> Edit</button>
                <button onClick={()=>onDelete(c)} className="px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1"><Trash className="w-4 h-4"/> Delete</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  </div>
);

export const Comments = () => {
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoadingComments(true);
        const res = await AdminAPI.listComments();
        if (mounted) setComments(Array.isArray(res) ? res : (res || []));
      } catch (err) {
        console.error('Failed to load comments', err);
        showToast && showToast('Failed to load comments', 'error');
        setCommentsError(true);
        if (mounted) setComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => comments.filter(c =>
    [c.author, c.text].join(' ').toLowerCase().includes(query.toLowerCase())
  ), [comments, query]);

  const startCreate = () => { setEditing(null); setShowForm(true); };
  const startEdit = (c) => { setEditing(c); setShowForm(true); };
  const handleDelete = async (c) => {
    if (!confirm(`Delete comment by ${c.author}?`)) return;
    try {
      await AdminAPI.deleteComment(c.id);
      setComments(prev => prev.filter(x => x.id !== c.id));
      showToast('Comment deleted', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete comment', 'error');
    }
  };

  const handleSave = async (data) => {
    try {
      if (editing) {
        const updated = await AdminAPI.updateComment(editing.id, data);
        setComments(prev => prev.map(c => (c.id === updated.id ? updated : c)));
        showToast('Comment updated', 'success');
      } else {
        const created = await AdminAPI.createComment(data);
        setComments(prev => [created, ...(prev || [])]);
        showToast('Comment created', 'success');
      }
      setShowForm(false); setEditing(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to save comment', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-700">Comments</h1>
          <p className="text-slate-600">Manage user comments</p>
        </div>
        <button onClick={startCreate} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4"/> New Comment
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search comments..." className="flex-1 border border-slate-300 rounded-lg px-3 py-2 placeholder-slate-400"/>
      </div>

      {isLoadingComments ? (
        <div className="py-12 flex items-center justify-center">
          <Spinner className="w-8 h-8" />
        </div>
      ) : commentsError ? (
        <div className="py-8 text-center text-red-600">Failed to load comments. Please try again later.</div>
      ) : (filtered && filtered.length ? (
        <CommentsTable comments={filtered} onEdit={startEdit} onDelete={handleDelete} />
      ) : (
        <div className="py-8 text-center text-slate-600">No comments found</div>
      ))}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-blue-700 mb-4">{editing ? 'Edit Comment' : 'New Comment'}</h2>
            <CommentForm initial={editing} onCancel={()=>{setShowForm(false); setEditing(null);}} onSave={handleSave} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Comments;
