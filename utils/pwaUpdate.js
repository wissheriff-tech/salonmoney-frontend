export const APP_VERSION = '2026-07-02-3';
export const PROGRESS_EVENT = 'goldmine:pwa-update-progress';

const SW_PATH = '/sw.js';
const DEFAULT_PROGRESS_DURATION_MS = 3600;
const CONTROLLER_CHANGE_TIMEOUT_MS = 14000;
const UPDATE_STAGES = {
  checking: 'Checking for the latest version',
  downloading: 'Downloading app files',
  installing: 'Installing app update',
  activating: 'Activating update',
  refreshing: 'Refreshing Gold Mine',
};

let activeUpdatePromise = null;

function canUseServiceWorker() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

function postSkipWaiting(worker) {
  if (worker) worker.postMessage({ type: 'SKIP_WAITING' });
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getConnectionProgressDuration() {
  if (typeof navigator === 'undefined') return DEFAULT_PROGRESS_DURATION_MS;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return DEFAULT_PROGRESS_DURATION_MS;

  const effectiveType = String(connection.effectiveType || '').toLowerCase();
  const downlink = Number(connection.downlink || 0);
  let duration = DEFAULT_PROGRESS_DURATION_MS;

  if (effectiveType === 'slow-2g') duration = 9500;
  else if (effectiveType === '2g') duration = 7600;
  else if (effectiveType === '3g') duration = 5600;
  else if (effectiveType === '4g') duration = downlink > 5 ? 2800 : 3400;

  if (connection.saveData) duration *= 1.35;

  return Math.round(duration);
}

function waitForControllerChange(timeoutMs = 1500) {
  if (!canUseServiceWorker() || !navigator.serviceWorker.controller) return Promise.resolve(false);

  return new Promise((resolve) => {
    let done = false;
    const finish = (changed) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      navigator.serviceWorker.removeEventListener('controllerchange', onChange);
      resolve(changed);
    };
    const onChange = () => finish(true);
    const timer = window.setTimeout(() => finish(false), timeoutMs);
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
  });
}

function normalizeProgress(progress) {
  return Math.max(1, Math.min(100, Math.round(Number(progress) || 1)));
}

function emitProgress(progress, stage = UPDATE_STAGES.checking) {
  if (typeof window === 'undefined') return;
  const detail = {
    progress: normalizeProgress(progress),
    stage,
    version: APP_VERSION,
  };
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, {
    detail,
  }));
}

function reportProgress(onProgress, progress, stage) {
  const payload = {
    progress: normalizeProgress(progress),
    stage,
    version: APP_VERSION,
  };
  emitProgress(payload.progress, payload.stage);
  onProgress?.(payload);
}

function createProgressController({ durationMs, onProgress }) {
  const startedAt = Date.now();
  const targetCeiling = 94;
  let stage = UPDATE_STAGES.checking;
  let target = 4;
  let progress = 1;
  let stopped = false;

  reportProgress(onProgress, progress, stage);

  const timer = window.setInterval(() => {
    if (stopped) return;

    const elapsed = Date.now() - startedAt;
    const timeTarget = Math.min(targetCeiling, Math.round(1 + (elapsed / durationMs) * (targetCeiling - 1)));
    target = Math.max(target, timeTarget);

    if (progress < target) {
      const step = Math.max(1, Math.ceil((target - progress) / 5));
      progress = Math.min(target, progress + step);
      reportProgress(onProgress, progress, stage);
    }
  }, 110);

  const setStage = (nextStage, floor) => {
    if (stopped) return;
    stage = nextStage;
    target = Math.max(target, floor);
    reportProgress(onProgress, progress, stage);
  };

  const finish = async () => {
    if (stopped) return;
    setStage(UPDATE_STAGES.refreshing, 96);
    window.clearInterval(timer);

    while (progress < 100) {
      progress = Math.min(100, progress + Math.max(1, Math.ceil((100 - progress) / 4)));
      reportProgress(onProgress, progress, UPDATE_STAGES.refreshing);
      await delay(progress >= 100 ? 120 : 90);
    }

    stopped = true;
  };

  const cancel = () => {
    stopped = true;
    window.clearInterval(timer);
  };

  return { setStage, finish, cancel };
}

