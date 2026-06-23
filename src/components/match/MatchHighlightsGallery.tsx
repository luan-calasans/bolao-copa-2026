import { useCallback, useEffect, useRef, useState } from 'react'
import type { Match } from '../../models/match'
import type { MatchHighlightImages } from '../../models/matchHighlight'
import { hasMatchHighlightImages } from '../../models/matchHighlight'
import { useMatchHighlights } from '../../hooks/useMatchHighlights'
import { buildHighlightImageFilename, downloadImageFromUrl } from '../../utils/downloadImage'
import { Skeleton } from '../ui/Skeleton'

interface MatchHighlightsGalleryProps {
  match: Match
  className?: string
}

interface HighlightImageItem {
  key: string
  label: string
  url: string
}

function buildHighlightImageItems(images: MatchHighlightImages): HighlightImageItem[] {
  const items: HighlightImageItem[] = []

  if (images.posterUrl) {
    items.push({ key: 'poster', label: 'Pôster', url: images.posterUrl })
  }

  if (images.bannerUrl) {
    items.push({ key: 'banner', label: 'Banner', url: images.bannerUrl })
  }

  if (images.fanartUrl) {
    items.push({ key: 'fanart', label: 'Fanart', url: images.fanartUrl })
  }

  if (images.thumbUrl) {
    items.push({ key: 'thumb', label: 'Destaque', url: images.thumbUrl })
  }

  return items
}

function HighlightsCarousel({ items }: { items: HighlightImageItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const hasMultipleSlides = items.length > 1

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return

    const clampedIndex = Math.max(0, Math.min(index, items.length - 1))
    const slide = track.children.item(clampedIndex) as HTMLElement | null
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
    setActiveIndex(clampedIndex)
  }, [items.length])

  useEffect(() => {
    const track = trackRef.current
    if (!track || !hasMultipleSlides) return

    const onScroll = () => {
      const slideWidth = track.clientWidth
      if (slideWidth <= 0) return

      const index = Math.round(track.scrollLeft / slideWidth)
      setActiveIndex(Math.max(0, Math.min(index, items.length - 1)))
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [hasMultipleSlides, items.length])

  const activeItem = items[activeIndex]

  const handleDownload = useCallback(async () => {
    if (!activeItem || isDownloading) return

    setIsDownloading(true)

    try {
      await downloadImageFromUrl(
        activeItem.url,
        buildHighlightImageFilename(activeItem.label, activeItem.url),
      )
    } finally {
      setIsDownloading(false)
    }
  }, [activeItem, isDownloading])

  return (
    <>
      <div className="relative h-[min(70vh,28rem)] overflow-hidden rounded-xl border border-slate-700/40 bg-pitch-950/40">
        {hasMultipleSlides && (
          <>
            <CarouselButton
              direction="prev"
              disabled={activeIndex === 0}
              onClick={() => scrollToIndex(activeIndex - 1)}
              className="left-2"
            />
            <CarouselButton
              direction="next"
              disabled={activeIndex === items.length - 1}
              onClick={() => scrollToIndex(activeIndex + 1)}
              className="right-2"
            />
          </>
        )}

        <div
          ref={trackRef}
          className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-roledescription="carrossel"
        >
          {items.map((item, index) => (
            <figure
              key={item.key}
              className="flex h-full w-full shrink-0 snap-start items-center justify-center p-3 sm:p-4"
              aria-roledescription="slide"
              aria-label={`${item.label}, ${index + 1} de ${items.length}`}
            >
              <img
                src={item.url}
                alt={`${item.label} da partida`}
                width={640}
                height={360}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'low'}
                decoding="async"
                className="max-h-full max-w-full object-contain"
              />
            </figure>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-1.5">
        <p className="text-xs font-medium text-slate-400">{activeItem?.label}</p>
        {activeItem && (
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={isDownloading}
            aria-label={isDownloading ? 'Baixando imagem' : `Baixar ${activeItem.label}`}
            className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:bg-white/5 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <DownloadIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {hasMultipleSlides && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {items.map((item, index) => (
            <button
              key={item.key}
              type="button"
              onClick={() => scrollToIndex(index)}
              aria-label={`Ir para ${item.label}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? 'w-5 bg-gold-400' : 'w-2 bg-slate-600 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>
      )}
    </>
  )
}

function MatchHighlightsGalleryContent({ match }: { match: Match }) {
  const { images, isLoading, error } = useMatchHighlights(match, true)

  if (isLoading && !images) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[min(70vh,28rem)] w-full rounded-xl" />
      </div>
    )
  }

  if (error && !images) {
    return <p className="text-sm text-slate-500">{error}</p>
  }

  if (!images || !hasMatchHighlightImages(images)) {
    return <p className="text-sm text-slate-500">Nenhuma imagem disponível para esta partida.</p>
  }

  const items = buildHighlightImageItems(images)

  return <HighlightsCarousel key={items.map((item) => item.key).join('-')} items={items} />
}

function CarouselButton({
  direction,
  disabled,
  onClick,
  className = '',
}: {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
  className?: string
}) {
  const label = direction === 'prev' ? 'Imagem anterior' : 'Próxima imagem'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`absolute top-1/2 z-[1] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-600/60 bg-pitch-900/90 text-slate-200 shadow-lg transition hover:border-slate-500 hover:bg-pitch-800 disabled:pointer-events-none disabled:opacity-30 ${className}`.trim()}
    >
      <CarouselChevronIcon direction={direction} />
    </button>
  )
}

function DownloadIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
  )
}

function CarouselChevronIcon({ direction }: { direction: 'prev' | 'next' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 ${direction === 'next' ? '' : 'rotate-180'}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function PanelChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function MatchHighlightsGallery({ match, className = '' }: MatchHighlightsGalleryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const isLive = match.isLive
  const isFinished = match.status === 'finished'

  if (!isLive && !isFinished) {
    return null
  }

  const title = isLive ? 'Imagens ao vivo' : 'Imagens da partida'

  function handleToggle() {
    setIsExpanded((open) => {
      const next = !open
      if (next) {
        setHasOpened(true)
      }
      return next
    })
  }

  return (
    <section
      className={`mt-4 rounded-2xl border border-slate-700/50 bg-pitch-800/40 p-4 sm:p-5 ${className}`.trim()}
      aria-label="Imagens da partida"
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls="match-highlights-panel"
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</h2>
        <PanelChevronIcon
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        id="match-highlights-panel"
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
        aria-hidden={!isExpanded}
      >
        <div className="min-h-0 overflow-hidden">
          {hasOpened && (
            <div className={isExpanded ? 'mt-4' : ''}>
              <MatchHighlightsGalleryContent match={match} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
