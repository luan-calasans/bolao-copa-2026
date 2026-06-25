import { describe, expect, it } from 'vitest'
import type { SportsdbTimelineEntry } from '../models/sportsdb.types'
import { mapTimelineToGoals } from './matchGoalsMapper'

function createTimelineEntry(
  overrides: Partial<SportsdbTimelineEntry> & Pick<SportsdbTimelineEntry, 'strTimeline'>,
): SportsdbTimelineEntry {
  return {
    idTimeline: '1',
    idEvent: '100',
    strTimelineDetail: null,
    strHome: 'Yes',
    strEvent: 'Team A vs Team B',
    idPlayer: '1',
    strPlayer: 'Player',
    intTime: '10',
    strPeriod: null,
    idTeam: '1',
    strTeam: 'Team A',
    strComment: null,
    dateEvent: '2022-01-01',
    strSeason: '2022',
    ...overrides,
  }
}

describe('mapTimelineToGoals', () => {
  it('keeps only goal events sorted by minute', () => {
    const goals = mapTimelineToGoals([
      createTimelineEntry({
        strTimeline: 'Card',
        strTimelineDetail: 'Yellow Card',
        intTime: '5',
      }),
      createTimelineEntry({
        idTimeline: '36',
        strTimeline: 'Goal',
        strTimelineDetail: 'Normal Goal',
        strPlayer: 'Messi',
        intTime: '36',
      }),
      createTimelineEntry({
        idTimeline: '80',
        strTimeline: 'Goal',
        strTimelineDetail: 'Penalty',
        strPlayer: 'Mbappé',
        intTime: '80',
        strHome: 'No',
      }),
    ])

    expect(goals).toHaveLength(2)
    expect(goals[0]?.minuteLabel).toBe('36')
    expect(goals[1]?.minuteLabel).toBe('80')
    expect(goals[1]?.isHomeTeam).toBe(false)
  })

  it('keeps multiple goals from the same player', () => {
    const goals = mapTimelineToGoals([
      createTimelineEntry({
        idTimeline: '1',
        strTimeline: 'Goal',
        strTimelineDetail: 'Normal Goal',
        strPlayer: 'Erik Botheim',
        intTime: '7',
      }),
      createTimelineEntry({
        idTimeline: '2',
        strTimeline: 'Goal',
        strTimelineDetail: 'Normal Goal',
        strPlayer: 'Erik Botheim',
        intTime: '31',
      }),
      createTimelineEntry({
        idTimeline: '3',
        strTimeline: 'Goal',
        strTimelineDetail: 'Normal Goal',
        strPlayer: 'Erik Botheim',
        intTime: '41',
      }),
    ])

    expect(goals).toHaveLength(3)
    expect(goals.every((goal) => goal.playerName === 'Erik Botheim')).toBe(true)
    expect(new Set(goals.map((goal) => goal.id)).size).toBe(3)
  })

  it('keeps multiple goals from the same player in added time', () => {
    const goals = mapTimelineToGoals([
      createTimelineEntry({
        idTimeline: '1',
        strTimeline: 'Goal',
        strTimelineDetail: 'Normal Goal',
        strPlayer: 'Kylian Mbappé',
        intTime: '90+1',
      }),
      createTimelineEntry({
        idTimeline: '2',
        strTimeline: 'Goal',
        strTimelineDetail: 'Normal Goal',
        strPlayer: 'Kylian Mbappé',
        intTime: '90+3',
      }),
    ])

    expect(goals).toHaveLength(2)
    expect(goals.map((goal) => goal.minuteLabel)).toEqual(['90+1', '90+3'])
  })

  it('marks own goals', () => {
    const goals = mapTimelineToGoals([
      createTimelineEntry({
        strTimeline: 'Goal',
        strTimelineDetail: 'Own Goal',
      }),
    ])

    expect(goals[0]?.isOwnGoal).toBe(true)
  })

  it('maps assist name when available', () => {
    const goals = mapTimelineToGoals([
      createTimelineEntry({
        strTimeline: 'Goal',
        strTimelineDetail: 'Normal Goal',
        strPlayer: 'Haaland',
        strAssist: 'Ødegaard',
        intTime: '23',
      }),
    ])

    expect(goals[0]?.assistName).toBe('Ødegaard')
  })

  it('ignores empty or zero assist values', () => {
    const goals = mapTimelineToGoals([
      createTimelineEntry({
        strTimeline: 'Goal',
        strTimelineDetail: 'Normal Goal',
        strAssist: '0',
      }),
    ])

    expect(goals[0]?.assistName).toBeNull()
  })

  it('excludes missed penalties from goals', () => {
    const goals = mapTimelineToGoals([
      createTimelineEntry({
        idTimeline: '9',
        strTimeline: 'Goal',
        strTimelineDetail: 'Missed Penalty',
        strPlayer: 'Lionel Messi',
        intTime: '9',
      }),
      createTimelineEntry({
        idTimeline: '38',
        strTimeline: 'Goal',
        strTimelineDetail: 'Normal Goal',
        strPlayer: 'Lionel Messi',
        intTime: '38',
      }),
      createTimelineEntry({
        idTimeline: '55',
        strTimeline: 'Penalty',
        strTimelineDetail: 'Penalty Missed',
        strPlayer: 'Player',
        intTime: '55',
      }),
    ])

    expect(goals).toHaveLength(1)
    expect(goals[0]?.minuteLabel).toBe('38')
    expect(goals[0]?.detail).toBe('Normal Goal')
  })
})
