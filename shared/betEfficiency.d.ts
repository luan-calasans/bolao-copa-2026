export function computeHitRateEfficiency(
  exactHits: number,
  partialHits: number,
  missedHits: number,
): number | null

export function formatEfficiencyPercent(value: number | null | undefined): string

export interface EfficiencyRule {
  title: string
  description: string
  formula: string
}

export const EFFICIENCY_RULE: EfficiencyRule
