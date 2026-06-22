'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '@/utils/api';

const BG = 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)';

const inputStyle = {
  width: '100%',
  background: '#fff',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 12,
  padding: '0.875rem 1.125rem',
  color: '#111',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function ResetPassword() {
  const router = useRouter();
  const params = useParams();
  const token = params.token;

  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [isLoading, setIsLoading]             = useState(false);
  const [done, setDone]                       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      toast.error('Password must contain uppercase, lowercase, number, and special character');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      toast.success(data.message || 'Password reset successfully');
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

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

        {done ? (
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <CheckCircle size={28} color="#10b981" />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Password Reset!</h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Redirecting you to login…
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.75rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>Reset Password</h1>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                Enter your new password below.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '1.75rem' }}>
              <form onSubmit={handleSubmit}>
                {/* New password */}
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '0.4rem' }}>
                  New Password
                </label>
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <Lock size={16} color="rgba(0,0,0,0.35)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    style={{ ...inputStyle, paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.4)', padding: 0, display: 'flex' }}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Confirm password */}
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                  <Lock size={16} color="rgba(0,0,0,0.35)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    style={{ ...inputStyle, paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.4)', padding: 0, display: 'flex' }}>
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                <button type="submit" disabled={isLoading || !password || !confirmPassword} style={{
                  width: '100%', padding: '0.875rem', borderRadius: 12, fontWeight: 800, fontSize: '0.875rem',
                  cursor: isLoading || !password || !confirmPassword ? 'not-allowed' : 'pointer',
                  background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', color: '#a78bfa',
                  opacity: isLoading || !password || !confirmPassword ? 0.5 : 1,
                }}>
                  {isLoading ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
