export const THEME_STORAGE_KEY = 'salonmoney-theme';
export const LEGACY_DARK_MODE_KEY = 'darkMode';

export function normalizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light';
}

export function readStoredTheme() {
  if (typeof window === 'undefined') return 'light';

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;

    return window.localStorage.getItem(LEGACY_DARK_MODE_KEY) === 'true' ? 'dark' : 'light';
  } catch (_) {
    return 'light';
  }
}

export function getCurrentTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function applyTheme(theme) {
  const nextTheme = normalizeTheme(theme);
  if (typeof document === 'undefined') return nextTheme;

  const isDark = nextTheme === 'dark';
  const root = document.documentElement;
  root.classList.toggle('dark', isDark);
  root.dataset.theme = nextTheme;
  root.style.colorScheme = nextTheme;
  return nextTheme;
}

export function applyStoredTheme() {
  return applyTheme(readStoredTheme());
}

export function setStoredTheme(theme) {
  const nextTheme = applyTheme(theme);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      window.localStorage.setItem(LEGACY_DARK_MODE_KEY, String(nextTheme === 'dark'));
    } catch (_) {}

    window.dispatchEvent(new CustomEvent('salonmoney:theme-change', {
      detail: { theme: nextTheme, dark: nextTheme === 'dark' },
    }));
  }

  return nextTheme;
}
