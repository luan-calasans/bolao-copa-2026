import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { KnockoutMatch, KnockoutParticipant, KnockoutRound } from '../../models/knockout'
import { matchBetsPath } from '../../routes/routePaths'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { TeamCrest } from '../ui/TeamCrest'
import {
  type BracketDimensions,
  type BracketSide,
  computeBracketDimensions,
  deriveBracketProfile,
  getBracketTotalHeight,
  getCenterPodConnectorAnchors,
  getCenterPodTargetY,
  measureCenterPodConnectors,
  type CenterPodConnectorLayout,
  getFinalMatch,
  getMatchWinner,
  getNodeCenterY,
  getRoundColumnX,
  getSemiFinalMatches,
  getSideMatches,
  getSeedSlotY,
  getSideSeedParticipants,
  getSideTeamSlots,
  getTeamRowY,
  getThirdPlaceMatch,
  getTreeBracketRounds,
  isKnockoutMatchPlayable,
} from './knockoutBracketLayout'

interface KnockoutBracketDesktopProps {
  rounds: KnockoutRound[]
  linkTeams?: boolean
}

function centerStyle(x: number, y: number): CSSProperties {
  return {
    left: x,
    top: y,
    transform: 'translate(-50%, -50%)',
  }
}

function buildConnectorPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  side: BracketSide,
): string {
  const midX = side === 'left' ? fromX + (toX - fromX) * 0.5 : fromX - (fromX - toX) * 0.5
  return `M ${fromX} ${fromY} H ${midX} V ${toY} H ${toX}`
}

function buildCenterPodConnectorPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  side: BracketSide,
): string {
  return buildConnectorPath(fromX, fromY, toX, toY, side)
}

function buildBracketPaths(
  rounds: KnockoutRound[],
  dimensions: BracketDimensions,
  connectorLayout?: CenterPodConnectorLayout | null,
): string[] {
  const paths: string[] = []
  const profile = dimensions.profile
  const outermostNodes = profile.teamRows / 2
  const { nodeSize, rowHeight, pairGap, intraPairGap, centerX, trophySize } = dimensions
  const centerY = dimensions.height / 2

  if (profile.roundsPerSide === 0) {
    const participants = profile.seedParticipants ?? []

    for (const side of ['left', 'right'] as const) {
      const teamX = side === 'left' ? dimensions.leftTeamX : dimensions.rightTeamX
      const toX = side === 'left' ? centerX - trophySize / 2 - 6 : centerX + trophySize / 2 + 6
      const seeds = getSideSeedParticipants(participants, side)

      seeds.forEach((_participant, index) => {
        const y = getSeedSlotY(index, seeds.length, dimensions)
        paths.push(buildConnectorPath(teamX, y, toX, centerY, side))
      })
    }

    return paths
  }

  const mainRounds = getTreeBracketRounds(rounds, profile)
  if (mainRounds.length === 0) return paths

  const semiCount = getSemiFinalMatches(rounds).length
  const hasThirdPlace = getThirdPlaceMatch(rounds) != null
  const centerAnchors = connectorLayout ?? {
    ...getCenterPodConnectorAnchors(dimensions, semiCount, hasThirdPlace),
    leftEdgeX: dimensions.centerX - dimensions.centerPodWidth / 2,
    rightEdgeX: dimensions.centerX + dimensions.centerPodWidth / 2,
  }

  for (const side of ['left', 'right'] as const) {
    const roundColumns = mainRounds.map((round) => getSideMatches(round.matches, side))
    const teamX = side === 'left' ? dimensions.leftTeamX : dimensions.rightTeamX

    for (let roundIndex = 0; roundIndex < roundColumns.length; roundIndex += 1) {
      const matches = roundColumns[roundIndex]
      const nextMatches = roundColumns[roundIndex + 1]
      const colX = getRoundColumnX(side, roundIndex, dimensions)

      matches.forEach((_match, nodeIndex) => {
        const y = getNodeCenterY(
          nodeIndex,
          matches.length,
          rowHeight,
          pairGap,
          intraPairGap,
          outermostNodes,
        )

        if (roundIndex === 0) {
          const homeY = getTeamRowY(nodeIndex * 2, rowHeight, pairGap, intraPairGap)
          const awayY = getTeamRowY(nodeIndex * 2 + 1, rowHeight, pairGap, intraPairGap)
          const nodeEdgeX = side === 'left' ? colX - nodeSize / 2 : colX + nodeSize / 2

          paths.push(buildConnectorPath(teamX, homeY, nodeEdgeX, y, side))
          paths.push(buildConnectorPath(teamX, awayY, nodeEdgeX, y, side))
        }

        if (!nextMatches) return

        const parentIndex = Math.floor(nodeIndex / 2)
        const parentY = getNodeCenterY(
          parentIndex,
          nextMatches.length,
          rowHeight,
          pairGap,
          intraPairGap,
          outermostNodes,
        )
        const nextColX = getRoundColumnX(side, roundIndex + 1, dimensions)

        const fromX = side === 'left' ? colX + nodeSize / 2 : colX - nodeSize / 2
        const toX = side === 'left' ? nextColX - nodeSize / 2 : nextColX + nodeSize / 2

        paths.push(buildConnectorPath(fromX, y, toX, parentY, side))
      })
    }

    const lastMatches = roundColumns[roundColumns.length - 1]
    if (!lastMatches?.length) continue

    const lastColX = getRoundColumnX(side, mainRounds.length - 1, dimensions)
    const toX = side === 'left' ? centerAnchors.leftEdgeX : centerAnchors.rightEdgeX

    lastMatches.forEach((_match, nodeIndex) => {
      const fromY = getNodeCenterY(
        nodeIndex,
        lastMatches.length,
        rowHeight,
        pairGap,
        intraPairGap,
        outermostNodes,
      )
      const toY = getCenterPodTargetY(centerAnchors, nodeIndex, lastMatches.length, side)
      const fromX = side === 'left' ? lastColX + nodeSize / 2 : lastColX - nodeSize / 2
      paths.push(buildCenterPodConnectorPath(fromX, fromY, toX, toY, side))
    })
  }

  return paths
}

