'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { User, Settings, Lock, KeyRound, LogOut, X, Crown } from 'lucide-react';

function ProfileAvatar({ user, size = 'lg' }) {
  const initial = user?.username?.charAt(0).toUpperCase() || 'U';
  const sizeClass = size === 'lg' ? 'w-20 h-20 text-3xl' : 'w-14 h-14 text-xl';

  return (
    <div className={`${sizeClass} bg-white/30 rounded-full flex items-center justify-center border-4 border-white/60`}>
      <span className="text-white font-bold drop-shadow">{initial}</span>
    </div>
  );
}

export default function ProfileSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    { icon: User,     label: 'Account',         href: '/account',                 description: 'Manage your profile' },
    { icon: Settings, label: 'Settings',         href: '/account/settings',        description: 'Preferences & notifications' },
    { icon: Lock,     label: 'Change Password',  href: '/account/change-password', description: 'Update your password' },
    { icon: KeyRound, label: 'Security',          href: '/account/security',        description: '2FA & security options' },
  ];

  const handleNavigation = (href) => { router.push(href); onClose(); };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar — full-width on small phones, fixed 320px on larger */}
      <div
        className={`fixed top-0 left-0 h-full w-full max-w-xs bg-white shadow-2xl z-50 transform transition-all duration-500 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative flex-shrink-0 px-6 pb-6"
             style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 3.5rem)' }}>
          {/* Close button — anchored just below safe-area top */}
          <button
            onClick={onClose}
            className="absolute right-4 w-9 h-9 bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-all"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Avatar + info */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <ProfileAvatar user={user} />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-400 border-2 border-white rounded-full" />
            </div>

            <h3 className="text-white font-bold text-lg">{user?.username || 'User'}</h3>
            <p className="text-white/80 text-sm">{user?.phone}</p>

            {user?.vip_level && user.vip_level !== 'none' && (
              <div className="mt-2 px-4 py-1 bg-yellow-400 rounded-full flex items-center space-x-1">
                <Crown className="w-4 h-4 text-gray-900" />
                <span className="text-xs font-bold text-gray-900">{user.vip_level}</span>
              </div>
            )}

            <button
              onClick={() => { router.push('/deposit'); onClose(); }}
              className="mt-4 w-full bg-white/20 backdrop-blur-sm rounded-xl p-3 hover:bg-white/30 transition-all group"
            >
              <p className="text-white/80 text-xs text-center">Total Balance</p>
              <p className="text-white font-bold text-xl text-center">
                {user?.balance_NSL?.toLocaleString() || 0} NSL
              </p>
              <p className="text-white/60 text-xs text-center mt-0.5 group-hover:text-white/90 transition-opacity">
                Tap to recharge
              </p>
            </button>
          </div>
        </div>

        {/* Menu items */}
        <div className="profile-menu-readable flex-1 overflow-y-auto p-4 space-y-1 bg-white dark:bg-gray-900">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-800 transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-700 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-blue-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-purple-400 transition-colors">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div className="shrink-0 p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900"
             style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
