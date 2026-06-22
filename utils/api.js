import axios from 'axios';
import { API_ROUTES, APP_ROUTES, PUBLIC_APP_PATHS } from '@/utils/navigation';

const FALLBACK_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://salonmoneynewbackend.vercel.app/api'
  : 'http://localhost:5000/api';

export const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL || FALLBACK_API_URL);
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/i, '');

export function normalizeApiBaseUrl(url) {
  const clean = String(url || FALLBACK_API_URL).trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

export function normalizeApiPath(path) {
  if (path == null) return path;
  const value = String(path);
  if (/^(https?:)?\/\//i.test(value)) return value;
  const withSlash = value.startsWith('/') ? value : `/${value}`;
  return withSlash.replace(/^\/api(?=\/|$)/i, '') || '/';
}

export function backendAssetUrl(path) {
  if (!path) return '';
  const value = String(path);
  if (/^(https?:)?\/\//i.test(value)) return value;
  return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30s — tolerates Vercel cold starts
  headers: { 'Content-Type': 'application/json' },
});

const SAFE_METHODS = new Set(['get', 'head', 'options']);
const PRIVILEGED_PATH_PREFIXES = ['/admin', '/finance', '/superadmin'];

function isPrivilegedFrontendPath() {
  if (typeof window === 'undefined') return false;
  return PRIVILEGED_PATH_PREFIXES.some(path => window.location.pathname === path || window.location.pathname.startsWith(`${path}/`));
}

function safeUserErrorMessage(error) {
  if (!error.response) {
    return 'Network error. Please check your network and try again.';
  }

  const status = error.response.status;
  const backendMessage = error.response?.data?.message;

  if (status === 400) return backendMessage || 'Please check the information you entered and try again.';
  if (status === 401) return 'Wrong phone, username, or password. Enter your correct login details.';
  if (status === 403) return backendMessage || 'You cannot access this action.';
  if (status === 404) return 'That item could not be found.';
  if (status === 409) return backendMessage || 'This action conflicts with existing information.';
  if (status === 413) return 'The file is too large. Please upload a smaller file.';
  if (status === 429) return 'Too many attempts. Please wait and try again.';
  if (status >= 500) return 'Something went wrong. Please try again later.';
  return backendMessage || 'Something went wrong. Please try again.';
}

function attachSafeErrorMessage(error) {
  if (isPrivilegedFrontendPath()) return error;

  const message = safeUserErrorMessage(error);
  if (!error.response) {
    error.response = { status: 0, data: { message } };
  } else {
    error.response.data = { ...(error.response.data || {}), message };
  }
  error.userMessage = message;
  return error;
}

api.interceptors.request.use((config) => {
  const method = String(config.method || 'get').toLowerCase();
  config.url = normalizeApiPath(config.url);

  if (!SAFE_METHODS.has(method)) {
    if (typeof config.headers?.set === 'function') {
      config.headers.set('X-Requested-With', 'XMLHttpRequest');
    } else {
      config.headers = {
        ...config.headers,
        'X-Requested-With': 'XMLHttpRequest',
      };
    }
  }
  return config;
});

// Only redirect to /login on 401 from protected pages.
// Never redirect on network errors/timeouts (cold start).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    attachSafeErrorMessage(error);
    const is401 = error.response?.status === 401;
    if (is401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isPublic = PUBLIC_APP_PATHS.some(p => path === p || (p !== APP_ROUTES.home && path.startsWith(`${p}/`)));
      if (!isPublic) {
        api.post(API_ROUTES.auth.logout).catch(() => {});
        window.location.href = APP_ROUTES.login;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
