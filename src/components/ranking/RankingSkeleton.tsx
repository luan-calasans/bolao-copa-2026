import { Skeleton } from '../ui/Skeleton'

export function RankingSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-pitch-800/40" aria-busy="true" aria-label="Carregando ranking">
      <div className="border-b border-slate-700/40 bg-pitch-900/40 px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700/40">
              {[
                '#',
                'Participante',
                'Pontos',
                'Exatos',
                'Parciais',
                'Eficiência',
                'Palpites',
                'Aguardando',
              ].map(
                (_, index) => (
                  <th key={index} className="px-4 py-3">
                    <Skeleton className="h-4 w-14" />
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, index) => (
              <tr key={index} className="border-b border-slate-700/20 last:border-b-0">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-6" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="mx-auto h-5 w-10" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="mx-auto h-4 w-8" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="mx-auto h-4 w-8" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="mx-auto h-4 w-10" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="mx-auto h-4 w-8" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="mx-auto h-4 w-8" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
