import { describe, expect, it } from 'vitest'
import { toSportsdbSearchToken, toSportsdbTeamName } from './sportsdbTeamNames'

describe('sportsdbTeamNames', () => {
  it('maps known aliases', () => {
    expect(toSportsdbTeamName('Korea Republic')).toBe('South Korea')
    expect(toSportsdbTeamName('Congo DR')).toBe('DR Congo')
  })

  it('builds search tokens with underscores', () => {
    expect(toSportsdbSearchToken('South Korea')).toBe('South_Korea')
    expect(toSportsdbSearchToken('United States')).toBe('United_States')
  })
})
