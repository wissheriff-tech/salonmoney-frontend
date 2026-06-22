'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Wallet, DollarSign, TrendingUp, Users, ArrowDownCircle,
  ArrowUpCircle, ShoppingBag, Copy, Check, Sun, Moon,
  CloudSun, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import api from '@/utils/api';
import { API_ROUTES, APP_ROUTES } from '@/utils/navigation';
import Layout from '@/components/common/Layout';

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function fmt(n, decimals = 2) {
  if (n == null) return '0.00';
  return parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function activityAmountLabel(item) {
  if (item?.amount_display) return item.amount_display;
  const amount = parseFloat(item?.amount_nsl || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  return `${amount} ${item?.currency_code || 'NSL'}`;
}

function useGreeting() {
  const [state, setState] = useState({ label: '', Icon: Sun });
  useEffect(() => {
    const update = () => {
      const h = new Date().getHours();
      if (h >= 5  && h < 12) setState({ label: 'Good morning',   Icon: Sun });
      else if (h >= 12 && h < 17) setState({ label: 'Good afternoon', Icon: CloudSun });
      else if (h >= 17 && h < 21) setState({ label: 'Good evening',   Icon: CloudSun });
      else                         setState({ label: 'Good night',     Icon: Moon });
    };
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, []);
  return state;
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, Icon, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 16,
      padding: '1.25rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backdropFilter: 'blur(12px)',
    }}>
      <div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem', fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>{sub}</p>}
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
    </div>
  );
}

function QuickAction({ href, Icon, label, desc, color }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14,
        padding: '1.1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', marginBottom: '0.1rem' }}>{label}</p>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>{desc}</p>
        </div>
        <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
      </div>
    </Link>
  );
}

