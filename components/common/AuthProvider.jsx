'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/utils/api';
import { API_ROUTES, PUBLIC_APP_PATHS } from '@/utils/navigation';
import { applyStoredTheme } from '@/utils/theme';

export default function AuthProvider({ children }) {
  const pathname = usePathname();
  const setUser = useAuthStore(state => state.setUser);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const syncTheme = () => applyStoredTheme();
    syncTheme();

    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    const MAX_RETRIES = 5;
    const isPublicPath = PUBLIC_APP_PATHS.includes(pathname);

    async function checkAuth({ retryOnNetwork = true } = {}) {
      try {
        const { data } = await api.get(API_ROUTES.user.dashboard, { timeout: 8000 });
        if (!cancelled) {
          if (data.user) setUser(data.user);
          useAuthStore.setState({ isInitializing: false });
          setConnecting(false);
        }
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;

        if (status === 401 || status === 403) {
          // Genuinely unauthenticated — stop trying
          useAuthStore.setState({ isInitializing: false });
          setConnecting(false);
          return;
        }

        // Network error / cold start — retry with backoff on protected app pages.
        if (retryOnNetwork && retries < MAX_RETRIES) {
          retries++;
          setConnecting(true);
          const delay = Math.min(2000 * retries, 10000); // 2s, 4s, 6s, 8s, 10s
          setTimeout(() => checkAuth({ retryOnNetwork }), delay);
        } else {
          // Give up — let user proceed as unauthenticated
          useAuthStore.setState({ isInitializing: false });
          setConnecting(false);
        }
      }
    }

    let publicAuthTimer = null;

    if (isPublicPath) {
      useAuthStore.setState({ isInitializing: false });
      const scheduleIdleCheck = window.requestIdleCallback || ((callback) => setTimeout(callback, 1200));
      publicAuthTimer = scheduleIdleCheck(() => checkAuth({ retryOnNetwork: false }));
    } else {
      checkAuth();
    }

    // Keep backend warm — ping every 3 min to prevent cold starts
    const ping = () => api.get(API_ROUTES.health).catch(() => {});
    const interval = setInterval(ping, 3 * 60 * 1000);

    return () => {
      cancelled = true;
      if (publicAuthTimer && window.cancelIdleCallback) window.cancelIdleCallback(publicAuthTimer);
      if (publicAuthTimer && !window.cancelIdleCallback) clearTimeout(publicAuthTimer);
      clearInterval(interval);
    };
  }, [pathname, setUser]);

  return (
    <>
      {connecting && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#f97316', color: '#fff',
          fontSize: '0.75rem', fontWeight: 600, textAlign: 'center',
          padding: '6px', letterSpacing: '0.03em',
        }}>
          Connecting to server…
        </div>
      )}
      {children}
    </>
  );
}
