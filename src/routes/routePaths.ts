export const APP_ROUTES = {
  home: '/',
  standings: '/classificacao',
  scorers: '/artilharia',
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
  participantLogin: '/entrar',
  myBets: '/meus-palpites',
  adminLogin: '/admin/login',
  adminBets: '/admin/palpites',
  historico: '/historico',
  historicoYear: '/historico/:year',
  notFound: '/404',
} as const

export type AppRoutePath = (typeof APP_ROUTES)[keyof typeof APP_ROUTES]

export type MainNavLink = {
  path: string
  label: string
  end?: boolean
}

export type MainNavItem =
  | ({ type: 'link' } & MainNavLink)
  | { type: 'group'; label: string; items: ReadonlyArray<MainNavLink> }

export const MAIN_NAV: ReadonlyArray<MainNavItem> = [
  { type: 'link', path: APP_ROUTES.home, label: 'Jogos', end: true },
  { type: 'link', path: APP_ROUTES.allBets, label: 'Palpites' },
  { type: 'link', path: APP_ROUTES.ranking, label: 'Ranking' },
  {
    type: 'group',
    label: 'Copa',
    items: [
      { path: APP_ROUTES.standings, label: 'Classificação' },
      { path: APP_ROUTES.scorers, label: 'Artilharia' },
      { path: APP_ROUTES.knockout, label: 'Mata-mata' },
      { path: APP_ROUTES.championBet, label: 'Campeão' },
    ],
  },
  {
    type: 'group',
    label: 'Mais',
    items: [
      { path: APP_ROUTES.historico, label: 'Histórico' },
      { path: APP_ROUTES.teams, label: 'Seleções' },
    ],
  },
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

export function historicoYearPath(year: number): string {
  return `/historico/${year}`
}
