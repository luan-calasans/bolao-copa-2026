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
  getFinalMatch,
  getMainBracketRounds,
  getMatchWinner,
  getNodeCenterY,
  getRoundColumnX,
  getSideMatches,
  getSeedSlotY,
  getSideSeedParticipants,
  getSideTeamSlots,
  getTeamRowY,
  isKnockoutMatchPlayable,
} from './knockoutBracketLayout'

interface KnockoutBracketDesktopProps {
  rounds: KnockoutRound[]
  linkTeams?: boolean
}

const TROPHY_IMAGE_SRC = '/trofeu.webp'

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

function buildBracketPaths(rounds: KnockoutRound[], dimensions: BracketDimensions): string[] {
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

  const mainRounds = getMainBracketRounds(rounds, profile)
  if (mainRounds.length === 0) return paths

  const semiY = getNodeCenterY(0, 1, rowHeight, pairGap, intraPairGap, outermostNodes)

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
  }

  const leftSemiX = getRoundColumnX('left', mainRounds.length - 1, dimensions)
  const rightSemiX = getRoundColumnX('right', mainRounds.length - 1, dimensions)

  paths.push(
    buildConnectorPath(leftSemiX + nodeSize / 2, semiY, centerX - trophySize / 2 - 6, centerY, 'left'),
  )
  paths.push(
    buildConnectorPath(rightSemiX - nodeSize / 2, semiY, centerX + trophySize / 2 + 6, centerY, 'right'),
  )

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

function BracketChampionSlot({
  match,
  x,
  y,
  dimensions,
  linkTeams = true,
}: {
  match: KnockoutMatch | undefined
  x: number
  y: number
  dimensions: BracketDimensions
  linkTeams?: boolean
}) {
  const winner = match ? getMatchWinner(match) : null
  const isPlayable = match ? isKnockoutMatchPlayable(match) : false
  const size = dimensions.trophySize
  const winnerName = winner?.team
    ? getTeamDisplayName(winner.team.shortName, winner.team.name)
    : match
      ? `${match.home.label} x ${match.away.label}`
      : 'Final da Copa'

  const slot = (
    <div
      className={`relative flex items-center justify-center rounded-full border border-dashed border-slate-600/70 bg-pitch-900/30 ${
        match?.status === 'live' ? 'border-brazil-green/70 shadow-sm shadow-brazil-green/20' : ''
      } ${isPlayable ? 'cursor-pointer transition hover:border-brazil-green/60 hover:bg-pitch-800/60' : 'cursor-default'}`}
      style={{ width: size, height: size }}
      title={winnerName}
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
      <img
        src={TROPHY_IMAGE_SRC}
        alt="Troféu da Copa do Mundo"
        className="pointer-events-none absolute -right-1 -top-1 h-[42%] w-[42%] object-contain drop-shadow-md"
        loading="lazy"
        decoding="async"
      />
    </div>
  )

  const style = centerStyle(x, y)

  if (isPlayable && match?.id != null) {
    return (
      <Link to={matchBetsPath(match.id)} className="absolute" style={style} aria-label={winnerName}>
        {slot}
      </Link>
    )
  }

  if (linkTeams && winner?.team?.id) {
    return (
      <Link
        to={`/times/${winner.team.id}`}
        className="absolute transition hover:opacity-80"
        style={style}
        aria-label={winnerName}
      >
        {slot}
      </Link>
    )
  }

  return (
    <div className="absolute" style={style} aria-label={winnerName}>
      {slot}
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

  const mainRounds = getMainBracketRounds(rounds, profile)
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
  const profile = useMemo(() => deriveBracketProfile(rounds), [rounds])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || !profile) return

    const updateDimensions = () => {
      const nextWidth = container.clientWidth
      if (nextWidth > 0) {
        setDimensions(computeBracketDimensions(nextWidth, profile) ?? null)
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
  }, [profile])

  if (!profile) return null

  const finalMatch = getFinalMatch(rounds)
  const paths = dimensions ? buildBracketPaths(rounds, dimensions) : []

  return (
    <section className="hidden w-full lg:block">
      <p className="mb-5 text-center text-base italic text-brazil-green">
        Acompanhe o avanço das seleções na chave eliminatória.
      </p>

      <div ref={containerRef} className="w-full">
        {dimensions && (
          <div
            className="relative mx-auto"
            style={{ width: dimensions.totalWidth, height: dimensions.height }}
          >
            <svg
              className="pointer-events-none absolute inset-0 overflow-visible"
              width={dimensions.totalWidth}
              height={dimensions.height}
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

            <BracketSideLayout side="left" rounds={rounds} dimensions={dimensions} linkTeams={linkTeams} />
            <BracketSideLayout side="right" rounds={rounds} dimensions={dimensions} linkTeams={linkTeams} />

            <BracketChampionSlot
              match={finalMatch}
              x={dimensions.centerX}
              y={dimensions.height / 2}
              dimensions={dimensions}
              linkTeams={linkTeams}
            />
          </div>
        )}
      </div>
    </section>
  )
}
