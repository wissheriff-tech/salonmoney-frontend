'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, User, Lock, Wallet } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { resolvePostLoginRedirect } from '@/utils/navigation';
import { reloadIfPwaUpdateIsReady } from '@/utils/pwaUpdate';

function Field({ label, children, action }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.02em' }}>
          {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  );
}

function Input({ icon: Icon, right, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {Icon && (
        <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: focused ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)', pointerEvents: 'none', transition: 'color 0.2s' }}>
          <Icon size={15} />
        </div>
      )}
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: '100%',
          padding: `0.75rem ${right ? '2.75rem' : '0.875rem'} 0.75rem ${Icon ? '2.6rem' : '0.875rem'}`,
          background: focused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
          border: `1px solid ${focused ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: '10px',
          color: '#fff',
          fontSize: '0.875rem',
          outline: 'none',
          transition: 'all 0.2s',
          boxSizing: 'border-box',
          boxShadow: focused ? '0 0 0 3px rgba(139,92,246,0.2)' : 'none',
          ...props.style,
        }}
      />
      {right}
    </div>
  );
}

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [updateProgress, setUpdateProgress] = useState(null);
  const [updateStage, setUpdateStage] = useState('Checking for the latest version');
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    let reloadingForUpdate = false;
    try {
      reloadingForUpdate = await reloadIfPwaUpdateIsReady({
        onProgress: ({ progress, stage }) => {
          setUpdateProgress(progress);
          setUpdateStage(stage || 'Checking for the latest version');
        },
      });
      if (reloadingForUpdate) return;
      setUpdateProgress(null);

      const data = await login(identifier.trim(), password, rememberMe);
      if (data.requiresTwoFactor) {
        try {
          if (rememberMe) {
            window.sessionStorage.setItem('pendingLoginRememberMe', '1');
          } else {
            window.sessionStorage.removeItem('pendingLoginRememberMe');
          }
        } catch {}
        toast.success(data.message);
        router.push(`/verify-2fa?userId=${data.userId}`);
        return;
      }
      try {
        window.sessionStorage.removeItem('pendingLoginRememberMe');
      } catch {}
      toast.success('Welcome back!');
      router.push(resolvePostLoginRedirect(data));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      if (!reloadingForUpdate) setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem 1rem 3rem',
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'auto',
    }}>
      {updateProgress !== null && (
        <div className="pwa-update-shell" role="status" aria-live="assertive">
          <div className="pwa-update-card">
            <p className="pwa-install-title">Updating SalonMoney</p>
            <p className="pwa-install-copy">{updateStage}. {updateProgress}%</p>
            <div
              className="pwa-update-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={updateProgress}
            >
              <div style={{ width: `${updateProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Aurora orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'oklch(0.62 0.19 295 / .12)', filter: 'blur(120px)', top: -200, left: -150 }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'oklch(0.55 0.18 240 / .10)', filter: 'blur(100px)', bottom: -100, right: -100 }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(245,158,11,0.06)', filter: 'blur(80px)', top: '40%', right: '20%' }} />
      </div>

      {/* Content */}
      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', marginBottom: '1.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '1.375rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>SalonMoney</span>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 20,
          padding: '2rem 1.75rem',
          boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)',
        }}>

          <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>Welcome back</h1>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>Sign in to continue to SalonMoney</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Username or phone */}
            <Field label="Username or phone">
              <Input
                icon={User}
                name="username"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter username or phone"
                required
                autoComplete="username"
              />
            </Field>

            {/* Password */}
            <Field
              label="Password"
              action={
                <Link href="/forgot-password" style={{ fontSize: '0.72rem', color: 'rgba(167,139,250,0.85)', textDecoration: 'none', fontWeight: 500 }}>
                  Forgot password?
                </Link>
              }
            >
              <Input
                icon={Lock}
                name="password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                autoComplete="current-password"
                right={
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', padding: 0, lineHeight: 0 }}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </Field>

            {/* Remember me */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '-0.25rem' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: '#8b5cf6', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>Keep me signed in</span>
            </label>

            {/* Submit */}
            <button type="submit" disabled={isLoading} style={{
              width: '100%',
              padding: '0.9rem',
              background: isLoading
                ? 'rgba(139,92,246,0.4)'
                : 'linear-gradient(135deg, oklch(0.62 0.19 295) 0%, oklch(0.50 0.20 270) 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLoading ? 'none' : '0 4px 24px oklch(0.62 0.19 295 / .45)',
              transition: 'all 0.2s',
              marginTop: '0.25rem',
            }}>
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)' }}>
          Have a referral code?{' '}
          <Link href="/signup" style={{ color: '#fff', fontWeight: 700, textDecoration: 'none' }}>Create account</Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
