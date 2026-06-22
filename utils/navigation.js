export const APP_ROUTES = Object.freeze({
  home: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  verify2fa: '/verify-2fa',
  dashboard: '/dashboard',
  products: '/products',
  deposit: '/deposit',
  recharge: '/recharge',
  withdraw: '/withdraw',
  transactions: '/transactions',
  referrals: '/referrals',
  account: '/account',
  admin: '/admin',
  superadmin: '/superadmin',
  ambassador: '/ambassador',
  terms: '/terms',
  privacy: '/privacy',
  contact: '/contact',
  help: '/help',
});

export const API_ROUTES = Object.freeze({
  health: '/health',
  auth: {
    logout: '/auth/logout',
  },
  user: {
    dashboard: '/user/dashboard',
    transactions: '/user/transactions',
  },
  products: {
    list: '/products',
    durations: '/products/durations',
    buy: '/products/buy',
  },
  notifications: {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    markAllRead: '/notifications/mark-all-read',
    clearRead: '/notifications/clear-read',
    read: (id) => `/notifications/${id}/read`,
    item: (id) => `/notifications/${id}`,
    adminMessage: '/notifications/admin/message',
  },
  testimonials: {
    public: '/testimonials',
  },
});

export const PUBLIC_APP_PATHS = Object.freeze([
  APP_ROUTES.home,
  APP_ROUTES.login,
  APP_ROUTES.signup,
  APP_ROUTES.forgotPassword,
  APP_ROUTES.resetPassword,
  APP_ROUTES.verifyEmail,
  APP_ROUTES.verify2fa,
  APP_ROUTES.terms,
  APP_ROUTES.privacy,
  APP_ROUTES.contact,
  APP_ROUTES.help,
]);

const ADMIN_ROLES = new Set(['superadmin', 'admin', 'finance']);

export function resolvePostLoginRedirect(data = {}) {
  const role = String(data.user?.role || '').trim().toLowerCase();
  const redirectTo = String(data.redirectTo || '').trim();
  const normalizedRedirect = redirectTo.replace(/^\/+/, '').toLowerCase();

  if (ADMIN_ROLES.has(role) || ADMIN_ROLES.has(normalizedRedirect)) {
    return APP_ROUTES.admin;
  }

  if (role === 'ambassador' || normalizedRedirect === 'ambassador') {
    return APP_ROUTES.ambassador;
  }

  if (normalizedRedirect === 'dashboard' || normalizedRedirect === 'user') {
    return APP_ROUTES.dashboard;
  }

  if (redirectTo.startsWith('/')) {
    return redirectTo;
  }

  return APP_ROUTES.dashboard;
}
