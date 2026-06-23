import { useLottie } from 'lottie-react'
import { useEffect, useRef, useState } from 'react'
import { GiSoccerBall } from 'react-icons/gi'
import { useNavigate } from 'react-router-dom'

const SCROLL_THRESHOLD = 300
const BET_TRANSITION_MS = 1500

const FLOATING_BUTTON_SIZE =
  'h-14 w-14 shrink-0 sm:h-16 sm:w-16'

const floatingButtonClass = `${FLOATING_BUTTON_SIZE} grid place-items-center rounded-full border shadow-lg backdrop-blur-md`

const ballButtonClass = `bet-ball-fab pointer-events-auto grid place-items-center border border-[#007A55]/40 bg-pitch-900/95 text-white shadow-lg shadow-black/25 transition-colors hover:border-[#007A55]/70 hover:bg-pitch-800 ${FLOATING_BUTTON_SIZE} rounded-full`

interface BetTransitionLottieProps {
  animationData: object
  className?: string
}

function BetTransitionLottie({ animationData, className }: BetTransitionLottieProps) {
  const { View } = useLottie({ animationData, loop: true })
  return <div className={className}>{View}</div>
}

interface ScrollToTopButtonProps {
  betHref?: string
}

export function ScrollToTopButton({ betHref }: ScrollToTopButtonProps) {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [isBetTransitioning, setIsBetTransitioning] = useState(false)
  const [lottieData, setLottieData] = useState<object | null>(null)
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > SCROLL_THRESHOLD)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!betHref || lottieData) return

    fetch('/world-cup-lottie.json')
      .then((response) => response.json())
      .then(setLottieData)
      .catch(() => {})
  }, [betHref, lottieData])

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBetClick() {
    if (!betHref || isBetTransitioning) return

    setIsBetTransitioning(true)

    transitionTimeoutRef.current = setTimeout(() => {
      navigate(betHref)
    }, BET_TRANSITION_MS)
  }

  return (
    <>
      <div className="pointer-events-none fixed right-4 bottom-6 z-40 flex flex-col items-center gap-2 sm:right-6 sm:bottom-8">
        {isVisible && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Voltar ao topo"
            className={`pointer-events-auto cursor-pointer border-gold-500/40 bg-pitch-900/95 text-gold-400 shadow-black/30 hover:border-gold-500/70 hover:bg-pitch-800 hover:text-gold-300 ${floatingButtonClass}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[1.375rem] w-[1.375rem] sm:h-7 sm:w-7"
              aria-hidden="true"
            >
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          </button>
        )}

        {betHref && !isBetTransitioning && (
          <button
            type="button"
            onClick={handleBetClick}
            aria-label="Palpitar"
            className={`${ballButtonClass} cursor-pointer`}
          >
            <GiSoccerBall
              className="h-11 w-11 sm:h-12 sm:w-12"
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {isBetTransitioning && (
        <div
          className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-pitch-950/75 backdrop-blur-sm"
          aria-live="polite"
          aria-label="Abrindo palpite"
        >
          {lottieData && (
            <BetTransitionLottie animationData={lottieData} className="h-56 w-56 sm:h-72 sm:w-72" />
          )}
        </div>
      )}
    </>
  )
}
