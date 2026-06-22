/**
 * Frontend Application Configuration
 * Main configuration file for the frontend application
 */

const DEFAULT_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://salonmoneynewbackend.vercel.app/api'
  : 'http://localhost:5000/api';

export const config = {
  // Application Info
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'SalonMoney',
    company: process.env.NEXT_PUBLIC_COMPANY_NAME || 'SalonMoney Inc.',
    version: '1.0.0',
    description: 'Secure Salon Financial Platform',
    tagline: 'Your Financial Growth Partner'
  },

  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // Authentication
  auth: {
    tokenKey: 'salonmoney_token',
    userKey: 'salonmoney_user',
    rememberMeKey: 'salonmoney_remember_me',
    tokenExpireTime: 24 * 60 * 60 * 1000,
    refreshTokenExpireTime: 7 * 24 * 60 * 60 * 1000,
  },

  // Feature Flags
  features: {
    enableTwoFactor: true,
    enableEmailVerification: true,
    enableReferralProgram: true,
    enableAutoRenewal: true,
    enableCryptoPayments: true,
    enableNotifications: true,
    enableAnalytics: true
  },

  // UI Configuration
  ui: {
    theme: {
      primaryColor: '#8b5cf6',
      secondaryColor: '#d946ef',
      accentColor: '#f97316',
      successColor: '#22c55e',
      warningColor: '#eab308',
      errorColor: '#ef4444',
      infoColor: '#3b82f6'
    },
    toast: {
      duration: 3000,
      position: 'top-right',
      successDuration: 2000,
      errorDuration: 4000
    },
    pagination: {
      defaultPage: 1,
      defaultLimit: 20,
      pageSizeOptions: [10, 20, 50, 100]
    },
    animation: {
      enabled: true,
      duration: 300
    }
  },

  // Business Rules
  business: {
    currency: {
      nslToUsdtRate: 23.99,
      usdtToNslRate: 23.99,
      nslDecimals: 2,
      usdtDecimals: 2
    },
    referral: {
      bonusPercentage: 35,
      maxReferralLevel: 1,
      minRechargeForBonus: 0
    },
    product: {
      defaultValidityDays: 60,
      autoRenewalEnabled: true
    },
    transaction: {
      minRecharge: 10,
      minWithdrawal: 10,
      maxWithdrawal: 100000,
      pendingExpiryDays: 7
    }
  },

  // File Upload
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    allowedDocumentTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  },

  // Social Media
  social: {
    facebook: 'https://facebook.com/salonmoney',
    twitter: 'https://twitter.com/salonmoney',
    instagram: 'https://instagram.com/salonmoney',
    linkedin: 'https://linkedin.com/company/salonmoney'
  },

  // Support
  support: {
    email: 'support@salonmoney.com',
    phone: '+232 77 777 7777',
    whatsapp: '+232777777777',
    telegramGroup: 'https://t.me/salonmoney',
    workingHours: '9 AM - 6 PM (GMT)'
  },

  // Legal
  legal: {
    termsUrl: '/terms',
    privacyUrl: '/privacy',
    cookiePolicyUrl: '/cookie-policy'
  },

  // Environment
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test'
  }
};

export default config;