function ReferralBar({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div style={{
      background: 'rgba(139,92,246,0.12)',
      border: '1px solid rgba(139,92,246,0.3)',
      borderRadius: 14,
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    }}>
      <Users size={18} color="#a78bfa" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.15rem' }}>Your referral code</p>
        <p style={{ fontSize: '1rem', fontWeight: 800, color: '#a78bfa', letterSpacing: '0.1em', fontFamily: 'monospace' }}>{code}</p>
      </div>
      <button
        onClick={copy}
        style={{
          background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.2)',
          border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(139,92,246,0.4)'}`,
          borderRadius: 8,
          padding: '0.4rem 0.75rem',
          color: copied ? '#10b981' : '#a78bfa',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, setUser, isInitializing } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { label: greeting, Icon: GreetIcon } = useGreeting();
  const now = useClock();

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { router.push(APP_ROUTES.login); return; }
    api.get(API_ROUTES.user.dashboard)
      .then(({ data }) => {
        setDashboard(data);
        if (data.user) setUser({ ...user, ...data.user });
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setIsLoading(false));
  }, [user?.id, isInitializing]);

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const activePlans  = dashboard?.products?.filter(p => p.is_active) || [];
  const totalDaily   = activePlans.reduce((sum, p) => sum + parseFloat(p.product?.daily_income_NSL || 0), 0);
  const topPlan      = activePlans[0];
  const topProduct   = topPlan?.product || {};
  const daysLeft     = topPlan ? Math.max(0, Math.ceil((new Date(topPlan.expires_at) - now) / 864e5)) : 0;
  const totalDays    = topProduct.validity_days || 60;
  const progress     = topPlan ? Math.round(Math.min(100, ((totalDays - daysLeft) / totalDays) * 100)) : 0;

  if (isLoading) {
    return (
      <Layout>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ animation: 'spin 1s linear infinite' }} width="36" height="36" fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="#a78bfa" strokeWidth="3"/>
            <path style={{ opacity: 0.8 }} fill="#a78bfa" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)',
        padding: '1.5rem 1rem 2rem',
        position: 'relative',
      }}>
        {/* Aurora background */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'oklch(0.62 0.19 295 / .10)', filter: 'blur(120px)', top: -150, right: -100 }} />
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'oklch(0.55 0.18 240 / .08)', filter: 'blur(100px)', bottom: -100, left: -80 }} />
        </div>

        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ── Greeting header ─────────────────────────────────────────── */}
          <div style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20,
            padding: '1.5rem',
            backdropFilter: 'blur(16px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GreetIcon size={22} color="#fbbf24" />
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.1rem' }}>{greeting}</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                    {dashboard?.user?.username || user?.username || 'User'}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{timeStr}</p>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{dateStr}</p>
              </div>
            </div>
          </div>

          {/* ── Stats grid ──────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            <StatCard
              label="NSL Balance"
              value={fmt(dashboard?.user?.balance_NSL)}
              sub="Sierra Leone Leones"
              Icon={Wallet}
              color="#a78bfa"
            />
            <StatCard
              label="USDT Balance"
              value={fmt(dashboard?.user?.balance_usdt)}
              sub="Tether stablecoin"
              Icon={DollarSign}
              color="#10b981"
            />
            <StatCard
              label="Daily Income"
              value={totalDaily > 0 ? `+${fmt(totalDaily)} NSL` : '0.00 NSL'}
              sub={activePlans.length > 0 ? `${activePlans.length} active plan${activePlans.length > 1 ? 's' : ''}` : 'No active plan'}
              Icon={TrendingUp}
              color="#f59e0b"
            />
            <StatCard
              label="Referral Earnings"
              value={fmt(dashboard?.referrals?.total_earnings_NSL)}
              sub={`${dashboard?.referrals?.count || 0} referral${(dashboard?.referrals?.count || 0) !== 1 ? 's' : ''}`}
              Icon={Users}
              color="#60a5fa"
            />
          </div>

          {/* ── Active plan ─────────────────────────────────────────────── */}
          {topPlan ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(99,102,241,0.15) 100%)',
              border: '1px solid rgba(139,92,246,0.35)',
              borderRadius: 18,
              padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <span style={{ display: 'inline-block', background: 'rgba(139,92,246,0.4)', color: '#c4b5fd', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', padding: '0.2rem 0.6rem', borderRadius: 6, marginBottom: '0.5rem' }}>
                    {topProduct.name || 'VIP'}
                  </span>
                  <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    +{fmt(topProduct.daily_income_NSL)} NSL
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(196,181,253,0.8)', marginTop: '0.25rem' }}>per day</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.15rem' }}>Expires</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                    {new Date(topPlan.expires_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(196,181,253,0.7)', marginTop: '0.15rem' }}>{daysLeft} days left</p>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #8b5cf6, #6366f1)', borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.4rem' }}>
                {progress}% elapsed · {daysLeft}/{totalDays} days remaining
              </p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px dashed rgba(255,255,255,0.15)',
              borderRadius: 18,
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}>
              <div>
                <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>No active investment plan</p>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Buy a VIP plan to start earning daily NSL income</p>
              </div>
              <Link href="/products" style={{
                background: 'linear-gradient(135deg, oklch(0.62 0.19 295), oklch(0.50 0.20 270))',
                color: '#fff',
                borderRadius: 10,
                padding: '0.6rem 1.1rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                Browse Plans
              </Link>
            </div>
          )}

          {/* ── Quick actions ────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', paddingLeft: '0.25rem' }}>Quick actions</p>
            <QuickAction href="/deposit"     Icon={ArrowDownCircle} label="Recharge"       desc="Add NSL to your balance"        color="#60a5fa" />
            <QuickAction href="/products"     Icon={ShoppingBag}     label="VIP Plans"      desc="Browse and buy investment plans" color="#a78bfa" />
            <QuickAction href="/withdraw"     Icon={ArrowUpCircle}   label="Withdraw"       desc="Request an NSL withdrawal"       color="#10b981" />
            <QuickAction href="/referrals"    Icon={Users}           label="Referrals"      desc="Invite members and earn bonuses"  color="#f59e0b" />
            <QuickAction href="/transactions" Icon={TrendingUp}      label="Transactions"   desc="View your full history"          color="#f472b6" />
          </div>

          <TestimonialCountryList />

          {/* ── Referral code ────────────────────────────────────────────── */}
          {dashboard?.user?.referral_code && (
            <ReferralBar code={dashboard.user.referral_code} />
          )}

        </div>
      </div>

      <TestimonialFeed />
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes testimonialDrop{from{opacity:0;transform:translate(-50%,-18px)}to{opacity:1;transform:translate(-50%,0)}}
        @keyframes testimonialFade{from{opacity:1;transform:translate(-50%,0)}to{opacity:0;transform:translate(-50%,-12px)}}
      `}</style>
    </Layout>
  );
}

function TestimonialCountryList() {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('Sierra Leone');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(API_ROUTES.testimonials.public, { params: { country: selectedCountry, page, limit: 5 } })
      .then(({ data }) => {
        if (!mounted) return;
        const nextCountries = Array.isArray(data.countries) ? data.countries : [];
        setCountries(nextCountries);
        setItems(Array.isArray(data.testimonials) ? data.testimonials : []);
        setPagination(data.pagination || { page: 1, total_pages: 1, total: 0 });
        if (!nextCountries.some(country => country.country === selectedCountry) && nextCountries[0]) {
          setSelectedCountry(nextCountries[0].country);
        }
      })
      .catch(() => {
        if (mounted) setItems([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [selectedCountry, page]);

  const selectedMeta = countries.find(country => country.country === selectedCountry);
  const canPrevious = page > 1;
  const canNext = page < (pagination.total_pages || 1);

  return (
    <section style={{
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 16,
      padding: '1rem',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.15rem' }}>Country activity</p>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>Showing five records per page.</p>
        </div>
        <select
          value={selectedCountry}
          onChange={(event) => { setSelectedCountry(event.target.value); setPage(1); }}
          style={{
            minWidth: 180,
            background: 'rgba(10,8,28,0.9)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 10,
            color: '#fff',
            padding: '0.55rem 0.7rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            outline: 'none',
          }}
        >
          {countries.map(country => (
            <option key={country.country} value={country.country}>
              {country.flag} {country.country}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.8rem', color: 'rgba(255,255,255,0.68)', fontSize: '0.78rem' }}>
        <span style={{ fontSize: '1rem' }}>{selectedMeta?.flag || ''}</span>
        <span>{selectedCountry}</span>
        <span style={{ color: 'rgba(255,255,255,0.35)' }}>•</span>
        <span>{selectedMeta?.currency_code || 'NSL'}</span>
      </div>

      <div style={{ display: 'grid', gap: '0.55rem' }}>
        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', padding: '1rem 0' }}>Loading country activity...</div>
        ) : items.length ? items.map(item => {
          const typeColor = item.type === 'withdrawal' ? '#10b981' : item.type === 'deposit' ? '#60a5fa' : '#f59e0b';
          const typeLabel = item.type === 'withdrawal' ? 'Withdrawal' : item.type === 'deposit' ? 'Deposit' : 'Earning';
          return (
            <div key={item.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '0.5rem',
              alignItems: 'center',
              padding: '0.65rem 0.75rem',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.055)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.flag} {item.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.68rem', fontFamily: 'monospace', marginTop: '0.1rem' }}>{item.phone}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: typeColor, fontSize: '0.7rem', fontWeight: 800 }}>{typeLabel}</p>
                <p style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 800 }}>{activityAmountLabel(item)}</p>
              </div>
            </div>
          );
        }) : (
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', padding: '1rem 0' }}>No records for this country.</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.9rem' }}>
        <button
          type="button"
          disabled={!canPrevious}
          onClick={() => setPage(value => Math.max(1, value - 1))}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.45rem 0.65rem',
            borderRadius: 9,
            border: '1px solid rgba(255,255,255,0.12)',
            background: canPrevious ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.035)',
            color: canPrevious ? '#fff' : 'rgba(255,255,255,0.25)',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: canPrevious ? 'pointer' : 'not-allowed',
          }}
        >
          <ChevronLeft size={14} /> Five before
        </button>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 700 }}>
          {pagination.page || page} / {pagination.total_pages || 1}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => setPage(value => value + 1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.45rem 0.65rem',
            borderRadius: 9,
            border: '1px solid rgba(255,255,255,0.12)',
            background: canNext ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.035)',
            color: canNext ? '#fff' : 'rgba(255,255,255,0.25)',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: canNext ? 'pointer' : 'not-allowed',
          }}
        >
          Next five <ChevronRight size={14} />
        </button>
      </div>
    </section>
  );
}

const TESTIMONIAL_VISIBLE_MS = 3000;
const TESTIMONIAL_HOLD_RELEASE_MS = 450;
const TESTIMONIAL_RANDOM_DELAYS_MS = [
  60_000,
  5 * 60_000,
  10 * 60_000,
  15 * 60_000,
  20 * 60_000,
  30 * 60_000,
  40 * 60_000,
  60 * 60_000,
];

const nextTestimonialDelay = () => TESTIMONIAL_RANDOM_DELAYS_MS[
  Math.floor(Math.random() * TESTIMONIAL_RANDOM_DELAYS_MS.length)
];

function TestimonialFeed() {
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [drag, setDrag] = useState({ active: false, startX: 0, startY: 0, x: 0, y: 0 });
  const dragRef = useRef(drag);
  const indexRef = useRef(0);
  const hideTimerRef = useRef(null);
  const nextTimerRef = useRef(null);
  const holdRef = useRef(false);

  function clearTestimonialTimers() {
    clearTimeout(hideTimerRef.current);
    clearTimeout(nextTimerRef.current);
  }

  function scheduleNextTestimonial(delay = nextTestimonialDelay()) {
    clearTimeout(nextTimerRef.current);
    nextTimerRef.current = setTimeout(showNextTestimonial, delay);
  }

  function hideAndScheduleNext() {
    if (holdRef.current) return;
    setVisible(false);
    scheduleNextTestimonial();
  }

  function showNextTestimonial() {
    if (!items.length) return;
    clearTestimonialTimers();
    const item = items[indexRef.current % items.length];
    indexRef.current += 1;
    setCurrent(item);
    setVisible(true);
    hideTimerRef.current = setTimeout(hideAndScheduleNext, TESTIMONIAL_VISIBLE_MS);
  }

  useEffect(() => {
    api.get(API_ROUTES.testimonials.public, { params: { country: 'all', page: 1, limit: 30 } })
      .then(({ data: d }) => {
        if (Array.isArray(d.testimonials) && d.testimonials.length) {
          setItems([...d.testimonials].sort(() => Math.random() - 0.5));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!items.length) return;
    scheduleNextTestimonial(60_000);
    return clearTestimonialTimers;
  }, [items]);

  const dismissCurrent = () => {
    setVisible(false);
    clearTestimonialTimers();
    scheduleNextTestimonial();
    const reset = { active: false, startX: 0, startY: 0, x: 0, y: 0 };
    dragRef.current = reset;
    setDrag(reset);
  };
  const holdCurrent = () => {
    holdRef.current = true;
    clearTimeout(hideTimerRef.current);
  };
  const releaseCurrent = () => {
    holdRef.current = false;
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(hideAndScheduleNext, TESTIMONIAL_HOLD_RELEASE_MS);
  };
  const startDrag = (event) => {
    holdCurrent();
    const next = { active: true, startX: event.clientX, startY: event.clientY, x: 0, y: 0 };
    dragRef.current = next;
    setDrag(next);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const moveDrag = (event) => {
    if (!dragRef.current.active) return;
    const next = {
      ...dragRef.current,
      x: event.clientX - dragRef.current.startX,
      y: event.clientY - dragRef.current.startY,
    };
    dragRef.current = next;
    setDrag(next);
  };
  const endDrag = () => {
    const currentDrag = dragRef.current;
    if (Math.abs(currentDrag.x) > 70 || currentDrag.y < -45) {
      dismissCurrent();
      return;
    }
    const reset = { active: false, startX: 0, startY: 0, x: 0, y: 0 };
    dragRef.current = reset;
    setDrag(reset);
    releaseCurrent();
  };

  useEffect(() => {
    if (!drag.active) return undefined;

    const handleMouseMove = (event) => moveDrag(event);
    const handleMouseUp = () => endDrag();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drag.active]);

  const startTouchDrag = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    startDrag({ clientX: touch.clientX, clientY: touch.clientY, currentTarget: event.currentTarget, pointerId: undefined });
  };

  const moveTouchDrag = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    moveDrag({ clientX: touch.clientX, clientY: touch.clientY });
  };

  if (!current) return null;

  const typeLabel = current.type === 'withdrawal' ? 'just cashed out' : current.type === 'deposit' ? 'just deposited' : 'earned today';
  const typeColor = current.type === 'withdrawal' ? '#10b981' : current.type === 'deposit' ? '#60a5fa' : '#f59e0b';

  return (
    <div style={{
      position: 'fixed',
      top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
      left: '50%',
      zIndex: 9999,
      width: 'min(92vw, 340px)',
      pointerEvents: 'auto',
      animation: visible ? 'testimonialDrop 0.35s ease forwards' : 'testimonialFade 0.35s ease forwards',
    }}
    >
      <div style={{
        background: 'linear-gradient(135deg, rgba(30,20,60,0.95) 0%, rgba(20,15,50,0.98) 100%)',
        border: '1px solid rgba(167,139,250,0.3)',
        borderLeft: `3px solid ${typeColor}`,
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', gap: '0.2rem',
        touchAction: 'pan-y',
        cursor: drag.active ? 'grabbing' : 'grab',
        transform: `translate(${drag.x}px, ${drag.y}px)`,
        opacity: Math.max(0.3, 1 - Math.min(Math.abs(drag.x) / 180, 0.7)),
        transition: drag.active ? 'none' : 'transform 0.18s ease, opacity 0.18s ease',
      }}
        data-swipeable-testimonial
        onMouseEnter={holdCurrent}
        onMouseLeave={() => { if (!dragRef.current.active) releaseCurrent(); }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onMouseDown={startDrag}
        onTouchStart={startTouchDrag}
        onTouchMove={moveTouchDrag}
        onTouchEnd={endDrag}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>{current.flag}</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0' }}>{current.name}</span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginLeft: 'auto' }}>{current.country}</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
          <span style={{ color: typeColor, fontWeight: 600 }}>{typeLabel}</span>
          {' '}<span style={{ color: '#fff', fontWeight: 700 }}>{activityAmountLabel(current)}</span>
        </div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{current.phone}</div>
      </div>
    </div>
  );
}

