import type { BetsTableItem } from '../models/betsTable'

let participantBetItemsCache: Map<string, BetsTableItem[]> | null = null
let participantBetItemsPromise: Promise<Map<string, BetsTableItem[]>> | null = null

export function getParticipantBetItemsCache(): Map<string, BetsTableItem[]> | null {
  return participantBetItemsCache
}

export function setParticipantBetItemsCache(value: Map<string, BetsTableItem[]>): void {
  participantBetItemsCache = value
}

export function getParticipantBetItemsPromise(): Promise<Map<string, BetsTableItem[]>> | null {
  return participantBetItemsPromise
}

export function setParticipantBetItemsPromise(
  value: Promise<Map<string, BetsTableItem[]>> | null,
): void {
  participantBetItemsPromise = value
}

export function invalidateParticipantBetItemsCache(): void {
  participantBetItemsCache = null
  participantBetItemsPromise = null
}
