'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Layout from '@/components/common/Layout';
import { Save, User, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/utils/api';

const BG = 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)';
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '0.8rem 1rem', color: '#fff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '0.4rem' };

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading]       = useState(false);
  const [form, setForm] = useState({ username: '', email: '' });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    setForm({ username: user.username || '', email: user.email || '' });
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await api.put('/user/profile', form);
      setUser(data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setIsLoading(false); }
  };

  const initial = (form.username || user?.username || user?.phone || 'U').charAt(0).toUpperCase();

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

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Account Settings</h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.75rem' }}>Update your profile information</p>

          {/* Avatar section */}
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '1.5rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Profile Avatar</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid rgba(167,139,250,0.4)', background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#a78bfa' }}>{initial}</span>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.25rem' }}>Your avatar uses the first letter of your username.</p>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>Profile image uploads are disabled.</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '1.5rem' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.125rem' }}>
                <label style={labelStyle}>
                  <User size={12} style={{ display: 'inline', marginRight: 4 }} /> Username
                </label>
                <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} style={inputStyle} placeholder="Your username" />
              </div>

              <div style={{ marginBottom: '1.125rem' }}>
                <label style={labelStyle}>
                  <Mail size={12} style={{ display: 'inline', marginRight: 4 }} /> Email Address
                </label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="your@email.com" />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Phone Number</label>
                <input type="text" value={user?.phone || ''} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.25rem' }}>Phone number cannot be changed</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => router.push('/account')} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} style={{ flex: 2, padding: '0.8rem', borderRadius: 12, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', color: '#a78bfa', fontWeight: 800, cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: isLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <Save size={15} /> {isLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
