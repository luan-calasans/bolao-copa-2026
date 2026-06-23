import { describe, expect, it } from 'vitest'
import { hasMatchHighlightImages } from '../models/matchHighlight'
import {
  mapSportsdbEventToHighlightImages,
  mergeMatchHighlightImages,
  toSportsdbPreviewImageUrl,
} from './matchHighlightMapper'

describe('matchHighlightMapper', () => {
  it('adds medium preview suffix to image urls', () => {
    expect(toSportsdbPreviewImageUrl('https://www.thesportsdb.com/images/media/event/poster/test.jpg')).toBe(
      'https://www.thesportsdb.com/images/media/event/poster/test.jpg/medium',
    )
  })

  it('maps sportsdb event image fields', () => {
    expect(
      mapSportsdbEventToHighlightImages({
        strThumb: 'https://example.com/thumb.jpg',
        strPoster: 'https://example.com/poster.jpg',
        strFanart: 'https://example.com/fanart.jpg',
        strBanner: 'https://example.com/banner.jpg',
      }),
    ).toEqual({
      thumbUrl: 'https://example.com/thumb.jpg/medium',
      posterUrl: 'https://example.com/poster.jpg/medium',
      fanartUrl: 'https://example.com/fanart.jpg/medium',
      bannerUrl: 'https://example.com/banner.jpg/medium',
    })
  })

  it('merges highlight sources without overwriting existing urls', () => {
    const merged = mergeMatchHighlightImages(
      {
        thumbUrl: 'https://example.com/thumb.jpg/medium',
        posterUrl: null,
        fanartUrl: null,
        bannerUrl: null,
      },
      {
        thumbUrl: 'https://example.com/other-thumb.jpg/medium',
        posterUrl: 'https://example.com/poster.jpg/medium',
        fanartUrl: null,
        bannerUrl: null,
      },
    )

    expect(merged.thumbUrl).toBe('https://example.com/thumb.jpg/medium')
    expect(merged.posterUrl).toBe('https://example.com/poster.jpg/medium')
    expect(hasMatchHighlightImages(merged)).toBe(true)
  })
})
