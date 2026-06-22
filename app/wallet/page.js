'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const SLL_PER_NSL = parseFloat(process.env.NEXT_PUBLIC_ORANGE_SLL_PER_NSL || 100);
const DEFAULT_NSL_RATE = 23.99;

function statusBadge(s) {
  const map = {
    pending:   'bg-yellow-800 text-yellow-200',
    approved:  'bg-green-800 text-green-200',
    rejected:  'bg-red-800 text-red-200',
    reviewing: 'bg-blue-800 text-blue-200',
  };
  return map[s] || 'bg-gray-700 text-gray-300';
}

// ── Crypto deposit tab ────────────────────────────────────────────────────────
function CryptoTab({ binanceAddress, binanceNetwork, nslRate }) {
  const [form, setForm] = useState({ amount: '', txid: '', notes: '' });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ loading: false, success: '', error: '' });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/deposit/my').then(r => setHistory(r.data.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setStatus({ ...status, error: 'Please attach your receipt image.' });
    setStatus({ loading: true, success: '', error: '' });

    const fd = new FormData();
    fd.append('receipt', file);
    fd.append('amount', form.amount);
    fd.append('txid', form.txid);
    fd.append('notes', form.notes);

    try {
      await api.post('/deposit/submit', fd);
      setStatus({ loading: false, success: 'Deposit submitted! Admin will credit your account shortly.', error: '' });
      setForm({ amount: '', txid: '', notes: '' });
      setFile(null);
      const r = await api.get('/deposit/my');
      setHistory(r.data.data || []);
    } catch (err) {
      setStatus({ loading: false, success: '', error: err.response?.data?.message || 'Submission failed.' });
    }
  };

  const usdtAmount = parseFloat(form.amount) || 0;
  const expectedNsl = usdtAmount * nslRate;

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
        <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">Step 1 — Send USDT</p>
        <p className="text-gray-300 text-sm">Send USDT to the address below, then upload your transaction proof.</p>
        <div className="bg-gray-800 rounded-xl p-4 space-y-2">
          <p className="text-xs text-gray-500">Network</p>
          <p className="text-purple-300 font-semibold">{binanceNetwork || 'TRC20 (USDT)'}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 space-y-2">
          <p className="text-xs text-gray-500">Wallet Address</p>
          <div className="flex items-center gap-2">
            <code className="text-green-400 text-sm break-all flex-1">
              {binanceAddress || 'Contact admin for wallet address'}
            </code>
            {binanceAddress && (
              <button onClick={() => { navigator.clipboard.writeText(binanceAddress); toast.success('Address copied!'); }}
                className="text-xs text-gray-400 hover:text-white shrink-0">Copy</button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
        <p className="text-gray-400 text-sm font-medium uppercase tracking-wide mb-4">Step 2 — Submit Proof</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Amount (USDT)</label>
            <input type="number" min="1" step="0.01" required value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
              placeholder="e.g. 50" />
            {usdtAmount > 0 && (
              <p className="text-xs text-white mt-2">
                Approx. {expectedNsl.toLocaleString(undefined, { maximumFractionDigits: 2 })} NSL at 1 USDT = {nslRate.toFixed(2)} NSL
              </p>
            )}
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Transaction ID / TxHash (optional)</label>
            <input type="text" value={form.txid} onChange={e => setForm({ ...form, txid: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
              placeholder="Paste transaction hash" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Receipt Screenshot</label>
            <input type="file" accept="image/*" required onChange={e => setFile(e.target.files[0])}
              className="w-full text-gray-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Notes (optional)</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 resize-none"
              placeholder="Any additional info for the admin" />
          </div>
          {status.error && <p className="text-red-400 text-sm">{status.error}</p>}
          {status.success && <p className="text-green-400 text-sm">{status.success}</p>}
          <button type="submit" disabled={status.loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors">
            {status.loading ? 'Submitting...' : 'Submit Deposit Proof'}
          </button>
        </form>
      </div>

      {history.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wide mb-4">Deposit History</p>
          <div className="space-y-3">
            {history.map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">${d.user_submitted_amount} USDT</p>
                  <p className="text-gray-500 text-xs">{new Date(d.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusBadge(d.status)}`}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared manual-payment tab (Orange Money & Africell) ──────────────────────
function parseOrangeReceipt(text) {
  // Match Orange Money screenshot reference: "ReferenceCI260606.1351.B51366"
  const refMatch1 = text.match(/Reference\s*([A-Z]{2}\d{6}\.\d{4}\.[A-Z0-9]+)/i);
  // Match Orange Money SMS transaction ID: "transaction id mp2606062049b07097" or just "mp..." pattern
  const refMatch2 = text.match(/transaction\s+id\s+([a-z]{2}\d{10,}[a-z0-9]*)/i);
  // Match standalone transaction ID without label
  const refMatch3 = text.match(/\b([a-z]{2}\d{10,}[a-z0-9]{4,})\b/i);

  const senderMatch = text.match(/(?:Sender|From)\s*[:\-]?\s*(0\d{7,9})/i);
  const recvMatch   = text.match(/(?:Receiver|To)\s*[:\-]?\s*(0\d{7,9})/i);
  // Match receipt amounts: "NSL 5.00", "SLE 5.00", "5.00 Leones", or plain number before Leones
  const amtMatch    = text.match(/(?:amount\s+of\s+|NSL\s*|SLE\s*|Le\s*)([\d,]+(?:\.\d+)?)\s*(?:leones?)?/i)
                   || text.match(/(?:NSL|SLE?)\s*([\d,]+)/i);
  const tsMatch     = text.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);

  const refId = refMatch1 ? 'Reference' + refMatch1[1]
              : refMatch2 ? refMatch2[1]
              : refMatch3 ? refMatch3[1]
              : '';

  return {
    reference_id:      refId,
    sender_number:     senderMatch ? senderMatch[1] : '',
    receiver_number:   recvMatch   ? recvMatch[1]   : '',
    amount_SLE:        amtMatch    ? amtMatch[1].replace(/,/g, '') : '',
    timestamp_receipt: tsMatch     ? tsMatch[1] : '',
  };
}

function MobileMoneyTab({ provider, accentClass, bgClass, borderClass, merchantNumber, nslRate }) {
  const [step, setStep]             = useState(1);
  const [amountNSL, setAmountNSL]   = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview]       = useState(null);
  const [ocr, setOcr]               = useState({ reference_id: '', sender_number: '', receiver_number: '', amount_SLE: '', timestamp_receipt: '' });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();
  const nsl = parseFloat(amountNSL) || 0;
  const sll = Math.round(nsl * SLL_PER_NSL);
  const usdtValue = nsl / nslRate;

  const handleFile = async (file) => {
    if (!file) return;
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
    setOcrLoading(true);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      const fields = parseOrangeReceipt(text);
      setOcr(fields);
      if (fields.reference_id) toast.success('Receipt scanned successfully');
      else toast('Screenshot scanned — please fill in any missing fields', { icon: '⚠️' });
    } catch {
      toast('Could not auto-scan — please fill fields manually', { icon: '⚠️' });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!screenshot) return toast.error('Screenshot is required');
    if (!ocr.reference_id.trim()) return toast.error('Reference ID is required');
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('screenshot', screenshot);
      form.append('amount_NSL', nsl);
      form.append('amount_SLE', sll);
      form.append('reference_id', ocr.reference_id.trim());
      form.append('sender_number', ocr.sender_number.trim());
      form.append('receiver_number', ocr.receiver_number.trim());
      form.append('timestamp_receipt', ocr.timestamp_receipt.trim());
      form.append('provider', provider === 'Africell' ? 'africell' : 'orange_money');
      await api.post('/orange-money/manual-deposit', form);
      toast.success('Deposit submitted! Admin will approve shortly.');
      setStep(1); setAmountNSL(''); setScreenshot(null); setPreview(null);
      setOcr({ reference_id: '', sender_number: '', receiver_number: '', amount_SLE: '', timestamp_receipt: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!merchantNumber) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center space-y-3">
        <div className={`w-12 h-12 rounded-full ${bgClass} flex items-center justify-center text-white font-bold text-xl mx-auto`}>
          {provider[0]}
        </div>
        <p className="text-white font-semibold">{provider}</p>
        <p className="text-gray-400 text-sm">No payment number configured yet.</p>
        <p className="text-gray-500 text-sm">Please contact admin to get the {provider} number.</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border ${borderClass} rounded-2xl p-6 space-y-5`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${bgClass} flex items-center justify-center text-white font-bold text-lg`}>
          {provider[0]}
        </div>
        <div>
          <p className="text-white font-semibold">{provider}</p>
          <p className="text-gray-400 text-xs">Send to our number, upload your receipt</p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Amount you want to deposit (NSL)</label>
            <input type="number" min="10" step="1" value={amountNSL} onChange={e => setAmountNSL(e.target.value)}
              className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:${borderClass}`}
              placeholder="Min 10 NSL" />
          </div>
          {nsl >= 10 && (
            <>
              <div className={`${bgClass} bg-opacity-10 border ${borderClass} rounded-xl p-4 text-sm space-y-1.5`}>
                <div className="flex justify-between text-gray-300"><span>Send (NSL)</span><span className={`font-mono ${accentClass} font-bold`}>{sll.toLocaleString()} NSL</span></div>
                <div className="flex justify-between text-gray-300"><span>You receive (NSL)</span><span className="font-mono text-white font-semibold">{nsl.toLocaleString()} NSL</span></div>
                <div className="flex justify-between text-gray-300"><span>USD value</span><span className="font-mono text-white font-semibold">${usdtValue.toFixed(2)} USDT</span></div>
                <div className="flex justify-between text-gray-300"><span>Rate</span><span className="font-mono text-white font-semibold">1 USDT = {nslRate.toFixed(2)} NSL</span></div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 space-y-2">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Send to this {provider} number</p>
                <div className="flex items-center justify-between">
                  <p className={`${accentClass} text-2xl font-bold font-mono`}>{merchantNumber}</p>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(merchantNumber); toast.success('Number copied!'); }}
                    className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5">Copy</button>
                </div>
              </div>
              <button onClick={() => setStep(2)}
                className={`w-full ${bgClass} hover:opacity-90 text-white py-3 rounded-xl font-semibold transition-colors`}>
                I&apos;ve sent the money →
              </button>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 space-y-1">
            <p>Sent <span className={`${accentClass} font-bold`}>{sll.toLocaleString()} NSL</span> to <span className="font-mono text-white">{merchantNumber}</span>?</p>
            <p className="text-gray-500 text-xs">Take a screenshot of the confirmation and upload it below.</p>
          </div>
          <div onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed border-gray-600 hover:${borderClass} rounded-xl p-8 text-center cursor-pointer transition-colors`}>
            {preview ? (
              <img src={preview} alt="Receipt preview" className="max-h-48 mx-auto rounded-lg object-contain" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Tap to upload {provider} receipt screenshot</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
          {ocrLoading && (
            <div className={`flex items-center gap-2 ${accentClass} text-sm`}>
              <Loader className="w-4 h-4 animate-spin" />
              Scanning receipt…
            </div>
          )}
          {screenshot && !ocrLoading && (
            <button onClick={() => setStep(3)}
              className={`w-full ${bgClass} hover:opacity-90 text-white py-3 rounded-xl font-semibold transition-colors`}>
              Continue →
            </button>
          )}
          <button onClick={() => setStep(1)} className="w-full text-gray-400 text-sm hover:text-white py-2">← Back</button>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-gray-400 text-sm">Confirm the details extracted from your receipt. Correct any mistakes before submitting.</p>
          {[
            { label: 'Reference ID', key: 'reference_id', placeholder: 'e.g. ReferenceCI260606.1351.B51366', required: true },
            { label: 'Sender Number', key: 'sender_number', placeholder: 'e.g. 075085941' },
            { label: 'Receiver Number', key: 'receiver_number', placeholder: 'e.g. 078811767' },
            { label: 'Amount (NSL)', key: 'amount_SLE', placeholder: 'e.g. 2500' },
            { label: 'Timestamp on Receipt', key: 'timestamp_receipt', placeholder: 'e.g. 2026-06-06 13:51' },
          ].map(({ label, key, placeholder, required }) => (
            <div key={key}>
              <label className="text-gray-400 text-xs block mb-1">{label}{required && <span className={`${accentClass}`}> *</span>}</label>
              <input type="text" value={ocr[key]} onChange={e => setOcr(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder} required={required}
                className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:${borderClass} font-mono`} />
            </div>
          ))}
          {preview && <img src={preview} alt="Receipt" className="w-full rounded-xl max-h-40 object-contain bg-gray-800 p-2" />}
          <div className={`${bgClass} bg-opacity-10 border ${borderClass} rounded-xl p-3 text-xs text-gray-200`}>
            Your deposit of <strong>{nsl.toLocaleString()} NSL</strong> will be credited after admin verifies the screenshot.
          </div>
          <button type="submit" disabled={submitting}
            className={`w-full ${bgClass} hover:opacity-90 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors`}>
            {submitting ? 'Submitting…' : 'Submit Deposit Proof'}
          </button>
          <button type="button" onClick={() => setStep(2)} className="w-full text-gray-400 text-sm hover:text-white py-2">← Back</button>
        </form>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
function DepositPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState('crypto');
  const [paymentMethods, setPaymentMethods] = useState(null);
  const [nslRate, setNslRate] = useState(DEFAULT_NSL_RATE);

  useEffect(() => {
    api.get('/deposit/payment-methods')
      .then(r => setPaymentMethods(r.data.data))
      .catch(() => setPaymentMethods({}));
    api.get('/finance/nsl-rate')
      .then(r => setNslRate(parseFloat(r.data.nsl_per_usdt) || DEFAULT_NSL_RATE))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const omStatus = searchParams.get('om_status');
    const orderId  = searchParams.get('order_id');
    if (omStatus === 'success' && orderId) {
      toast.success('Payment received! Your balance will be updated shortly.');
      setTab('orange');
    } else if (omStatus === 'cancelled') {
      toast.error('Orange Money payment was cancelled.');
      setTab('orange');
    }
  }, []);

  return (
    <div className="max-w-xl mx-auto space-y-6 py-6 px-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <h1 className="text-2xl font-bold text-white">Deposit Funds</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-900 border border-gray-700 rounded-xl p-1">
        <button onClick={() => setTab('crypto')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'crypto' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          Binance (USDT)
        </button>
        <button onClick={() => setTab('orange')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'orange' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
          Orange Money
        </button>
        <button onClick={() => setTab('africell')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'africell' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          Africell
        </button>
      </div>

      {tab === 'crypto' && (
        <CryptoTab
          binanceAddress={paymentMethods?.binance_wallet_address}
          binanceNetwork={paymentMethods?.binance_network}
          nslRate={nslRate}
        />
      )}
      {tab === 'orange' && (
        <MobileMoneyTab
          provider="Orange Money"
          accentClass="text-orange-400"
          bgClass="bg-orange-500"
          borderClass="border-orange-500"
          merchantNumber={paymentMethods?.orange_money_number}
          nslRate={nslRate}
        />
      )}
      {tab === 'africell' && (
        <MobileMoneyTab
          provider="Africell"
          accentClass="text-blue-400"
          bgClass="bg-blue-600"
          borderClass="border-blue-500"
          merchantNumber={paymentMethods?.africell_number}
          nslRate={nslRate}
        />
      )}
    </div>
  );
}

export default function DepositPage() {
  return (
    <Suspense fallback={null}>
      <DepositPageInner />
    </Suspense>
  );
}
