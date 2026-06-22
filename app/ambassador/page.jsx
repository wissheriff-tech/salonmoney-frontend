'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Copy, MapPin, Users, TrendingUp, UserCheck, Clock } from 'lucide-react';
import Layout from '@/components/common/Layout';
import api from '@/utils/api';
import { APP_ROUTES } from '@/utils/navigation';
import { useAuthStore } from '@/store/auth';

const statCards = [
  ['total_users', 'Invited Users', Users],
  ['active_users', 'Active Users', UserCheck],
  ['pending_users', 'Pending Users', Clock],
  ['total_purchase_NSL', 'Purchase Volume', TrendingUp],
];

const fmt = (value) => parseFloat(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function AmbassadorPage() {
  const { user, isInitializing } = useAuthStore();
  const router = useRouter();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      router.push(APP_ROUTES.login);
      return;
    }
    if (user.role !== 'ambassador' && user.role !== 'superadmin') {
      router.push(APP_ROUTES.dashboard);
      return;
    }

    api.get('/ambassador/overview')
      .then(({ data }) => setOverview(data))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load ambassador workspace'))
      .finally(() => setLoading(false));
  }, [user, isInitializing, router]);

  const inviteCode = overview?.ambassador?.referral_code || user?.referral_code || '';

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success('Invitation code copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  if (loading || isInitializing) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-white px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-6 text-white">
            <p className="text-sm font-bold uppercase tracking-wide text-white/90">Ambassador Workspace</p>
            <h1 className="text-2xl font-black mt-1">{overview?.ambassador?.username || user?.username}</h1>
            <div className="flex flex-wrap gap-3 mt-4 text-sm font-semibold">
              <span className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1">
                <MapPin className="w-4 h-4" />
                {overview?.ambassador?.ambassador_region || 'Region not set'}
              </span>
              <span className="bg-white/15 rounded-full px-3 py-1">
                {overview?.ambassador?.ambassador_sector || 'Sector not set'}
              </span>
            </div>
          </header>

          <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-black">Invitation Code</h2>
                <p className="text-sm text-black">Members in your sector should sign up with this code.</p>
              </div>
              <button onClick={copyInvite} className="inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-semibold">
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-xl font-black text-black">
              {inviteCode || 'No code'}
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(([key, label, Icon]) => (
              <div key={key} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <Icon className="w-5 h-5 text-emerald-600 mb-3" />
                <p className="text-sm font-semibold text-black">{label}</p>
                <p className="text-2xl font-black text-black mt-1">
                  {key === 'total_purchase_NSL' ? `${fmt(overview?.stats?.[key])} NSL` : fmt(overview?.stats?.[key])}
                </p>
              </div>
            ))}
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-black">Invited Members</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Username', 'Phone', 'Status', 'VIP', 'Balance', 'Joined'].map(header => (
                      <th key={header} className="px-4 py-3 text-left font-bold text-black">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(overview?.users || []).map(member => (
                    <tr key={member.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-semibold text-black">{member.username}</td>
                      <td className="px-4 py-3 text-black">{member.phone}</td>
                      <td className="px-4 py-3 text-black">{member.status}</td>
                      <td className="px-4 py-3 text-black">{member.vip_level}</td>
                      <td className="px-4 py-3 font-mono text-black">{fmt(member.balance_NSL)} NSL</td>
                      <td className="px-4 py-3 text-black">{new Date(member.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {(!overview?.users || overview.users.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-black">No invited members yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
