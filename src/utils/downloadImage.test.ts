import { describe, expect, it } from 'vitest'
import { buildHighlightImageFilename, toFullImageUrl } from './downloadImage'

describe('downloadImage', () => {
  it('removes sportsdb preview suffix from image urls', () => {
    expect(toFullImageUrl('https://example.com/poster.jpg/medium')).toBe(
      'https://example.com/poster.jpg',
    )
  })

  it('builds a safe filename from label and url', () => {
    expect(
      buildHighlightImageFilename('Pôster', 'https://example.com/poster.jpg/medium'),
    ).toBe('poster.jpg')
  })
})
