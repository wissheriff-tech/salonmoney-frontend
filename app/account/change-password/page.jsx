'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Layout from '@/components/common/Layout';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/utils/api';

const BG = 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)';
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '0.8rem 1rem', color: '#fff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', paddingRight: '3rem' };
const labelStyle = { display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '0.4rem' };

const RULES = [
  { label: 'At least 8 characters',  test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',    test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',    test: (p) => /[a-z]/.test(p) },
  { label: 'One number',             test: (p) => /[0-9]/.test(p) },
];

export default function ChangePasswordPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => { if (!user) router.push('/login'); }, [user, router]);

  const toggle = (f) => setShow(s => ({ ...s, [f]: !s[f] }));
  const change = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error('New passwords do not match');
    if (form.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setIsLoading(true);
    try {
      await api.put('/user/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed successfully!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      router.push('/account');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setIsLoading(false); }
  };

  return (
    <Layout>
      <div className="account-readable-surface" style={{ minHeight: '100vh', background: BG, padding: '2rem 1rem 3rem', position: 'relative' }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'oklch(0.62 0.19 295 / .09)', filter: 'blur(100px)', top: -100, right: -80 }} />
          <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'oklch(0.55 0.18 240 / .07)', filter: 'blur(90px)', bottom: -80, left: -60 }} />
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <button onClick={() => router.push('/account')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
            <ArrowLeft size={15} /> Account
          </button>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Change Password</h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.75rem' }}>Update your account password</p>

          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '1.75rem' }}>
            <form onSubmit={handleSubmit}>
              {[
                { key: 'current', name: 'currentPassword', label: 'Current Password' },
                { key: 'new',     name: 'newPassword',     label: 'New Password' },
                { key: 'confirm', name: 'confirmPassword', label: 'Confirm New Password' },
              ].map(({ key, name, label }) => (
                <div key={name} style={{ marginBottom: '1.125rem' }}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={show[key] ? 'text' : 'password'}
                      name={name}
                      value={form[name]}
                      onChange={change}
                      style={inputStyle}
                      required
                      autoComplete={key === 'current' ? 'current-password' : 'new-password'}
                    />
                    <button type="button" onClick={() => toggle(key)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', lineHeight: 0 }}>
                      {show[key] ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Password rules */}
              {form.newPassword && (
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '0.875rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password rules</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {RULES.map(({ label, test }) => {
                      const ok = test(form.newPassword);
                      return (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CheckCircle size={12} color={ok ? '#10b981' : 'rgba(255,255,255,0.2)'} />
                          <span style={{ fontSize: '0.75rem', color: ok ? '#6ee7b7' : 'rgba(255,255,255,0.35)' }}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => router.push('/account')} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} style={{ flex: 2, padding: '0.8rem', borderRadius: 12, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', color: '#a78bfa', fontWeight: 800, cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: isLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <Lock size={15} /> {isLoading ? 'Changing…' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
