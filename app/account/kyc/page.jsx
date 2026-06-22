'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Layout from '@/components/common/Layout';
import { ArrowLeft, ShieldCheck, Upload, X, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/utils/api';
import { compressImage, fmtBytes } from '@/utils/compressImage';

const BG = 'linear-gradient(145deg, oklch(0.18 0.26 295) 0%, oklch(0.10 0.20 270) 45%, oklch(0.14 0.22 245) 100%)';

export default function KYCPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [kycStatus, setKycStatus]   = useState(null);
  const [file, setFile]             = useState(null);
  const [preview, setPreview]       = useState(null);
  const [fileMeta, setFileMeta]     = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const inputRef = useRef();

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/user/kyc/status')
      .then(({ data }) => setKycStatus(data))
      .catch(() => toast.error('Failed to load KYC status'))
      .finally(() => setIsFetching(false));
  }, [user, router]);

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) return toast.error('File must be under 50 MB');
    e.target.value = '';
    // Show original immediately so the document stays readable while compressing
    setPreview(URL.createObjectURL(f));
    setFile(f);
    setFileMeta(null);
    setIsCompressing(true);
    try {
      const result = await compressImage(f);
      setFile(result.file);
      setFileMeta(result);
    } catch {
      toast.error('Could not process file. Try another.');
      setFile(null);
      setPreview(null);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please upload your document');
    setIsLoading(true);
    const fd = new FormData();
    fd.append('id_front', file);
    try {
      const { data } = await api.post('/user/kyc/upload', fd);
      toast.success("Document submitted! Our financial admin will review within 24–48 hours.");
      setKycStatus(data);
      setFile(null);
      setPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Layout>
        <div className="account-readable-surface" style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ animation: 'spin 1s linear infinite' }} width="32" height="32" fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="#a78bfa" strokeWidth="3"/>
            <path style={{ opacity: 0.8 }} fill="#a78bfa" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </Layout>
    );
  }

  const verified = kycStatus?.kyc_verified;
  const hasDocs  = kycStatus?.documents ? Object.values(kycStatus.documents).some(Boolean) : false;

  return (
    <Layout>
      <div className="account-readable-surface" style={{ minHeight: '100vh', background: BG, padding: '2rem 1rem 3rem', position: 'relative' }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'oklch(0.62 0.19 295 / .09)', filter: 'blur(100px)', top: -100, right: -80 }} />
          <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'oklch(0.55 0.18 240 / .07)', filter: 'blur(90px)', bottom: -80, left: -60 }} />
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <button onClick={() => router.push('/account')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
            <ArrowLeft size={15} /> Account
          </button>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Identity Verification</h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>Upload one document to verify your identity</p>

          {/* Status banner */}
          {verified ? (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 14, padding: '1.125rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <ShieldCheck size={24} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontWeight: 700, color: '#10b981', fontSize: '0.875rem' }}>Identity Verified</p>
                <p style={{ fontSize: '0.78rem', color: 'rgba(16,185,129,0.7)', marginTop: '0.2rem' }}>Your document has been reviewed and confirmed.</p>
              </div>
            </div>
          ) : hasDocs ? (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 14, padding: '1.125rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <Clock size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.875rem' }}>Under Review</p>
                <p style={{ fontSize: '0.78rem', color: 'rgba(245,158,11,0.7)', marginTop: '0.2rem' }}>We received your document. Our financial admin will review within 24–48 hours. You can resubmit below to replace it.</p>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: '1.125rem', display: 'flex', gap: '0.875rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <AlertTriangle size={22} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontWeight: 700, color: '#f87171', fontSize: '0.875rem' }}>Verification Required</p>
                <p style={{ fontSize: '0.78rem', color: 'rgba(248,113,113,0.7)', marginTop: '0.2rem' }}>Upload a national ID, passport, or driver&apos;s licence to continue.</p>
              </div>
            </div>
          )}

          {!verified && (
            <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '1.5rem' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                {hasDocs ? 'Resubmit Document' : 'Upload Document'}
              </p>

              {/* Single upload slot */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `2px dashed ${file ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 14,
                  padding: '1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>Identity Document</p>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.15rem' }}>National ID, passport, or driver&apos;s licence</p>
                  </div>
                  {file && (
                    <button type="button" onClick={() => { setFile(null); setPreview(null); setFileMeta(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', lineHeight: 0, padding: '0.2rem' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                {preview ? (
                  <div style={{ position: 'relative' }}>
                    <img src={preview} alt="Document" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)' }} />
                    {isCompressing ? (
                      <div style={{ position: 'absolute', bottom: '0.4rem', right: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(0,0,0,0.75)', borderRadius: 20, padding: '0.2rem 0.5rem' }}>
                        <div style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Optimizing…</span>
                      </div>
                    ) : (
                      <div style={{ position: 'absolute', bottom: '0.4rem', right: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(16,185,129,0.9)', borderRadius: 20, padding: '0.2rem 0.5rem' }}>
                        <CheckCircle size={11} color="#fff" />
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fff' }}>Ready</span>
                      </div>
                    )}
                    {fileMeta && !fileMeta.skipped && (
                      <span style={{ fontSize: '0.65rem', color: '#10b981', display: 'block', marginTop: '0.35rem' }}>
                        {fmtBytes(fileMeta.originalSize)} → {fmtBytes(fileMeta.compressedSize)}
                      </span>
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={() => inputRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '2rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', width: '100%' }}>
                    <Upload size={28} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Click to upload</span>
                  </button>
                )}

                <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleFile} disabled={isCompressing} />
              </div>

              <button
                type="submit"
                disabled={isLoading || isCompressing || !file}
                style={{
                  width: '100%', padding: '0.875rem', borderRadius: 12,
                  background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)',
                  color: '#a78bfa', fontWeight: 800, fontSize: '0.875rem',
                  cursor: isLoading || isCompressing || !file ? 'not-allowed' : 'pointer',
                  opacity: isLoading || isCompressing || !file ? 0.5 : 1,
                }}
              >
                {isLoading ? 'Uploading…' : 'Submit for Review'}
              </button>
            </form>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Layout>
  );
}
