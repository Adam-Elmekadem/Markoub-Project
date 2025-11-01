import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, FileText, Image as ImageIcon, Tag, Calendar, User } from 'lucide-react';
import { AdminAPI } from '../../utils/adminApi';
import { useToast } from '../../components/Toast';
import { Spinner } from '../../components/Spinner';

export const Blogs = () => {
  const { showToast } = useToast();
  const [blogs, setBlogs] = useState([]);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '',
    author: '',
    category: '',
    date: new Date().toISOString().slice(0,10),
    readTime: '5 min read',
    image: '',
    status: 'draft',
    content: '',
    sections: [{ h2: '', h3: '', body: '' }]
  });
  const [errors, setErrors] = useState({});
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);
  const [blogsError, setBlogsError] = useState(null);
    const getAuthorName = (b) => {
      const a = b?.author;
      if (!a) return '';
      if (typeof a === 'string') return a;
      // possible shapes: { name }, { full_name }, { first_name, last_name }, or nested user object
      if (a.name) return a.name;
      if (a.full_name) return a.full_name;
      if (a.fullName) return a.fullName;
      const first = a.first_name || a.firstName || '';
      const last = a.last_name || a.lastName || '';
      const combined = `${first} ${last}`.trim();
      if (combined) return combined;
      return a.email || '';
    };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoadingBlogs(true);
      try {
        const res = await AdminAPI.listBlogs();
        if (mounted) setBlogs(Array.isArray(res) ? res : (res || []));
      } catch (err) {
        console.error('Failed to load blogs', err);
        showToast('Failed to load blogs', 'error');
        setBlogsError(err?.message || 'Failed to load blogs');
      } finally {
        setIsLoadingBlogs(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return blogs;
      return blogs.filter(b => {
        const title = (b.title || '').toString().toLowerCase();
        const author = getAuthorName(b).toString().toLowerCase();
        const category = (b.category || '').toString().toLowerCase();
        return title.includes(q) || author.includes(q) || category.includes(q);
      });
  }, [blogs, query]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', author: '', category: '', date: new Date().toISOString().slice(0,10), readTime: '5 min read', image: '', status: 'draft', content: '', sections: [{ h2: '', h3: '', body: '' }] });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (blog) => {
    setEditing(blog);
    // If existing blog has content, seed it into one section by default.
    const sections = blog?.sections || (blog?.content ? [{ h2: '', h3: '', body: blog.content }] : [{ h2: '', h3: '', body: '' }]);
    setForm({ ...blog, sections });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.author.trim()) e.author = 'Author is required';
    if (!form.category.trim()) e.category = 'Category is required';
    // Ensure at least one non-empty section (title or body)
    const hasSectionContent = Array.isArray(form.sections) && form.sections.some(s => (s.h2||'').trim() || (s.h3||'').trim() || (s.body||'').trim());
    if (!hasSectionContent) e.content = 'At least one section is required';
    if (form.image && !/^https?:\/\//i.test(form.image)) e.image = 'Provide a valid image URL (http/https)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addSection = () => {
    setForm(prev => ({ ...prev, sections: [...(prev.sections || []), { h2: '', h3: '', body: '' }] }));
  };

  const removeSection = (idx) => {
    setForm(prev => ({ ...prev, sections: (prev.sections || []).filter((_, i) => i !== idx) }));
  };

  const updateSection = (idx, field, value) => {
    setForm(prev => {
      const sections = Array.isArray(prev.sections) ? [...prev.sections] : [];
      sections[idx] = { ...(sections[idx] || {}), [field]: value };
      return { ...prev, sections };
    });
  };

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

  const save = () => {
    if (!validate()) return;
    (async () => {
      if (!validate()) return;
      try {
        // Serialize sections into HTML content
        const contentHtml = (Array.isArray(form.sections) ? form.sections : []).map(s => {
          let html = '';
          if (s.h2 && s.h2.trim()) html += `<h2>${s.h2.trim()}</h2>`;
          if (s.h3 && s.h3.trim()) html += `<h3>${s.h3.trim()}</h3>`;
          if (s.body && s.body.trim()) html += `<p>${s.body.trim()}</p>`;
          return html;
        }).join('\n');
        const payload = { ...form, content: contentHtml };
        if (editing) {
          const updated = await AdminAPI.updateBlog(editing.id, payload);
          setBlogs(prev => prev.map(b => (b.id === updated.id ? updated : b)));
          showToast('Blog updated', 'success');
        } else {
          const created = await AdminAPI.createBlog(payload);
          setBlogs(prev => [created, ...(prev || [])]);
          showToast('Blog created', 'success');
        }
        setModalOpen(false);
      } catch (err) {
        console.error(err);
        showToast('Failed to save blog', 'error');
      }
    })();
  };

  const remove = async (blog) => {
    if (!confirm(`Delete blog: ${blog.title}?`)) return;
    try {
      await AdminAPI.deleteBlog(blog.id);
      setBlogs(prev => prev.filter(b => b.id !== blog.id));
      showToast('Blog deleted', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete blog', 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2"><FileText className="w-6 h-6"/> Blogs</h1>
        <button onClick={openNew} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <Plus className="w-4 h-4"/> New Blog
        </button>
      </div>

      {/* Filters/Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or category"
          className="w-full md:w-80 px-3 py-2 rounded-lg border border-slate-300 placeholder-slate-400"
        />
      </div>

      {isLoadingBlogs ? (
        <div className="text-center py-12">
          <div className="mx-auto mb-4"><Spinner className="w-12 h-12" /></div>
          <p className="text-slate-500">Loading blogs...</p>
        </div>
      ) : (
      <div ref={wrapperRef} className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto rounded-xl border border-slate-200 no-scrollbar touch-scroll">
        <table className="w-full table-auto divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Author</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filtered.map((b, i) => (
              <tr key={b.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50 hover:bg-slate-100'}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {b.image ? (
                      <img src={b.image} alt="cover" className="w-12 h-12 rounded object-cover border" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center border"><ImageIcon className="w-5 h-5 text-slate-400"/></div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-900">{b.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{(b.content || '').replace(/<[^>]+>/g,'').slice(0,80)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{getAuthorName(b)}</td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs"><Tag className="w-3 h-3"/>{b.category}</span></td>
                <td className="px-4 py-3 text-slate-700">{b.date}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.status === 'published' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(b)} className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1"><Pencil className="w-4 h-4"/> Edit</button>
                    <button onClick={() => remove(b)} className="px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1"><Trash2 className="w-4 h-4"/> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {blogsError ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-red-600">Failed to load blogs: {blogsError}</td>
              </tr>
            ) : (filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No blogs found</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-9999 bg-black/30 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl p-6 relative my-8 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-blue-700 mb-4">{editing ? 'Edit Blog' : 'New Blog'}</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${errors.title?'border-red-500':'border-slate-300'}`} />
                  {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
                  <input value={form.author} onChange={(e)=>setForm({...form,author:e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${errors.author?'border-red-500':'border-slate-300'}`} />
                  {errors.author && <p className="text-xs text-red-600 mt-1">{errors.author}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${errors.category?'border-red-500':'border-slate-300'}`} />
                  {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} className="w-full pl-9 px-3 py-2 rounded-lg border border-slate-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Read Time</label>
                  <input value={form.readTime} onChange={(e)=>setForm({...form,readTime:e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image URL</label>
                  <input value={form.image} onChange={(e)=>setForm({...form,image:e.target.value})} className={`w-full px-3 py-2 rounded-lg border ${errors.image?'border-red-500':'border-slate-300'}`} />
                  {errors.image && <p className="text-xs text-red-600 mt-1">{errors.image}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sections</label>
                  <div className="space-y-3">
                    {(form.sections || []).map((s, idx) => (
                      <div key={idx} className="border rounded p-3 bg-slate-50">
                        <div className="flex gap-2 mb-2">
                          <input placeholder="H2 title (optional)" value={s.h2 || ''} onChange={e=>updateSection(idx, 'h2', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-300" />
                          <input placeholder="H3 title (optional)" value={s.h3 || ''} onChange={e=>updateSection(idx, 'h3', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-300" />
                          <button type="button" onClick={() => removeSection(idx)} className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700"><Trash2 className="w-4 h-4"/></button>
                        </div>
                        <textarea placeholder="Section body (optional)" value={s.body || ''} onChange={e=>updateSection(idx, 'body', e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                      </div>
                    ))}
                    <div>
                      <button type="button" onClick={addSection} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white"><Plus className="w-4 h-4"/> Add section</button>
                    </div>
                  </div>
                  {errors.content && <p className="text-xs text-red-600 mt-1">{errors.content}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={()=>setModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700">Cancel</button>
                <button onClick={save} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blogs;
