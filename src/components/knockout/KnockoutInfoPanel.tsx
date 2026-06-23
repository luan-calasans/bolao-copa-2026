import { useState } from 'react'

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

export function KnockoutInfoPanel() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="mb-6 rounded-2xl border border-slate-700/50 bg-pitch-800/40 p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setIsExpanded((open) => !open)}
        aria-expanded={isExpanded}
        aria-controls="knockout-info-panel"
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Como funciona o mata-mata
        </h2>
        <ChevronIcon
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        id="knockout-info-panel"
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
        aria-hidden={!isExpanded}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={`space-y-4 text-sm leading-relaxed text-slate-400 ${isExpanded ? 'mt-4' : ''}`}>
            <p>
              Para saber quem vai ao mata-mata, acompanhe a pontuação na fase de grupos. Com{' '}
              <strong className="text-slate-200">48 seleções</strong> em{' '}
              <strong className="text-slate-200">12 grupos de 4</strong>, avançam{' '}
              <strong className="text-slate-200">32 equipes</strong> para uma fase extra antes das
              oitavas tradicionais.
            </p>

            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Critérios na fase de grupos
              </h3>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Maior número de pontos (3 vitória, 1 empate, 0 derrota)</li>
                <li>Saldo de gols</li>
                <li>Gols pró (gols marcados)</li>
              </ol>
            </div>

            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quem avança
              </h3>
              <ul className="list-disc space-y-1 pl-5">
                <li>Os 2 primeiros de cada um dos 12 grupos</li>
                <li>Os 8 melhores terceiros colocados na classificação geral</li>
              </ul>
            </div>

            <p>
              Como <strong className="text-slate-200">32 seleções</strong> passam da fase de grupos, a
              FIFA criou os <strong className="text-slate-200">16 avos de final</strong> (Round of 32):
              mata-mata de jogo único entre as 32 classificadas, que depois segue para oitavas, quartas,
              semifinais e a final.
            </p>

            <p className="text-xs text-slate-500">
              Os confrontos com terceiros colocados seguem a matriz oficial da FIFA (495 combinações
              possíveis). A chave abaixo é atualizada com a classificação atual e pode mudar até o fim da
              fase de grupos.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
