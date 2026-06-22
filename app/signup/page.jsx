'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, User, Mail, Phone, Lock, Gift, Wallet } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor  = ['', '#ef4444', '#f59e0b', '#f59e0b', '#10b981'];

function Field({ label, hint, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.02em' }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Input({ icon: Icon, right, highlight, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {Icon && (
        <div style={{
          position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
          color: focused ? (highlight ? 'rgba(245,158,11,0.9)' : 'rgba(255,255,255,0.8)') : (highlight ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.35)'),
          pointerEvents: 'none', transition: 'color 0.2s',
        }}>
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
          background: focused
            ? (highlight ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.12)')
            : (highlight ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.07)'),
          border: `1px solid ${focused
            ? (highlight ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.45)')
            : (highlight ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.15)')}`,
          borderRadius: '10px',
          color: '#fff',
          fontSize: '0.875rem',
          outline: 'none',
          transition: 'all 0.2s',
          boxSizing: 'border-box',
          boxShadow: focused
            ? (highlight ? '0 0 0 3px rgba(245,158,11,0.2)' : '0 0 0 3px rgba(139,92,246,0.2)')
            : 'none',
          ...props.style,
        }}
      />
      {right}
    </div>
  );
}

function SignupInner() {
  const [form, setForm] = useState({ referred_by: '', phone: '', username: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [strength, setStrength]   = useState(0);
  const { signup } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setForm(prev => ({ ...prev, referred_by: ref.toUpperCase() }));
  }, []);

  const getReqs = (p) => ({
    minLength: p.length >= 8,
    hasLower:  /[a-z]/.test(p),
    hasUpper:  /[A-Z]/.test(p),
    hasNumber: /\d/.test(p),
    hasSpecial: /[@$!%*?&]/.test(p),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = name === 'referred_by' ? value.toUpperCase() : value;
    setForm(prev => ({ ...prev, [name]: next }));
    if (name === 'password') {
      const r = getReqs(value);
      setStrength([r.minLength, r.hasLower && r.hasUpper, r.hasNumber, r.hasSpecial].filter(Boolean).length);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.referred_by.trim()) return toast.error('A referral code is required to create an account');
    if (!form.phone.trim()) return toast.error('Phone number is required');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    const r = getReqs(form.password);
    if (!r.minLength) return toast.error('Password must be at least 8 characters');
    if (!r.hasLower)  return toast.error('Password must contain a lowercase letter');
    if (!r.hasUpper)  return toast.error('Password must contain an uppercase letter');
    if (!r.hasNumber) return toast.error('Password must contain a number');
    if (!r.hasSpecial) return toast.error('Password must contain a special character (@$!%*?&)');
    setIsLoading(true);
    try {
      const username = form.username.trim() || form.phone.trim();
      await signup(username, form.phone, form.password, form.referred_by, form.email);
      toast.success('Account created! You can now sign in.');
      router.push('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create account. Please check your referral code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const reqs = getReqs(form.password);
  const passwordsMatch = form.confirmPassword && form.password === form.confirmPassword;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem 1rem 5rem',
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'auto',
    }}>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'oklch(0.62 0.19 295 / .12)', filter: 'blur(120px)', top: -200, right: -150 }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'oklch(0.55 0.18 240 / .10)', filter: 'blur(100px)', bottom: -100, left: -100 }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(245,158,11,0.06)', filter: 'blur(80px)', top: '40%', left: '50%' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

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

          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>Create your account</h1>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
              Invitation only — you need a referral code to join
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Referral code — first and required */}
            <div style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 12,
              padding: '1rem',
            }}>
              <Field label="Referral code">
                <Input
                  icon={Gift}
                  name="referred_by"
                  type="text"
                  value={form.referred_by}
                  onChange={handleChange}
                  placeholder="Enter your referral code"
                  autoComplete="off"
                  required
                  highlight
                  style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}
                />
                <p style={{ fontSize: '0.7rem', color: 'rgba(245,158,11,0.7)', marginTop: '0.4rem' }}>
                  Get your referral code from an existing SalonMoney member.
                </p>
              </Field>
            </div>

            {/* Phone */}
            <Field label="Phone number">
              <Input
                icon={Phone}
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+232-00-000-000"
                required
                autoComplete="tel"
              />
            </Field>

            {/* Password */}
            <Field label="Password">
              <Input
                icon={Lock}
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
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
              {form.password && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: '0.35rem', alignItems: 'center' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,0.12)', transition: 'background 0.2s' }} />
                    ))}
                    <span style={{ fontSize: '0.68rem', color: strengthColor[strength] || 'rgba(255,255,255,0.35)', marginLeft: 6, whiteSpace: 'nowrap' }}>
                      {strengthLabel[strength]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem 0.6rem' }}>
                    {[
                      [reqs.minLength, '8+ chars'],
                      [reqs.hasLower && reqs.hasUpper, 'Upper & lower'],
                      [reqs.hasNumber, 'Number'],
                      [reqs.hasSpecial, 'Special char'],
                    ].map(([met, text]) => (
                      <span key={text} style={{ fontSize: '0.68rem', color: met ? '#10b981' : 'rgba(255,255,255,0.35)' }}>
                        {met ? '✓' : '○'} {text}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Field>

            {/* Confirm password */}
            <Field label="Confirm password">
              <Input
                icon={Lock}
                name="confirmPassword"
                type={showPass ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
                right={
                  form.confirmPassword ? (
                    <div style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: passwordsMatch ? '#10b981' : '#ef4444', pointerEvents: 'none' }}>
                      {passwordsMatch
                        ? <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      }
                    </div>
                  ) : null
                }
              />
            </Field>

            {/* Display name — optional */}
            <Field label="Display name" hint="optional">
              <Input
                icon={User}
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="Leave blank to use your phone number"
                autoComplete="username"
              />
            </Field>

            {/* Email — optional */}
            <Field label="Email" hint="optional">
              <Input
                icon={Mail}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                autoComplete="email"
              />
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.3rem' }}>
                Used for password reset only.
              </p>
            </Field>

            {/* Terms */}
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginTop: '-0.25rem' }}>
              By creating an account you agree to our{' '}
              <Link href="/terms" style={{ color: 'rgba(167,139,250,0.9)', textDecoration: 'none' }}>Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" style={{ color: 'rgba(167,139,250,0.9)', textDecoration: 'none' }}>Privacy Policy</Link>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
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
              }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>
        </div>

        {/* Sign in link */}
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#fff', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  );
}
