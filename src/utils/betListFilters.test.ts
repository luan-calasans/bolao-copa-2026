import { describe, expect, it } from 'vitest'
import type { BetsTableItem } from '../models/betsTable'
import type { Match } from '../models/match'
import {
  filterBetsByCountry,
  filterBetsByMatchStatus,
  filterBetsByParticipant,
  filterBetsByResult,
  getBetCountryFilterOptions,
  getBetMatchStatusFilterOptions,
  getBetParticipantFilterOptions,
  getBetResultFilterOptions,
  hasActiveBetListFilters,
  sortBetsByDatePreset,
} from './betListFilters'

const finishedMatch = {
  id: 1,
  utcDate: '2026-06-20T18:00:00Z',
  status: 'finished',
  isLive: false,
  homeTeam: { id: 10, name: 'Brasil', shortName: 'BRA', crest: '' },
  awayTeam: { id: 20, name: 'Argentina', shortName: 'ARG', crest: '' },
} as Match

const liveMatch = {
  ...finishedMatch,
  id: 2,
  utcDate: '2026-06-21T18:00:00Z',
  status: 'live',
  isLive: true,
} as Match

const scheduledMatch = {
  ...finishedMatch,
  id: 3,
  utcDate: '2026-06-22T18:00:00Z',
  status: 'scheduled',
  isLive: false,
} as Match

function item(
  matchData: Match,
  resultStatus: 'exact' | 'partial' | 'none' | 'pending',
  receiptId: string,
  generatedAt: string,
  personName = 'João',
): BetsTableItem {
  return {
    matchId: matchData.id,
    match: matchData,
    row: {
      entry: {
        receiptId,
        matchId: matchData.id,
        homeScore: 1,
        awayScore: 0,
        personName,
        createdAt: generatedAt,
        generatedAt,
      },
      displayName: personName,
      resultStatus,
      points: null,
    },
  }
}

describe('betListFilters', () => {
  const items = [
    item(finishedMatch, 'exact', 'a', '2026-06-04T12:00:00Z'),
    item(finishedMatch, 'partial', 'b', '2026-06-02T12:00:00Z'),
    item(liveMatch, 'pending', 'c', '2026-06-03T12:00:00Z'),
    item(scheduledMatch, 'none', 'd', '2026-06-01T12:00:00Z'),
  ]

  it('builds result filter options with counts', () => {
    const options = getBetResultFilterOptions(items)

    expect(options).toEqual([
      { id: 'exact', label: 'Placar exato', count: 1 },
      { id: 'partial', label: 'Parcial', count: 1 },
      { id: 'none', label: 'Errou', count: 1 },
    ])
  })

  it('builds match status filter options with counts', () => {
    const options = getBetMatchStatusFilterOptions(items)

    expect(options).toEqual([
      { id: 'finished', label: 'Encerrado', count: 2 },
      { id: 'live', label: 'Ao vivo', count: 1 },
      { id: 'scheduled', label: 'Agendado', count: 1 },
    ])
  })

  it('filters by result status', () => {
    expect(filterBetsByResult(items, 'exact')).toHaveLength(1)
    expect(filterBetsByResult(items, 'all')).toHaveLength(4)
  })

  it('filters by match status', () => {
    expect(filterBetsByMatchStatus(items, 'finished')).toHaveLength(2)
    expect(filterBetsByMatchStatus(items, 'live')).toHaveLength(1)
    expect(filterBetsByMatchStatus(items, 'scheduled')).toHaveLength(1)
  })

  it('filters by country participation', () => {
    expect(filterBetsByCountry(items, 10)).toHaveLength(4)
    expect(filterBetsByCountry(items, 20)).toHaveLength(4)
    expect(filterBetsByCountry(items, 99)).toHaveLength(0)
  })

  it('builds country options from matches', () => {
    const options = getBetCountryFilterOptions(items)

    expect(options.map((option) => option.id).sort()).toEqual([10, 20])
    expect(options).toHaveLength(2)
  })

  it('builds participant options from bets', () => {
    const mixedParticipants = [
      ...items,
      item(finishedMatch, 'exact', 'e', '2026-06-05T12:00:00Z', 'Maria'),
      item(finishedMatch, 'partial', 'f', '2026-06-05T12:00:00Z', 'joao'),
    ]

    const options = getBetParticipantFilterOptions(mixedParticipants)

    expect(options).toEqual([
      { id: 'joao', label: 'João' },
      { id: 'maria', label: 'Maria' },
    ])
  })

  it('filters by participant', () => {
    const mixedParticipants = [
      item(finishedMatch, 'exact', 'a', '2026-06-04T12:00:00Z', 'João'),
      item(finishedMatch, 'partial', 'b', '2026-06-02T12:00:00Z', 'Maria'),
    ]

    expect(filterBetsByParticipant(mixedParticipants, 'maria')).toHaveLength(1)
    expect(filterBetsByParticipant(mixedParticipants, null)).toHaveLength(2)
  })

  it('sorts by match date preset', () => {
    const recent = sortBetsByDatePreset(items, 'recent')
    const oldest = sortBetsByDatePreset(items, 'oldest')

    expect(recent[0]?.row.entry.receiptId).toBe('d')
    expect(oldest[0]?.row.entry.receiptId).toBe('b')
  })

  it('breaks ties on match date with live before scheduled before finished', () => {
    const tiedItems = [
      item({ ...finishedMatch, status: 'finished', isLive: false }, 'exact', 'finished', '2026-06-05T12:00:00Z'),
      item({ ...finishedMatch, status: 'scheduled', isLive: false }, 'none', 'scheduled', '2026-06-04T12:00:00Z'),
      item({ ...finishedMatch, status: 'live', isLive: true }, 'pending', 'live', '2026-06-03T12:00:00Z'),
    ]

    const sorted = sortBetsByDatePreset(tiedItems, 'recent')

    expect(sorted.map((entry) => entry.row.entry.receiptId)).toEqual(['live', 'scheduled', 'finished'])
  })

  it('detects active filters', () => {
    expect(hasActiveBetListFilters('all', 'all', null, 'recent')).toBe(false)
    expect(hasActiveBetListFilters('exact', 'all', null, 'recent')).toBe(true)
    expect(hasActiveBetListFilters('all', 'live', null, 'recent')).toBe(true)
    expect(hasActiveBetListFilters('all', 'all', 10, 'recent')).toBe(true)
    expect(hasActiveBetListFilters('all', 'all', null, 'oldest')).toBe(true)
    expect(hasActiveBetListFilters('all', 'all', null, 'recent', 'joao')).toBe(true)
  })
})
