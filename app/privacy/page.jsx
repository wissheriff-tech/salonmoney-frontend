'use client';

import { Shield, Lock, Eye, Database, UserCheck, FileText, Bell, Globe } from 'lucide-react';

const BG = 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)';

function Section({ icon, title, children }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
        {icon}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

const BODY = { fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 };
const CARD = { background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '1.125rem' };

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh', background: BG, position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'oklch(0.62 0.19 295 / .08)', filter: 'blur(120px)', top: -150, right: -100 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'oklch(0.55 0.18 240 / .07)', filter: 'blur(100px)', bottom: -80, left: -80 }} />
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 1rem', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Lock size={32} color="#a78bfa" />
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Privacy Policy</h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)' }}>Last Updated: November 2025</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '2rem' }}>
          {/* Intro */}
          <div style={{ borderLeft: '3px solid #a78bfa', paddingLeft: '1.25rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>Our Commitment to Your Privacy</h2>
            <p style={BODY}>At SalonMoney, we take your privacy seriously. This Privacy Policy explains how we collect, use, protect, and share your personal information when you use our investment platform.</p>
          </div>

          <Section icon={<Database size={20} color="#60a5fa" />} title="Information We Collect">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                ['Personal Information',  UserCheck, '#10b981', ['Full name and username', 'Email address', 'Phone number', 'Password (encrypted)', 'Profile information and preferences']],
                ['Financial Information', FileText,  '#a78bfa', ['Account balance and transaction history', 'Investment details and package selections', 'Withdrawal and recharge records', 'Referral earnings and commission data']],
                ['Technical Information', Globe,     '#60a5fa', ['IP address and device information', 'Browser type and version', 'Login timestamps and activity logs', 'Cookies and similar tracking technologies']],
              ].map(([title, Icon, color, items]) => (
                <div key={title} style={CARD}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                    <Icon size={16} color={color} />
                    <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.875rem' }}>{title}</p>
                  </div>
                  {items.map(item => <p key={item} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', paddingLeft: '1.5rem', marginBottom: '0.25rem' }}>• {item}</p>)}
                </div>
              ))}
            </div>
          </Section>

          <Section icon={<Eye size={20} color="#f472b6" />} title="How We Use Your Information">
            <div style={CARD}>
              <p style={{ ...BODY, marginBottom: '0.875rem' }}>We use the information we collect for the following purposes:</p>
              {[['Account Management', 'Create and manage your account, verify identity, and provide customer support.', '#10b981'], ['Transaction Processing', 'Process your investments, withdrawals, and recharges securely.', '#60a5fa'], ['Platform Improvement', 'Analyze usage patterns and improve services and user experience.', '#a78bfa'], ['Security', 'Detect and prevent fraud, unauthorized access, and security threats.', '#f87171'], ['Communication', 'Send important updates, notifications, and promotional materials.', '#f59e0b'], ['Compliance', 'Comply with legal obligations and regulatory requirements.', '#10b981']].map(([bold, text, color]) => (
                <div key={bold} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Shield size={14} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}><strong style={{ color: '#fff' }}>{bold}:</strong> {text}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={<Lock size={20} color="#10b981" />} title="How We Protect Your Data">
            <p style={{ ...BODY, marginBottom: '0.875rem' }}>We implement robust security measures to protect your personal and financial information:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.75rem' }}>
              {[['SSL/TLS Encryption', 'All data transmitted is encrypted using industry-standard SSL/TLS protocols.', '#60a5fa', Shield], ['Password Encryption', 'Passwords are hashed using advanced cryptographic algorithms — unreadable even to staff.', '#a78bfa', Lock], ['Two-Factor Auth', 'Optional 2FA adds an extra layer of security beyond your password.', '#10b981', UserCheck], ['Secure Databases', 'Data stored in encrypted databases with regular backups and strict access controls.', '#f472b6', Database]].map(([title, desc, color, Icon]) => (
                <div key={title} style={{ background: `${color}11`, border: `1px solid ${color}33`, borderRadius: 12, padding: '1rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.625rem' }}>
                    <Icon size={18} color={color} />
                  </div>
                  <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.875rem', marginBottom: '0.3rem' }}>{title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={<Globe size={20} color="#60a5fa" />} title="Information Sharing">
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderLeft: '3px solid #f59e0b', borderRadius: 12, padding: '1.125rem' }}>
              <p style={{ ...BODY, marginBottom: '0.875rem' }}>We do <strong style={{ color: '#f59e0b' }}>NOT</strong> sell, rent, or trade your personal information. We may share it only in these limited circumstances:</p>
              {[['Service Providers', 'Trusted third parties that help operate our platform (payment processors, hosting)'], ['Legal Compliance', 'When required by law, court order, or government request'], ['Security Purposes', 'To protect against fraud, security threats, or illegal activities'], ['Business Transfers', 'In the event of a merger, acquisition, or sale of assets']].map(([bold, text]) => (
                <p key={bold} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', paddingLeft: '1rem', marginBottom: '0.35rem', lineHeight: 1.5 }}>• <strong style={{ color: '#fff' }}>{bold}:</strong> {text}</p>
              ))}
            </div>
          </Section>

          <Section icon={<FileText size={20} color="#a78bfa" />} title="Cookies and Tracking">
            <p style={{ ...BODY, marginBottom: '0.875rem' }}>We use cookies to enhance your experience. They help us:</p>
            {['Remember your login preferences and settings', 'Analyze how you use the platform to improve services', 'Provide personalized content and recommendations', 'Detect and prevent fraudulent activity'].map(item => (
              <p key={item} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', paddingLeft: '1rem', marginBottom: '0.3rem', lineHeight: 1.5 }}>• {item}</p>
            ))}
            <p style={{ ...BODY, marginTop: '0.75rem' }}>You can control cookies through your browser settings, though disabling them may affect some platform features.</p>
          </Section>

          <Section icon={<UserCheck size={20} color="#10b981" />} title="Your Privacy Rights">
            <div style={CARD}>
              <p style={{ ...BODY, marginBottom: '0.875rem' }}>You have the following rights regarding your personal information:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                {[['Access', 'Request a copy of your personal data', '#60a5fa', Eye], ['Correction', 'Update or correct inaccurate information', '#a78bfa', FileText], ['Deletion', 'Request deletion of your account and data', '#f472b6', Lock], ['Opt-Out', 'Unsubscribe from marketing communications', '#10b981', Bell]].map(([title, desc, color, Icon]) => (
                  <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={color} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.82rem', marginBottom: '0.15rem' }}>{title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {[
            ['Data Retention',    <Database key="data-retention-icon" size={20} color="#f59e0b" />, 'We retain your personal information for as long as necessary to provide our services. When you close your account, data is deleted or anonymized within 90 days, except where required for legal or security purposes.'],
            ["Children's Privacy", null, 'Our platform is not intended for individuals under 18. We do not knowingly collect information from children. If we become aware of such data, we delete it immediately.'],
            ['Changes to This Policy', <Bell key="policy-changes-icon" size={20} color="#60a5fa" />, 'We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy and updating the "Last Updated" date. We encourage you to review periodically.'],
          ].map(([title, icon, text]) => (
            <Section key={title} icon={icon} title={title}>
              <p style={BODY}>{text}</p>
            </Section>
          ))}

          {/* Contact */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.875rem' }}>Contact Us About Privacy</h2>
            <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 14, padding: '1.25rem' }}>
              <p style={{ ...BODY, marginBottom: '0.875rem' }}>Questions, concerns, or requests about this policy or how we handle your data:</p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.3rem' }}>
                Email: <a href="mailto:privacy@salonmoney.com" style={{ color: '#a78bfa', textDecoration: 'none' }}>privacy@salonmoney.com</a>
              </p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.3rem' }}>Phone: +232 (0)34115306</p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)' }}>
                Live Chat: <a href="/help" style={{ color: '#a78bfa', textDecoration: 'none' }}>Help Center</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
