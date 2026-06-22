'use client';

import { useEffect, useRef, useState } from 'react';
import { ToastBar, Toaster, toast } from 'react-hot-toast';

function SwipeableToast({ t, children }) {
  const [drag, setDrag] = useState({ active: false, startX: 0, startY: 0, x: 0, y: 0 });
  const dragRef = useRef(drag);

  const dismiss = () => toast.dismiss(t.id);

  const startDrag = (event) => {
    if (event.target?.closest?.('button, a, input, textarea, select')) return;
    const next = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      x: 0,
      y: 0,
    };
    dragRef.current = next;
    setDrag(next);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (event) => {
    if (!dragRef.current.active) return;
    const x = event.clientX - dragRef.current.startX;
    const y = event.clientY - dragRef.current.startY;
    const next = { ...dragRef.current, x, y };
    dragRef.current = next;
    setDrag(next);
  };

  const endDrag = () => {
    const current = dragRef.current;
    if (Math.abs(current.x) > 70 || current.y < -45) {
      dismiss();
      return;
    }
    const reset = { active: false, startX: 0, startY: 0, x: 0, y: 0 };
    dragRef.current = reset;
    setDrag(reset);
  };

  useEffect(() => {
    if (!drag.active) return undefined;

    const handleMouseMove = (event) => moveDrag(event);
    const handleMouseUp = () => endDrag();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drag.active]);

  const startTouchDrag = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    startDrag({ clientX: touch.clientX, clientY: touch.clientY, currentTarget: event.currentTarget, pointerId: undefined });
  };

  const moveTouchDrag = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    moveDrag({ clientX: touch.clientX, clientY: touch.clientY });
  };

  return (
    <div
      data-swipeable-toast
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onMouseDown={startDrag}
      onTouchStart={startTouchDrag}
      onTouchMove={moveTouchDrag}
      onTouchEnd={endDrag}
      style={{
        touchAction: 'pan-y',
        cursor: drag.active ? 'grabbing' : 'grab',
        transform: `translate(${drag.x}px, ${drag.y}px)`,
        opacity: Math.max(0.35, 1 - Math.min(Math.abs(drag.x) / 180, 0.65)),
        transition: drag.active ? 'none' : 'transform 0.18s ease, opacity 0.18s ease',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}

export default function AppToaster() {
  const closeToast = (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    toast.dismiss(id);
  };

  const stopCloseDrag = (event) => {
    event.stopPropagation();
  };

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 10000,
        style: {
          background: '#ffffff',
          color: '#111827',
          border: '1px solid rgba(17,24,39,0.12)',
          boxShadow: '0 24px 80px rgba(15,23,42,0.24)',
          borderRadius: '12px',
          maxWidth: 'min(92vw, 460px)',
          padding: '12px 42px 12px 14px',
          fontSize: '0.9rem',
          lineHeight: 1.45,
        },
        success: {
          iconTheme: { primary: '#16a34a', secondary: '#ffffff' },
        },
        error: {
          iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
        },
      }}
      containerStyle={{
        top: '50%',
        bottom: 'auto',
        transform: 'translateY(-50%)',
        zIndex: 99999,
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <SwipeableToast t={t}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%' }}>
                <span style={{ flexShrink: 0, marginTop: 2 }}>{icon}</span>
                <div style={{ flex: 1, paddingRight: 4 }}>{message}</div>
                <button
                  type="button"
                  onPointerDown={stopCloseDrag}
                  onMouseDown={stopCloseDrag}
                  onTouchStart={stopCloseDrag}
                  onClick={(event) => closeToast(event, t.id)}
                  aria-label="Close notification"
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -34,
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    border: '1px solid rgba(17,24,39,0.12)',
                    background: '#ffffff',
                    color: '#111827',
                    cursor: 'pointer',
                    fontSize: 18,
                    lineHeight: '22px',
                    fontWeight: 700,
                  }}
                >
                  ×
                </button>
              </div>
            </SwipeableToast>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
