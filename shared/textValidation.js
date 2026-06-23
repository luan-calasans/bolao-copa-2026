export function hasControlCharacters(value) {
  for (const char of value) {
    const code = char.charCodeAt(0)

    if (
      (code >= 0x00 && code <= 0x08) ||
      code === 0x0b ||
      code === 0x0c ||
      (code >= 0x0e && code <= 0x1f)
    ) {
      return true
    }
  }

  return false
}
