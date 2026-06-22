'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, CheckCheck, Trash2 } from 'lucide-react';
import api from '@/utils/api';
import { API_ROUTES } from '@/utils/navigation';

const TYPE_META = {
  transaction_approved: { emoji: '✅', bg: 'bg-green-100'  },
  transaction_rejected: { emoji: '❌', bg: 'bg-red-100'    },
  product_purchased:    { emoji: '🛒', bg: 'bg-purple-100' },
  product_expiring:     { emoji: '⏰', bg: 'bg-yellow-100' },
  product_expired:      { emoji: '⚠️', bg: 'bg-orange-100' },
  daily_income:         { emoji: '💰', bg: 'bg-green-100'  },
  referral_bonus:       { emoji: '🎁', bg: 'bg-purple-100' },
  account_approved:     { emoji: '🎉', bg: 'bg-green-100'  },
  account_suspended:    { emoji: '🚫', bg: 'bg-red-100'    },
  account_updated:      { emoji: '👤', bg: 'bg-blue-100'   },
  balance_adjusted:     { emoji: '💳', bg: 'bg-green-100'  },
  phone_changed:        { emoji: '📱', bg: 'bg-blue-100'   },
  password_changed:     { emoji: '🔐', bg: 'bg-red-100'    },
  password_reset:       { emoji: '🔑', bg: 'bg-red-100'    },
  kyc_verified:         { emoji: '🛡️', bg: 'bg-teal-100'   },
  kyc_rejected:         { emoji: '❌', bg: 'bg-red-100'    },
  withdrawal_approved:  { emoji: '✅', bg: 'bg-green-100'  },
  withdrawal_rejected:  { emoji: '❌', bg: 'bg-red-100'    },
  recharge_approved:    { emoji: '✅', bg: 'bg-green-100'  },
  recharge_rejected:    { emoji: '❌', bg: 'bg-red-100'    },
  vip_upgrade:          { emoji: '⭐', bg: 'bg-yellow-100' },
  system_announcement:  { emoji: '📢', bg: 'bg-blue-100'   },
  security_alert:       { emoji: '🔒', bg: 'bg-red-100'    },
  admin_message:        { emoji: '📢', bg: 'bg-blue-100'   },
  system:               { emoji: '⚙️', bg: 'bg-gray-100'   },
};

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high:   'bg-orange-400',
  medium: 'bg-blue-400',
  low:    'bg-gray-400',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await api.get(API_ROUTES.notifications.unreadCount);
      setUnread(data.unread_count || 0);
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(API_ROUTES.notifications.list, { params: { limit: 30 } });
      setNotifications(data.notifications || []);
      if (typeof data.unread_count === 'number') setUnread(data.unread_count);
    } catch {}
    finally { setLoading(false); }
  }, []);

  // Poll unread count every 60s
  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 60000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Load notifications when panel opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markRead = async (id) => {
    try {
      await api.patch(API_ROUTES.notifications.read(id));
      setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch(API_ROUTES.notifications.markAllRead);
      setNotifications(ns => ns.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  };

  const deleteOne = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(API_ROUTES.notifications.item(id));
      setNotifications(ns => ns.filter(n => n.id !== id));
      const was = notifications.find(n => n.id === id);
      if (was && !was.read) setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const clearRead = async () => {
    try {
      await api.delete(API_ROUTES.notifications.clearRead);
      setNotifications(ns => ns.filter(n => !n.read));
    } catch {}
  };

  const handleClick = (n) => {
    if (!n.read) markRead(n.id);
    if (n.action_url) {
      setOpen(false);
      router.push(n.action_url);
    }
  };

  const readCount = notifications.filter(n => n.read).length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-white" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
              {unread > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {unread} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAllRead} title="Mark all read"
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {readCount > 0 && (
                <button onClick={clearRead} title="Clear read"
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const meta = TYPE_META[n.type] || TYPE_META.system;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!n.read ? 'bg-blue-50/40' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-full ${meta.bg} flex items-center justify-center shrink-0 text-base`}>
                      {meta.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-sm leading-snug ${n.read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                          {n.title}
                        </p>
                        <button
                          onClick={e => deleteOne(e, n.id)}
                          className="p-0.5 text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
                        {n.priority && n.priority !== 'medium' && (
                          <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[n.priority] || 'bg-gray-400'}`} />
                        )}
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">{notifications.length} notifications loaded</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
