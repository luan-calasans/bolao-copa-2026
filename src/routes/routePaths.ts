export const APP_ROUTES = {
  home: '/',
  standings: '/classificacao',
  knockout: '/mata-a-mata',
  ranking: '/ranking',
  participant: '/participante/:personNameKey',
  teams: '/times',
  team: '/times/:teamId',
  allBets: '/palpites',
  matchBets: '/jogo/:matchId/palpites',
  bet: '/palpite/:matchId',
  championBet: '/campeao',
  receipt: '/comprovante/:receiptId',
  adminLogin: '/admin/login',
  adminBets: '/admin/palpites',
  notFound: '/404',
} as const

export type AppRoutePath = (typeof APP_ROUTES)[keyof typeof APP_ROUTES]

export const MAIN_NAV_ROUTES: ReadonlyArray<{
  path: string
  label: string
  end?: boolean
}> = [
  { path: APP_ROUTES.home, label: 'Jogos', end: true },
  { path: APP_ROUTES.allBets, label: 'Palpites' },
  { path: APP_ROUTES.ranking, label: 'Ranking' },
  { path: APP_ROUTES.championBet, label: 'Campeão' },
  { path: APP_ROUTES.standings, label: 'Classificação' },
  { path: APP_ROUTES.knockout, label: 'Mata-mata' },
  { path: APP_ROUTES.teams, label: 'Seleções' },
]

export function participantPath(personNameKey: string): string {
  return `/participante/${encodeURIComponent(personNameKey)}`
}

export function teamPath(teamId: number): string {
  return `/times/${teamId}`
}

export function matchBetsPath(matchId: number): string {
  return `/jogo/${matchId}/palpites`
}

export function betPath(matchId: number): string {
  return `/palpite/${matchId}`
}

export function receiptPath(receiptId: string): string {
  return `/comprovante/${receiptId}`
}
