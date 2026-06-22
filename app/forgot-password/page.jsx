'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '@/utils/api';

const BG = 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)';
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12, padding: '0.875rem 1.125rem', color: '#fff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
};

export default function ForgotPassword() {
  const [email, setEmail]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success(data.message);
      setEmailSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
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

        {emailSent ? (
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <CheckCircle size={28} color="#10b981" />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Check Your Email</h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              If an account with that email exists, we&apos;ve sent password reset instructions.
            </p>
            <Link href="/login" style={{ display: 'block', padding: '0.875rem', borderRadius: 12, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', color: '#a78bfa', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', textAlign: 'center' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.75rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>Forgot Password</h1>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                Enter your email and we&apos;ll send a reset link.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '1.75rem' }}>
              <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                  <Mail size={16} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{ ...inputStyle, paddingLeft: '2.75rem' }}
                    required
                    autoComplete="email"
                  />
                </div>

                <button type="submit" disabled={isLoading || !email} style={{
                  width: '100%', padding: '0.875rem', borderRadius: 12, fontWeight: 800, fontSize: '0.875rem', cursor: isLoading || !email ? 'not-allowed' : 'pointer',
                  background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', color: '#a78bfa',
                  opacity: isLoading || !email ? 0.5 : 1,
                }}>
                  {isLoading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
