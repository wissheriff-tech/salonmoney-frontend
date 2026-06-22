'use client';

import { useEffect } from 'react';

export default function Error({ reset }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '1.5rem',
        padding: '2.5rem 2rem',
        maxWidth: 360,
        width: '100%',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📶</div>
        <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.75rem', margin: '0 0 0.75rem' }}>
          Network Error
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.75rem' }}>
          Please check your network connection and try again. If the issue continues, move to a better signal area and retry.
        </p>
        <button
          onClick={reset}
          style={{
            display: 'block',
            width: '100%',
            padding: '0.85rem',
            borderRadius: '0.875rem',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            marginBottom: '0.75rem',
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => { window.location.href = '/'; }}
          style={{
            display: 'block',
            width: '100%',
            padding: '0.85rem',
            borderRadius: '0.875rem',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Go to Home
        </button>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
        SalonMoney
      </p>
    </div>
  );
}