function BracketTeamSlot({
  participant,
  x,
  y,
  dimensions,
  linkTeams = true,
}: {
  participant: KnockoutParticipant
  x: number
  y: number
  dimensions: BracketDimensions
  linkTeams?: boolean
}) {
  const name = participant.team
    ? getTeamDisplayName(participant.team.shortName, participant.team.name)
    : participant.label
  const size = dimensions.teamCrestSize

  const crest = (
    <div
      className="flex items-center justify-center rounded-full border border-slate-700/50 bg-pitch-900/40"
      style={{ width: size, height: size }}
    >
      <TeamCrest
        crest={participant.team?.crest ?? null}
        name={name}
        isDefined={Boolean(participant.team)}
        size="sm"
        className="!h-[88%] !w-[88%] rounded-full object-contain p-0"
      />
    </div>
  )

  const style = centerStyle(x, y)

  if (linkTeams && participant.team?.id) {
    return (
      <Link
        to={`/times/${participant.team.id}`}
        className="absolute transition hover:opacity-80"
        style={style}
        title={name}
        aria-label={name}
      >
        {crest}
      </Link>
    )
  }

  return (
    <div className="absolute" style={style} title={name} aria-label={name}>
      {crest}
    </div>
  )
}

function BracketParticipantCrest({
  participant,
  size,
  isWinner = false,
  isLoser = false,
  isDefined = true,
  linkTeams = true,
}: {
  participant: KnockoutParticipant
  size: number
  isWinner?: boolean
  isLoser?: boolean
  isDefined?: boolean
  linkTeams?: boolean
}) {
  const name = participant.team
    ? getTeamDisplayName(participant.team.shortName, participant.team.name)
    : participant.label

  const crest = (
    <div
      className={`relative flex items-center justify-center rounded-full border bg-pitch-900/40 transition ${
        isWinner
          ? 'border-brazil-green bg-pitch-800/70 shadow-md shadow-brazil-green/25 ring-2 ring-brazil-green/45'
          : isLoser
            ? 'border-slate-700/40 opacity-70'
            : isDefined
              ? 'border-slate-700/50 opacity-80'
              : 'border-dashed border-slate-600/70 opacity-60'
      }`}
      style={{ width: size, height: size }}
      title={name}
    >
      <TeamCrest
        crest={participant.team?.crest ?? null}
        name={name}
        isDefined={Boolean(participant.team)}
        size="sm"
        className="!h-[88%] !w-[88%] rounded-full object-contain p-0"
      />
    </div>
  )

  if (linkTeams && participant.team?.id) {
    return (
      <Link
        to={`/times/${participant.team.id}`}
        className="transition hover:opacity-80"
        title={name}
        aria-label={name}
      >
        {crest}
      </Link>
    )
  }

  return crest
}

