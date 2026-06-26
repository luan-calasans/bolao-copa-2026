import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../ui/ThemeToggle'
import { ParticipantAuthButton } from './ParticipantAuthButton'
import { APP_ROUTES, MAIN_NAV, type MainNavLink } from '../../routes/routePaths'

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function readHeaderHeight(header: HTMLElement): number {
  return header.offsetHeight
}

function isNavLinkActive(pathname: string, link: MainNavLink): boolean {
  return link.end ? pathname === link.path : pathname.startsWith(link.path)
}

function isNavGroupActive(pathname: string, items: ReadonlyArray<MainNavLink>): boolean {
  return items.some((item) => isNavLinkActive(pathname, item))
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-pitch-700 text-brazil-yellow'
      : 'text-slate-300 hover:bg-pitch-800 hover:text-white'
  }`

const navGroupButtonClass = (isActive: boolean) =>
  `flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-pitch-700 text-brazil-yellow'
      : 'text-slate-300 hover:bg-pitch-800 hover:text-white'
  }`

function NavGroupDropdown({
  label,
  items,
  onNavigate,
}: {
  label: string
  items: ReadonlyArray<MainNavLink>
  onNavigate?: () => void
}) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLLIElement>(null)
  const isActive = isNavGroupActive(pathname, items)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  function handleNavigate() {
    setOpen(false)
    onNavigate?.()
    scrollToTop()
  }

  return (
    <li ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        className={navGroupButtonClass(isActive)}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        {label}
        <ChevronIcon open={open} />
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-lg border border-slate-700/80 bg-pitch-900 py-1 shadow-lg shadow-black/30"
        >
          {items.map((item) => (
            <li key={item.path} role="none">
              <NavLink
                to={item.path}
                end={item.end}
                role="menuitem"
                className={({ isActive: linkActive }) =>
                  `block px-3 py-2 text-sm font-semibold transition ${
                    linkActive
                      ? 'bg-pitch-800 text-brazil-yellow'
                      : 'text-slate-300 hover:bg-pitch-800 hover:text-white'
                  }`
                }
                onClick={handleNavigate}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function MainNavDesktop() {
  return (
    <ul className="flex items-center gap-1">
      {MAIN_NAV.map((item) =>
        item.type === 'link' ? (
          <li key={item.path} className="shrink-0">
            <NavLink to={item.path} end={item.end} className={navLinkClass} onClick={scrollToTop}>
              {item.label}
            </NavLink>
          </li>
        ) : (
          <NavGroupDropdown key={item.label} label={item.label} items={item.items} />
        ),
      )}
    </ul>
  )
}

function MainNavMobile({
  onNavigate,
  className = '',
}: {
  onNavigate?: () => void
  className?: string
}) {
  function handleNavigate() {
    onNavigate?.()
    scrollToTop()
  }

  return (
    <ul className={`flex flex-col gap-1 ${className}`}>
      {MAIN_NAV.map((item) =>
        item.type === 'link' ? (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.end}
              className={navLinkClass}
              onClick={handleNavigate}
            >
              {item.label}
            </NavLink>
          </li>
        ) : (
          <li key={item.label} className="pt-1">
            <p className="px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <ul className="flex flex-col gap-0.5 pl-2">
              {item.items.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    end={link.end}
                    className={navLinkClass}
                    onClick={handleNavigate}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
        ),
      )}
    </ul>
  )
}

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

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
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

  function closeMobileMenu() {
    setMenuOpenPath(null)
  }

  return (
    <>
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/80 bg-pitch-950 pt-[env(safe-area-inset-top,0px)]"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
          <Link
            to={APP_ROUTES.home}
            className="group flex min-w-0 shrink-0 cursor-pointer items-center gap-2 sm:gap-3"
            onClick={handleHeaderClick}
          >
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Bolão"
              width={44}
              height={44}
              className="h-10 w-10 shrink-0 rounded-xl object-contain shadow-md shadow-brazil-yellow/10 transition group-hover:brightness-110 sm:h-11 sm:w-11"
              loading="eager"
              fetchPriority="high"
            />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black tracking-tight text-white sm:text-2xl">
                BOLÃO
              </h1>
            </div>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:gap-3">
            <nav aria-label="Navegação principal" className="hidden lg:block">
              <MainNavDesktop />
            </nav>
            <ThemeToggle />
            <ParticipantAuthButton />
            <button
              type="button"
              onClick={() => setMenuOpenPath(isMenuOpen ? null : pathname)}
              aria-expanded={isMenuOpen}
              aria-controls="main-nav-menu-mobile"
              aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-700/60 bg-pitch-800/60 text-white transition hover:border-brazil-yellow/40 hover:bg-pitch-700/80 lg:hidden"
            >
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        <nav
          id="main-nav-menu-mobile"
          aria-label="Navegação principal"
          aria-hidden={!isMenuOpen}
          className={`grid border-t border-slate-800/60 bg-pitch-950 transition-[grid-template-rows,opacity] duration-300 ease-out lg:hidden ${
            isMenuOpen
              ? 'pointer-events-auto grid-rows-[1fr] opacity-100'
              : 'pointer-events-none grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden px-4 py-2 sm:px-6 sm:py-2.5">
            <MainNavMobile onNavigate={closeMobileMenu} />
          </div>
        </nav>

        {isMenuOpen && (
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-x-0 bottom-0 z-40 cursor-default bg-pitch-950/70 backdrop-blur-sm lg:hidden"
            style={{ top: overlayTop }}
            onClick={closeMobileMenu}
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
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
