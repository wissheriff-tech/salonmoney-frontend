'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Layout from '@/components/common/Layout';
import { Shield, Smartphone, Lock, AlertTriangle, X, ChevronRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/utils/api';

const BG = 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)';
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '0.8rem 1rem', color: '#fff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '0.4rem' };

const STEPS = { IDLE: 'idle', ENABLE_EMAIL: 'enable_email', ENABLE_CODE: 'enable_code', DISABLE_CONFIRM: 'disable_confirm' };

function Modal({ onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'rgba(10,6,25,0.97)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 20, padding: '1.75rem', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', lineHeight: 0 }}>
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [method, setMethod]     = useState(null);
  const [step, setStep]         = useState(STEPS.IDLE);
  const [isLoading, setIsLoading] = useState(false);
  const [enableEmail, setEnableEmail] = useState('');
  const [enableCode, setEnableCode]   = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode]         = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/security/2fa/status')
      .then(({ data }) => { setTwoFactorEnabled(data.enabled); setMethod(data.method); })
      .catch(() => setTwoFactorEnabled(user?.twoFactorEnabled || false));
    setEnableEmail(user?.email || '');
  }, [user, router]);

  const reset = () => {
    setStep(STEPS.IDLE);
    setEnableEmail(user?.email || '');
    setEnableCode(''); setDisablePassword(''); setDisableCode('');
  };

  const sendEnableCode = async (e) => {
    e.preventDefault();
    if (!enableEmail) return toast.error('Email is required');
    setIsLoading(true);
    try {
      await api.post('/security/2fa/enable', { method: 'email', email: enableEmail });
      setStep(STEPS.ENABLE_CODE);
      toast.success('Verification code sent');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send code');
    } finally { setIsLoading(false); }
  };

  const confirmEnable = async (e) => {
    e.preventDefault();
    if (!enableCode) return toast.error('Enter the verification code');
    setIsLoading(true);
    try {
      await api.post('/security/2fa/verify', { code: enableCode });
      setTwoFactorEnabled(true); setMethod('email'); reset();
      toast.success('2FA enabled');
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid code');
    } finally { setIsLoading(false); }
  };

  const disableTwoFactor = async (e) => {
    e.preventDefault();
    if (!disablePassword) return toast.error('Password is required');
    if (!disableCode) return toast.error('Backup code is required');
    setIsLoading(true);
    try {
      await api.post('/security/2fa/disable', { password: disablePassword, code: disableCode });
      setTwoFactorEnabled(false); setMethod(null); reset();
      toast.success('2FA disabled');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to disable 2FA');
    } finally { setIsLoading(false); }
  };

  return (
    <Layout>
      {step !== STEPS.IDLE && (
        <Modal onClose={reset}>
          {step === STEPS.ENABLE_EMAIL && (
            <>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Enable 2FA</h2>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1.25rem' }}>We&apos;ll send a 6-digit code to confirm your email.</p>
              <form onSubmit={sendEnableCode}>
                <label style={labelStyle}>Email address</label>
                <input type="email" value={enableEmail} onChange={e => setEnableEmail(e.target.value)} style={{ ...inputStyle, marginBottom: '1rem' }} required />
                <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.8rem', borderRadius: 12, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', color: '#a78bfa', fontWeight: 800, cursor: 'pointer', opacity: isLoading ? 0.6 : 1 }}>
                  {isLoading ? 'Sending…' : 'Send verification code'}
                </button>
              </form>
            </>
          )}

          {step === STEPS.ENABLE_CODE && (
            <>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Enter code</h2>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1.25rem' }}>6-digit code sent to <strong style={{ color: '#fff' }}>{enableEmail}</strong>.</p>
              <form onSubmit={confirmEnable}>
                <input
                  type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                  value={enableCode} onChange={e => setEnableCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  style={{ ...inputStyle, textAlign: 'center', fontSize: '1.75rem', letterSpacing: '0.25em', fontFamily: 'monospace', marginBottom: '1rem' }}
                  required />
                <button type="submit" disabled={isLoading || enableCode.length !== 6} style={{ width: '100%', padding: '0.8rem', borderRadius: 12, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', color: '#a78bfa', fontWeight: 800, cursor: 'pointer', marginBottom: '0.5rem', opacity: isLoading || enableCode.length !== 6 ? 0.5 : 1 }}>
                  {isLoading ? 'Verifying…' : 'Activate 2FA'}
                </button>
                <button type="button" onClick={() => setStep(STEPS.ENABLE_EMAIL)} style={{ width: '100%', padding: '0.6rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', cursor: 'pointer' }}>
                  Didn&apos;t receive it? Go back
                </button>
              </form>
            </>
          )}

          {step === STEPS.DISABLE_CONFIRM && (
            <>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Disable 2FA</h2>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1.25rem' }}>Enter your password and a backup code to confirm.</p>
              <form onSubmit={disableTwoFactor}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Current password</label>
                  <input type="password" value={disablePassword} onChange={e => setDisablePassword(e.target.value)} style={inputStyle} required />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>Backup code</label>
                  <input type="text" value={disableCode} onChange={e => setDisableCode(e.target.value.toUpperCase())} placeholder="XXXXXXXX" style={{ ...inputStyle, fontFamily: 'monospace' }} required />
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.3rem' }}>Use one of the backup codes you saved when enabling 2FA.</p>
                </div>
                <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.8rem', borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', fontWeight: 800, cursor: 'pointer', opacity: isLoading ? 0.6 : 1 }}>
                  {isLoading ? 'Disabling…' : 'Disable 2FA'}
                </button>
              </form>
            </>
          )}
        </Modal>
      )}

      <div className="account-readable-surface" style={{ minHeight: '100vh', background: BG, padding: '2rem 1rem 3rem', position: 'relative' }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'oklch(0.62 0.19 295 / .09)', filter: 'blur(100px)', top: -100, right: -80 }} />
          <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'oklch(0.55 0.18 240 / .07)', filter: 'blur(90px)', bottom: -80, left: -60 }} />
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <button onClick={() => router.push('/account')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
            <ChevronRight size={15} style={{ transform: 'rotate(180deg)' }} /> Account
          </button>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Security Settings</h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.75rem' }}>Manage authentication and account security</p>

          {/* 2FA card */}
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Smartphone size={20} color="#a78bfa" />
                </div>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '0.2rem' }}>Two-Factor Authentication</p>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>Extra security layer for your account</p>
                </div>
              </div>
              {twoFactorEnabled ? (
                <button onClick={() => setStep(STEPS.DISABLE_CONFIRM)} style={{ padding: '0.45rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0 }}>
                  Disable 2FA
                </button>
              ) : (
                <button onClick={() => setStep(STEPS.ENABLE_EMAIL)} style={{ padding: '0.45rem 1rem', borderRadius: 10, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', color: '#a78bfa', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0 }}>
                  Enable 2FA
                </button>
              )}
            </div>

            {twoFactorEnabled ? (
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>2FA is active</p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(16,185,129,0.7)', marginTop: '0.1rem' }}>
                    {method === 'email' ? 'A code is sent to your email at each login.' : 'Your account is protected with 2FA.'}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>2FA is not enabled</p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(245,158,11,0.7)', marginTop: '0.1rem' }}>Enable 2FA to protect against unauthorized access.</p>
                </div>
              </div>
            )}
          </div>

          {/* Password card */}
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lock size={18} color="#fb923c" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '0.15rem' }}>Password</p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                Last changed: {user?.password_updated_at ? new Date(user.password_updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
              </p>
            </div>
            <button onClick={() => router.push('/account/change-password')} style={{ padding: '0.45rem 1rem', borderRadius: 10, background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.3)', color: '#fb923c', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0 }}>
              Change
            </button>
          </div>

          {/* Recommendations */}
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18, padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <Shield size={18} color="#a78bfa" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>Security Recommendations</p>
            </div>
            {[
              ['Use a strong, unique password', 'Combine uppercase, lowercase, numbers, and special characters'],
              ['Enable two-factor authentication', 'Protect your account from unauthorized access'],
              ["Never share your password", "SalonMoney will never ask for your password via email or phone"],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', flexShrink: 0, marginTop: 6 }} />
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '0.15rem' }}>{title}</p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
