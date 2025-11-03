// Simple API client using fetch with JWT support
function normalizeBaseUrl(raw) {
  try {
    if (!raw || typeof raw !== 'string') return null;
    let url = raw.trim();
    if (!url) return null;
    // Prefix protocol+host if missing (e.g. :8000/api/v1)
    if (url.startsWith(':')) {
      url = `${window.location.protocol}//127.0.0.1${url}`;
    }
    // Relative path -> make absolute to current origin
    if (url.startsWith('/')) {
      url = `${window.location.origin}${url}`;
    }
    // If no scheme present, default to http://
    if (!/^https?:\/\//i.test(url)) {
      url = `http://${url}`;
    }
    return url.replace(/\/$/, '');
  } catch {
    return null;
  }
}

const BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) ||
  `${window.location.protocol}//127.0.0.1:8000/api/v1`;

function getToken() {
  try {
    // Prefer persistent token in localStorage, fall back to sessionStorage.
    const rawLocal = localStorage.getItem('auth_token');
    if (rawLocal) return rawLocal;
    const rawSession = sessionStorage.getItem('auth_token');
    return rawSession || null;
  } catch {
    return null;
  }
}

export async function api(path, { method = 'GET', headers = {}, body, auth = true } = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const init = {
    method,
    headers: {
      'Accept': 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    credentials: 'include',
  };

  if (auth) {
    const token = getToken();
    if (token) init.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && typeof body !== 'string') {
    // If caller passed a FormData (file uploads), don't JSON.stringify and let fetch set the multipart boundary
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      // remove Content-Type so browser sets multipart/form-data with boundary
      delete init.headers['Content-Type'];
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
    }
  } else if (body) {
    init.body = body;
  }

  const res = await fetch(url, init);
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const message = (isJson && (data?.message || data?.error)) || res.statusText || 'Request failed';
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const AuthAPI = {
  async register(form) {
    // Map UI fields to API fields
    const payload = {
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      phone: form.phone,
      city: form.city,
      birthday: form.birthday,
      address: form.address,
      ...(form.gender ? { gender: form.gender } : {}),
      password: form.password,
      password_confirmation: form.confirmPassword || form.password,
      role: form.isDriver ? 'driver' : 'passenger',
    };

    // Add driver-specific fields if driver
    if (form.isDriver) {
      payload.license_number = form.licenseNumber;
      payload.vehicle_model = form.vehicleModel;
      // send both keys to be compatible with backends expecting either name
      payload.vehicle_number = form.vehicleNumber;
      payload.vehicle_number_plate = form.vehicleNumber;
      if (form.vehicleColor) payload.vehicle_color = form.vehicleColor;
      if (form.vehicleYear) payload.vehicle_year = form.vehicleYear;
    }

    const res = await api('/register', { method: 'POST', body: payload, auth: false });
    return res?.data;
  },
  async login({ email, password }) {
    const res = await api('/login', { method: 'POST', body: { email, password }, auth: false });
    return res?.data;
  },
  async me() {
    const res = await api('/me');
    return res?.data;
  },
  async updateProfile(payload) {
    // Support both JSON payload and FormData for avatar uploads
    const isForm = (typeof FormData !== 'undefined' && payload instanceof FormData);
    const res = await api('/profile', { method: 'PUT', body: payload });
    return res?.data;
  },
  async logout() {
    await api('/logout', { method: 'POST' });
  },
};

export const RidesAPI = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await api(`/rides${qs ? `?${qs}` : ''}`, { auth: false });
    return res?.data;
  },
  async update(id, payload) {
    const res = await api(`/rides/${id}`, { method: 'PUT', body: payload });
    return res?.data;
  },
  async get(id) {
    const res = await api(`/rides/${id}`);
    return res?.data;
  },
  async create(payload) {
    const res = await api('/rides', { method: 'POST', body: payload });
    return res?.data;
  },
  async myRides(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await api(`/my-rides${qs ? `?${qs}` : ''}`);
    return res?.data;
  },
  async delete(id) {
    const res = await api(`/rides/${id}`, { method: 'DELETE' });
    return res?.data;
  },
};

export const BookingsAPI = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await api(`/bookings${qs ? `?${qs}` : ''}`);
    return res?.data;
  },
  async create(payload) {
    const res = await api('/bookings', { method: 'POST', body: payload });
    return res?.data;
  },
  async get(id) {
    const res = await api(`/bookings/${id}`);
    return res?.data;
  },
  async confirm(id) {
    const res = await api(`/bookings/${id}/confirm`, { method: 'POST' });
    return res?.data;
  },
  async cancel(id) {
    const res = await api(`/bookings/${id}/cancel`, { method: 'POST' });
    return res?.data;
  }
};

export const BlogsAPI = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await api(`/blogs${qs ? `?${qs}` : ''}`, { auth: false });
    return res?.data;
  },
  async get(slug) {
    const res = await api(`/blogs/${slug}`, { auth: false });
    return res?.data;
  },
};
