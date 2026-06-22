'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Layout from '@/components/common/Layout';
import { Users, DollarSign, CheckCircle, XCircle, Wallet, UserCheck, UserX, Activity, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { backendAssetUrl } from '@/utils/api';

const BG = 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)';
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '0.7rem 0.875rem', color: '#fff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginBottom: '0.3rem' };

const TABS = [
  { id: 'transactions', label: 'Pending Transactions', Icon: Clock },
  { id: 'users',        label: 'User Management',      Icon: Users },
  { id: 'activity',    label: 'Activity Log',          Icon: Activity, superadmin: true },
];

function parseTransactionNotes(notes) {
  if (!notes || typeof notes !== 'string') return { data: {}, isJson: false };
  try {
    const parsed = JSON.parse(notes);
    return { data: parsed && typeof parsed === 'object' ? parsed : {}, isJson: true };
  } catch {
    return { data: {}, isJson: false };
  }
}

export default function FinancePage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [activeTab,   setActiveTab]   = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [users,        setUsers]        = useState([]);
  const [activityLog,  setActivityLog]  = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currencyForm, setCurrencyForm] = useState({ amount_NSL: '', amount_usdt: '', reason: '' });
  const [nslRate,      setNslRate]      = useState(23.99);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    if (TABS.some(tab => tab.id === requestedTab)) setActiveTab(requestedTab);
  }, []);

  useEffect(() => {
    if (!user || (user.role !== 'superadmin' && user.role !== 'finance')) {
      router.push('/dashboard'); return;
    }
    fetchData();
    api.get('/finance/nsl-rate').then(({ data }) => setNslRate(parseFloat(data.nsl_per_usdt) || 23.99)).catch(() => {});
  }, [user, router, activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'transactions') {
        const { data } = await api.get('/finance/transactions?status=pending');
        setTransactions(data.transactions);
      } else if (activeTab === 'users') {
        const { data } = await api.get('/finance/users');
        setUsers(data.users);
      } else if (activeTab === 'activity' && user.role === 'superadmin') {
        const { data } = await api.get('/finance/activity-log');
        setActivityLog(data.activities);
      }
    } catch { toast.error('Failed to load data');
    } finally { setIsLoading(false); }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/finance/transactions/${id}/approve`, { reason: 'Approved by financial admin' });
      toast.success('Transaction approved'); fetchData();
    } catch (err) {
      const detail = err.response?.data?.errorDetail || err.response?.data?.error;
      const msg = err.response?.data?.message || 'Failed to approve';
      toast.error(detail ? `${msg}: ${detail}` : msg);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason (optional):');
    try {
      await api.patch(`/finance/transactions/${id}/reject`, { reason });
      toast.success('Transaction rejected'); fetchData();
    } catch { toast.error('Failed to reject'); }
  };

  const handleNslChange = (val) => {
    const nsl = val === '' ? '' : val;
    const usdt = val !== '' && !isNaN(parseFloat(val)) ? (parseFloat(val) / nslRate).toFixed(2) : '';
    setCurrencyForm(f => ({ ...f, amount_NSL: nsl, amount_usdt: usdt }));
  };

  const handleUsdtChange = (val) => {
    const usdt = val === '' ? '' : val;
    const nsl = val !== '' && !isNaN(parseFloat(val)) ? (parseFloat(val) * nslRate).toFixed(2) : '';
    setCurrencyForm(f => ({ ...f, amount_usdt: usdt, amount_NSL: nsl }));
  };

  const handleAddCurrency = async (e) => {
    e.preventDefault();
    if (!currencyForm.reason || currencyForm.reason.trim().length < 3) {
      toast.error('Reason must be at least 3 characters'); return;
    }
    try {
      await api.patch(`/finance/users/${selectedUser.id}/add-currency`, currencyForm);
      toast.success('Currency added'); setShowModal(false);
      setCurrencyForm({ amount_NSL: '', amount_usdt: '', reason: '' }); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add currency'); }
  };

  const handleSuspend = async (id) => {
    const reason = prompt('Suspension reason (optional):');
    try { await api.patch(`/finance/users/${id}/suspend`, { reason }); toast.success('User suspended'); fetchData();
    } catch { toast.error('Failed to suspend'); }
  };

  const handleActivate = async (id) => {
    try { await api.patch(`/finance/users/${id}/activate`, {}); toast.success('User activated'); fetchData();
    } catch { toast.error('Failed to activate'); }
  };

  const handleApproveUser = async (id) => {
    try { await api.patch(`/finance/users/${id}/approve`, {}); toast.success('User approved'); fetchData();
    } catch { toast.error('Failed to approve'); }
  };

  const TYPE_COLOR = (type) => type === 'recharge'
    ? { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#10b981' }
    : { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', color: '#f87171' };

  const STATUS_COLOR = (status) => ({
    pending:  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b' },
    approved: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#10b981' },
    rejected: { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', color: '#f87171' },
    active:   { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: '#10b981' },
    frozen:   { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', color: '#f87171' },
    pending_approval: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b' },
  }[status] || { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' });

  const Badge = ({ label, status }) => {
    const c = STATUS_COLOR(status);
    return <span style={{ padding: '0.15rem 0.55rem', borderRadius: 20, fontSize: '0.62rem', fontWeight: 800, background: c.bg, border: `1px solid ${c.border}`, color: c.color, letterSpacing: '0.04em' }}>{label.toUpperCase()}</span>;
  };

  if (isLoading) {
    return (
      <Layout>
        <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ animation: 'spin 1s linear infinite' }} width="32" height="32" fill="none" viewBox="0 0 24 24">
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
      {/* Add Currency modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'rgba(10,6,25,0.97)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ background: 'rgba(124,58,237,0.3)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Add Currency</p>
                <p style={{ fontWeight: 800, color: '#fff' }}>{selectedUser?.phone} · {selectedUser?.username}</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', lineHeight: 0 }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddCurrency} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '0.75rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span>NSL: <strong style={{ color: '#60a5fa' }}>{selectedUser?.balance_NSL?.toFixed(2)}</strong></span>
                <span>USDT: <strong style={{ color: '#10b981' }}>{selectedUser?.balance_usdt?.toFixed(2)}</strong></span>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>Rate: 1 USDT = {nslRate} NSL</span>
              </div>
              <div>
                <label style={labelStyle}>Amount NSL</label>
                <input
                  type="number" step="0.01" min="0"
                  value={currencyForm.amount_NSL}
                  onChange={e => handleNslChange(e.target.value)}
                  style={inputStyle} placeholder="0.00"
                />
              </div>
              <div>
                <label style={labelStyle}>Amount USDT</label>
                <input
                  type="number" step="0.01" min="0"
                  value={currencyForm.amount_usdt}
                  onChange={e => handleUsdtChange(e.target.value)}
                  style={inputStyle} placeholder="0.00"
                />
              </div>
              <div>
                <label style={labelStyle}>Reason <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>(min 3 chars)</span></label>
                <textarea rows={3} value={currencyForm.reason} onChange={e => setCurrencyForm(f => ({ ...f, reason: e.target.value }))} style={{ ...inputStyle, resize: 'none' }} placeholder="Reason for adding…" />
              </div>
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button type="button" onClick={() => { setShowModal(false); setCurrencyForm({ amount_NSL: '', amount_usdt: '', reason: '' }); }} style={{ flex: 1, padding: '0.75rem', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: 10, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', color: '#a78bfa', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem' }}>Add Currency</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', background: BG, padding: '2rem 1rem 3rem', position: 'relative' }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'oklch(0.62 0.19 295 / .09)', filter: 'blur(100px)', top: -100, right: -80 }} />
          <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'oklch(0.55 0.18 240 / .07)', filter: 'blur(90px)', bottom: -80, left: -60 }} />
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Finance Management</h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.75rem' }}>Manage transactions and user accounts</p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '0.25rem', width: 'fit-content', flexWrap: 'wrap' }}>
            {TABS.filter(t => !t.superadmin || user.role === 'superadmin').map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: 9, border: 'none', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', background: activeTab === id ? 'rgba(167,139,250,0.2)' : 'none', color: activeTab === id ? '#a78bfa' : 'rgba(255,255,255,0.45)' }}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {/* Transactions */}
          {activeTab === 'transactions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {transactions.length === 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
                  No pending transactions
                </div>
              ) : transactions.map((tx) => {
                const tc = TYPE_COLOR(tx.type);
                const parsedNotes = parseTransactionNotes(tx.notes);
                const receiptNotes = parsedNotes.data;
                const proofUrl = tx.payment_proof ? backendAssetUrl(tx.payment_proof) : '';
                return (
                  <div key={tx.id} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <Badge label={tx.type} status={tx.type} />
                        <Badge label={tx.status} status={tx.status} />
                      </div>
                      {[
                        ['User',         tx.user?.phone || 'N/A', '#fff'],
                        ['Amount NSL',   tx.amount_NSL, '#60a5fa'],
                        ['Amount USDT',  tx.amount_usdt, '#10b981'],
                        ['Balance NSL',  tx.user?.balance_NSL, 'rgba(255,255,255,0.6)'],
                        ['Balance USDT', tx.user?.balance_usdt, 'rgba(255,255,255,0.6)'],
                      ].map(([label, value, color]) => (
                        <p key={label} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                          {label}: <span style={{ fontWeight: 700, color }}>{value}</span>
                        </p>
                      ))}
                      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>{new Date(tx.created_at).toLocaleString()}</p>
                      {tx.type === 'recharge' && (tx.reference_id || proofUrl || receiptNotes.sender_number || receiptNotes.receiver_number) && (
                        <div style={{ marginTop: '0.35rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.42)', fontWeight: 800 }}>Receipt proof</p>
                          {tx.reference_id && <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.55)' }}>Reference: <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 800 }}>{tx.reference_id}</span></p>}
                          {tx.deposit_network && <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.55)' }}>Network: <span style={{ color: '#fff', fontWeight: 800 }}>{tx.deposit_network}</span></p>}
                          {(receiptNotes.sender_number || receiptNotes.receiver_number) && <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.55)' }}>Number: <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 800 }}>{receiptNotes.sender_number || receiptNotes.receiver_number}</span></p>}
                          {receiptNotes.timestamp_receipt && <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.55)' }}>Receipt time: <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 800 }}>{receiptNotes.timestamp_receipt}</span></p>}
                          {proofUrl && <a href={proofUrl} target="_blank" rel="noreferrer" style={{ width: 'fit-content', marginTop: '0.2rem', fontSize: '0.74rem', color: '#a78bfa', fontWeight: 800 }}>Open receipt image</a>}
                        </div>
                      )}
                      {tx.notes && !parsedNotes.isJson && <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>Note: {tx.notes}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleApprove(tx.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.6rem 1rem', borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button onClick={() => handleReject(tx.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.6rem 1rem', borderRadius: 10, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(167,139,250,0.12)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Phone', 'Username', 'NSL Balance', 'USDT Balance', 'Status', 'VIP', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.875rem 1rem', color: '#fff', whiteSpace: 'nowrap' }}>{u.phone}</td>
                        <td style={{ padding: '0.875rem 1rem', color: '#fff', fontWeight: 600 }}>{u.username}</td>
                        <td style={{ padding: '0.875rem 1rem', color: '#60a5fa', fontWeight: 700 }}>{u.balance_NSL?.toFixed(2)}</td>
                        <td style={{ padding: '0.875rem 1rem', color: '#10b981', fontWeight: 700 }}>{u.balance_usdt?.toFixed(2)}</td>
                        <td style={{ padding: '0.875rem 1rem' }}><Badge label={u.status} status={u.status} /></td>
                        <td style={{ padding: '0.875rem 1rem', color: 'rgba(255,255,255,0.6)' }}>{u.vip_level}</td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button onClick={() => { setSelectedUser(u); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: 8, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              <Wallet size={11} /> Add
                            </button>
                            {u.status === 'active' ? (
                              <button onClick={() => handleSuspend(u.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: 8, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                <UserX size={11} /> Suspend
                              </button>
                            ) : u.status === 'frozen' ? (
                              <button onClick={() => handleActivate(u.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                <UserCheck size={11} /> Activate
                              </button>
                            ) : (
                              <button onClick={() => handleApproveUser(u.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                <UserCheck size={11} /> Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Activity Log */}
          {activeTab === 'activity' && user.role === 'superadmin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {activityLog.length === 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
                  No activity recorded
                </div>
              ) : activityLog.map((act) => (
                <div key={act.id} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <Badge label={act.type} status={act.type} />
                    <Badge label={act.status} status={act.status} />
                  </div>
                  {[
                    ['Finance User', act.approver?.phone || act.approver?.username || 'N/A', '#a78bfa'],
                    ['Target User',  act.user?.phone || act.user?.username || 'N/A', '#fff'],
                    ['Amount NSL',   act.amount_NSL, '#60a5fa'],
                    ['Amount USDT',  act.amount_usdt, '#10b981'],
                  ].map(([label, value, color]) => (
                    <p key={label} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                      {label}: <span style={{ fontWeight: 700, color }}>{value}</span>
                    </p>
                  ))}
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>{new Date(act.completed_at).toLocaleString()}</p>
                  {act.notes && <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.4rem 0.625rem' }}>Note: {act.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Layout>
  );
}
