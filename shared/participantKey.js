const COMBINING_MARKS_PATTERN = /[\u0300-\u036f]/g

export function normalizePersonNameKey(name) {
  if (name == null || typeof name !== 'string') {
    return ''
  }

  return name
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(COMBINING_MARKS_PATTERN, '')
    .toLowerCase()
}
