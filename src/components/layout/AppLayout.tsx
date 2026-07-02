import type { ReactNode } from 'react'
import { TopRankingFab } from '../ranking/TopRankingFab'
import { Footer } from './Footer'
import { Header } from './Header'
import { ScrollToTopButton } from './ScrollToTopButton'

interface AppLayoutProps {
  children: ReactNode
  betHref?: string
}

export function AppLayout({ children, betHref }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden lg:overflow-x-visible">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 overflow-x-hidden px-4 py-6 [--app-main-padding-top:1.5rem] sm:px-6 sm:py-8 sm:[--app-main-padding-top:2rem] lg:overflow-x-visible">
        {children}
      </main>
      <Footer />
      <ScrollToTopButton betHref={betHref} leadingActions={<TopRankingFab />} />
    </div>
  )
}
