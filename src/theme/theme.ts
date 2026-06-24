export type Theme = 'dark' | 'light'

export const DEFAULT_THEME: Theme = 'dark'
export const THEME_STORAGE_KEY = 'bolao-theme'

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light'
}

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function applyThemeClass(theme: Theme): void {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
}
