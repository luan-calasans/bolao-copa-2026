import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useDesktop } from '../hooks/useDesktop'
import { AdminRoute } from '../components/auth/AdminRoute'
import { ParticipantRoute as ParticipantAuthRoute } from '../components/auth/ParticipantRoute'
import { LoadingState } from '../components/ui/LoadingState'
import { HomeView } from '../views/HomeView'
import { APP_ROUTES } from './routePaths'
import {
  fetchHistoricalDataIndex,
  getHistoricalWorldCupYears,
  isValidHistoricalYear,
} from '../services/historicalWorldCupService'

const StandingsView = lazy(() =>
  import('../views/StandingsView').then((module) => ({ default: module.StandingsView })),
)
const ScorersView = lazy(() =>
  import('../views/ScorersView').then((module) => ({ default: module.ScorersView })),
)
const KnockoutView = lazy(() =>
  import('../views/KnockoutView').then((module) => ({ default: module.KnockoutView })),
)
const KnockoutSimulatorView = lazy(() =>
  import('../views/KnockoutSimulatorView').then((module) => ({
    default: module.KnockoutSimulatorView,
  })),
)
const RankingView = lazy(() =>
  import('../views/RankingView').then((module) => ({ default: module.RankingView })),
)
const TeamsView = lazy(() =>
  import('../views/TeamsView').then((module) => ({ default: module.TeamsView })),
)
const TeamView = lazy(() =>
  import('../views/TeamView').then((module) => ({ default: module.TeamView })),
)
const AllBetsView = lazy(() =>
  import('../views/AllBetsView').then((module) => ({ default: module.AllBetsView })),
)
const MatchBetsView = lazy(() =>
  import('../views/MatchBetsView').then((module) => ({ default: module.MatchBetsView })),
)
const BetView = lazy(() =>
  import('../views/BetView').then((module) => ({ default: module.BetView })),
)
const ChampionBetView = lazy(() =>
  import('../views/ChampionBetView').then((module) => ({ default: module.ChampionBetView })),
)
const ReceiptView = lazy(() =>
  import('../views/ReceiptView').then((module) => ({ default: module.ReceiptView })),
)
const ParticipantBetsView = lazy(() =>
  import('../views/ParticipantBetsView').then((module) => ({
    default: module.ParticipantBetsView,
  })),
)
const ParticipantLoginView = lazy(() =>
  import('../views/ParticipantLoginView').then((module) => ({
    default: module.ParticipantLoginView,
  })),
)
const MyBetsView = lazy(() =>
  import('../views/MyBetsView').then((module) => ({ default: module.MyBetsView })),
)
const AdminLoginView = lazy(() =>
  import('../views/AdminLoginView').then((module) => ({ default: module.AdminLoginView })),
)
const AdminBetsView = lazy(() =>
  import('../views/AdminBetsView').then((module) => ({ default: module.AdminBetsView })),
)
const NotFoundView = lazy(() =>
  import('../views/NotFoundView').then((module) => ({ default: module.NotFoundView })),
)
const HistoricoView = lazy(() =>
  import('../views/HistoricoView').then((module) => ({ default: module.HistoricoView })),
)
const HistoricoYearView = lazy(() =>
  import('../views/HistoricoYearView').then((module) => ({ default: module.HistoricoYearView })),
)

function RouteFallback() {
  return <LoadingState lines={4} />
}

function MatchBetsRoute() {
  const { matchId } = useParams<{ matchId: string }>()
  const id = Number(matchId)

  if (!matchId || Number.isNaN(id)) {
    return <Navigate to={APP_ROUTES.notFound} replace />
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <MatchBetsView matchId={id} />
    </Suspense>
  )
}

function BetRoute() {
  const { matchId } = useParams<{ matchId: string }>()
  const id = Number(matchId)

  if (!matchId || Number.isNaN(id)) {
    return <Navigate to={APP_ROUTES.notFound} replace />
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <ParticipantAuthRoute>
        <BetView matchId={id} />
      </ParticipantAuthRoute>
    </Suspense>
  )
}

function ReceiptRoute() {
  const { receiptId } = useParams<{ receiptId: string }>()

  if (!receiptId) {
    return <Navigate to={APP_ROUTES.notFound} replace />
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <ReceiptView receiptId={receiptId} />
    </Suspense>
  )
}

