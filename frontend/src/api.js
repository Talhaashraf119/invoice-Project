// Backend address. Empty = same server (local proxy or single deployment).
// If the frontend is deployed separately (e.g. Vercel), set VITE_API_URL=https://your-backend.onrender.com
const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

// Small fetch wrapper: adds the JWT token and handles errors in one place
export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: 'Bearer ' + token }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && token) {
    logout();
    return;
  }
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export function saveSession({ token, user }) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function getUser() {
  return JSON.parse(localStorage.getItem('user') || '{}');
}

export function logout() {
  localStorage.clear();
  window.location.href = '/login';
}

export function money(amount) {
  const value = Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${getUser().currency || 'PKR'} ${value}`;
}

export function formatDate(d) {
  return d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
}

export const today = () => new Date().toISOString().slice(0, 10);
