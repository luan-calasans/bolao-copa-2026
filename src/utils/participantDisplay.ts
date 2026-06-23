import { formatPersonNameForStorage } from '../../shared/personNameFormat.js'

export function formatPersonNameKeyDisplay(personNameKey: string): string {
  return formatPersonNameForStorage(personNameKey)
}
