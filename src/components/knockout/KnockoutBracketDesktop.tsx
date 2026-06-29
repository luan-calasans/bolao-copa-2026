import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { KnockoutMatch, KnockoutParticipant, KnockoutRound } from '../../models/knockout'
import { matchBetsPath } from '../../routes/routePaths'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { TeamCrest } from '../ui/TeamCrest'
import { Button } from '../ui/Button'
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
  resolvePickSideForParticipant,
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
import type { KnockoutSimulatorProps } from '../../utils/knockoutSimulator'

interface KnockoutBracketDesktopProps {
  rounds: KnockoutRound[]
  linkTeams?: boolean
  simulator?: KnockoutSimulatorProps
}

function resolveBracketWinner(
  match: KnockoutMatch,
  simulator?: KnockoutSimulatorProps,
): KnockoutParticipant | null {
  return simulator ? simulator.getWinner(match) : getMatchWinner(match)
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
  match,
  slot,
  simulator,
}: {
  participant: KnockoutParticipant
  x: number
  y: number
  dimensions: BracketDimensions
  linkTeams?: boolean
  match?: KnockoutMatch
  slot?: 'home' | 'away'
  simulator?: KnockoutSimulatorProps
}) {
  const name = participant.team
    ? getTeamDisplayName(participant.team.shortName, participant.team.name)
    : participant.label
  const size = dimensions.teamCrestSize
  const winner = match ? resolveBracketWinner(match, simulator) : null
  const isDecided = winner != null
  const isWinner = winner === participant
  const isLoser = isDecided && !isWinner
  const isPickable = match && simulator ? simulator.isMatchPickable(match) : false

  const crest = (
    <div
      className={`flex items-center justify-center rounded-full border bg-pitch-900/40 transition ${
        isWinner
          ? isPickable
            ? 'cursor-pointer border-brazil-green bg-pitch-800/70 shadow-md shadow-brazil-green/25 ring-2 ring-brazil-green/45 hover:ring-brazil-green/70'
            : 'border-brazil-green bg-pitch-800/70 shadow-md shadow-brazil-green/25 ring-2 ring-brazil-green/45'
          : isLoser && isPickable
            ? 'cursor-pointer border-slate-700/40 opacity-70 hover:border-brazil-green/60 hover:bg-pitch-800/60 hover:opacity-90'
            : isLoser
              ? 'border-slate-700/40 opacity-70'
              : isPickable
                ? 'cursor-pointer border-slate-600/70 hover:border-brazil-green/60 hover:bg-pitch-800/60'
                : 'border-slate-700/50'
      }`}
      style={{ width: size, height: size }}
      onClick={
        isPickable && match && slot
          ? () => simulator!.onPickWinner(match.key, slot)
          : undefined
      }
      onKeyDown={
        isPickable && match && slot
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                simulator!.onPickWinner(match.key, slot)
              }
            }
          : undefined
      }
      role={isPickable ? 'button' : undefined}
      tabIndex={isPickable ? 0 : undefined}
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

  if (linkTeams && !simulator && !isPickable && participant.team?.id) {
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
  onPick,
  isPickable = false,
}: {
  participant: KnockoutParticipant
  size: number
  isWinner?: boolean
  isLoser?: boolean
  isDefined?: boolean
  linkTeams?: boolean
  onPick?: () => void
  isPickable?: boolean
}) {
  const name = participant.team
    ? getTeamDisplayName(participant.team.shortName, participant.team.name)
    : participant.label

  const crest = (
    <div
      className={`relative flex items-center justify-center rounded-full border bg-pitch-900/40 transition ${
        isWinner
          ? isPickable
            ? 'cursor-pointer border-brazil-green bg-pitch-800/70 shadow-md shadow-brazil-green/25 ring-2 ring-brazil-green/45 hover:ring-brazil-green/70'
            : 'border-brazil-green bg-pitch-800/70 shadow-md shadow-brazil-green/25 ring-2 ring-brazil-green/45'
          : isLoser && isPickable
            ? 'cursor-pointer border-slate-700/40 opacity-70 hover:border-brazil-green/60 hover:bg-pitch-800/60 hover:opacity-90'
            : isLoser
              ? 'border-slate-700/40 opacity-70'
              : isPickable
                ? 'cursor-pointer border-slate-600/70 hover:border-brazil-green/60 hover:bg-pitch-800/60'
                : isDefined
                  ? 'border-slate-700/50 opacity-80'
                  : 'border-dashed border-slate-600/70 opacity-60'
      }`}
      style={{ width: size, height: size }}
      title={name}
      onClick={isPickable ? onPick : undefined}
      onKeyDown={
        isPickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onPick?.()
              }
            }
          : undefined
      }
      role={isPickable ? 'button' : undefined}
      tabIndex={isPickable ? 0 : undefined}
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

  if (linkTeams && !isPickable && participant.team?.id) {
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
  simulator,
}: {
  match: KnockoutMatch
  crestSize: number
  linkTeams?: boolean
  connectorAnchor?: 'semi' | 'final' | 'third'
  simulator?: KnockoutSimulatorProps
}) {
  const winner = resolveBracketWinner(match, simulator)
  const isPlayable = isKnockoutMatchPlayable(match)
  const isSimPickable = simulator ? simulator.isMatchPickable(match) : false
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
        linkTeams={linkTeams && !simulator}
        isPickable={isSimPickable && Boolean(match.home.team)}
        onPick={() => simulator?.onPickWinner(match.key, 'home')}
      />
      <span className={`text-[11px] font-medium ${isDecided ? 'text-slate-600' : 'text-slate-500'}`}>×</span>
      <BracketParticipantCrest
        participant={match.away}
        size={crestSize}
        isWinner={winner === match.away}
        isLoser={isDecided && winner !== match.away}
        linkTeams={linkTeams && !simulator}
        isPickable={isSimPickable && Boolean(match.away.team)}
        onPick={() => simulator?.onPickWinner(match.key, 'away')}
      />
    </div>
  )

  if (isPlayable && match.id != null && !simulator) {
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
  simulator,
}: {
  rounds: KnockoutRound[]
  dimensions: BracketDimensions
  linkTeams?: boolean
  simulator?: KnockoutSimulatorProps
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
                linkTeams={linkTeams && !simulator}
                connectorAnchor="semi"
                simulator={simulator}
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
              linkTeams={linkTeams && !simulator}
              connectorAnchor="final"
              simulator={simulator}
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
              linkTeams={linkTeams && !simulator}
              connectorAnchor="third"
              simulator={simulator}
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
  simulator,
  parentMatch,
}: {
  match: KnockoutMatch
  x: number
  y: number
  dimensions: BracketDimensions
  simulator?: KnockoutSimulatorProps
  parentMatch?: KnockoutMatch
}) {
  const winner = resolveBracketWinner(match, simulator)
  const isPlayable = isKnockoutMatchPlayable(match)
  const size = dimensions.nodeSize
  const parentPickSide =
    parentMatch && winner ? resolvePickSideForParticipant(parentMatch, winner) : null
  const canAdvance =
    simulator &&
    parentMatch &&
    parentPickSide &&
    winner?.team &&
    simulator.isMatchPickable(parentMatch)

  const parentWinner = parentMatch ? resolveBracketWinner(parentMatch, simulator) : null
  const isChangingParent =
    parentWinner?.team?.id != null &&
    winner?.team?.id != null &&
    parentWinner.team.id !== winner.team.id

  const advanceWinner = () => {
    if (!simulator || !parentMatch || !parentPickSide) return
    if (simulator.picks[parentMatch.key] === parentPickSide) return
    simulator.onPickWinner(parentMatch.key, parentPickSide)
  }

  const node = winner?.team ? (
    <div
      className={`flex items-center justify-center rounded-full border border-dashed border-slate-600/70 bg-pitch-900/30 ${
        match.status === 'live' ? 'border-brazil-green/70 shadow-sm shadow-brazil-green/20' : ''
      } ${canAdvance ? 'cursor-pointer transition hover:border-brazil-green/60 hover:bg-pitch-800/60 hover:ring-2 hover:ring-brazil-green/30' : ''}`}
      style={{ width: size, height: size }}
      title={
        canAdvance
          ? isChangingParent
            ? `Trocar vencedor para ${getTeamDisplayName(winner.team.shortName, winner.team.name)}`
            : `Avançar ${getTeamDisplayName(winner.team.shortName, winner.team.name)}`
          : getTeamDisplayName(winner.team.shortName, winner.team.name)
      }
      onClick={canAdvance ? advanceWinner : undefined}
      onKeyDown={
        canAdvance
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                advanceWinner()
              }
            }
          : undefined
      }
      role={canAdvance ? 'button' : undefined}
      tabIndex={canAdvance ? 0 : undefined}
    >
      <TeamCrest
        crest={winner.team.crest}
        name={winner.team.name}
        isDefined
        size="sm"
        className="!h-[78%] !w-[78%] rounded-full object-contain p-0"
      />
    </div>
  ) : (
    <div
      className={`flex items-center justify-center rounded-full border border-dashed border-slate-600/70 bg-pitch-900/30 ${
        match.status === 'live' ? 'border-brazil-green/70 shadow-sm shadow-brazil-green/20' : ''
      } ${isPlayable && !simulator ? 'cursor-pointer transition hover:border-brazil-green/60 hover:bg-pitch-800/60' : 'cursor-default'}`}
      style={{ width: size, height: size }}
      title={`${match.home.label} x ${match.away.label}`}
    />
  )

  const style = centerStyle(x, y)

  if (!isPlayable || simulator) {
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
  simulator,
}: {
  side: BracketSide
  rounds: KnockoutRound[]
  dimensions: BracketDimensions
  linkTeams?: boolean
  simulator?: KnockoutSimulatorProps
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
          match={slot.match}
          slot={slot.slot}
          simulator={simulator}
        />
      ))}

      {roundColumns.map((matches, roundIndex) =>
        matches.map((match, nodeIndex) => {
          const parentMatches = roundColumns[roundIndex + 1]
          const parentMatch = parentMatches?.[Math.floor(nodeIndex / 2)]
          const canPickParent = parentMatch && simulator?.isMatchPickable(parentMatch)

          return (
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
              simulator={simulator}
              parentMatch={canPickParent ? parentMatch : undefined}
            />
          )
        }),
      )}
    </>
  )
}

