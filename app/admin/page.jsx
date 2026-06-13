'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import api from '@/utils/api';
import { Users, DollarSign, Trash2, Edit, Plus, Shield, X, Key, Search, CheckCircle, XCircle, Package, FileCheck } from 'lucide-react';

const TABS = ['Pending', 'All Users', 'Deposits', 'Withdrawals', 'Products', 'KYC', 'Analytics', 'Settings', 'Testimonials'];

export default function AdminPanel() {
  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState('Pending');
  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [mobileDeposits, setMobileDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [products, setProducts] = useState([]);
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [selectedKYCUser, setSelectedKYCUser] = useState(null);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [kycRejectReason, setKycRejectReason] = useState('');
  const [withdrawalAction, setWithdrawalAction] = useState({ reason: '' });
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneForm, setPhoneForm] = useState({ phone: '' });
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [editForm, setEditForm] = useState({ vip_level: 'none', role: 'user' });
  const [searchQuery, setSearchQuery] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [showAddVIPModal, setShowAddVIPModal] = useState(false);
  const [showEditVIPModal, setShowEditVIPModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [vipForm, setVipForm] = useState({ name: '', price_NSL: '', daily_income_NSL: '', validity_days: '7', description: '' });
  const [vipSaving, setVipSaving] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Cron trigger state
  const [cronRunning, setCronRunning] = useState('');
  const [cronResult, setCronResult] = useState(null);

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState({ orange_money_number: '', africell_number: '', binance_wallet_address: '', binance_network: 'TRC20 (USDT)' });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Platform settings state
  const [platformSettings, setPlatformSettings] = useState({
    referral_l1_pct: 3, referral_l2_pct: 2, referral_l3_pct: 1,
    recharge_fee_pct: 5, withdrawal_fee_pct: 10,
    dur_short: 3, dur_week: 7, dur_month: 30, dur_promo: 14, dur_promo_label: 'Promo',
  });
  const [platformSaving, setPlatformSaving] = useState(false);

  // Testimonials state
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);
  const [showAddTestimonialModal, setShowAddTestimonialModal] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({ name: '', country: '', flag: '', phone: '', type: 'withdrawal', amount_nsl: '' });
  const [testimonialSaving, setTestimonialSaving] = useState(false);

  const router = useRouter();

  const [createForm, setCreateForm] = useState({ username: '', phone: '', password: '', role: 'user', status: 'active' });
  const [balanceForm, setBalanceForm] = useState({ balance_NSL: 0, balance_usdt: 0, reason: '' });
  const [passwordForm, setPasswordForm] = useState({ new_password: '', confirm_password: '' });
  const [depositAction, setDepositAction] = useState({ approved_amount: '', notes: '', reason: '', admin_reference: '' });

  const NSL_RATE = parseInt(process.env.NEXT_PUBLIC_NSL_TO_USDT || 23);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'superadmin') { toast.error('Access denied'); router.push('/dashboard'); return; }
    fetchAll();
  }, [user, router]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [usersRes, depositsRes, mobileDepositsRes, productsRes, withdrawalsRes, kycRes] = await Promise.all([
        api.get('/admin/users?limit=200'),
        api.get('/deposit/pending'),
        api.get('/admin/mobile-deposits/pending'),
        api.get('/admin/products'),
        api.get('/finance/transactions?type=withdrawal&status=pending&limit=100'),
        api.get('/admin/kyc/pending'),
      ]);
      setUsers(usersRes.data.users || []);
      setDeposits(depositsRes.data.data || []);
      setMobileDeposits(mobileDepositsRes.data.data || []);
      setProducts(productsRes.data.products || []);
      setWithdrawals(withdrawalsRes.data.transactions || []);
      setKycSubmissions(kycRes.data.data || []);
    } catch { toast.error('Failed to load data'); }
    finally { setIsLoading(false); }
  };

  // ── User actions ──────────────────────────────────────────────
  const approveUser = async (id) => {
    await api.patch(`/admin/users/${id}/status`, { status: 'active' });
    toast.success('User approved'); fetchAll();
  };

  const rejectUser = async (id) => {
    await api.patch(`/admin/users/${id}/status`, { status: 'frozen' });
    toast.success('User rejected'); fetchAll();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    await api.patch(`/admin/users/${id}/status`, { status: newStatus });
    toast.success('Status updated'); fetchAll();
  };

  const handleUpdateVIP = async (id, vip_level) => {
    await api.patch(`/admin/users/${id}/vip`, { vip_level });
    toast.success('VIP updated'); fetchAll(); setShowEditModal(false);
  };

  const handleUpdateRole = async (id, role) => {
    await api.patch(`/admin/users/${id}/role`, { role });
    toast.success('Role updated'); fetchAll(); setShowEditModal(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', createForm);
      toast.success('User created'); setShowCreateModal(false);
      setCreateForm({ username: '', phone: '', password: '', role: 'user', status: 'active' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/admin/users/${selectedUser.id}/balance`, balanceForm);
      toast.success('Balance updated'); setShowBalanceModal(false); fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) return toast.error('Passwords do not match');
    try {
      await api.patch(`/admin/users/${selectedUser.id}/reset-password`, { new_password: passwordForm.new_password });
      toast.success('Password reset'); setShowPasswordModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleChangePhone = async (e) => {
    e.preventDefault();
    if (!phoneForm.phone.trim()) return toast.error('Phone number required');
    try {
      await api.patch(`/admin/users/${selectedUser.id}/phone`, { phone: phoneForm.phone.trim() });
      toast.success('Phone number updated'); setShowPhoneModal(false); fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteUser = async (id, username) => {
    if (!confirm(`Delete user ${username}?`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted'); fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // ── Deposit actions ───────────────────────────────────────────
  const approveDeposit = async () => {
    try {
      if (selectedDeposit._type === 'mobile') {
        await api.patch(`/admin/transaction/${selectedDeposit.id}/approve`, {
          approved_NSL: depositAction.approved_amount || selectedDeposit.amount_NSL,
          notes: depositAction.notes,
          verified_reference: depositAction.admin_reference || null,
        });
      } else {
        await api.patch(`/deposit/${selectedDeposit.id}/approve`, {
          approved_amount: depositAction.approved_amount || selectedDeposit.user_submitted_amount,
          notes: depositAction.notes,
        });
      }
      toast.success('Deposit approved & balance credited');
      setShowDepositModal(false);
      setDepositAction({ approved_amount: '', notes: '', reason: '', admin_reference: '' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const rejectDeposit = async () => {
    if (!depositAction.reason) return toast.error('Rejection reason required');
    try {
      if (selectedDeposit._type === 'mobile') {
        await api.patch(`/admin/transaction/${selectedDeposit.id}/reject`, { reason: depositAction.reason });
      } else {
        await api.patch(`/deposit/${selectedDeposit.id}/reject`, { reason: depositAction.reason });
      }
      toast.success('Deposit rejected');
      setShowDepositModal(false);
      setDepositAction({ approved_amount: '', notes: '', reason: '', admin_reference: '' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // ── Withdrawal actions ────────────────────────────────────────
  const approveWithdrawal = async (id) => {
    try {
      await api.patch(`/finance/transactions/${id}/approve`, { reason: 'Approved by admin' });
      toast.success('Withdrawal approved'); fetchAll();
      setShowWithdrawalModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const rejectWithdrawal = async (id) => {
    if (!withdrawalAction.reason) return toast.error('Rejection reason required');
    try {
      await api.patch(`/finance/transactions/${id}/reject`, { reason: withdrawalAction.reason });
      toast.success('Withdrawal rejected'); fetchAll();
      setShowWithdrawalModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // ── KYC actions ──────────────────────────────────────────────
  const approveKYC = async (userId) => {
    try {
      await api.patch(`/admin/kyc/${userId}/approve`, {});
      toast.success('KYC approved'); fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const rejectKYC = async () => {
    if (!kycRejectReason) return toast.error('Rejection reason required');
    try {
      await api.patch(`/admin/kyc/${selectedKYCUser.id}/reject`, { reason: kycRejectReason });
      toast.success('KYC rejected'); setShowKYCModal(false); setKycRejectReason(''); fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // ── Cron trigger ─────────────────────────────────────────────
  const triggerCron = async (job) => {
    setCronRunning(job);
    setCronResult(null);
    try {
      const { data } = await api.post('/cron/trigger', { job });
      setCronResult({ job, ok: true, result: data.result });
      toast.success(`${job} completed`);
    } catch (err) {
      setCronResult({ job, ok: false, message: err.response?.data?.message || 'Failed' });
      toast.error(`${job} failed`);
    } finally {
      setCronRunning('');
    }
  };

  // ── Analytics ────────────────────────────────────────────────
  useEffect(() => {
    if (tab === 'Analytics' && !analytics) {
      setAnalyticsLoading(true);
      api.get('/analytics/admin/dashboard')
        .then(({ data }) => setAnalytics(data))
        .catch(() => toast.error('Failed to load analytics'))
        .finally(() => setAnalyticsLoading(false));
    }
    if (tab === 'Settings') {
      api.get('/admin/payment-settings')
        .then(({ data }) => setPaymentSettings(s => ({ ...s, ...data.data })))
        .catch(() => {});
      api.get('/admin/platform-settings')
        .then(({ data }) => setPlatformSettings(s => ({ ...s, ...data.settings })))
        .catch(() => {});
    }
    if (tab === 'Testimonials') {
      setTestimonialsLoading(true);
      api.get('/testimonials/all')
        .then(({ data }) => setTestimonials(data.testimonials || []))
        .catch(() => toast.error('Failed to load testimonials'))
        .finally(() => setTestimonialsLoading(false));
    }
  }, [tab, analytics]);

  // ── Seed products ─────────────────────────────────────────────
  const seedProducts = async () => {
    setSeeding(true);
    try {
      const { data } = await api.post('/admin/seed-products');
      toast.success(`Products seeded: ${data.created} created, ${data.updated} updated`);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Seed failed'); }
    finally { setSeeding(false); }
  };

  const openAddVIP = () => {
    const nums = products.map(p => { const m = p.name.match(/\d+/); return m ? parseInt(m[0]) : -1; }).filter(n => n >= 0);
    const nextNum = nums.length ? Math.max(...nums) + 1 : 0;
    const last = products.reduce((a, b) => (parseFloat(a.price_NSL) > parseFloat(b.price_NSL) ? a : b), products[0] || {});
    const lastPrice = parseFloat(last?.price_NSL || 0);
    const lastDailyPct = lastPrice > 0 ? (parseFloat(last.daily_income_NSL) / lastPrice * 100) : 3;
    const nextDailyPct = Math.min(12, lastDailyPct + 0.5);
    const suggestedPrice = lastPrice > 0 ? Math.round(lastPrice * 2.5 / 100000) * 100000 : 500;
    const suggestedIncome = Math.round(suggestedPrice * nextDailyPct / 100);
    setVipForm({
      name: `VIP${nextNum}`,
      price_NSL: String(suggestedPrice),
      daily_income_NSL: String(suggestedIncome),
      validity_days: '7',
      description: `VIP${nextNum} premium investment plan with enhanced daily returns.`,
    });
    setShowAddVIPModal(true);
  };

  const openEditVIP = (p) => {
    setEditingProduct(p);
    setVipForm({
      name: p.name,
      price_NSL: String(parseFloat(p.price_NSL)),
      daily_income_NSL: String(parseFloat(p.daily_income_NSL)),
      validity_days: String(p.validity_days || 7),
      description: p.description || '',
      active: p.active !== false,
    });
    setShowEditVIPModal(true);
  };

  const saveNewVIP = async () => {
    setVipSaving(true);
    try {
      const priceNSL = parseFloat(vipForm.price_NSL);
      const dailyIncome = parseFloat(vipForm.daily_income_NSL);
      const nslRate = parseInt(process.env.NEXT_PUBLIC_NSL_TO_USDT || 23);
      await api.post('/admin/products', {
        name: vipForm.name,
        price_NSL: priceNSL,
        price_usdt: parseFloat((priceNSL / nslRate).toFixed(2)),
        daily_income_NSL: dailyIncome,
        validity_days: parseInt(vipForm.validity_days) || 7,
        description: vipForm.description,
      });
      toast.success(`${vipForm.name} created`);
      setShowAddVIPModal(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create VIP'); }
    finally { setVipSaving(false); }
  };

  const saveEditVIP = async () => {
    setVipSaving(true);
    try {
      const priceNSL = parseFloat(vipForm.price_NSL);
      const dailyIncome = parseFloat(vipForm.daily_income_NSL);
      const nslRate = parseInt(process.env.NEXT_PUBLIC_NSL_TO_USDT || 23);
      await api.patch(`/admin/products/${editingProduct.id}`, {
        price_NSL: priceNSL,
        price_usdt: parseFloat((priceNSL / nslRate).toFixed(2)),
        daily_income_NSL: dailyIncome,
        validity_days: parseInt(vipForm.validity_days) || 7,
        description: vipForm.description,
        active: vipForm.active,
      });
      toast.success(`${editingProduct.name} updated`);
      setShowEditVIPModal(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update VIP'); }
    finally { setVipSaving(false); }
  };

  const toggleVIP = async (p) => {
    try {
      const { data } = await api.patch(`/admin/products/${p.id}/toggle`, {});
      toast.success(data.message);
      setProducts(prev => prev.map(x => x.id === p.id ? data.product : x));
    } catch (err) { toast.error(err.response?.data?.message || 'Toggle failed'); }
  };

  const deleteVIP = async (p) => {
    if (!confirm(`Deactivate ${p.name}? Users with this plan keep their current period but cannot repurchase.`)) return;
    try {
      const { data } = await api.delete(`/admin/products/${p.id}`);
      toast.success(data.message);
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: false } : x));
    } catch (err) { toast.error(err.response?.data?.message || 'Deactivate failed'); }
  };

  // ── Helpers ───────────────────────────────────────────────────
  const pendingUsers = users.filter(u => u.status === 'pending');
  const filteredUsers = searchQuery
    ? users.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone?.includes(searchQuery))
    : users;

  const statusBadge = (s) => ({
    active: 'bg-green-100 text-green-800',
    pending: 'bg-orange-100 text-orange-800',
    frozen: 'bg-red-100 text-red-800',
  }[s] || 'bg-gray-100 text-gray-800');

  if (isLoading) return <div className="flex items-center justify-center h-screen text-gray-600">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-base md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600 shrink-0" />
            <span className="hidden sm:inline">Super Admin Panel</span>
            <span className="sm:hidden">Admin</span>
          </h1>
          <div className="flex gap-2">
            <button onClick={() => router.push('/dashboard')} className="text-xs md:text-sm text-gray-600 hover:text-gray-900 px-2 md:px-3 py-1.5 rounded-lg hover:bg-gray-100">Dashboard</button>
            <button onClick={async () => { await logout(); router.push('/login'); }} className="text-xs md:text-sm text-gray-600 hover:text-gray-900 px-2 md:px-3 py-1.5 rounded-lg hover:bg-gray-100">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Users', value: users.length, color: 'text-blue-600' },
            { label: 'Pending Approval', value: pendingUsers.length, color: 'text-orange-600', alert: pendingUsers.length > 0 },
            { label: 'Pending Deposits', value: deposits.length + mobileDeposits.length, color: 'text-purple-600', alert: deposits.length + mobileDeposits.length > 0 },
            { label: 'Pending Withdrawals', value: withdrawals.length, color: 'text-red-600', alert: withdrawals.length > 0 },
            { label: 'Products', value: products.length, color: 'text-green-600', alert: products.length === 0 },
            { label: 'Pending KYC', value: kycSubmissions.length, color: 'text-teal-600', alert: kycSubmissions.length > 0 },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl p-4 shadow-sm border ${s.alert ? 'border-orange-200' : 'border-gray-100'}`}>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto scrollbar-hide mb-6">
          <div className="flex gap-1 bg-gray-200 p-1 rounded-xl w-max min-w-full">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
              {t}
              {t === 'Pending' && pendingUsers.length > 0 && <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingUsers.length}</span>}
              {t === 'Deposits' && (deposits.length + mobileDeposits.length) > 0 && <span className="ml-1.5 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">{deposits.length + mobileDeposits.length}</span>}
              {t === 'Withdrawals' && withdrawals.length > 0 && <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{withdrawals.length}</span>}
              {t === 'KYC' && kycSubmissions.length > 0 && <span className="ml-1.5 bg-teal-500 text-white text-xs px-1.5 py-0.5 rounded-full">{kycSubmissions.length}</span>}
            </button>
          ))}
          </div>
        </div>

        {/* ── PENDING USERS TAB ── */}
        {tab === 'Pending' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Users Awaiting Approval ({pendingUsers.length})</h2>
              <p className="text-sm text-gray-500 mt-0.5">New signups waiting to be activated</p>
            </div>
            {pendingUsers.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-300" />
                <p>No pending users — all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingUsers.map(u => (
                  <div key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">{u.username}</p>
                      <p className="text-sm text-gray-500">{u.phone} {u.email && `· ${u.email}`}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Referral: {u.referred_by || 'none'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveUser(u.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => rejectUser(u.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ALL USERS TAB ── */}
        {tab === 'All Users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search username or phone…" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400" />
              </div>
              <button onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg">
                <Plus className="w-4 h-4" /> New User
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  {['Username','Phone','Role','Status','VIP','NSL','USDT','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                      <td className="px-4 py-3 text-gray-600">{u.phone}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{u.role}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(u.status)}`}>{u.status}</span></td>
                      <td className="px-4 py-3 text-gray-600">{u.vip_level}</td>
                      <td className="px-4 py-3 text-gray-900 font-mono">{parseFloat(u.balance_NSL||0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-900 font-mono">{parseFloat(u.balance_usdt||0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setSelectedUser(u); setEditForm({ vip_level: u.vip_level || 'none', role: u.role || 'user' }); setShowEditModal(true); }} title="Edit" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setSelectedUser(u); setBalanceForm({ balance_NSL: u.balance_NSL, balance_usdt: u.balance_usdt, reason: '' }); setShowBalanceModal(true); }} title="Balance" className="p-1.5 text-green-600 hover:bg-green-50 rounded"><DollarSign className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setSelectedUser(u); setPasswordForm({ new_password: '', confirm_password: '' }); setShowPasswordModal(true); }} title="Reset password" className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"><Key className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setSelectedUser(u); setPhoneForm({ phone: u.phone || '' }); setShowPhoneModal(true); }} title="Change phone" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><span className="text-xs font-bold">#</span></button>
                          {u.status === 'pending' && <button onClick={() => approveUser(u.id)} title="Approve" className="p-1.5 text-green-600 hover:bg-green-50 rounded"><CheckCircle className="w-3.5 h-3.5" /></button>}
                          {u.status !== 'superadmin' && u.role !== 'superadmin' && (
                            <button onClick={() => handleUpdateStatus(u.id, u.status === 'active' ? 'frozen' : 'active')} title={u.status === 'active' ? 'Freeze' : 'Activate'} className={`p-1.5 rounded ${u.status === 'active' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}><Shield className="w-3.5 h-3.5" /></button>
                          )}
                          {u.role !== 'superadmin' && <button onClick={() => handleDeleteUser(u.id, u.username)} title="Delete" className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DEPOSITS TAB ── */}
        {tab === 'Deposits' && (
          <div className="space-y-4">
            {/* Crypto Deposits */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Binance / Crypto Deposits ({deposits.length})</h2>
                  <p className="text-sm text-gray-500 mt-0.5">USDT deposits with transaction proof</p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">USDT</span>
              </div>
              {deposits.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">No pending crypto deposits</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {deposits.map(d => (
                    <div key={d.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 font-bold text-xs shrink-0">BNB</div>
                        <div>
                          <p className="font-semibold text-gray-900">{d.user?.username || `User #${d.user_id}`}</p>
                          <p className="text-sm text-gray-600">${parseFloat(d.user_submitted_amount).toFixed(2)} USDT → {((d.user_submitted_amount * NSL_RATE) * 0.95).toFixed(0)} NSL after 5% fee</p>
                          {d.user_submitted_txid && <p className="text-xs text-gray-400 font-mono truncate max-w-xs">TxID: {d.user_submitted_txid}</p>}
                          <p className="text-xs text-gray-400">{new Date(d.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedDeposit({ ...d, _type: 'crypto' }); setDepositAction({ approved_amount: d.user_submitted_amount, notes: '', reason: '' }); setShowDepositModal(true); }}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg shrink-0">
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Money Deposits */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Orange Money & Africell Deposits ({mobileDeposits.length})</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Mobile money deposits with receipt screenshots</p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">NSL</span>
              </div>
              {mobileDeposits.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">No pending mobile deposits</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {mobileDeposits.map(d => {
                    const notes = (() => { try { return JSON.parse(d.notes || '{}'); } catch { return {}; } })();
                    const isAfricell = d.payment_method === 'africell';
                    return (
                      <div key={d.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 ${isAfricell ? 'bg-blue-600' : 'bg-orange-500'}`}>
                            {isAfricell ? 'AFR' : 'OM'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{d.user?.username || `User #${d.user_id}`}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isAfricell ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                {isAfricell ? 'Africell' : 'Orange Money'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{parseFloat(d.amount_NSL).toLocaleString()} SLE sent · {parseFloat(d.amount_NSL * 0.95).toLocaleString()} NSL after 5% fee</p>
                            {d.reference_id && <p className="text-xs text-gray-400 font-mono truncate max-w-xs">Ref: {d.reference_id}</p>}
                            {notes.sender_number && <p className="text-xs text-gray-400">From: {notes.sender_number}</p>}
                            <p className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <button onClick={() => { setSelectedDeposit({ ...d, _type: 'mobile', _notes: notes }); setDepositAction({ approved_amount: notes.amount_SLE || d.amount_NSL, notes: '', reason: '', admin_reference: '' }); setShowDepositModal(true); }}
                          className={`px-4 py-1.5 text-white text-sm font-medium rounded-lg shrink-0 ${isAfricell ? 'bg-blue-600 hover:bg-blue-500' : 'bg-orange-500 hover:bg-orange-400'}`}>
                          Review
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── WITHDRAWALS TAB ── */}
        {tab === 'Withdrawals' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Pending Withdrawal Requests ({withdrawals.length})</h2>
              <p className="text-sm text-gray-500 mt-0.5">Approve to deduct balance and process; reject to cancel</p>
            </div>
            {withdrawals.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-300" />
                <p>No pending withdrawals</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {withdrawals.map(w => {
                  const u = w.user || {};
                  return (
                    <div key={w.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">{u.username || `User #${w.user_id}`}</p>
                          <p className="text-sm text-gray-600">{parseFloat(w.amount_NSL || 0).toLocaleString()} NSL → ${parseFloat(w.amount_usdt || 0).toFixed(2)} USDT</p>
                          {w.withdrawal_address && <p className="text-xs font-mono text-gray-400 truncate max-w-xs">{w.withdrawal_address}</p>}
                          {w.withdrawal_network && <span className="inline-block text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{w.withdrawal_network}</span>}
                          <p className="text-xs text-gray-400">{new Date(w.createdAt || w.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => approveWithdrawal(w.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg">
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => { setSelectedWithdrawal(w); setWithdrawalAction({ reason: '' }); setShowWithdrawalModal(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {tab === 'Products' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">Investment Plans</h2>
                <p className="text-sm text-gray-500">{products.length} plans in database</p>
              </div>
              <div className="flex gap-2">
                {products.length === 0 && (
                  <button onClick={seedProducts} disabled={seeding}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm">
                    <Package className="w-4 h-4" />
                    {seeding ? 'Seeding…' : 'Seed VIP0–VIP9'}
                  </button>
                )}
                <button onClick={openAddVIP}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors text-sm">
                  <Plus className="w-4 h-4" /> New VIP
                </button>
              </div>
            </div>
            {products.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No products yet</p>
                <p className="text-sm text-gray-400 mb-6">Click "Seed All VIP Plans" to populate VIP0–VIP9</p>
                <button onClick={seedProducts} disabled={seeding}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl">
                  {seeding ? 'Seeding…' : 'Seed All VIP Plans (VIP0–VIP9)'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <div key={p.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-opacity ${p.active ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
                    <div className={`px-5 py-3 flex items-center justify-between ${p.active ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gray-400'}`}>
                      <span className="font-bold text-lg text-white">{p.name}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleVIP(p)}
                          title={p.active ? 'Deactivate plan' : 'Activate plan'}
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold border transition-colors ${p.active ? 'bg-green-400/20 text-green-100 border-green-400/40 hover:bg-red-400/30 hover:text-red-100 hover:border-red-400/40' : 'bg-gray-400/30 text-gray-100 border-gray-300/40 hover:bg-green-400/30 hover:text-green-100 hover:border-green-400/40'}`}>
                          {p.active ? 'Active' : 'Inactive'}
                        </button>
                        <button onClick={() => openEditVIP(p)} title="Edit plan" className="text-white/70 hover:text-white transition-colors p-1"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteVIP(p)} title="Deactivate plan" className="text-white/50 hover:text-red-300 transition-colors p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="p-5 space-y-2.5 text-sm">
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Price</span>
                        <span className="font-bold text-gray-900 font-mono">{parseFloat(p.price_NSL).toLocaleString()} NSL</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Price (USDT)</span>
                        <span className="font-bold text-gray-900 font-mono">${parseFloat(p.price_usdt).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Daily Income</span>
                        <span className="font-bold text-green-600 font-mono">{parseFloat(p.daily_income_NSL).toLocaleString()} NSL</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Duration</span>
                        <span className="font-bold text-gray-900">{p.validity_days} days</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Total Return</span>
                        <span className="font-bold text-blue-600 font-mono">{(parseFloat(p.daily_income_NSL) * p.validity_days).toLocaleString()} NSL</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium">Net Profit</span>
                        {(() => { const profit = parseFloat(p.daily_income_NSL) * p.validity_days - parseFloat(p.price_NSL); return <span className={`font-bold font-mono ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{profit >= 0 ? '+' : ''}{profit.toLocaleString()} NSL</span>; })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* ── KYC TAB ── */}
        {tab === 'KYC' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Pending KYC Submissions ({kycSubmissions.length})</h2>
              <p className="text-sm text-gray-500 mt-0.5">Review identity documents submitted by users</p>
            </div>
            {kycSubmissions.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <FileCheck className="w-10 h-10 mx-auto mb-2 text-teal-300" />
                <p>No pending KYC submissions</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {kycSubmissions.map(u => {
                  const docs = [
                    { key: 'kyc_id_front', label: 'Document' },
                    { key: 'kyc_id_back', label: 'ID Back' },
                    { key: 'kyc_selfie', label: 'Selfie' },
                    { key: 'kyc_additional', label: 'Additional' },
                  ].filter(d => u[d.key]);
                  const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
                  const docUrl = (raw) => raw?.startsWith('http') ? raw : `${base}${raw}`;
                  return (
                    <div key={u.id} className="px-6 py-5 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{u.username}</p>
                          <p className="text-sm text-gray-500">{u.phone}{u.email && ` · ${u.email}`}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Submitted {new Date(u.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => approveKYC(u.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => { setSelectedKYCUser(u); setKycRejectReason(''); setShowKYCModal(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                      {/* Inline document thumbnails */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {docs.map(d => (
                          <a key={d.key} href={docUrl(u[d.key])} target="_blank" rel="noopener noreferrer"
                            className="group block rounded-lg overflow-hidden border border-gray-200 hover:border-teal-400 transition-colors">
                            <img src={docUrl(u[d.key])} alt={d.label}
                              className="w-full h-20 object-cover bg-gray-100 group-hover:opacity-90 transition-opacity" />
                            <div className="px-2 py-1 bg-teal-50 flex items-center gap-1">
                              <FileCheck className="w-3 h-3 text-teal-600 shrink-0" />
                              <span className="text-teal-700 text-xs font-medium truncate">{d.label}</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === 'Analytics' && (
          <div className="space-y-6">
            {analyticsLoading || !analytics ? (
              <div className="flex items-center justify-center h-48 text-gray-400">
                {analyticsLoading ? 'Loading analytics…' : 'No data yet'}
              </div>
            ) : (
              <>
                {/* ── Financial Summary ── */}
                <div className="bg-gradient-to-r from-purple-700 to-indigo-700 rounded-2xl p-6 text-white">
                  <h3 className="font-bold text-lg mb-4">Financial Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-purple-200 text-xs uppercase tracking-wide mb-1">Total Deposits (Recharges)</p>
                      <p className="text-3xl font-bold">${(analytics.revenue.total.total_USDT||0).toFixed(2)}</p>
                      <p className="text-purple-200 text-sm mt-1">{(analytics.revenue.total.total_NSL||0).toLocaleString()} NSL</p>
                      <p className="text-purple-300 text-xs mt-2">This month: ${(analytics.revenue.this_month.total_USDT||0).toFixed(2)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-purple-200 text-xs uppercase tracking-wide mb-1">Total Withdrawals (Paid Out)</p>
                      <p className="text-3xl font-bold text-red-300">${(analytics.withdrawals.approved?.total_USDT||0).toFixed(2)}</p>
                      <p className="text-purple-200 text-sm mt-1">{(analytics.withdrawals.approved?.total_NSL||0).toLocaleString()} NSL</p>
                      <p className="text-purple-300 text-xs mt-2">Pending: ${(analytics.withdrawals.pending.total_USDT||0).toFixed(2)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-purple-200 text-xs uppercase tracking-wide mb-1">Net Platform Revenue</p>
                      <p className={`text-3xl font-bold ${((analytics.revenue.total.total_USDT||0) - (analytics.withdrawals.approved?.total_USDT||0)) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        ${((analytics.revenue.total.total_USDT||0) - (analytics.withdrawals.approved?.total_USDT||0)).toFixed(2)}
                      </p>
                      <p className="text-purple-200 text-sm mt-1">
                        {((analytics.revenue.total.total_NSL||0) - (analytics.withdrawals.approved?.total_NSL||0)).toLocaleString()} NSL
                      </p>
                      <p className="text-purple-300 text-xs mt-2">Deposits minus paid withdrawals</p>
                    </div>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Users',      value: analytics.users.total,                          sub: `${analytics.users.new_today} new today`,    color: 'text-blue-600' },
                    { label: 'Active Users',     value: analytics.users.active,                         sub: `${analytics.users.pending} pending`,         color: 'text-green-600' },
                    { label: 'Revenue (USDT)',   value: `$${(analytics.revenue.total.total_USDT||0).toFixed(2)}`, sub: `This month: $${(analytics.revenue.this_month.total_USDT||0).toFixed(2)}`, color: 'text-purple-600' },
                    { label: 'Revenue Growth',  value: analytics.revenue.growth_rate,                  sub: 'vs last month',                              color: parseFloat(analytics.revenue.growth_rate) >= 0 ? 'text-green-600' : 'text-red-500' },
                    { label: 'Transactions',    value: analytics.transactions.total,                   sub: `${analytics.transactions.pending} pending`,   color: 'text-orange-600' },
                    { label: 'Pending Withdrawals', value: analytics.withdrawals.pending.count,        sub: `$${(analytics.withdrawals.pending.total_USDT||0).toFixed(2)} USDT`, color: 'text-red-600' },
                    { label: 'Referrals',       value: analytics.referrals.total_count,               sub: `${(analytics.referrals.total_payouts||0).toLocaleString()} NSL paid`, color: 'text-cyan-600' },
                    { label: 'New This Month',  value: analytics.users.new_this_month,                sub: 'registered users',                            color: 'text-indigo-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* User growth chart */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm mb-4">User Growth (30 days)</h3>
                    {analytics.charts.user_growth.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-6">No data yet</p>
                    ) : (() => {
                      const data = analytics.charts.user_growth;
                      const max = Math.max(...data.map(d => d.count), 1);
                      return (
                        <div className="flex items-end gap-1 h-28">
                          {data.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count} users`}>
                              <div className="w-full bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600"
                                style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }} />
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Revenue trend chart */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm mb-4">Revenue Trend — USDT (30 days)</h3>
                    {analytics.charts.revenue_trend.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-6">No deposits yet</p>
                    ) : (() => {
                      const data = analytics.charts.revenue_trend;
                      const max = Math.max(...data.map(d => d.USDT || 0), 1);
                      return (
                        <div className="flex items-end gap-1 h-28">
                          {data.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: $${(d.USDT||0).toFixed(2)}`}>
                              <div className="w-full bg-purple-500 rounded-t-sm transition-all hover:bg-purple-600"
                                style={{ height: `${Math.max(((d.USDT||0) / max) * 100, 4)}%` }} />
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* VIP distribution */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm mb-4">VIP Distribution</h3>
                    <div className="space-y-2">
                      {analytics.users.vip_distribution.map(v => (
                        <div key={v.vip_level} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-12">{v.vip_level || 'None'}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${Math.min((v.count / (analytics.users.total||1)) * 100, 100)}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-6 text-right">{v.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transaction by type */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm mb-4">Transactions by Type</h3>
                    <div className="space-y-2">
                      {analytics.transactions.by_type.map(t => {
                        const colors = { recharge:'bg-green-500', withdrawal:'bg-red-500', income:'bg-blue-500', purchase:'bg-purple-500', renewal:'bg-orange-500' };
                        return (
                          <div key={t.type} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${colors[t.type]||'bg-gray-400'}`} />
                              <span className="text-sm capitalize text-gray-700">{t.type}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-semibold text-gray-900">{t.count}</span>
                              <span className="text-xs text-gray-400 ml-1.5">{(t.total_NSL||0).toLocaleString()} NSL</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Top products */}
                {analytics.products.sales.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-sm">Top Products by Sales</h3>
                    </div>
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                        <th className="px-5 py-2.5 text-left">Product</th>
                        <th className="px-5 py-2.5 text-right">Sales</th>
                        <th className="px-5 py-2.5 text-right">Revenue (NSL)</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {analytics.products.sales.map(p => (
                          <tr key={p.product_name} className="hover:bg-gray-50">
                            <td className="px-5 py-2.5 font-medium text-purple-700">{p.product_name}</td>
                            <td className="px-5 py-2.5 text-right text-gray-700">{p.sales_count}</td>
                            <td className="px-5 py-2.5 text-right font-mono text-gray-900">{(p.revenue||0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Income Distribution Controls ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-1">Income Distribution</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Runs automatically every day at midnight. Use these buttons to trigger manually (e.g. after a system fix or to catch up).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {[
                      { job: 'daily-income',  label: 'Run Daily Income',  color: 'bg-green-600 hover:bg-green-500',  desc: 'Credits each active VIP product\'s daily NSL to user balances' },
                      { job: 'auto-renewal',  label: 'Run Auto-Renewal',  color: 'bg-blue-600 hover:bg-blue-500',    desc: 'Renews or deactivates expired products, recalculates VIP levels' },
                      { job: 'cleanup',       label: 'Run Cleanup',       color: 'bg-gray-600 hover:bg-gray-500',    desc: 'Purges expired sessions and old notifications' },
                    ].map(({ job, label, color, desc }) => (
                      <button key={job} onClick={() => triggerCron(job)} disabled={!!cronRunning}
                        className={`${color} disabled:opacity-50 text-white text-sm font-semibold rounded-xl px-4 py-3 transition-colors flex flex-col items-start gap-1`}>
                        <span className="flex items-center gap-2">
                          {cronRunning === job
                            ? <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : null}
                          {label}
                        </span>
                        <span className="text-xs font-normal opacity-75">{desc}</span>
                      </button>
                    ))}
                  </div>
                  {cronResult && (
                    <div className={`rounded-xl px-4 py-3 text-sm font-mono ${cronResult.ok ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                      <p className="font-semibold mb-1">{cronResult.job} — {cronResult.ok ? 'Success' : 'Failed'}</p>
                      {cronResult.ok ? (
                        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(cronResult.result, null, 2)}</pre>
                      ) : (
                        <p className="text-xs">{cronResult.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'Settings' && (
          <div className="space-y-6 max-w-xl">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <h2 className="font-semibold text-gray-900">Payment Methods</h2>
              <p className="text-gray-500 text-sm">Configure the numbers and addresses users send money to when making deposits.</p>

              {/* Orange Money */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">O</span>
                    Orange Money Number
                  </span>
                </label>
                <input type="tel" value={paymentSettings.orange_money_number || ''}
                  onChange={e => setPaymentSettings(s => ({ ...s, orange_money_number: e.target.value }))}
                  placeholder="e.g. 078811767"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 font-mono" />
                <p className="text-gray-400 text-xs mt-1">Users will send Orange Money to this number</p>
              </div>

              {/* Africell */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">A</span>
                    Africell Number
                  </span>
                </label>
                <input type="tel" value={paymentSettings.africell_number || ''}
                  onChange={e => setPaymentSettings(s => ({ ...s, africell_number: e.target.value }))}
                  placeholder="e.g. 030123456"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 font-mono" />
                <p className="text-gray-400 text-xs mt-1">Users will send Africell money to this number</p>
              </div>

              {/* Binance Wallet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">B</span>
                    Binance USDT Wallet Address
                  </span>
                </label>
                <input type="text" value={paymentSettings.binance_wallet_address || ''}
                  onChange={e => setPaymentSettings(s => ({ ...s, binance_wallet_address: e.target.value }))}
                  placeholder="e.g. TRx... (TRC20)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400 font-mono" />
              </div>

              {/* Binance Network */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Network / Chain</label>
                <input type="text" value={paymentSettings.binance_network || ''}
                  onChange={e => setPaymentSettings(s => ({ ...s, binance_network: e.target.value }))}
                  placeholder="e.g. TRC20 (USDT)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400" />
              </div>

              <button
                disabled={settingsSaving}
                onClick={async () => {
                  setSettingsSaving(true);
                  try {
                    await api.put('/admin/payment-settings', paymentSettings);
                    toast.success('Payment settings saved');
                  } catch {
                    toast.error('Failed to save settings');
                  } finally {
                    setSettingsSaving(false);
                  }
                }}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors">
                {settingsSaving ? 'Saving…' : 'Save Payment Settings'}
              </button>
            </div>

            {/* ── Platform Settings ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div>
                <h2 className="font-semibold text-gray-900">Platform Rules</h2>
                <p className="text-gray-500 text-sm mt-0.5">Referral commissions, fees, and investment duration options</p>
              </div>

              {/* Referral percentages */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Referral Commission (%)</p>
                <div className="grid grid-cols-3 gap-3">
                  {[['Level 1 (Direct)', 'referral_l1_pct'], ['Level 2', 'referral_l2_pct'], ['Level 3', 'referral_l3_pct']].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <div className="relative">
                        <input type="number" min="0" max="100" step="0.1"
                          value={platformSettings[key]}
                          onChange={e => setPlatformSettings(s => ({ ...s, [key]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 pr-7" />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Paid to each referral level when a user makes an investment purchase</p>
              </div>

              {/* Fee percentages */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Transaction Fees (%)</p>
                <div className="grid grid-cols-2 gap-3">
                  {[['Recharge Fee', 'recharge_fee_pct'], ['Withdrawal Fee', 'withdrawal_fee_pct']].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <div className="relative">
                        <input type="number" min="0" max="100" step="0.1"
                          value={platformSettings[key]}
                          onChange={e => setPlatformSettings(s => ({ ...s, [key]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 pr-7" />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Super admin accounts are always exempt from fees</p>
              </div>

              {/* Duration options */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Investment Duration Options (days)</p>
                <div className="grid grid-cols-2 gap-3">
                  {[['Short', 'dur_short'], ['1 Week', 'dur_week'], ['1 Month', 'dur_month'], ['Promo (days)', 'dur_promo']].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <input type="number" min="1" max="365"
                        value={platformSettings[key]}
                        onChange={e => setPlatformSettings(s => ({ ...s, [key]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-gray-500 mb-1">Promo Label (shown to users)</label>
                  <input type="text"
                    value={platformSettings.dur_promo_label}
                    onChange={e => setPlatformSettings(s => ({ ...s, dur_promo_label: e.target.value }))}
                    placeholder="e.g. Flash Sale"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400" />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Changes take effect immediately on the next user session (30s cache)</p>
              </div>

              <button
                disabled={platformSaving}
                onClick={async () => {
                  setPlatformSaving(true);
                  try {
                    await api.put('/admin/platform-settings', platformSettings);
                    toast.success('Platform settings saved');
                  } catch {
                    toast.error('Failed to save platform settings');
                  } finally {
                    setPlatformSaving(false);
                  }
                }}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors">
                {platformSaving ? 'Saving…' : 'Save Platform Settings'}
              </button>
            </div>
          </div>
        )}

        {/* ── TESTIMONIALS TAB ── */}
        {tab === 'Testimonials' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Social Proof Feed</h2>
                <p className="text-sm text-gray-500">These pop up on the user dashboard as a live activity feed. Toggle visibility or delete entries.</p>
              </div>
              <button onClick={() => { setTestimonialForm({ name: '', country: '', flag: '', phone: '', type: 'withdrawal', amount_nsl: '' }); setShowAddTestimonialModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg">
                <Plus className="w-4 h-4" /> Add Entry
              </button>
            </div>
            {testimonialsLoading ? (
              <div className="text-center py-12 text-gray-400">Loading…</div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    {['Flag','Name','Country','Phone','Type','Amount (NSL)','Visible','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {testimonials.map(t => (
                      <tr key={t.id} className={`hover:bg-gray-50 ${!t.visible ? 'opacity-40' : ''}`}>
                        <td className="px-4 py-3 text-xl">{t.flag}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                        <td className="px-4 py-3 text-gray-600">{t.country}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{t.phone}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.type === 'withdrawal' ? 'bg-green-100 text-green-700' : t.type === 'deposit' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-900">{parseFloat(t.amount_nsl).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={async () => {
                            try { const { data } = await api.patch(`/testimonials/${t.id}/toggle`, {}); setTestimonials(prev => prev.map(x => x.id === t.id ? data.testimonial : x)); }
                            catch { toast.error('Toggle failed'); }
                          }} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${t.visible ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${t.visible ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={async () => {
                            if (!confirm(`Delete "${t.name}"?`)) return;
                            try { await api.delete(`/testimonials/${t.id}`); setTestimonials(prev => prev.filter(x => x.id !== t.id)); toast.success('Deleted'); }
                            catch { toast.error('Delete failed'); }
                          }} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {testimonials.length === 0 && (
                  <div className="py-10 text-center text-gray-400 text-sm">No testimonials yet</div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── ADD TESTIMONIAL MODAL ── */}
      {showAddTestimonialModal && (
        <Modal title="Add Testimonial Entry" onClose={() => setShowAddTestimonialModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" value={testimonialForm.name} onChange={e => setTestimonialForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="e.g. Mohamed Bangura" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <input type="text" value={testimonialForm.country} onChange={e => setTestimonialForm(f => ({ ...f, country: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="e.g. Sierra Leone" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Flag emoji</label>
                <input type="text" value={testimonialForm.flag} onChange={e => setTestimonialForm(f => ({ ...f, flag: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="🇸🇱" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="text" value={testimonialForm.phone} onChange={e => setTestimonialForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="+232 76 234567" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select value={testimonialForm.type} onChange={e => setTestimonialForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400">
                  <option value="withdrawal">Withdrawal (cashed out)</option>
                  <option value="deposit">Deposit</option>
                  <option value="earning">Daily Earning</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (NSL)</label>
                <input type="number" value={testimonialForm.amount_nsl} onChange={e => setTestimonialForm(f => ({ ...f, amount_nsl: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" placeholder="2500" />
              </div>
            </div>
            <button disabled={testimonialSaving || !testimonialForm.name || !testimonialForm.country || !testimonialForm.phone || !testimonialForm.amount_nsl}
              onClick={async () => {
                setTestimonialSaving(true);
                try {
                  const { data } = await api.post('/testimonials', testimonialForm);
                  setTestimonials(prev => [...prev, data.testimonial]);
                  setShowAddTestimonialModal(false);
                  toast.success('Testimonial added');
                } catch { toast.error('Failed to add'); }
                finally { setTestimonialSaving(false); }
              }}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-lg">
              {testimonialSaving ? 'Saving…' : 'Add Testimonial'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── ADD VIP MODAL ── */}
      {showAddVIPModal && (
        <Modal title={`Add New VIP Plan`} onClose={() => setShowAddVIPModal(false)}>
          <VIPForm form={vipForm} setForm={setVipForm} nameEditable onSave={saveNewVIP} onCancel={() => setShowAddVIPModal(false)} saving={vipSaving} />
        </Modal>
      )}

      {/* ── EDIT VIP MODAL ── */}
      {showEditVIPModal && editingProduct && (
        <Modal title={`Edit ${editingProduct.name}`} onClose={() => setShowEditVIPModal(false)}>
          <VIPForm form={vipForm} setForm={setVipForm} nameEditable={false} onSave={saveEditVIP} onCancel={() => setShowEditVIPModal(false)} saving={vipSaving} />
        </Modal>
      )}

      {/* ── CREATE USER MODAL ── */}
      {showCreateModal && (
        <Modal title="Create New User" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateUser} className="space-y-4">
            {[['Username','text','username'],['Phone','tel','phone'],['Password','password','password']].map(([label, type, field]) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input type={type} value={createForm[field]} onChange={e => setCreateForm({...createForm, [field]: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" required />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select value={createForm.role} onChange={e => setCreateForm({...createForm, role: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {['user','admin','finance','verificator','approval'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg">Create User</button>
          </form>
        </Modal>
      )}

      {/* ── EDIT USER MODAL ── */}
      {showEditModal && selectedUser && (
        <Modal title={`Edit: ${selectedUser.username}`} onClose={() => setShowEditModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">VIP Level</label>
              <select value={editForm.vip_level} onChange={e => setEditForm(f => ({...f, vip_level: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {['none','VIP0','VIP1','VIP2','VIP3','VIP4','VIP5','VIP6','VIP7','VIP8','VIP9'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select value={editForm.role} onChange={e => setEditForm(f => ({...f, role: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {['user','admin','finance','verificator','approval','superadmin'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <button onClick={async () => {
              if (editForm.vip_level !== selectedUser.vip_level) await handleUpdateVIP(selectedUser.id, editForm.vip_level);
              if (editForm.role !== selectedUser.role) await handleUpdateRole(selectedUser.id, editForm.role);
              if (editForm.vip_level === selectedUser.vip_level && editForm.role === selectedUser.role) toast('No changes to save');
            }} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg">
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      {/* ── BALANCE MODAL ── */}
      {showBalanceModal && selectedUser && (
        <Modal title={`Balance: ${selectedUser.username}`} onClose={() => setShowBalanceModal(false)}>
          <form onSubmit={handleAdjustBalance} className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
              1 USDT = {NSL_RATE} NSL
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">NSL Balance</label>
              <input type="number" step="0.01" value={balanceForm.balance_NSL}
                onChange={e => { const nsl = parseFloat(e.target.value)||0; setBalanceForm({...balanceForm, balance_NSL: nsl, balance_usdt: parseFloat((nsl/NSL_RATE).toFixed(4))}); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">USDT Balance</label>
              <input type="number" step="0.0001" value={balanceForm.balance_usdt}
                onChange={e => { const usdt = parseFloat(e.target.value)||0; setBalanceForm({...balanceForm, balance_usdt: usdt, balance_NSL: parseFloat((usdt*NSL_RATE).toFixed(4))}); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <textarea value={balanceForm.reason} onChange={e => setBalanceForm({...balanceForm, reason: e.target.value})}
                rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 resize-none" required />
            </div>
            <button type="submit" className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg">Update Balance</button>
          </form>
        </Modal>
      )}

      {/* ── PASSWORD RESET MODAL ── */}
      {showPasswordModal && selectedUser && (
        <Modal title={`Reset Password: ${selectedUser.username}`} onClose={() => setShowPasswordModal(false)}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            {[['New Password','new_password'],['Confirm Password','confirm_password']].map(([label, field]) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input type="password" value={passwordForm[field]} onChange={e => setPasswordForm({...passwordForm, [field]: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" required minLength={6} />
              </div>
            ))}
            {passwordForm.new_password && passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
              <p className="text-red-500 text-sm">Passwords do not match</p>
            )}
            <button type="submit" disabled={passwordForm.new_password !== passwordForm.confirm_password}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-lg">Reset Password</button>
          </form>
        </Modal>
      )}

      {/* ── CHANGE PHONE MODAL ── */}
      {showPhoneModal && selectedUser && (
        <Modal title={`Change Phone: ${selectedUser.username}`} onClose={() => setShowPhoneModal(false)}>
          <form onSubmit={handleChangePhone} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current phone</label>
              <p className="text-gray-500 text-sm font-mono">{selectedUser.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New phone number</label>
              <input type="tel" value={phoneForm.phone} onChange={e => setPhoneForm({ phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 font-mono" required placeholder="+232XXXXXXXX" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg">Update Phone Number</button>
          </form>
        </Modal>
      )}

      {/* ── DEPOSIT REVIEW MODAL ── */}
      {showDepositModal && selectedDeposit && (() => {
        const isMobile = selectedDeposit._type === 'mobile';
        const notes = selectedDeposit._notes || {};
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace('/api', '');
        const resolveUrl = (raw) => !raw ? null : raw.startsWith('http') ? raw : `${apiBase}/${raw}`;
        const screenshotUrl = isMobile
          ? resolveUrl(selectedDeposit.payment_proof)
          : resolveUrl(selectedDeposit.receipt_image);
        const isAfricell = selectedDeposit.payment_method === 'africell';
        return (
          <Modal title={isMobile ? `Review ${isAfricell ? 'Africell' : 'Orange Money'} Deposit` : 'Review Crypto Deposit'} onClose={() => setShowDepositModal(false)}>
            <div className="space-y-4">
              {/* Receipt / Screenshot image */}
              {screenshotUrl && (
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-500 px-3 py-1.5 border-b border-gray-100 font-medium">Receipt Screenshot</p>
                  <img src={screenshotUrl} alt="Receipt" className="w-full max-h-56 object-contain p-2" />
                  <a href={screenshotUrl} target="_blank" rel="noopener noreferrer"
                    className="block text-center text-xs text-blue-600 hover:text-blue-800 py-1.5 border-t border-gray-100">
                    Open full size ↗
                  </a>
                </div>
              )}

              {/* Deposit details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">User</span><span className="font-medium">{selectedDeposit.user?.username}</span></div>
                {isMobile ? (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-mono font-bold text-gray-900">{parseFloat(selectedDeposit.amount_NSL).toLocaleString()} NSL</span></div>
                    {notes.amount_SLE && <div className="flex justify-between"><span className="text-gray-500">SLE Sent</span><span className="font-mono">{parseInt(notes.amount_SLE).toLocaleString()} SLE</span></div>}
                    {selectedDeposit.reference_id && <div className="flex justify-between"><span className="text-gray-500">Reference</span><span className="font-mono text-xs">{selectedDeposit.reference_id}</span></div>}
                    {notes.sender_number && <div className="flex justify-between"><span className="text-gray-500">Sender</span><span className="font-mono">{notes.sender_number}</span></div>}
                    {notes.receiver_number && <div className="flex justify-between"><span className="text-gray-500">Receiver</span><span className="font-mono">{notes.receiver_number}</span></div>}
                    {notes.timestamp_receipt && <div className="flex justify-between"><span className="text-gray-500">Time on Receipt</span><span className="text-xs">{notes.timestamp_receipt}</span></div>}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Submitted</span><span className="font-mono font-medium">${parseFloat(selectedDeposit.user_submitted_amount).toFixed(2)} USDT</span></div>
                    {selectedDeposit.user_submitted_txid && <div className="flex justify-between"><span className="text-gray-500">TxID</span><span className="font-mono text-xs truncate max-w-[180px]">{selectedDeposit.user_submitted_txid}</span></div>}
                    {selectedDeposit.user_notes && <div className="flex justify-between"><span className="text-gray-500">Notes</span><span>{selectedDeposit.user_notes}</span></div>}
                  </>
                )}
              </div>

              {/* ── Reference Code Verification (mobile only) ── */}
              {isMobile && (() => {
                const userRef = (selectedDeposit.reference_id || '').trim().toLowerCase();
                const adminRef = (depositAction.admin_reference || '').trim().toLowerCase();
                const hasAdminRef = adminRef.length > 0;
                const matches = hasAdminRef && userRef && adminRef === userRef;
                const mismatch = hasAdminRef && userRef && adminRef !== userRef;
                return (
                  <div className={`rounded-xl p-4 space-y-3 border-2 ${matches ? 'border-green-400 bg-green-50' : mismatch ? 'border-red-400 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                    <div className="flex items-start gap-2">
                      <div className={`w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-white text-xs font-bold ${matches ? 'bg-green-500' : mismatch ? 'bg-red-500' : 'bg-blue-500'}`}>
                        {matches ? '✓' : mismatch ? '✗' : '!'}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${matches ? 'text-green-800' : mismatch ? 'text-red-800' : 'text-blue-800'}`}>
                          {matches ? 'Reference Code Verified ✓' : mismatch ? 'Reference Code Mismatch!' : 'Verify Reference Code'}
                        </p>
                        <p className={`text-xs mt-0.5 ${matches ? 'text-green-600' : mismatch ? 'text-red-600' : 'text-blue-600'}`}>
                          {matches
                            ? 'The code you received on your phone matches the user\'s receipt.'
                            : mismatch
                            ? 'The code does not match. Do NOT approve unless you have confirmed this manually.'
                            : 'Enter the reference code you received via SMS on your phone to verify this payment.'}
                        </p>
                      </div>
                    </div>
                    {userRef && (
                      <div className="bg-white rounded-lg px-3 py-2 text-xs font-mono text-gray-600 border border-gray-200">
                        <span className="text-gray-400">User submitted: </span>{selectedDeposit.reference_id}
                      </div>
                    )}
                    <input
                      type="text"
                      value={depositAction.admin_reference}
                      onChange={e => setDepositAction({...depositAction, admin_reference: e.target.value})}
                      placeholder="Paste the reference code from your SMS"
                      className={`w-full rounded-lg px-3 py-2 text-sm font-mono focus:outline-none border-2 ${matches ? 'border-green-400 bg-green-50' : mismatch ? 'border-red-400 bg-red-50' : 'border-blue-300 bg-white focus:border-blue-500'}`}
                    />
                  </div>
                );
              })()}

              {/* Approve amount field */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isMobile ? 'Verified SLE Amount (from receipt)' : 'Verified USDT Amount (from receipt)'}
                </label>
                <input type="number" step={isMobile ? '1' : '0.01'} value={depositAction.approved_amount}
                  onChange={e => setDepositAction({...depositAction, approved_amount: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
                <p className="text-xs text-gray-400 mt-1">
                  {isMobile
                    ? `= ${((parseFloat(depositAction.approved_amount) || 0) * 0.95).toFixed(0)} NSL credited after 5% deposit fee`
                    : `= ${((parseFloat(depositAction.approved_amount) || 0) * NSL_RATE * 0.95).toFixed(0)} NSL credited after 5% deposit fee`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Admin Notes (optional)</label>
                <input type="text" value={depositAction.notes} onChange={e => setDepositAction({...depositAction, notes: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
              </div>

              {/* Approve button — blocked if mobile and reference mismatch */}
              {isMobile && (() => {
                const userRef = (selectedDeposit.reference_id || '').trim().toLowerCase();
                const adminRef = (depositAction.admin_reference || '').trim().toLowerCase();
                const mismatch = adminRef.length > 0 && userRef && adminRef !== userRef;
                return (
                  <>
                    {mismatch && (
                      <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 text-sm text-red-700 font-medium">
                        Reference code mismatch — payment cannot be approved. Ask the user to resubmit or verify manually before overriding.
                      </div>
                    )}
                    <button onClick={approveDeposit} disabled={mismatch}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Approve & Credit Balance
                    </button>
                  </>
                );
              })()}
              {!isMobile && (
                <button onClick={approveDeposit} className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Approve & Credit Balance
                </button>
              )}

              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-1 text-red-600">Reject Reason</label>
                <input type="text" value={depositAction.reason} onChange={e => setDepositAction({...depositAction, reason: e.target.value})}
                  placeholder="Required for rejection" className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 mb-2" />
                <button onClick={rejectDeposit} className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ── KYC REJECT MODAL ── */}
      {showKYCModal && selectedKYCUser && (
        <Modal title={`Reject KYC: ${selectedKYCUser.username}`} onClose={() => setShowKYCModal(false)}>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">User</span><span className="font-medium">{selectedKYCUser.username}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{selectedKYCUser.phone}</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-red-600">Rejection Reason</label>
              <textarea rows={3} value={kycRejectReason} onChange={e => setKycRejectReason(e.target.value)}
                placeholder="e.g. Documents are blurry, ID appears expired, selfie doesn't match ID…"
                className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none" />
            </div>
            <button onClick={rejectKYC}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" /> Confirm Rejection
            </button>
          </div>
        </Modal>
      )}

      {/* ── WITHDRAWAL REJECT MODAL ── */}
      {showWithdrawalModal && selectedWithdrawal && (
        <Modal title="Reject Withdrawal" onClose={() => setShowWithdrawalModal(false)}>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">User</span><span className="font-medium">{selectedWithdrawal.user?.username}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-mono">{parseFloat(selectedWithdrawal.amount_NSL||0).toLocaleString()} NSL</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-mono text-xs truncate max-w-[180px]">{selectedWithdrawal.withdrawal_address}</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-red-600">Rejection Reason</label>
              <textarea rows={3} value={withdrawalAction.reason}
                onChange={e => setWithdrawalAction({ reason: e.target.value })}
                placeholder="Explain why this withdrawal is rejected..."
                className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none" />
            </div>
            <button onClick={() => rejectWithdrawal(selectedWithdrawal.id)}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" /> Confirm Rejection
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function VIPForm({ form, setForm, nameEditable, onSave, onCancel, saving }) {
  const price = parseFloat(form.price_NSL) || 0;
  const daily = parseFloat(form.daily_income_NSL) || 0;
  const days = parseInt(form.validity_days) || 7;
  const nslRate = 23;
  const dailyPct = price > 0 ? ((daily / price) * 100) : 0;
  const totalReturn = daily * days;
  const netProfit = totalReturn - price;
  const isProfitable = netProfit >= 0;

  const handlePriceChange = (e) => {
    const newPrice = parseFloat(e.target.value) || 0;
    const updates = { price_NSL: e.target.value };
    // Keep same daily % when price changes — only if daily was already set
    if (daily > 0 && price > 0) {
      const currentPct = daily / price;
      updates.daily_income_NSL = Math.round(newPrice * currentPct);
    }
    setForm(f => ({ ...f, ...updates }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">VIP Name</label>
        <input value={form.name} disabled={!nameEditable}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-purple-700 focus:outline-none focus:border-purple-400 disabled:bg-gray-50 disabled:text-gray-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (NSL)</label>
          <input type="number" value={form.price_NSL} onChange={handlePriceChange}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
          <p className="text-xs text-gray-400 mt-0.5">${(price / nslRate).toFixed(2)} USDT</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Income (NSL)</label>
          <input type="number" value={form.daily_income_NSL} onChange={e => setForm(f => ({ ...f, daily_income_NSL: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
          <p className="text-xs text-gray-400 mt-0.5">{dailyPct.toFixed(2)}% of price/day</p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
        <input type="number" value={form.validity_days} onChange={e => setForm(f => ({ ...f, validity_days: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
        <p className="text-xs text-gray-400 mt-0.5">User earns {daily > 0 ? `${daily.toLocaleString()} NSL × ${days} days = ${totalReturn.toLocaleString()} NSL` : '—'}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 resize-none" />
      </div>
      {!nameEditable && (
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
          <div>
            <p className="text-sm font-medium text-gray-700">Plan Status</p>
            <p className="text-xs text-gray-400">{form.active ? 'Visible and purchasable by users' : 'Hidden from users'}</p>
          </div>
          <button type="button" onClick={() => setForm(f => ({ ...f, active: !f.active }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.active ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.active ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      )}
      {price > 0 && daily > 0 && (
        <div className={`border rounded-xl p-4 space-y-2 text-sm ${isProfitable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Return ({days}d)</span>
            <span className="font-bold text-blue-700 font-mono">{totalReturn.toLocaleString()} NSL</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Investment</span>
            <span className="font-mono text-gray-700">− {price.toLocaleString()} NSL</span>
          </div>
          <div className={`flex justify-between items-center pt-1 border-t ${isProfitable ? 'border-green-200' : 'border-red-200'}`}>
            <span className="font-semibold text-gray-800">Net Profit</span>
            <span className={`font-bold text-base font-mono ${isProfitable ? 'text-green-700' : 'text-red-600'}`}>
              {isProfitable ? '+' : ''}{netProfit.toLocaleString()} NSL
            </span>
          </div>
          {!isProfitable && (
            <p className="text-xs text-red-500 pt-1">Plan duration is shorter than break-even ({Math.ceil(price/daily)} days needed). Increase duration or daily income.</p>
          )}
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={onSave} disabled={saving || !form.name || !form.price_NSL || !form.daily_income_NSL}
          className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors">
          {saving ? 'Saving…' : 'Save VIP Plan'}
        </button>
      </div>
    </div>
  );
}
