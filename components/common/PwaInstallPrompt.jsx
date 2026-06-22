'use client';

import { useEffect, useRef, useState } from 'react';
import {
  APP_VERSION,
  activatePwaUpdate,
  checkForPwaUpdate,
  completePwaUpdateReload,
  PROGRESS_EVENT,
  registerPwaWorker,
} from '@/utils/pwaUpdate';

const DEFAULT_UPDATE_STAGE = 'Checking for the latest version';

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}

function syncInstalledModeClass() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('pwa-standalone', isStandalone());
}

function hasPendingUpdate(registration) {
  return Boolean(registration?.waiting || registration?.installing);
}

function normalizeUpdateDetail(detail) {
  const progress = typeof detail === 'number' ? detail : detail?.progress;
  return {
    progress: Math.max(1, Math.min(100, Math.round(Number(progress) || 1))),
    stage: detail?.stage || DEFAULT_UPDATE_STAGE,
  };
}

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [updateVisible, setUpdateVisible] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(1);
  const [updateStage, setUpdateStage] = useState(DEFAULT_UPDATE_STAGE);
  const [iosHelp, setIosHelp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const updateRunningRef = useRef(false);
  const reloadScheduledRef = useRef(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    syncInstalledModeClass();

    const syncMode = () => syncInstalledModeClass();
    const media = window.matchMedia('(display-mode: standalone)');
    media.addEventListener?.('change', syncMode);
    window.addEventListener('appinstalled', syncMode);

    return () => {
      media.removeEventListener?.('change', syncMode);
      window.removeEventListener('appinstalled', syncMode);
    };
  }, []);

  useEffect(() => {
    if (!isMobile || isStandalone()) return undefined;

    setVisible(true);

    if (/iPhone|iPad|iPod/i.test(navigator.userAgent || '')) {
      setIosHelp(true);
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isMobile]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    const hadController = Boolean(navigator.serviceWorker.controller);

    const applyProgress = (detail) => {
      const next = normalizeUpdateDetail(detail);
      setUpdateVisible(true);
      setUpdateProgress(next.progress);
      setUpdateStage(next.stage);
    };

    const beginUpdate = (registration) => {
      if (!hadController || !hasPendingUpdate(registration)) return;
      if (updateRunningRef.current || reloadScheduledRef.current) return;

      updateRunningRef.current = true;
      applyProgress({ progress: 1, stage: DEFAULT_UPDATE_STAGE });

      activatePwaUpdate(registration, { onProgress: applyProgress })
        .then((willReload) => {
          if (willReload) {
            reloadScheduledRef.current = true;
            return;
          }
          updateRunningRef.current = false;
          setUpdateVisible(false);
        })
        .catch(() => {
          updateRunningRef.current = false;
          reloadScheduledRef.current = false;
          setUpdateVisible(false);
        });
    };

    const finishReloadFromControllerChange = () => {
      if (!hadController || updateRunningRef.current || reloadScheduledRef.current) return;

      updateRunningRef.current = true;
      reloadScheduledRef.current = true;
      applyProgress({ progress: 1, stage: 'Activating update' });

      completePwaUpdateReload({ onProgress: applyProgress })
        .catch(() => window.location.reload());
    };

    const handleControllerChange = () => {
      finishReloadFromControllerChange();
    };

    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === 'APP_UPDATE_AVAILABLE' || event.data?.type === 'APP_UPDATE_READY') {
        if (!hadController) return;
        applyProgress({ progress: 4, stage: 'Activating update' });
        navigator.serviceWorker.getRegistration()
          .then((registration) => {
            if (hasPendingUpdate(registration)) beginUpdate(registration);
            else finishReloadFromControllerChange();
          })
          .catch(() => finishReloadFromControllerChange());
      }
    };
    const handleProgress = (event) => {
      applyProgress(event.detail);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    window.addEventListener(PROGRESS_EVENT, handleProgress);

    registerPwaWorker()
      .then((registration) => {
        if (!registration) return;
        if (hasPendingUpdate(registration)) {
          beginUpdate(registration);
        }

        registration.addEventListener('updatefound', () => {
          beginUpdate(registration);
        });

        registration.update()
          .then(() => {
            if (hasPendingUpdate(registration)) beginUpdate(registration);
          })
          .catch(() => {});
      })
      .catch(() => {});

    const checkForUpdates = () => {
      if (updateRunningRef.current || reloadScheduledRef.current) return;
      checkForPwaUpdate()
        .then((registration) => {
          if (hasPendingUpdate(registration)) beginUpdate(registration);
        })
        .catch(() => {});
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) checkForUpdates();
    };
    const updateInterval = window.setInterval(checkForUpdates, 30000);

    window.addEventListener('focus', checkForUpdates);
    window.addEventListener('online', checkForUpdates);
    window.addEventListener('pageshow', checkForUpdates);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      window.removeEventListener(PROGRESS_EVENT, handleProgress);
      window.clearInterval(updateInterval);
      window.removeEventListener('focus', checkForUpdates);
      window.removeEventListener('online', checkForUpdates);
      window.removeEventListener('pageshow', checkForUpdates);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) {
      setIosHelp(true);
      return;
    }
    installEvent.prompt();
    await installEvent.userChoice.catch(() => null);
    setInstallEvent(null);
    syncInstalledModeClass();
    dismiss();
  };

  if (updateVisible) {
    return (
      <div className="pwa-update-shell" role="status" aria-live="assertive">
        <div className="pwa-update-card">
          <p className="pwa-install-title">Updating SalonMoney</p>
          <p className="pwa-install-copy">{updateStage}. {updateProgress}%</p>
          <div
            className="pwa-update-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={updateProgress}
          >
            <div style={{ width: `${updateProgress}%` }} />
          </div>
          <p className="pwa-update-meta">Version {APP_VERSION}</p>
        </div>
      </div>
    );
  }

  if (!visible || !isMobile) return null;

  return (
    <div className="pwa-install-shell" role="dialog" aria-live="polite" aria-label="Install SalonMoney app">
      <div className="pwa-install-card">
        <button type="button" className="pwa-install-close" onClick={dismiss} aria-label="Close install prompt">×</button>
        <div>
          <p className="pwa-install-title">Install SalonMoney</p>
          <p className="pwa-install-copy">
            Add the web app for faster mobile access.
          </p>
          {iosHelp && (
            <p className="pwa-install-help">
              iPhone: Share, then Add to Home Screen.
            </p>
          )}
        </div>
        <div className="pwa-install-actions">
          {!iosHelp && <button type="button" onClick={install}>Install</button>}
          <button type="button" onClick={dismiss}>Not now</button>
        </div>
      </div>
    </div>
  );
}
