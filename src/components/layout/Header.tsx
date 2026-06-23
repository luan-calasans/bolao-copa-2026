import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../ui/ThemeToggle'
import { APP_ROUTES, MAIN_NAV_ROUTES } from '../../routes/routePaths'

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function readHeaderHeight(header: HTMLElement): number {
  return header.offsetHeight
}

const desktopNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-pitch-700 text-brazil-yellow'
      : 'text-slate-300 hover:bg-pitch-800 hover:text-white'
  }`

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-3 text-sm font-semibold transition ${
    isActive
      ? 'bg-pitch-700 text-brazil-yellow'
      : 'text-slate-200 hover:bg-pitch-800 hover:text-white'
  }`

export function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isHome = pathname === APP_ROUTES.home
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null)
  const isMenuOpen = menuOpenPath === pathname
  const [headerHeight, setHeaderHeight] = useState<number | null>(null)
  const [overlayTop, setOverlayTop] = useState(0)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpenPath(null)
    }

    function handleResize() {
      if (window.innerWidth >= 1024) setMenuOpenPath(null)
    }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', handleResize)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('resize', handleResize)
    }
  }, [isMenuOpen])

  useLayoutEffect(() => {
    const header = headerRef.current
    if (!header) return

    function updateHeaderMetrics() {
      const nextHeight = readHeaderHeight(header!)
      setHeaderHeight(nextHeight)
      setOverlayTop(header!.getBoundingClientRect().bottom)
      document.documentElement.style.setProperty('--app-header-height', `${nextHeight}px`)
    }

    updateHeaderMetrics()

    const observer = new ResizeObserver(updateHeaderMetrics)
    observer.observe(header)

    return () => observer.disconnect()
  }, [isMenuOpen])

  function handleHeaderClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()

    if (isHome) {
      scrollToTop()
      return
    }

    navigate(APP_ROUTES.home)
    scrollToTop()
  }

  function handleNavClick() {
    setMenuOpenPath(null)
    scrollToTop()
  }

  return (
    <>
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/80 bg-pitch-950/95 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
          <Link
            to={APP_ROUTES.home}
            className="group flex min-w-0 cursor-pointer items-center gap-2 sm:gap-3"
            onClick={handleHeaderClick}
          >
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Bolão Copa 2026"
              width={44}
              height={44}
              className="h-10 w-10 shrink-0 rounded-xl object-contain shadow-md shadow-brazil-yellow/10 transition group-hover:brightness-110 sm:h-11 sm:w-11"
              loading="eager"
              fetchPriority="high"
            />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black tracking-tight text-white sm:text-2xl">
                BOLÃO <span className="text-brazil-yellow">2026</span>
              </h1>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
            {MAIN_NAV_ROUTES.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={desktopNavLinkClass}
                onClick={scrollToTop}
              >
                {item.label}
              </NavLink>
            ))}
            <ThemeToggle className="ml-1" />
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpenPath(isMenuOpen ? null : pathname)}
              aria-expanded={isMenuOpen}
              aria-controls="main-nav-menu"
              aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-700/60 bg-pitch-800/60 text-white transition hover:border-brazil-yellow/40 hover:bg-pitch-700/80 lg:hidden"
            >
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        <nav
          id="main-nav-menu"
          aria-label="Navegação principal"
          aria-hidden={!isMenuOpen}
          className={`overflow-hidden border-t border-slate-800/60 bg-pitch-950/95 transition-all duration-300 ease-out lg:hidden ${
            isMenuOpen
              ? 'pointer-events-auto max-h-80 opacity-100'
              : 'pointer-events-none max-h-0 opacity-0'
          }`}
        >
          <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-2.5 sm:px-6">
            {MAIN_NAV_ROUTES.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  className={mobileNavLinkClass}
                  onClick={handleNavClick}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {isMenuOpen && (
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-x-0 bottom-0 z-40 cursor-default bg-pitch-950/70 backdrop-blur-sm lg:hidden"
            style={{ top: overlayTop }}
            onClick={() => setMenuOpenPath(null)}
          />
        )}
      </header>
      <div
        aria-hidden="true"
        className="header-offset shrink-0"
        style={headerHeight != null ? { height: headerHeight } : undefined}
      />
    </>
  )
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
