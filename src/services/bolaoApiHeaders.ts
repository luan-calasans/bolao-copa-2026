export function getBolaoAccessHeaders(): HeadersInit {
  const token = import.meta.env.VITE_BOLAO_ACCESS_TOKEN?.trim()

  if (!token) {
    return {}
  }

  return {
    'X-Bolao-Token': token,
  }
}
