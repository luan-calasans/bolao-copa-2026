import { useEffect, useId, useState } from 'react'
import type { ScoringRule, ScoringRuleItem } from '../../utils/betScoring'
import { EFFICIENCY_RULE } from '../../utils/betEfficiency'
import { getBetResultPointsClass, resultBadgeClass } from '../bet/betsTableStyles'
import { Button } from '../ui/Button'

interface RankingRulesInfoProps {
  rules: ScoringRule[]
}

function parseRulePoints(points: string): number {
  return Number.parseInt(points, 10) || 0
}

function getScoringRuleBadgeClass(points: string): string {
  const value = parseRulePoints(points)
  return getBetResultPointsClass(value, value === 0 ? 'none' : 'exact')
}

export function RankingRulesInfo({ rules }: RankingRulesInfoProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label="Ver regras de pontuação"
        title="Regras de pontuação"
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-600/60 bg-pitch-800/80 text-sm font-bold text-slate-300 transition hover:border-gold-500/50 hover:bg-gold-500/10 hover:text-gold-400"
      >
        i
      </button>

      <ScoringRulesModal isOpen={isOpen} rules={rules} onClose={() => setIsOpen(false)} />
    </>
  )
}

interface ScoringRulesModalProps {
  isOpen: boolean
  rules: ScoringRule[]
  onClose: () => void
}

function isScoringRuleGroup(rule: ScoringRule): rule is Extract<ScoringRule, { items: ScoringRuleItem[] }> {
  return 'items' in rule
}

function ScoringRuleCard({ title, points, description }: ScoringRuleItem) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
      <span
        className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 ${resultBadgeClass} ${getScoringRuleBadgeClass(points)}`}
      >
        {points}
      </span>
    </div>
  )
}

function ScoringRulesModal({ isOpen, rules, onClose }: ScoringRulesModalProps) {
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar modal"
        className="absolute inset-0 cursor-default bg-pitch-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-pitch-900 shadow-2xl shadow-black/40"
      >
        <div className="border-b border-slate-700/40 px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold text-white">
            Regras de pontuação
          </h2>
          <p id={descriptionId} className="mt-1 text-sm text-slate-400">
            Os pontos são calculados automaticamente quando o jogo é encerrado.
          </p>
        </div>

        <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {rules.map((rule) =>
            isScoringRuleGroup(rule) ? (
              <li
                key={rule.title}
                className="rounded-xl border border-slate-700/40 bg-pitch-950/50 p-4"
              >
                <p className="text-sm font-semibold text-white">{rule.title}</p>
                <div className="mt-3 space-y-3">
                  {rule.items.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-lg border border-slate-700/30 bg-pitch-900/40 p-3"
                    >
                      <ScoringRuleCard {...item} />
                    </div>
                  ))}
                </div>
              </li>
            ) : (
              <li
                key={rule.title}
                className="rounded-xl border border-slate-700/40 bg-pitch-950/50 p-4"
              >
                <ScoringRuleCard {...rule} />
              </li>
            ),
          )}
        </ul>

        <div className="border-t border-slate-700/40 px-5 py-4">
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <p className="text-sm font-semibold text-violet-200">{EFFICIENCY_RULE.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {EFFICIENCY_RULE.description}
            </p>
            <p className="mt-2 font-mono text-xs text-slate-500">{EFFICIENCY_RULE.formula}</p>
          </div>
        </div>

        <div className="border-t border-slate-700/40 bg-pitch-950/40 px-5 py-4">
          <Button type="button" variant="gold" className="w-full" onClick={onClose}>
            Entendi
          </Button>
        </div>
      </div>
    </div>
  )
}