function BracketMatchupRow({
  match,
  crestSize,
  linkTeams = true,
  connectorAnchor,
}: {
  match: KnockoutMatch
  crestSize: number
  linkTeams?: boolean
  connectorAnchor?: 'semi' | 'final' | 'third'
}) {
  const winner = getMatchWinner(match)
  const isPlayable = isKnockoutMatchPlayable(match)
  const matchLabel = `${match.home.label} x ${match.away.label}`
  const isDecided = winner != null
  const anchorProps =
    connectorAnchor === 'semi'
      ? { 'data-bracket-semi-anchor': true }
      : connectorAnchor === 'final'
        ? { 'data-bracket-final-anchor': true }
        : connectorAnchor === 'third'
          ? { 'data-bracket-third-anchor': true }
          : {}

  const row = (
    <div className="flex items-center justify-center gap-3 py-0.5">
      <BracketParticipantCrest
        participant={match.home}
        size={crestSize}
        isWinner={winner === match.home}
        isLoser={isDecided && winner !== match.home}
        linkTeams={linkTeams}
      />
      <span className={`text-[11px] font-medium ${isDecided ? 'text-slate-600' : 'text-slate-500'}`}>×</span>
      <BracketParticipantCrest
        participant={match.away}
        size={crestSize}
        isWinner={winner === match.away}
        isLoser={isDecided && winner !== match.away}
        linkTeams={linkTeams}
      />
    </div>
  )

  if (isPlayable && match.id != null) {
    return (
      <Link
        to={matchBetsPath(match.id)}
        className="rounded-lg transition hover:bg-pitch-800/40"
        aria-label={matchLabel}
        {...anchorProps}
      >
        {row}
      </Link>
    )
  }

  return (
    <div aria-label={matchLabel} {...anchorProps}>
      {row}
    </div>
  )
}

