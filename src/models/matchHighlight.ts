export interface MatchHighlightImages {
  thumbUrl: string | null
  posterUrl: string | null
  fanartUrl: string | null
  bannerUrl: string | null
}

export function hasMatchHighlightImages(images: MatchHighlightImages): boolean {
  return Boolean(
    images.thumbUrl || images.posterUrl || images.fanartUrl || images.bannerUrl,
  )
}
