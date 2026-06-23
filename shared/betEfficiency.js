export function computeHitRateEfficiency(exactHits, partialHits, missedHits) {
  const decided = exactHits + partialHits + missedHits
  if (decided === 0) return null
  return ((exactHits + partialHits) / decided) * 100
}

export function formatEfficiencyPercent(value) {
  if (value === null || value === undefined) return '—'
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
}

export const EFFICIENCY_RULE = {
  title: 'Eficiência',
  description:
    'Percentual de palpites que acertaram (placar exato ou parcial) entre os jogos já encerrados. Jogos aguardando não entram no cálculo.',
  formula: '(Exatos + Parciais) ÷ (Exatos + Parciais + Erros) × 100',
}
