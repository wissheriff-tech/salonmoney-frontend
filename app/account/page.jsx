'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Layout from '@/components/common/Layout';
import { User, Mail, Phone, Calendar, Crown, Shield, ShieldCheck, ChevronRight, Lock, Settings, Key } from 'lucide-react';

const BG = 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)';

export default function AccountPage() {
  const { user, isInitializing } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && !user) router.push('/login');
  }, [user, isInitializing, router]);

  if (isInitializing || !user) return null;

  const initials = (user.username || user.phone || 'U').charAt(0).toUpperCase();

  return (
    <Layout>
      <div className="account-readable-surface" style={{ minHeight: '100vh', background: BG, padding: '2rem 1rem 3rem', position: 'relative' }}>
        {/* Aurora */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'oklch(0.62 0.19 295 / .09)', filter: 'blur(100px)', top: -100, right: -80 }} />
          <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'oklch(0.55 0.18 240 / .07)', filter: 'blur(90px)', bottom: -80, left: -60 }} />
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Profile hero */}
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '1.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid rgba(167,139,250,0.4)', overflow: 'hidden', background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#a78bfa' }}>{initials}</span>
                </div>
                <div style={{ position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: '#10b981', border: '2px solid rgba(10,6,25,0.8)' }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.2rem' }}>{user.username || user.phone}</h1>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.5rem' }}>{user.phone}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {user.vip_level && user.vip_level !== 'none' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.35)', borderRadius: 20, padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 800, color: '#fcd34d' }}>
                      <Crown size={11} /> {user.vip_level}
                    </span>
                  )}
                  <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
                    {user.role}
                  </span>
                  <span style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: '#6ee7b7' }}>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Balances */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 16, padding: '1.25rem' }}>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.4rem' }}>NSL Balance</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{(user.balance_NSL || 0).toLocaleString()}</p>
              <p style={{ fontSize: '0.68rem', color: '#a78bfa', marginTop: '0.1rem' }}>NSL</p>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 16, padding: '1.25rem' }}>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.4rem' }}>USDT Balance</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{(user.balance_usdt || 0).toLocaleString()}</p>
              <p style={{ fontSize: '0.68rem', color: '#10b981', marginTop: '0.1rem' }}>USDT</p>
            </div>
          </div>

          {/* Account info */}
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18, padding: '1.5rem', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Account Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {[
                { Icon: User,     label: 'Username',      value: user.username || 'Not set' },
                { Icon: Mail,     label: 'Email',         value: user.email || 'Not set' },
                { Icon: Phone,    label: 'Phone',         value: user.phone || 'Not set' },
                { Icon: Shield,   label: 'Referral Code', value: user.referral_code || 'Not set', mono: true },
                { Icon: Calendar, label: 'Member Since',  value: user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A' },
                { Icon: ShieldCheck, label: 'KYC Status', value: user.kyc_verified ? 'Verified' : 'Not Verified', color: user.kyc_verified ? '#10b981' : '#f59e0b' },
              ].map(({ Icon, label, value, mono, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="rgba(255,255,255,0.5)" />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.15rem' }}>{label}</p>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: color || '#fff', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Settings</p>
            </div>
            {[
              { Icon: Settings,  label: 'Edit Profile',      sub: 'Update your account info', path: '/account/settings' },
              { Icon: Lock,      label: 'Change Password',   sub: 'Update your password',       path: '/account/change-password' },
              { Icon: Key,       label: 'Security Settings', sub: 'Manage 2FA',                  path: '/account/security' },
              { Icon: ShieldCheck, label: 'Verify Identity', sub: user.kyc_verified ? 'KYC verified' : 'Submit KYC documents', path: '/account/kyc', badge: user.kyc_verified ? 'Verified' : null },
            ].map(({ Icon, label, sub, path, badge }) => (
              <button key={path} onClick={() => router.push(path)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} color="rgba(255,255,255,0.6)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{label}</p>
                    {badge && <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '0.1rem 0.4rem' }}>{badge}</span>}
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.1rem' }}>{sub}</p>
                </div>
                <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
              </button>
            ))}
          </div>

        </div>
      </div>
    </Layout>
  );
}
