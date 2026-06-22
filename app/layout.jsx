import '../styles/globals.css';
import AuthProvider from '@/components/common/AuthProvider';
import AppToaster from '@/components/common/AppToaster';
import PwaInstallPrompt from '@/components/common/PwaInstallPrompt';

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('salonmoney-theme');
    var legacy = localStorage.getItem('darkMode');
    var theme = stored === 'dark' || stored === 'light'
      ? stored
      : legacy === 'true' ? 'dark' : 'light';
    var root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  } catch (error) {}
})();
`;

export const metadata = {
  title: 'SalonMoney - Secure Salon Financial Platform',
  description: 'Invest in salon services, earn daily income, and grow your wealth',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'SalonMoney',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  themeColor: '#6d28d9',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AuthProvider>
          {children}
          <PwaInstallPrompt />
        </AuthProvider>
        <AppToaster />
      </body>
    </html>
  );
}
