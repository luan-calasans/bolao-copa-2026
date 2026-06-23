import type { MatchHighlightImages } from '../models/matchHighlight'

function normalizeImageUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }

  if (trimmed.startsWith('www.')) {
    return `https://${trimmed}`
  }

  return null
}

export function toSportsdbPreviewImageUrl(
  url: string | null,
  size: 'medium' | 'small' = 'medium',
): string | null {
  const normalized = normalizeImageUrl(url)
  if (!normalized) return null

  if (normalized.endsWith('/medium') || normalized.endsWith('/small') || normalized.endsWith('/tiny')) {
    return normalized
  }

  return `${normalized}/${size}`
}

function mapHighlightEntry(
  entry: {
    strPoster?: string | null
    strThumb?: string | null
    strFanart?: string | null
    strBanner?: string | null
  },
): MatchHighlightImages {
  return {
    thumbUrl: toSportsdbPreviewImageUrl(entry.strThumb ?? null, 'medium'),
    posterUrl: toSportsdbPreviewImageUrl(entry.strPoster ?? null, 'medium'),
    fanartUrl: toSportsdbPreviewImageUrl(entry.strFanart ?? null, 'medium'),
    bannerUrl: toSportsdbPreviewImageUrl(entry.strBanner ?? null, 'medium'),
  }
}

export function mapSportsdbEventToHighlightImages(
  event:
    | {
        strPoster?: string | null
        strThumb?: string | null
        strFanart?: string | null
        strBanner?: string | null
      }
    | null
    | undefined,
): MatchHighlightImages {
  if (!event) {
    return { thumbUrl: null, posterUrl: null, fanartUrl: null, bannerUrl: null }
  }

  return mapHighlightEntry(event)
}

export function mergeMatchHighlightImages(
  ...sources: MatchHighlightImages[]
): MatchHighlightImages {
  const merged: MatchHighlightImages = {
    thumbUrl: null,
    posterUrl: null,
    fanartUrl: null,
    bannerUrl: null,
  }

  for (const source of sources) {
    if (!merged.thumbUrl && source.thumbUrl) merged.thumbUrl = source.thumbUrl
    if (!merged.posterUrl && source.posterUrl) merged.posterUrl = source.posterUrl
    if (!merged.fanartUrl && source.fanartUrl) merged.fanartUrl = source.fanartUrl
    if (!merged.bannerUrl && source.bannerUrl) merged.bannerUrl = source.bannerUrl
  }

  return merged
}
