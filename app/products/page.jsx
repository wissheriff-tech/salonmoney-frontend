'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Award, Gem, Crown, Sparkles, Zap, Star, Trophy, Flame,
  X, Wallet, Lock, CheckCircle, ChevronRight, Calendar,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import api from '@/utils/api';
import { API_ROUTES, APP_ROUTES } from '@/utils/navigation';
import Layout from '@/components/common/Layout';

// ─── VIP tier definitions ──────────────────────────────────────────────────────
const TIERS = {
  vip0: { Icon: Zap,      label: 'Starter',  accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  vip1: { Icon: Award,    label: 'Bronze',   accent: '#cd7f32', bg: 'rgba(205,127,50,0.12)',  border: 'rgba(205,127,50,0.3)'  },
  vip2: { Icon: Star,     label: 'Silver',   accent: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' },
  vip3: { Icon: Trophy,   label: 'Gold',     accent: '#eab308', bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.3)'   },
  vip4: { Icon: Sparkles, label: 'Elite',    accent: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)'  },
  vip5: { Icon: Gem,      label: 'Platinum', accent: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.3)'  },
  vip6: { Icon: Gem,      label: 'Diamond',  accent: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)'  },
  vip7: { Icon: Crown,    label: 'Royal',    accent: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  vip8: { Icon: Flame,    label: 'Phoenix',  accent: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.3)' },
  vip9: { Icon: Crown,    label: 'Legend',   accent: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.3)' },
};

const tierOf = (name = '') => TIERS[(name || '').toLowerCase()] || TIERS.vip0;
const vipNum = (level) => { if (!level || level === 'none') return -1; const m = level.match(/\d+/); return m ? +m[0] : -1; };
function fmt(n) { return parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
function daysLeft(exp) { return Math.max(0, Math.ceil((new Date(exp) - new Date()) / 864e5)); }

// Duration accent colors
const DUR_ACCENT = { short: '#f59e0b', week: '#10b981', month: '#60a5fa', promo: '#f472b6' };

// ─── Confirm + Duration modal ──────────────────────────────────────────────────
function ConfirmModal({ product, balance, durations, invitationAllowed, onConfirm, onCancel, busy }) {
  const tier = tierOf(product.name);
  const { Icon } = tier;
  const canAfford = balance >= product.price_NSL;

  const selectableDurations = durations.filter(d => !d.requires_invitation || invitationAllowed);
  const [selectedKey, setSelectedKey] = useState(selectableDurations[0]?.key || 'short');
  const selectedDur = durations.find(d => d.key === selectedKey) || durations[0];
  const totalReturn = product.daily_income_NSL * (selectedDur?.days || 3);
  const defaultDurations = durations.filter(d => d.group !== 'invitation');
  const invitationDurations = durations.filter(d => d.group === 'invitation');

  const renderDurationButton = (d) => {
    const accent = DUR_ACCENT[d.key] || '#a78bfa';
    const isSelected = d.key === selectedKey;
    const locked = d.requires_invitation && !invitationAllowed;
    return (
      <button
        key={d.key}
        type="button"
        disabled={locked}
        onClick={() => {
          if (!locked) setSelectedKey(d.key);
        }}
        style={{
          padding: '0.75rem 0.5rem',
          borderRadius: 12,
          border: `2px solid ${isSelected ? accent : locked ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.1)'}`,
          background: isSelected ? `${accent}18` : locked ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.04)',
          cursor: locked ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          transition: 'all 0.15s',
          opacity: locked ? 0.55 : 1,
        }}
      >
        <p style={{ fontSize: '0.875rem', fontWeight: 800, color: isSelected ? accent : locked ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.82)', marginBottom: '0.15rem' }}>{d.label}</p>
        <p style={{ fontSize: '0.7rem', color: isSelected ? `${accent}cc` : locked ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.72)' }}>
          {locked ? 'Invitation only' : `${fmt(product.daily_income_NSL * d.days)} NSL`}
        </p>
      </button>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} onClick={onCancel} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 400,
        background: 'rgba(12,8,28,0.97)',
        border: `1px solid ${tier.border}`,
        borderRadius: 22,
        padding: '1.75rem',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
      }}>
        <button onClick={onCancel} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', lineHeight: 0 }}>
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: tier.bg, border: `1px solid ${tier.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={24} color={tier.accent} />
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: tier.accent, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.1rem' }}>{tier.label}</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{product.name}</p>
          </div>
        </div>

        {/* Duration selector */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
            <Calendar size={14} color="rgba(255,255,255,0.75)" />
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.86)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Choose Duration</p>
          </div>
          <p style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 800, marginBottom: '0.35rem', textTransform: 'uppercase' }}>Default</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.7rem' }}>
            {defaultDurations.map(renderDurationButton)}
          </div>
          {invitationDurations.length > 0 && (
            <>
              <p style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 800, marginBottom: '0.35rem', textTransform: 'uppercase' }}>Invitation Only</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {invitationDurations.map(renderDurationButton)}
              </div>
            </>
          )}
        </div>

        {/* Details */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
          {[
            ['Investment',   `${fmt(product.price_NSL)} NSL`,              '#fff'],
            ['Daily Income', `+${fmt(product.daily_income_NSL)} NSL/day`,  '#10b981'],
            ['Duration',     `${selectedDur?.days} days`,                   '#fff'],
            ['Total Return', `${fmt(totalReturn)} NSL`,                     '#60a5fa'],
            ['Net Profit',   `+${fmt(totalReturn - product.price_NSL)} NSL`, totalReturn > product.price_NSL ? '#a78bfa' : '#f87171'],
          ].map(([k, v, c]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>{k}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: c }}>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Wallet size={13} /> Your balance
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: canAfford ? '#fff' : '#f87171' }}>
              {fmt(balance)} NSL
            </span>
          </div>
        </div>

        {!canAfford && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10, padding: '0.6rem 0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: '#f87171' }}>Need {fmt(product.price_NSL - balance)} more NSL</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '0.8rem', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedKey)}
            disabled={!canAfford || busy || !selectedDur}
            style={{
              flex: 1, padding: '0.8rem', borderRadius: 10, fontWeight: 800, fontSize: '0.875rem',
              cursor: canAfford && !busy ? 'pointer' : 'not-allowed',
              background: canAfford && !busy ? tier.bg : 'rgba(255,255,255,0.04)',
              border: `1px solid ${canAfford && !busy ? tier.border : 'rgba(255,255,255,0.08)'}`,
              color: canAfford && !busy ? tier.accent : 'rgba(255,255,255,0.3)',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product card ──────────────────────────────────────────────────────────────
function ProductCard({ product, balance, onBuy, busy, locked, needsVIP, owned }) {
  const tier = tierOf(product.name);
  const { Icon } = tier;
  const canAfford = balance >= product.price_NSL;
  const remaining = owned ? daysLeft(owned.expires_at) : null;

  const cardStyle = {
    position: 'relative',
    background: locked ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
    border: `1px solid ${locked ? 'rgba(255,255,255,0.08)' : tier.border}`,
    borderRadius: 18,
    padding: '1.5rem',
    overflow: 'hidden',
    opacity: locked ? 0.6 : 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  if (locked) {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={20} color="rgba(255,255,255,0.3)" />
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{tier.label}</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>{product.name}</p>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
          Reach <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{needsVIP}</strong> to unlock
        </p>
        <div style={{ marginTop: 'auto', padding: '0.6rem', background: 'rgba(255,255,255,0.04)', borderRadius: 8, textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>{fmt(product.price_NSL)} NSL</span>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: tier.accent, opacity: 0.06, filter: 'blur(30px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: tier.bg, border: `1px solid ${tier.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={22} color={tier.accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.7rem', color: tier.accent, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.1rem' }}>{tier.label}</p>
          <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{product.name}</p>
        </div>
        {owned && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '0.2rem 0.6rem', fontSize: '0.68rem', fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>
            <CheckCircle size={11} /> Active
          </span>
        )}
        {!owned && !canAfford && (
          <span style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 20, padding: '0.2rem 0.55rem', fontSize: '0.68rem', fontWeight: 700, color: '#f87171', whiteSpace: 'nowrap' }}>
            Low balance
          </span>
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Row label="Investment"   value={`${fmt(product.price_NSL)} NSL`}          color="#fff" />
        <Row label="Daily income" value={`+${fmt(product.daily_income_NSL)} NSL`}  color="#10b981" />
        <Row label="Returns from" value="3 days → 1 month"                          color="rgba(255,255,255,0.4)" />
        {owned ? (
          <Row label="Expires in" value={`${remaining} day${remaining !== 1 ? 's' : ''}`} color={remaining <= 5 ? '#f87171' : '#a78bfa'} />
        ) : (
          <Row label="Daily rate" value={`${fmt((product.daily_income_NSL / product.price_NSL) * 100)}%/day`} color="#60a5fa" />
        )}
      </div>

      {owned ? (
        <button disabled style={{ width: '100%', padding: '0.8rem', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontWeight: 700, fontSize: '0.875rem', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <CheckCircle size={15} /> Active Plan
        </button>
      ) : (
        <button
          onClick={() => onBuy(product)}
          disabled={busy === product.id || !canAfford}
          style={{
            width: '100%', padding: '0.8rem', borderRadius: 10, fontWeight: 800, fontSize: '0.875rem',
            cursor: canAfford && busy !== product.id ? 'pointer' : 'not-allowed',
            background: canAfford ? tier.bg : 'rgba(255,255,255,0.04)',
            border: `1px solid ${canAfford ? tier.border : 'rgba(255,255,255,0.08)'}`,
            color: canAfford ? tier.accent : 'rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            opacity: busy === product.id ? 0.7 : 1,
          }}
        >
          {busy === product.id ? 'Processing…' : canAfford ? <><ChevronRight size={15} /> Invest Now</> : 'Insufficient balance'}
        </button>
      )}
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Products() {
  const { user, isInitializing } = useAuthStore();
  const [products, setProducts]   = useState([]);
  const [ownedMap, setOwnedMap]   = useState({});
  const [durations, setDurations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy]           = useState(null);
  const [confirm, setConfirm]     = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) return;
    if (!user) { router.push(APP_ROUTES.login); return; }
    load();
  }, [user?.id, isInitializing]);

  const load = async () => {
    try {
      const [{ data: prods }, { data: dash }, { data: durs }] = await Promise.all([
        api.get(API_ROUTES.products.list),
        api.get(API_ROUTES.user.dashboard),
        api.get(API_ROUTES.products.durations),
      ]);
      setProducts(prods);
      setDurations(durs.options || []);
      const map = {};
      for (const up of (dash.products || [])) {
        if (up.is_active) map[up.product_id] = up;
      }
      setOwnedMap(map);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async (durationKey) => {
    if (!confirm) return;
    setBusy(confirm.id);
    try {
      const { data } = await api.post(API_ROUTES.products.buy, {
        product_id: confirm.id,
        duration_key: durationKey,
      });
      toast.success(data.message);
      setConfirm(null);
      await load();
      router.push(APP_ROUTES.dashboard);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed');
    } finally {
      setBusy(null);
    }
  };

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

  const balance = parseFloat(user?.balance_NSL ?? 0);
  const userVip = vipNum(user?.vip_level);
  const invitationAllowed = Boolean(user?.referred_by) || ['admin', 'superadmin'].includes(user?.role);

  return (
    <Layout>
      {confirm && durations.length > 0 && (
        <ConfirmModal
          product={confirm}
          balance={balance}
          durations={durations}
          invitationAllowed={invitationAllowed}
          onConfirm={handleBuy}
          onCancel={() => setConfirm(null)}
          busy={busy === confirm.id}
        />
      )}

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)',
        padding: '2rem 1rem 3rem',
        position: 'relative',
      }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'oklch(0.62 0.19 295 / .09)', filter: 'blur(120px)', top: -150, right: -100 }} />
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'oklch(0.55 0.18 240 / .07)', filter: 'blur(100px)', bottom: -100, left: -80 }} />
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: '#fff', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              VIP Investment Plans
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1rem' }}>
              Default durations are 3 days and 1 week. 1 month and promo durations are invitation-only.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '0.4rem 1rem' }}>
              <Wallet size={14} color="#a78bfa" />
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
                Balance: <strong style={{ color: '#fff' }}>{fmt(balance)} NSL</strong>
              </span>
              {user?.vip_level && user.vip_level !== 'none' && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                  <span style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 700 }}>{user.vip_level}</span>
                </>
              )}
            </div>
          </div>

          {/* Duration legend */}
          {durations.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              {durations.map(d => (
                <span key={d.key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: `${DUR_ACCENT[d.key] || '#a78bfa'}18`, border: `1px solid ${DUR_ACCENT[d.key] || '#a78bfa'}44`, borderRadius: 20, padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: DUR_ACCENT[d.key] || '#a78bfa' }}>
                  <Calendar size={11} /> {d.label}{d.requires_invitation ? ' · Invitation' : ' · Default'}
                </span>
              ))}
            </div>
          )}

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {products.map((p) => {
              const pNum   = vipNum(p.name);
              const locked = pNum > userVip + 2;
              return (
                <ProductCard
                  key={p.id}
                  product={p}
                  balance={balance}
                  onBuy={setConfirm}
                  busy={busy}
                  locked={locked}
                  needsVIP={locked ? `VIP${pNum - 2}` : null}
                  owned={ownedMap[p.id] || null}
                />
              );
            })}
          </div>

          {products.some(p => vipNum(p.name) > userVip + 2) && (
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)', marginTop: '2rem' }}>
              Higher plans unlock as you progress through VIP levels
            </p>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Layout>
  );
}
