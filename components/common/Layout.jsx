'use client';

import { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ProfileSidebar from '../profile/ProfileSidebar';
export default function Layout({ children }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const closeProfile = () => {
    setIsProfileOpen(false);
  };

  return (
    <div className="app-shell min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Navbar */}
      <Navbar onProfileClick={toggleProfile} isProfileOpen={isProfileOpen} />

      {/* Profile Sidebar */}
      <ProfileSidebar isOpen={isProfileOpen} onClose={closeProfile} />

      {/* Main Content — extra bottom padding on mobile for the fixed bottom nav */}
      <main className="app-main flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Footer — hidden on mobile (bottom nav serves that purpose) */}
      <div className="hidden md:block">
        <Footer />
      </div>

    </div>
  );
}