function BracketCenterFinale({
  rounds,
  dimensions,
  linkTeams = true,
}: {
  rounds: KnockoutRound[]
  dimensions: BracketDimensions
  linkTeams?: boolean
}) {
  const semiMatches = getSemiFinalMatches(rounds)
  const finalMatch = getFinalMatch(rounds)
  const thirdPlaceMatch = getThirdPlaceMatch(rounds)
  const crestSize = dimensions.matchupCrestSize

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: dimensions.centerX,
        top: dimensions.centerPodCenterY,
        width: dimensions.centerPodWidth,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className="flex w-full flex-col items-stretch gap-3 rounded-2xl border border-slate-700/45 bg-pitch-900/35 px-3 py-3 shadow-sm"
        data-bracket-center-pod
      >
        {semiMatches.length > 0 && (
          <div className="flex flex-col gap-2 border-b border-slate-700/35 pb-3">
            <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Semifinais
            </span>
            {semiMatches.map((match) => (
              <BracketMatchupRow
                key={match.key}
                match={match}
                crestSize={crestSize}
                linkTeams={linkTeams}
                connectorAnchor="semi"
              />
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-400/90">
            Final
          </span>
          {finalMatch ? (
            <BracketMatchupRow
              match={finalMatch}
              crestSize={crestSize}
              linkTeams={linkTeams}
              connectorAnchor="final"
            />
          ) : (
            <span className="text-xs text-slate-500">A definir</span>
          )}
        </div>

        {thirdPlaceMatch && (
          <div className="flex flex-col gap-2 border-t border-slate-700/35 pt-3">
            <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-amber-400/85">
              3º lugar
            </span>
            <BracketMatchupRow
              match={thirdPlaceMatch}
              crestSize={crestSize}
              linkTeams={linkTeams}
              connectorAnchor="third"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function BracketNode({
  match,
  x,
  y,
  dimensions,
}: {
  match: KnockoutMatch
  x: number
  y: number
  dimensions: BracketDimensions
}) {
  const winner = getMatchWinner(match)
  const isPlayable = isKnockoutMatchPlayable(match)
  const size = dimensions.nodeSize

  const node = (
    <div
      className={`flex items-center justify-center rounded-full border border-dashed border-slate-600/70 bg-pitch-900/30 ${
        match.status === 'live' ? 'border-brazil-green/70 shadow-sm shadow-brazil-green/20' : ''
      } ${isPlayable ? 'cursor-pointer transition hover:border-brazil-green/60 hover:bg-pitch-800/60' : 'cursor-default'}`}
      style={{ width: size, height: size }}
      title={
        winner?.team
          ? getTeamDisplayName(winner.team.shortName, winner.team.name)
          : `${match.home.label} x ${match.away.label}`
      }
    >
      {winner?.team ? (
        <TeamCrest
          crest={winner.team.crest}
          name={winner.team.name}
          isDefined
          size="sm"
          className="!h-[78%] !w-[78%] rounded-full object-contain p-0"
        />
      ) : null}
    </div>
  )

  const style = centerStyle(x, y)

  if (!isPlayable) {
    return (
      <div className="absolute" style={style}>
        {node}
      </div>
    )
  }

  return (
    <Link to={matchBetsPath(match.id!)} className="absolute" style={style}>
      {node}
    </Link>
  )
}

function BracketSideLayout({
  side,
  rounds,
  dimensions,
  linkTeams = true,
}: {
  side: BracketSide
  rounds: KnockoutRound[]
  dimensions: BracketDimensions
  linkTeams?: boolean
}) {
  const profile = dimensions.profile
  const outermostNodes = profile.teamRows / 2
  const { rowHeight, pairGap, intraPairGap } = dimensions
  const teamX = side === 'left' ? dimensions.leftTeamX : dimensions.rightTeamX

  if (profile.kind !== 'knockout' && profile.seedParticipants) {
    const seeds = getSideSeedParticipants(profile.seedParticipants, side)

    return (
      <>
        {seeds.map((participant, index) => (
          <BracketTeamSlot
            key={`${side}-seed-${participant.team?.name ?? participant.label}`}
            participant={participant}
            x={teamX}
            y={getSeedSlotY(index, seeds.length, dimensions)}
            dimensions={dimensions}
            linkTeams={linkTeams}
          />
        ))}
      </>
    )
  }

  const mainRounds = getTreeBracketRounds(rounds, profile)
  const outermostMatches = mainRounds[0] ? getSideMatches(mainRounds[0].matches, side) : []
  const teamSlots = getSideTeamSlots(outermostMatches)
  const roundColumns = mainRounds.map((round) => getSideMatches(round.matches, side))

  return (
    <>
      {teamSlots.map((slot, index) => (
        <BracketTeamSlot
          key={`${side}-${slot.match.key}-${slot.slot}`}
          participant={slot.participant}
          x={teamX}
          y={getTeamRowY(index, rowHeight, pairGap, intraPairGap)}
          dimensions={dimensions}
          linkTeams={linkTeams}
        />
      ))}

      {roundColumns.map((matches, roundIndex) =>
        matches.map((match, nodeIndex) => (
          <BracketNode
            key={`${side}-${match.key}`}
            match={match}
            x={getRoundColumnX(side, roundIndex, dimensions)}
            y={getNodeCenterY(
              nodeIndex,
              matches.length,
              rowHeight,
              pairGap,
              intraPairGap,
              outermostNodes,
            )}
            dimensions={dimensions}
          />
        )),
      )}
    </>
  )
}

export function KnockoutBracketDesktop({ rounds, linkTeams = true }: KnockoutBracketDesktopProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState<BracketDimensions | null>(null)
  const [connectorLayout, setConnectorLayout] = useState<CenterPodConnectorLayout | null>(null)
  const profile = useMemo(() => deriveBracketProfile(rounds), [rounds])
  const semiMatches = useMemo(() => getSemiFinalMatches(rounds), [rounds])
  const thirdPlaceMatch = useMemo(() => getThirdPlaceMatch(rounds), [rounds])
  const hasThirdPlace = thirdPlaceMatch != null

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || !profile) return

    const updateDimensions = () => {
      const nextWidth = container.clientWidth
      if (nextWidth > 0) {
        setDimensions(
          computeBracketDimensions(nextWidth, profile, {
            semiCount: semiMatches.length,
            hasThirdPlace,
          }) ?? null,
        )
      }
    }

    updateDimensions()

    const observer = new ResizeObserver(updateDimensions)
    observer.observe(container)
    window.addEventListener('resize', updateDimensions)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateDimensions)
    }
  }, [profile, semiMatches.length, hasThirdPlace])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || !dimensions) {
      setConnectorLayout(null)
      return
    }

    setConnectorLayout(
      measureCenterPodConnectors(container, dimensions, semiMatches.length, hasThirdPlace),
    )
  }, [dimensions, rounds, semiMatches.length, hasThirdPlace])

  if (!profile) return null

  const paths = dimensions ? buildBracketPaths(rounds, dimensions, connectorLayout) : []
  const totalHeight = dimensions ? getBracketTotalHeight(dimensions) : 0

  return (
    <section className="hidden w-full lg:block">
      <p className="mb-5 text-center text-base italic text-brazil-green">
        Acompanhe o avanço das seleções na chave eliminatória.
      </p>

      <div ref={containerRef} className="w-full">
        {dimensions && (
          <div
            className="relative mx-auto"
            style={{ width: dimensions.totalWidth, height: totalHeight }}
          >
            <svg
              className="pointer-events-none absolute inset-0 overflow-visible"
              width={dimensions.totalWidth}
              height={totalHeight}
              aria-hidden="true"
            >
              {paths.map((path, index) => (
                <path
                  key={index}
                  d={path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 5"
                  className="text-slate-600/70"
                />
              ))}
            </svg>

            <BracketSideLayout
              side="left"
              rounds={rounds}
              dimensions={dimensions}
              linkTeams={linkTeams}
            />
            <BracketSideLayout
              side="right"
              rounds={rounds}
              dimensions={dimensions}
              linkTeams={linkTeams}
            />

            <BracketCenterFinale rounds={rounds} dimensions={dimensions} linkTeams={linkTeams} />
          </div>
        )}
      </div>
    </section>
  )
}
