import { describe, expect, it } from 'vitest'
import { getBetSubmitSuccessMessage } from './betPickToast'

describe('getBetSubmitSuccessMessage', () => {
  it('returns complement messages', () => {
    expect(getBetSubmitSuccessMessage('add-winner', null, 1, 0)).toBe(
      'Quem vence adicionado ao seu palpite!',
    )
    expect(getBetSubmitSuccessMessage('add-score', 'home', null, null)).toBe(
      'Placar adicionado ao seu palpite!',
    )
  })

  it('returns messages for new bets by content', () => {
    expect(getBetSubmitSuccessMessage('none', 'home', 2, 1)).toBe(
      'Palpite registrado com placar e vencedor!',
    )
    expect(getBetSubmitSuccessMessage('none', null, 2, 1)).toBe('Placar registrado!')
    expect(getBetSubmitSuccessMessage('none', 'draw', null, null)).toBe(
      'Palpite de vencedor registrado!',
    )
  })
})
