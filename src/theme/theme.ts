export type Theme = 'dark' | 'light'

export const DEFAULT_THEME: Theme = 'dark'

export function applyThemeClass(theme: Theme): void {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
}