function HistoricoYearRoute() {
  const { year: yearParam } = useParams<{ year: string }>()
  const parsedYear = isValidHistoricalYear(yearParam ?? '')
  const [years, setYears] = useState<number[] | null>(null)

  useEffect(() => {
    let cancelled = false

    void fetchHistoricalDataIndex()
      .then((index) => {
        if (!cancelled) {
          setYears(getHistoricalWorldCupYears(index))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setYears([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!parsedYear) {
    return <Navigate to={APP_ROUTES.notFound} replace />
  }

  if (years == null) {
    return <RouteFallback />
  }

  if (!years.includes(parsedYear)) {
    return <Navigate to={APP_ROUTES.notFound} replace />
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <HistoricoYearView year={parsedYear} availableYears={years} />
    </Suspense>
  )
}

function TeamRoute() {
  const { teamId } = useParams<{ teamId: string }>()
  const id = Number(teamId)

  if (!teamId || Number.isNaN(id)) {
    return <Navigate to={APP_ROUTES.notFound} replace />
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <TeamView teamId={id} />
    </Suspense>
  )
}

function ParticipantProfileRoute() {
  const { personNameKey } = useParams<{ personNameKey: string }>()

  if (!personNameKey) {
    return <Navigate to={APP_ROUTES.notFound} replace />
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <ParticipantBetsView personNameKey={decodeURIComponent(personNameKey)} />
    </Suspense>
  )
}

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

function KnockoutSimulatorRoute() {
  const isDesktop = useDesktop()

  if (!isDesktop) {
    return <Navigate to={APP_ROUTES.home} replace />
  }

  return (
    <LazyRoute>
      <KnockoutSimulatorView />
    </LazyRoute>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path={APP_ROUTES.home} element={<HomeView />} />
      <Route
        path={APP_ROUTES.standings}
        element={
          <LazyRoute>
            <StandingsView />
          </LazyRoute>
        }
      />
      <Route
        path={APP_ROUTES.scorers}
        element={
          <LazyRoute>
            <ScorersView />
          </LazyRoute>
        }
      />
      <Route
        path={APP_ROUTES.knockout}
        element={
          <LazyRoute>
            <KnockoutView />
          </LazyRoute>
        }
      />
      <Route path={APP_ROUTES.knockoutSimulator} element={<KnockoutSimulatorRoute />} />
      <Route
        path={APP_ROUTES.historico}
        element={
          <LazyRoute>
            <HistoricoView />
          </LazyRoute>
        }
      />
      <Route path={APP_ROUTES.historicoYear} element={<HistoricoYearRoute />} />
      <Route
        path={APP_ROUTES.ranking}
        element={
          <LazyRoute>
            <RankingView />
          </LazyRoute>
        }
      />
      <Route path="/pontuacao" element={<Navigate to={APP_ROUTES.ranking} replace />} />
      <Route path={APP_ROUTES.participant} element={<ParticipantProfileRoute />} />
      <Route
        path={APP_ROUTES.teams}
        element={
          <LazyRoute>
            <TeamsView />
          </LazyRoute>
        }
      />
      <Route path={APP_ROUTES.team} element={<TeamRoute />} />
      <Route
        path={APP_ROUTES.allBets}
        element={
          <LazyRoute>
            <AllBetsView />
          </LazyRoute>
        }
      />
      <Route
        path={APP_ROUTES.championBet}
        element={
          <ParticipantAuthRoute>
            <LazyRoute>
              <ChampionBetView />
            </LazyRoute>
          </ParticipantAuthRoute>
        }
      />
      <Route path={APP_ROUTES.matchBets} element={<MatchBetsRoute />} />
      <Route path={APP_ROUTES.bet} element={<BetRoute />} />
      <Route path={APP_ROUTES.receipt} element={<ReceiptRoute />} />
      <Route
        path={APP_ROUTES.participantLogin}
        element={
          <LazyRoute>
            <ParticipantLoginView />
          </LazyRoute>
        }
      />
      <Route
        path={APP_ROUTES.myBets}
        element={
          <LazyRoute>
            <MyBetsView />
          </LazyRoute>
        }
      />
      <Route
        path={APP_ROUTES.adminLogin}
        element={
          <LazyRoute>
            <AdminLoginView />
          </LazyRoute>
        }
      />
      <Route
        path={APP_ROUTES.adminBets}
        element={
          <AdminRoute>
            <LazyRoute>
              <AdminBetsView />
            </LazyRoute>
          </AdminRoute>
        }
      />
      <Route
        path={APP_ROUTES.notFound}
        element={
          <LazyRoute>
            <NotFoundView />
          </LazyRoute>
        }
      />
      <Route
        path="*"
        element={
          <LazyRoute>
            <NotFoundView />
          </LazyRoute>
        }
      />
    </Routes>
  )
}
