import { describe, expect, it } from 'vitest'
import {
  formatMatchGoalDetail,
  formatSubstitutionTimelineDisplay,
  getMatchEventDetailClassName,
  translateMatchEventDetail,
} from './matchEventDetailPt'
import { formatTimelineDetail } from './matchTimelineMapper'
import type { MatchTimelineEvent } from '../models/sportsdb.types'

function timelineEvent(
  overrides: Partial<MatchTimelineEvent> & Pick<MatchTimelineEvent, 'kind'>,
): MatchTimelineEvent {
  return {
    id: '1',
    minute: 10,
    minuteLabel: '10',
    playerName: 'Jogador',
    assistName: null,
    teamName: 'Time',
    isHomeTeam: true,
    detail: 'Normal Goal',
    isOwnGoal: false,
    ...overrides,
  }
}

describe('matchEventDetailPt', () => {
  it('translates common timeline labels', () => {
    expect(translateMatchEventDetail('Normal Goal')).toBe('Gol')
    expect(translateMatchEventDetail('Goal Disallowed')).toBe('Gol anulado')
    expect(translateMatchEventDetail('Goal Disallowed - offside')).toBe('Gol anulado')
    expect(translateMatchEventDetail('Yellow Card')).toBe('Cartão amarelo')
    expect(translateMatchEventDetail('Card upgrade')).toBe('Mudança de cartão')
    expect(translateMatchEventDetail('Card updated')).toBe('Mudança de cartão')
    expect(translateMatchEventDetail('Substitution 2')).toBe('Substituição')
  })

  it('formats goal details', () => {
    expect(formatMatchGoalDetail('Penalty', false)).toBe('Pênalti')
    expect(formatMatchGoalDetail('Normal Goal', true)).toBe('Gol contra')
  })

  it('maps detail labels to highlight colors', () => {
    expect(getMatchEventDetailClassName('Gol')).toContain('emerald')
    expect(getMatchEventDetailClassName('Cartão amarelo')).toContain('yellow')
    expect(getMatchEventDetailClassName('Gol contra')).toContain('red')
    expect(getMatchEventDetailClassName('Substituição')).toContain('orange')
    expect(getMatchEventDetailClassName('Gol anulado')).toContain('orange')
  })

  it('formats substitution labels with player names', () => {
    expect(formatSubstitutionTimelineDisplay('Ousmane Dembélé', 'Bradley Barcola', 'França')).toEqual({
      title: 'Ousmane Dembélé',
      teamLabel: 'França',
      playerOut: 'Bradley Barcola',
    })
  })
})

describe('formatTimelineDetail', () => {
  it('uses Portuguese labels in history rows', () => {
    expect(
      formatTimelineDetail(
        timelineEvent({ kind: 'var', detail: 'Goal Disallowed' }),
      ),
    ).toBe('Gol anulado')

    expect(
      formatTimelineDetail(
        timelineEvent({
          kind: 'substitution',
          detail: 'Substitution 2',
          assistName: 'Sainte',
        }),
      ),
    ).toBe('Substituição')
  })
})
