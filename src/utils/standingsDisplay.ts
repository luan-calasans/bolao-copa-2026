export function formatStandingGroup(group: string | null): string {
  if (!group) return 'Classificação'

  if (group.startsWith('GROUP_')) {
    return `Grupo ${group.replace('GROUP_', '')}`
  }

  return group.replace(/_/g, ' ')
}

export function getStandingRowClasses(position: number): string {
  switch (position) {
    case 1:
    case 2:
      return 'bg-brazil-green/10'
    case 3:
      return 'bg-brazil-yellow/10'
    case 4:
      return 'bg-red-500/10'
    default:
      return ''
  }
}