function watchWorkerState(worker, registration, progress) {
  if (!worker) return () => {};

  const syncState = () => {
    if (worker.state === 'installing') {
      progress.setStage(UPDATE_STAGES.downloading, 22);
    } else if (worker.state === 'installed') {
      progress.setStage(UPDATE_STAGES.installing, 64);
      postSkipWaiting(registration.waiting || worker);
    } else if (worker.state === 'activating') {
      progress.setStage(UPDATE_STAGES.activating, 82);
    } else if (worker.state === 'activated') {
      progress.setStage(UPDATE_STAGES.activating, 92);
    }
  };

  syncState();
  worker.addEventListener('statechange', syncState);
  return () => worker.removeEventListener('statechange', syncState);
}

async function waitForInstallingWorker(registration, timeoutMs = 4000) {
  if (registration.waiting || registration.installing) {
    return registration.waiting || registration.installing;
  }

  return new Promise((resolve) => {
    let done = false;
    const finish = (worker) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      registration.removeEventListener?.('updatefound', onUpdateFound);
      resolve(worker || registration.waiting || registration.installing || null);
    };
    const onUpdateFound = () => finish(registration.installing);
    const timer = window.setTimeout(() => finish(null), timeoutMs);
    registration.addEventListener?.('updatefound', onUpdateFound);
  });
}

async function finishProgressAndReload({ onProgress, progressDurationMs } = {}) {
  const progress = createProgressController({
    durationMs: progressDurationMs || Math.min(getConnectionProgressDuration(), 2600),
    onProgress,
  });
  progress.setStage(UPDATE_STAGES.activating, 76);
  await delay(350);
  await progress.finish();
  window.location.reload();
  return true;
}

async function runActivation(registration, { onProgress, progressDurationMs } = {}) {
  if (!canUseServiceWorker()) return false;

  const durationMs = progressDurationMs || getConnectionProgressDuration();
  const progress = createProgressController({ durationMs, onProgress });
  let cleanup = () => {};

  try {
    const activeRegistration = registration || await registerPwaWorker();
    if (!activeRegistration) {
      progress.cancel();
      return false;
    }

    progress.setStage(UPDATE_STAGES.checking, 8);
    await activeRegistration.update().catch(() => null);

    let worker = activeRegistration.waiting || activeRegistration.installing;
    if (!worker) {
      worker = await waitForInstallingWorker(activeRegistration);
    }

    if (!worker) {
      progress.cancel();
      return false;
    }

    cleanup = watchWorkerState(worker, activeRegistration, progress);

    if (activeRegistration.waiting || worker.state === 'installed') {
      progress.setStage(UPDATE_STAGES.installing, 66);
      postSkipWaiting(activeRegistration.waiting || worker);
    }

    progress.setStage(UPDATE_STAGES.activating, worker.state === 'activated' ? 92 : 78);
    const changed = worker.state === 'activated'
      ? true
      : await waitForControllerChange(Math.max(CONTROLLER_CHANGE_TIMEOUT_MS, durationMs + 5000));

    if (!changed && activeRegistration.waiting) {
      postSkipWaiting(activeRegistration.waiting);
      await waitForControllerChange(3500);
    }

    await progress.finish();
    window.location.reload();
    return true;
  } finally {
    cleanup();
  }
}

export async function completePwaUpdateReload(options = {}) {
  if (!canUseServiceWorker()) return false;
  if (activeUpdatePromise) return activeUpdatePromise;

  activeUpdatePromise = finishProgressAndReload(options).finally(() => {
    activeUpdatePromise = null;
  });

  return activeUpdatePromise;
}

export async function activatePwaUpdate(registration, options = {}) {
  if (!canUseServiceWorker()) return false;
  if (activeUpdatePromise) return activeUpdatePromise;

  activeUpdatePromise = runActivation(registration, options).finally(() => {
    activeUpdatePromise = null;
  });

  return activeUpdatePromise;
}

export async function registerPwaWorker() {
  if (!canUseServiceWorker()) return null;
  try {
    return await navigator.serviceWorker.register(SW_PATH, { updateViaCache: 'none' });
  } catch {
    return null;
  }
}

export async function checkForPwaUpdate() {
  if (!canUseServiceWorker()) return null;

  const registration = await registerPwaWorker();
  if (!registration) return null;

  await registration.update().catch(() => null);

  return registration;
}

export async function reloadIfPwaUpdateIsReady(options = {}) {
  if (!canUseServiceWorker()) return false;

  const registration = await checkForPwaUpdate();
  if (!registration) return false;

  const worker = registration.waiting || registration.installing;
  if (!worker) return false;

  return activatePwaUpdate(registration, options);
}
