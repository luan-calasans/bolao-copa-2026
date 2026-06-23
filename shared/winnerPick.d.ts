export type WinnerPick = 'home' | 'away' | 'draw'

export const WINNER_PICKS: WinnerPick[]

export function isValidWinnerPick(value: unknown): value is WinnerPick

export function validateWinnerPick(value: unknown): string | null
