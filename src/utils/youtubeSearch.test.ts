import { describe, expect, it } from 'vitest'
import {
  buildMatchYouTubeHighlightsQuery,
  buildMatchYouTubeHighlightsSearchUrl,
  buildMatchYouTubeLiveQuery,
  buildMatchYouTubeLiveSearchUrl,
} from './youtubeSearch'

describe('youtubeSearch', () => {
  it('builds the highlights search query with team names', () => {
    expect(buildMatchYouTubeHighlightsQuery('Brasil', 'Argentina')).toBe(
      'Melhores Momentos Brasil x Argentina | FIFA WORLD CUP™ 2026',
    )
  })

  it('builds the live search query with Cazé TV prefix', () => {
    expect(buildMatchYouTubeLiveQuery('Brasil', 'Argentina')).toBe(
      'Cazé TV Brasil x Argentina | FIFA WORLD CUP™ 2026',
    )
  })

  it('builds the YouTube results URL with encoded query', () => {
    expect(buildMatchYouTubeHighlightsSearchUrl('Brasil', 'Argentina')).toBe(
      'https://www.youtube.com/results?search_query=Melhores%20Momentos%20Brasil%20x%20Argentina%20%7C%20FIFA%20WORLD%20CUP%E2%84%A2%202026',
    )
  })

  it('builds the live YouTube results URL with encoded query', () => {
    expect(buildMatchYouTubeLiveSearchUrl('Brasil', 'Argentina')).toBe(
      'https://www.youtube.com/results?search_query=Caz%C3%A9%20TV%20Brasil%20x%20Argentina%20%7C%20FIFA%20WORLD%20CUP%E2%84%A2%202026',
    )
  })
})
