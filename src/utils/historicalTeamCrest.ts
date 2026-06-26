import teamCrestIndex from '../data/teamCrests.json'
import { canonicalizeTeamName, getTeamCode } from './historicalTeamNames'

interface TeamCrestEntry {
  name: string
  tla?: string | null
  file: string
}

/** Arquivos locais cujo nome difere do código FIFA habitual. */
const CREST_CODE_FILES: Record<string, string> = {
  YUG: 'yug.svg',
  BOL: 'bol.svg',
  PER: 'pe.webp',
  PE: 'pe.webp',
  POL: 'pl.svg',
  PL: 'pl.svg',
  SRB: 'srb.png',
  NGA: 'nga.png',
  ISL: 'isl.svg',
  GRE: 'grc.svg',
  GRC: 'grc.svg',
  HON: 'hn.png',
  HN: 'hn.png',
  SVN: 'svn.svg',
  SVK: 'sk.svg',
  SK: 'sk.svg',
  PRK: 'prk.svg',
  TRI: 'tto.svg',
  TTO: 'tto.svg',
  SCG: 'scg.svg',
  ANG: 'ago.svg',
  AGO: 'ago.svg',
  TOG: 'tg.png',
  TG: 'tg.png',
  CHN: 'cn.webp',
  CN: 'cn.webp',
  IRL: 'irl.svg',
  NIR: 'irdn.png',
  IRDN: 'irdn.png',
  JAM: 'jm.svg',
  JM: 'jm.svg',
  UAE: 'eau.png',
  EAU: 'eau.png',
  UKR: 'ukr.png',
  SLV: 'esd.svg',
  ESD: 'esd.svg',
  KUW: 'kwtt.png',
  KWTT: 'kwtt.png',
  ISR: 'isral.png',
  ISRAL: 'isral.png',
}

const CREST_CANONICAL_FILES: Record<string, string> = {
  Yugoslavia: 'yug.svg',
  Bolivia: 'bol.svg',
  Peru: 'pe.webp',
  Poland: 'pl.svg',
  Serbia: 'srb.png',
  Nigeria: 'nga.png',
  Iceland: 'isl.svg',
  Greece: 'grc.svg',
  Honduras: 'hn.png',
  Slovenia: 'svn.svg',
  Slovakia: 'sk.svg',
  'North Korea': 'prk.svg',
  'Trinidad and Tobago': 'tto.svg',
  'Serbia and Montenegro': 'scg.svg',
  Angola: 'ago.svg',
  Togo: 'tg.png',
  China: 'cn.webp',
  Ireland: 'irl.svg',
  'Northern Ireland': 'irdn.png',
  Jamaica: 'jm.svg',
  'United Arab Emirates': 'eau.png',
  Ukraine: 'ukr.png',
  'El Salvador': 'esd.svg',
  Kuwait: 'kwtt.png',
  Israel: 'isral.png',
}

const CREST_NAME_FALLBACKS: Record<string, string> = {
  'West Germany': 'Germany',
  'East Germany': 'Germany',
  Czechoslovakia: 'Czechia',
  'Czech Republic': 'Czechia',
  'Soviet Union': 'Russia',
  'Bosnia and Herzegovina': 'Bosnia-Herzegovina',
  'IR Iran': 'Iran',
  'Korea Republic': 'South Korea',
  USA: 'United States',
}

function buildCrestLookup(): Map<string, string> {
  const lookup = new Map<string, string>()

  for (const entry of teamCrestIndex.teams as TeamCrestEntry[]) {
    lookup.set(canonicalizeTeamName(entry.name), entry.file)

    if (entry.tla?.trim()) {
      lookup.set(entry.tla.trim().toUpperCase(), entry.file)
    }
  }

  for (const [canonicalName, file] of Object.entries(CREST_CANONICAL_FILES)) {
    lookup.set(canonicalName, file)
  }

  for (const [code, file] of Object.entries(CREST_CODE_FILES)) {
    lookup.set(code, file)
  }

  return lookup
}

const crestLookup = buildCrestLookup()

function resolveCrestFile(canonicalName: string): string | null {
  const direct = crestLookup.get(canonicalName)
  if (direct) return direct

  const canonicalFile = CREST_CANONICAL_FILES[canonicalName]
  if (canonicalFile) return canonicalFile

  const fallbackName = CREST_NAME_FALLBACKS[canonicalName]
  if (fallbackName) {
    const fallbackCanonical = canonicalizeTeamName(fallbackName)
    const fallbackFile = crestLookup.get(fallbackCanonical)
    if (fallbackFile) return fallbackFile
  }

  const code = getTeamCode(canonicalName)
  return crestLookup.get(code) ?? CREST_CODE_FILES[code] ?? null
}

export function getHistoricalTeamCrestUrl(teamName: string): string | null {
  const canonical = canonicalizeTeamName(teamName)
  const file = resolveCrestFile(canonical)
  if (!file) return null

  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/')
  return `${base}teams/${file}`
}
