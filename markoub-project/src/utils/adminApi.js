import { api } from './api';

// Admin API wrapper (frontend) — lightweight helpers for admin CRUD operations.
// These use the shared `api()` helper which already attaches the auth token.
export const AdminAPI = {
  // Users
  async listUsers(params = {}) {
    const qs = new URLSearchParams(params).toString();
    try {
      const res = await api(`/users${qs ? `?${qs}` : ''}`);
      return res?.data || res;
    } catch (err) {
      // Backend doesn't expose /users by default in this project.
      // Return empty list so admin UI remains usable and show a clearer console message.
      console.warn('AdminAPI.listUsers: /users route not found or inaccessible.', err);
      return [];
    }
  },
  async createUser(payload) {
    const res = await api('/users', { method: 'POST', body: payload });
    return res?.data || res;
  },
  async updateUser(id, payload) {
    const res = await api(`/users/${id}`, { method: 'PUT', body: payload });
    return res?.data || res;
  },
  async deleteUser(id) {
    const res = await api(`/users/${id}`, { method: 'DELETE' });
    return res?.data || res;
  },

  // Blogs
  async listBlogs(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await api(`/blogs${qs ? `?${qs}` : ''}`);
    return res?.data || res;
  },
  async createBlog(payload) {
    const res = await api('/blogs', { method: 'POST', body: payload });
    return res?.data || res;
  },
  async updateBlog(id, payload) {
    const res = await api(`/blogs/${id}`, { method: 'PUT', body: payload });
    return res?.data || res;
  },
  async deleteBlog(id) {
    const res = await api(`/blogs/${id}`, { method: 'DELETE' });
    return res?.data || res;
  },

  // Rides (admin-level)
  async listRides(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await api(`/rides${qs ? `?${qs}` : ''}`);
    return res?.data || res;
  },
  async createRide(payload) {
    const res = await api('/rides', { method: 'POST', body: payload });
    return res?.data || res;
  },
  async updateRide(id, payload) {
    const res = await api(`/rides/${id}`, { method: 'PUT', body: payload });
    return res?.data || res;
  },
  async deleteRide(id) {
    const res = await api(`/rides/${id}`, { method: 'DELETE' });
    return res?.data || res;
  },

  // Comments
  async listComments(params = {}) {
    const qs = new URLSearchParams(params).toString();
    try {
      const res = await api(`/comments${qs ? `?${qs}` : ''}`);
      return res?.data || res;
    } catch (err) {
      // Comments listing endpoint may not be implemented; return empty list instead of throwing.
      console.warn('AdminAPI.listComments: GET /comments not available.', err);
      return [];
    }
  },
  async createComment(payload) {
    const res = await api('/comments', { method: 'POST', body: payload });
    return res?.data || res;
  },
  async updateComment(id, payload) {
    const res = await api(`/comments/${id}`, { method: 'PUT', body: payload });
    return res?.data || res;
  },
  async deleteComment(id) {
    const res = await api(`/comments/${id}`, { method: 'DELETE' });
    return res?.data || res;
  }
};

export default AdminAPI;
