/** @typedef {'home' | 'away' | 'draw'} WinnerPick */

export const WINNER_PICKS = ['home', 'away', 'draw']

/**
 * @param {unknown} value
 * @returns {value is WinnerPick}
 */
export function isValidWinnerPick(value) {
  return value === 'home' || value === 'away' || value === 'draw'
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
export function validateWinnerPick(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (!isValidWinnerPick(value)) {
    return 'Seleção de vencedor inválida.'
  }

  return null
}