export function KnockoutBracketDesktop({
  rounds,
  linkTeams = true,
  simulator,
}: KnockoutBracketDesktopProps) {
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
      {!simulator && (
        <p className="mb-5 text-center text-base italic text-brazil-green">
          Acompanhe o avanço das seleções na chave eliminatória.
        </p>
      )}

      {simulator?.onResetSimulation && (
        <div className="mb-5 flex justify-center">
          <Button
            type="button"
            variant="danger"
            onClick={simulator.onResetSimulation}
            disabled={!simulator.hasPicks}
            className="cursor-pointer gap-2 border-red-500/35 bg-red-500/10 px-5 py-2.5 text-sm shadow-md shadow-red-950/25 transition-all hover:border-red-400/50 hover:bg-red-500/15 hover:shadow-red-950/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <ResetIcon />
            Redefinir simulação
          </Button>
        </div>
      )}

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
              simulator={simulator}
            />
            <BracketSideLayout
              side="right"
              rounds={rounds}
              dimensions={dimensions}
              linkTeams={linkTeams}
              simulator={simulator}
            />

            <BracketCenterFinale
              rounds={rounds}
              dimensions={dimensions}
              linkTeams={linkTeams}
              simulator={simulator}
            />
          </div>
        )}
      </div>
    </section>
  )
}

function ResetIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
