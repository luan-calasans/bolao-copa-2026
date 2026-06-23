import { describe, expect, it } from 'vitest'
import { translateLineupPosition } from './matchLineupPositionPt'

describe('matchLineupPositionPt', () => {
  it('translates goalkeeper variants', () => {
    expect(translateLineupPosition('Goalkeeper')).toBe('Goleiro')
    expect(translateLineupPosition('Goalie')).toBe('Goleiro')
    expect(translateLineupPosition('Keeper')).toBe('Goleiro')
  })

  it('translates defense positions', () => {
    expect(translateLineupPosition('Centre-Back')).toBe('Zagueiro')
    expect(translateLineupPosition('Center-back')).toBe('Zagueiro')
    expect(translateLineupPosition('Defender')).toBe('Zagueiro')
    expect(translateLineupPosition('Full-back')).toBe('Lateral')
    expect(translateLineupPosition('Left-Back')).toBe('Lateral esquerdo')
    expect(translateLineupPosition('Right-Back')).toBe('Lateral direito')
    expect(translateLineupPosition('Wing-back')).toBe('Ala')
  })

  it('translates midfield positions', () => {
    expect(translateLineupPosition('Midfielder')).toBe('Meio-campista')
    expect(translateLineupPosition('Defensive Midfield')).toBe('Volante')
    expect(translateLineupPosition('Holding Midfielder')).toBe('Volante')
    expect(translateLineupPosition('Central Midfield')).toBe('Meia central')
    expect(translateLineupPosition('Attacking Midfield')).toBe('Meia-atacante')
    expect(translateLineupPosition('Playmaker')).toBe('Armador')
  })

  it('translates attack positions', () => {
    expect(translateLineupPosition('Forward')).toBe('Atacante')
    expect(translateLineupPosition('Striker')).toBe('Centroavante')
    expect(translateLineupPosition('Centre-Forward')).toBe('Centroavante')
    expect(translateLineupPosition('Winger')).toBe('Ponta')
    expect(translateLineupPosition('Right Winger')).toBe('Ponta direita')
    expect(translateLineupPosition('Left Wing')).toBe('Ponta esquerda')
    expect(translateLineupPosition('Right Wing')).toBe('Ponta direita')
  })

  it('keeps unknown positions unchanged', () => {
    expect(translateLineupPosition('False Nine')).toBe('False Nine')
  })
})
