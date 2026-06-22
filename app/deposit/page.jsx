'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/store/auth';
import api from '@/utils/api';
import { compressImage, fmtBytes } from '@/utils/compressImage';
import { extractReceiptData } from '@/utils/extractReceiptData';
import Layout from '@/components/common/Layout';

const DEPOSIT_FEE_PCT = 5;
const PROVIDER_NUMBERS = { orange_money: '076-123456', africell: '030-456789' };
const DEFAULT_NSL_RATE = 23;

const S = {
  bg: 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)',
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: '1.5rem' },
  input: {
    width: '100%', background: '#f9fafb', border: '1px solid #d1d5db',
    borderRadius: 10, padding: '0.8rem 1rem', color: '#111827', fontSize: '0.875rem', outline: 'none',
    boxSizing: 'border-box',
  },
  label: { display: 'block', fontSize: '0.78rem', color: '#374151', marginBottom: '0.4rem', fontWeight: 700 },
};

export default function DepositPage() {
  const { user, isInitializing } = useAuthStore();
  const router = useRouter();
  const [provider, setProvider] = useState('orange_money');
  const [amountSLE, setAmountSLE] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [screenshotMeta, setScreenshotMeta] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [nslRate, setNslRate] = useState(DEFAULT_NSL_RATE);
  const [ocrDebug, setOcrDebug] = useState(null);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) router.push('/login');
  }, [user, isInitializing, router]);

  useEffect(() => {
    api.get('/finance/nsl-rate')
      .then(({ data }) => setNslRate(parseFloat(data.nsl_per_usdt) || DEFAULT_NSL_RATE))
      .catch(() => {});
  }, []);

  const sle = parseFloat(amountSLE) || 0;
  const fee = parseFloat((sle * DEPOSIT_FEE_PCT / 100).toFixed(2));
  const nslToReceive = Math.round(sle - fee);
  const grossUsdt = sle / nslRate;
  const netUsdt = nslToReceive / nslRate;
  const isOrange = provider === 'orange_money';
  const accentColor = isOrange ? '#fb923c' : '#60a5fa';
  const accentBg = isOrange ? 'rgba(249,115,22,0.15)' : 'rgba(59,130,246,0.15)';
  const accentBorder = isOrange ? 'rgba(249,115,22,0.35)' : 'rgba(59,130,246,0.35)';

  const handleScreenshot = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error('Max file size is 50MB'); return; }
    setScreenshotPreview(URL.createObjectURL(file));
    setScreenshot(file);
    setScreenshotMeta(null);
    setOcrDebug(null);
    setIsCompressing(true);
    setIsExtracting(true);

    const [compressResult, extractResult] = await Promise.allSettled([
      compressImage(file),
      extractReceiptData(file),
    ]);

    if (compressResult.status === 'fulfilled') {
      setScreenshot(compressResult.value.file);
      setScreenshotMeta(compressResult.value);
    } else {
      toast.error('Could not process image. Try another file.');
      setScreenshot(null);
      setScreenshotPreview(null);
    }
    setIsCompressing(false);

    if (extractResult.status === 'fulfilled') {
      const { amount, senderNumber: phone, referenceId: ref, _rawText } = extractResult.value;
      setOcrDebug({ raw: _rawText, amount, phone, ref, ok: !!(amount || phone || ref) });
      if (amount) setAmountSLE(amount);
      if (phone) setSenderNumber(phone);
      if (ref) setReferenceId(ref);
      if (amount || phone || ref) {
        setScreenshot(null);
        setScreenshotPreview(null);
        setScreenshotMeta(null);
        toast.success('Receipt processed — please verify the details');
      }
    } else {
      setOcrDebug({ raw: '', amount: '', phone: '', ref: '', ok: false, error: extractResult.reason?.message });
    }
    setIsExtracting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sle || sle <= 0) return toast.error('Please enter the amount from your receipt');
    if (!senderNumber.trim()) return toast.error('Your phone number is required');
    if (!referenceId.trim()) return toast.error('Reference ID from your SMS is required');

    setIsLoading(true);
    try {
      const form = new FormData();
      form.append('amount_SLE', sle);
      form.append('amount_NSL', sle);
      form.append('sender_number', senderNumber.trim());
      form.append('reference_id', referenceId.trim().toUpperCase());
      form.append('provider', provider);
      if (screenshot) form.append('screenshot', screenshot);
      await api.post('/orange-money/manual-deposit', form, {
        headers: { 'Content-Type': undefined },
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 360 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CheckCircle size={32} color="#10b981" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Deposit Submitted</h2>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: '2rem' }}>
              Your request has been submitted. Please await approval from our financial admin — once approved, <strong style={{ color: '#10b981' }}>{nslToReceive.toLocaleString()} NSL</strong> will be credited to your balance within 24 hours.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => router.push('/dashboard')} style={{ padding: '0.8rem 1.5rem', borderRadius: 12, fontWeight: 700, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', cursor: 'pointer', fontSize: '0.875rem' }}>
                Dashboard
              </button>
              <button onClick={() => router.push('/transactions')} style={{ padding: '0.8rem 1.5rem', borderRadius: 12, fontWeight: 700, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.875rem' }}>
                Transactions
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ minHeight: '100vh', background: S.bg, padding: '2rem 1rem 3rem', position: 'relative' }}>
        {/* Aurora blobs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'oklch(0.62 0.19 295 / .09)', filter: 'blur(100px)', top: -100, right: -80 }} />
          <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'oklch(0.55 0.18 240 / .07)', filter: 'blur(90px)', bottom: -80, left: -60 }} />
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            <ArrowLeft size={16} /> Back
          </button>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>Deposit Funds</h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
            Send mobile money — balance credited after financial admin verifies your receipt
          </p>

          {/* Provider tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '0.25rem', marginBottom: '1.25rem' }}>
            {[['orange_money', 'Orange Money'], ['africell', 'Africell']].map(([key, label]) => (
              <button key={key} onClick={() => setProvider(key)} style={{
                flex: 1, padding: '0.65rem', borderRadius: 9, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', border: 'none',
                background: provider === key ? (key === 'orange_money' ? 'rgba(249,115,22,0.25)' : 'rgba(59,130,246,0.25)') : 'transparent',
                color: provider === key ? (key === 'orange_money' ? '#fb923c' : '#60a5fa') : 'rgba(255,255,255,0.4)',
                transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>

          {/* Recipient number + QR */}
          <div style={{ background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: 14, padding: '1.25rem', marginBottom: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>
              Send to this {isOrange ? 'Orange Money' : 'Africell'} number
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 900, color: accentColor, letterSpacing: '0.04em', fontFamily: 'monospace', margin: '0 0 1rem' }}>
              {PROVIDER_NUMBERS[provider]}
            </p>
            <div style={{ display: 'inline-block', background: '#fff', padding: 14, borderRadius: 12 }}>
              <QRCodeSVG
                value={PROVIDER_NUMBERS[provider]}
                size={220}
                bgColor="#ffffff"
                fgColor="#111111"
                level="M"
              />
            </div>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.75rem' }}>
              Scan to dial or save the number — then send your NSL here
            </p>
          </div>

          <div style={S.card}>
            <form onSubmit={handleSubmit}>
              {/* Amount in NSL */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={S.label}>Amount Sent (SLE) — enter the exact figure from your receipt</label>
                <input
                  type="number" min="1" step="1" value={amountSLE}
                  onChange={e => setAmountSLE(e.target.value)}
                  placeholder="e.g. 2500"
                  style={S.input} required
                />
              </div>

              {/* Fee preview */}
              {sle > 0 && (
                <div style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, padding: '0.875rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 600 }}>You sent</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>{sle.toLocaleString()} SLE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 600 }}>Deposit fee ({DEPOSIT_FEE_PCT}%)</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626', fontFamily: 'monospace' }}>−{fee.toLocaleString()} SLE</span>
                  </div>
                  <div style={{ height: 1, background: '#d1d5db', margin: '0.15rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 600 }}>You will receive</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>{nslToReceive.toLocaleString()} NSL</span>
                  </div>
                </div>
              )}

              {/* Sender number */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={S.label}>Your {isOrange ? 'Orange Money' : 'Africell'} Number</label>
                <input
                  type="tel" value={senderNumber}
                  onChange={e => setSenderNumber(e.target.value)}
                  placeholder="+232 XX XXX XXXX"
                  style={S.input} required
                />
              </div>

              {/* Reference ID */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={S.label}>Reference ID (from SMS confirmation)</label>
                <input
                  type="text" value={referenceId}
                  onChange={e => setReferenceId(e.target.value.toUpperCase())}
                  placeholder="e.g. MP241231ABCD"
                  style={{ ...S.input, fontFamily: 'monospace' }}
                  required
                />
                <p style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.35rem' }}>
                  Transaction reference from your {isOrange ? 'Orange Money' : 'Africell'} SMS confirmation
                </p>
              </div>

              {/* Screenshot upload */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={S.label}>Receipt Screenshot</label>
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '0.5rem', padding: '1.25rem', borderRadius: 10, cursor: 'pointer',
                  background: screenshot ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `2px dashed ${screenshot ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)'}`,
                  transition: 'all 0.15s',
                }}>
                  <input type="file" onChange={handleScreenshot} style={{ display: 'none' }} disabled={isCompressing} />
                  {screenshotPreview ? (
                    <>
                      <div style={{ position: 'relative' }}>
                        <img src={screenshotPreview} alt="Receipt preview" style={{ maxHeight: 160, borderRadius: 8, objectFit: 'contain' }} />
                        {(isCompressing || isExtracting) && (
                          <div style={{ position: 'absolute', bottom: 4, right: 4, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.75)', borderRadius: 20, padding: '0.2rem 0.5rem' }}>
                            <div style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                            <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                              {isExtracting ? 'Processing…' : 'Optimizing…'}
                            </span>
                          </div>
                        )}
                      </div>
                      {screenshotMeta && !screenshotMeta.skipped && (
                        <span style={{ fontSize: '0.68rem', color: '#10b981' }}>
                          {fmtBytes(screenshotMeta.originalSize)} → {fmtBytes(screenshotMeta.compressedSize)}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Upload size={24} color="rgba(255,255,255,0.35)" />
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>Tap to upload receipt</span>
                    </>
                  )}
                </label>
                {screenshot && (
                  <button type="button" onClick={() => { setScreenshot(null); setScreenshotPreview(null); setScreenshotMeta(null); }}
                    style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Remove &amp; re-upload
                  </button>
                )}
              </div>

              {/* Receipt processing indicator */}
              {ocrDebug && (
                <div style={{ marginBottom: '1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>Processing</span>
                </div>
              )}

              {/* Warning */}
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '0.75rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                  Enter the exact amount from your receipt. Any amount is accepted — mismatches will delay or reject the deposit.
                </p>
              </div>

              <button type="submit"
                disabled={isLoading || isCompressing || isExtracting || sle <= 0 || !senderNumber.trim() || !referenceId.trim()}
                style={{
                  width: '100%', padding: '0.875rem', borderRadius: 12, fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer',
                  background: accentBg, border: `1px solid ${accentBorder}`, color: accentColor,
                  opacity: isLoading || isCompressing || isExtracting || sle <= 0 || !senderNumber.trim() || !referenceId.trim() ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}>
                {isLoading ? 'Submitting…' : isExtracting ? 'Processing…' : `Submit ${isOrange ? 'Orange Money' : 'Africell'} Deposit`}
              </button>
            </form>
          </div>

          {/* How it works */}
          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>How it works</p>
            {[
              `Send any amount to ${PROVIDER_NUMBERS[provider]} (${isOrange ? 'Orange Money' : 'Africell'})`,
              'Note the reference ID from the SMS confirmation you receive',
              'Enter the exact amount and your phone number — scan your receipt for instant auto-fill',
              'Submit — your NSL balance is credited automatically upon approval',
              'You will be notified once the financial admin confirms your payment',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.7rem', color: accentColor, fontWeight: 700, minWidth: 14 }}>{i + 1}.</span>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
