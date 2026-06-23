const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 128
const MAX_EMAIL_LENGTH = 254

export function normalizeEmail(email) {
  if (typeof email !== 'string') return ''
  return email.trim().toLowerCase()
}

export function validateEmail(email) {
  const normalized = normalizeEmail(email)

  if (!normalized) {
    return 'Informe seu e-mail.'
  }

  if (normalized.length > MAX_EMAIL_LENGTH) {
    return 'E-mail muito longo.'
  }

  if (!EMAIL_PATTERN.test(normalized)) {
    return 'Informe um e-mail válido.'
  }

  return null
}

export function validatePassword(password) {
  if (typeof password !== 'string' || !password) {
    return 'Informe sua senha.'
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return 'Senha muito longa.'
  }

  return null
}

export function validatePasswordConfirmation(password, confirmation) {
  const passwordError = validatePassword(password)

  if (passwordError) {
    return passwordError
  }

  if (password !== confirmation) {
    return 'As senhas não coincidem.'
  }

  return null
}
