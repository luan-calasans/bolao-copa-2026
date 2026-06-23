import { useState } from 'react'

const TIEBREAKER_CRITERIA = [
  'Maior saldo de gols no grupo',
  'Maior número de gols marcados no grupo',
  'Maior número de pontos no confronto direto',
  'Maior saldo de gols no confronto direto',
  'Maior número de gols no confronto direto',
  'Fair Play (menos cartões: 1 amarelo, 3 dois amarelos, 4 vermelho direto, 5 amarelo + vermelho)',
  'Sorteio da FIFA',
]

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function StandingsGroupStageInfo() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="mb-6 rounded-2xl border border-slate-700/50 bg-pitch-800/40 p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setIsExpanded((open) => !open)}
        aria-expanded={isExpanded}
        aria-controls="standings-group-stage-info"
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Como funciona a fase de grupos
        </h2>
        <ChevronIcon
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        id="standings-group-stage-info"
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
        aria-hidden={!isExpanded}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={`space-y-4 text-sm leading-relaxed text-slate-400 ${isExpanded ? 'mt-4' : ''}`}>
            <p>
              Na fase de grupos, as 48 seleções são divididas em <strong className="text-slate-200">12 grupos de 4 equipes</strong>{' '}
              (A a L). Cada seleção disputa <strong className="text-slate-200">3 partidas</strong> em turno único,
              enfrentando todos os adversários do seu grupo. A pontuação é{' '}
              <strong className="text-slate-200">3 pontos por vitória</strong>,{' '}
              <strong className="text-slate-200">1 por empate</strong> e nenhum por derrota.
            </p>

            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quem avança
              </h3>
              <ul className="list-disc space-y-1 pl-5">
                <li>Os 2 primeiros colocados de cada um dos 12 grupos</li>
                <li>Os 8 melhores terceiros colocados na classificação geral</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Critérios de desempate
              </h3>
              <p className="mb-2">
                Se duas ou mais equipes terminarem com o mesmo número de pontos, a FIFA aplica os critérios
                abaixo, nesta ordem:
              </p>
              <ol className="list-decimal space-y-1 pl-5">
                {TIEBREAKER_CRITERIA.map((criterion) => (
                  <li key={criterion}>{criterion}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
