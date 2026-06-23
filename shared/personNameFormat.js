const LOWERCASE_NAME_PARTICLES = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'e',
  'di',
  'du',
  'la',
  'le',
  'las',
  'los',
  'el',
  'del',
  'y',
])

function titleCaseWord(word) {
  const lower = word.toLocaleLowerCase('pt-BR')
  if (!lower) return lower

  return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1)
}

export function formatPersonNameForStorage(name) {
  if (typeof name !== 'string') {
    return ''
  }

  const trimmed = name.trim().replace(/\s+/g, ' ')
  if (!trimmed) return trimmed

  const words = trimmed.split(' ')

  return words
    .map((word, index) => {
      const lower = word.toLocaleLowerCase('pt-BR')

      if (index > 0 && LOWERCASE_NAME_PARTICLES.has(lower)) {
        return lower
      }

      return titleCaseWord(word)
    })
    .join(' ')
}
