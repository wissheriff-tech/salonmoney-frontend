import { useAuthStore } from '@/store/auth';

// Returns a user-friendly error message.
// Superadmin sees the raw backend message; everyone else sees a generic fallback.
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const isSuperAdmin = useAuthStore.getState()?.user?.role === 'superadmin';
  const backendMsg = err?.response?.data?.message;
  if (isSuperAdmin && backendMsg) return backendMsg;
  return fallback;
}
