'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import api from '@/utils/api';
import { resolvePostLoginRedirect } from '@/utils/navigation';
import { Lock, ArrowLeft } from 'lucide-react';

const BG = 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)';

function Verify2FAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const { setUser } = useAuthStore();
  const [rememberMe] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem('pendingLoginRememberMe') === '1';
    } catch {
      return false;
    }
  });

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!userId) {
      toast.error('Invalid session. Please login again.');
      router.push('/login');
    }
  }, [userId, router]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newCode = pastedData.split('');
    setCode([...newCode, ...Array(6 - newCode.length).fill('')]);
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await api.post('/auth/resend-2fa', { userId });
      toast.success('New code sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/verify-2fa', { userId, code: fullCode, rememberMe });

      // C-5 FIX: Token is already set as an httpOnly cookie by the server.
      // Do not store tokens in localStorage — XSS accessible storage is insecure.
      setUser(data.user);
      try {
        window.sessionStorage.removeItem('pendingLoginRememberMe');
      } catch {}

      toast.success('Login successful!');
      router.push(resolvePostLoginRedirect(data));
    } catch (error) {
      toast.error(error.response?.data?.message || '2FA verification failed');
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const allFilled = code.every(d => d !== '');

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative' }}>
      {/* Aurora */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'oklch(0.62 0.19 295 / .09)', filter: 'blur(120px)', top: -150, right: -100 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'oklch(0.55 0.18 240 / .07)', filter: 'blur(100px)', bottom: -100, left: -80 }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
          <ArrowLeft size={15} /> Back to Login
        </Link>

        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Lock size={22} color="#a78bfa" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>Two-Factor Auth</h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            Enter the 6-digit code sent to your email.
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '1.75rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  style={{
                    width: 48,
                    height: 56,
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#111',
                    background: '#fff',
                    border: digit ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 12,
                    outline: 'none',
                  }}
                  required
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || !allFilled}
              style={{
                width: '100%', padding: '0.875rem', borderRadius: 12, fontWeight: 800, fontSize: '0.875rem',
                cursor: isLoading || !allFilled ? 'not-allowed' : 'pointer',
                background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', color: '#a78bfa',
                opacity: isLoading || !allFilled ? 0.5 : 1,
              }}
            >
              {isLoading ? 'Verifying…' : 'Verify Code'}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
              Didn&apos;t receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={isResending}
                style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: isResending ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.82rem', padding: 0, opacity: isResending ? 0.5 : 1 }}
              >
                {isResending ? 'Sending…' : 'Resend Code'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Verify2FA() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>Loading…</div>
      </div>
    }>
      <Verify2FAContent />
    </Suspense>
  );
}
