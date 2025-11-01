// Lightweight localStorage-backed CRUD for admin demo
const USERS_KEY = 'admin_users';
const RIDES_KEY = 'admin_rides';
const COMMENTS_KEY = 'admin_comments';
const BLOGS_KEY = 'admin_blogs';

// NOTE: Seeding of demo admin data is intentionally disabled by default.
// If you need to populate local demo data for admin pages, call `seed()` manually
// from a development-only script or the browser console.
const seed = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    const users = [
      { id: 'u_1', name: 'Alice Johnson', email: 'alice@example.com', role: 'user' },
      { id: 'u_2', name: 'Bob Smith', email: 'bob@example.com', role: 'driver' },
      { id: 'u_3', name: 'Admin', email: 'admin@markoub.com', role: 'admin' },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  if (!localStorage.getItem(RIDES_KEY)) {
    const rides = [];
    localStorage.setItem(RIDES_KEY, JSON.stringify(rides));
  }
  if (!localStorage.getItem(COMMENTS_KEY)) {
    const comments = [];
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  }
  if (!localStorage.getItem(BLOGS_KEY)) {
    const blogs = [];
    localStorage.setItem(BLOGS_KEY, JSON.stringify(blogs));
  }
};

const read = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const write = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

// Users
export const getAllUsers = () => read(USERS_KEY);
export const createUser = (user) => { const all = read(USERS_KEY); const nu = { id: uid('u'), role: 'user', ...user }; write(USERS_KEY, [nu, ...all]); return nu; };
export const updateUser = (id, patch) => { const all = read(USERS_KEY); const idx = all.findIndex(u => u.id === id); if (idx >= 0) { all[idx] = { ...all[idx], ...patch }; write(USERS_KEY, all); return all[idx]; } return null; };
export const deleteUser = (id) => { const all = read(USERS_KEY).filter(u => u.id !== id); write(USERS_KEY, all); };

// Rides
export const getAllRides = () => read(RIDES_KEY);
export const createRide = (ride) => { const all = read(RIDES_KEY); const nr = { id: uid('r'), seats: 1, price: 0, ...ride }; write(RIDES_KEY, [nr, ...all]); return nr; };
export const updateRide = (id, patch) => { const all = read(RIDES_KEY); const idx = all.findIndex(r => r.id === id); if (idx >= 0) { all[idx] = { ...all[idx], ...patch }; write(RIDES_KEY, all); return all[idx]; } return null; };
export const deleteRide = (id) => { const all = read(RIDES_KEY).filter(r => r.id !== id); write(RIDES_KEY, all); };

// Comments
export const getAllComments = () => read(COMMENTS_KEY);
export const createComment = (comment) => { const all = read(COMMENTS_KEY); const nc = { id: uid('c'), createdAt: Date.now(), ...comment }; write(COMMENTS_KEY, [nc, ...all]); return nc; };
export const updateComment = (id, patch) => { const all = read(COMMENTS_KEY); const idx = all.findIndex(c => c.id === id); if (idx >= 0) { all[idx] = { ...all[idx], ...patch }; write(COMMENTS_KEY, all); return all[idx]; } return null; };
export const deleteComment = (id) => { const all = read(COMMENTS_KEY).filter(c => c.id !== id); write(COMMENTS_KEY, all); };

// Blogs
export const getAllBlogs = () => read(BLOGS_KEY);
export const createBlog = (blog) => { const all = read(BLOGS_KEY); const nb = { id: uid('b'), status: 'draft', date: new Date().toISOString().slice(0,10), ...blog }; write(BLOGS_KEY, [nb, ...all]); return nb; };
export const updateBlog = (id, patch) => { const all = read(BLOGS_KEY); const idx = all.findIndex(b => b.id === id); if (idx >= 0) { all[idx] = { ...all[idx], ...patch }; write(BLOGS_KEY, all); return all[idx]; } return null; };
export const deleteBlog = (id) => { const all = read(BLOGS_KEY).filter(b => b.id !== id); write(BLOGS_KEY, all); };
