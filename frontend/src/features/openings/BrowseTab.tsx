import { useState, useMemo } from 'react'
import { Chess } from 'chess.js'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOpenings } from './useOpenings'
import { useAuthSession } from './useAuthSession'
import { ChessBoard } from '../../components/ChessBoard/ChessBoard'
import { OpeningComment } from './OpeningComment'
import { PositionComment } from './PositionComment'
import { drillApi } from './api'
import type { Opening } from './types'

type EcoGroup = 'All' | 'A' | 'B' | 'C' | 'D' | 'E'
const ECO_GROUPS: EcoGroup[] = ['All', 'A', 'B', 'C', 'D', 'E']

function AddToDrillButton({ openingId }: { openingId: number }) {
  const session = useAuthSession()
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => drillApi.addToDrill(openingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drill-queue'] }),
  })
  const { data: queue = [] } = useQuery({
    queryKey: ['drill-queue'],
    queryFn: drillApi.queue,
    enabled: !!session,
  })
  const inDrill = (queue as Array<{ opening_id: number }>).some(i => i.opening_id === openingId)

  if (!session) return null

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={inDrill || mutation.isPending}
      className={`text-xs px-3 py-1.5 rounded transition-colors ${
        inDrill
          ? 'bg-green-500/10 text-green-500 cursor-default'
          : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
      }`}
    >
      {inDrill ? '✓ In Drill' : '+ Add to Drill'}
    </button>
  )
}

function computeMoveFens(moves: string[]): string[] {
  const chess = new Chess()
  return moves.map(m => { chess.move(m); return chess.fen() })
}

export function BrowseTab() {
  const { data: openings, isLoading } = useOpenings()
  const [selected, setSelected] = useState<Opening | null>(null)
  const [ecoGroup, setEcoGroup] = useState<EcoGroup>('All')
  const [search, setSearch] = useState('')
  const [moveIndex, setMoveIndex] = useState<number | null>(null)

  const filtered = useMemo(() => {
    if (!openings) return []
    return openings.filter(o => {
      const matchEco = ecoGroup === 'All' || o.eco.startsWith(ecoGroup)
      const matchSearch = o.name.toLowerCase().includes(search.toLowerCase())
      return matchEco && matchSearch
    })
  }, [openings, ecoGroup, search])

  const moveFens = useMemo(
    () => (selected ? computeMoveFens(selected.moves) : []),
    [selected],
  )

  function selectOpening(o: Opening) {
    setSelected(o)
    setMoveIndex(null)
  }

  const boardFen = moveIndex === null ? selected?.fen : moveFens[moveIndex]

  return (
    <div className="flex h-full overflow-hidden">
      {/* List column */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-white/10">
        <div className="p-3 space-y-2 border-b border-white/10">
          <input
            type="text"
            placeholder="Search openings…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 text-sm text-white placeholder-gray-500 rounded px-3 py-1.5 border border-white/10 focus:outline-none focus:border-amber-400/50"
          />
          <div className="flex gap-1">
            {ECO_GROUPS.map(g => (
              <button
                key={g}
                onClick={() => setEcoGroup(g)}
                className={`flex-1 text-xs py-1 rounded transition-colors ${
                  ecoGroup === g
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <p className="text-gray-500 text-sm p-3">Loading openings…</p>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="text-gray-500 text-sm p-3">No openings found</p>
          )}
          {filtered.map(o => (
            <button
              key={o.id}
              onClick={() => selectOpening(o)}
              className={`w-full text-left px-3 py-2 text-sm border-b border-white/5 transition-colors ${
                selected?.id === o.id
                  ? 'bg-amber-500/15 text-amber-200'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-gray-500 font-mono text-xs mr-2">{o.eco}</span>
              {o.name}
            </button>
          ))}
        </div>
      </div>

      {/* Board column */}
      <div className="flex-1 flex items-center justify-center p-4 min-w-0">
        <div className="w-full max-w-md">
          <ChessBoard position={boardFen} interactive={false} />
        </div>
      </div>

      {/* Detail column */}
      <div className="w-72 flex-shrink-0 flex flex-col border-l border-white/10 overflow-y-auto">
        {selected ? (
          <>
            <div className="p-3 border-b border-white/10 space-y-1.5">
              <div className="text-xs font-mono text-amber-400">{selected.eco}</div>
              <div className="text-sm font-semibold text-white">{selected.name}</div>
              <AddToDrillButton openingId={selected.id} />
            </div>

            <div className="flex-1 overflow-y-auto">
              <MoveListWithComments
                moves={selected.moves}
                openingId={selected.id}
                moveFens={moveFens}
                moveIndex={moveIndex}
                onMoveClick={setMoveIndex}
              />
            </div>

            <div className="border-t border-white/10 p-3">
              <OpeningComment openingId={selected.id} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm p-4 text-center">
            Select an opening to view its moves and notes
          </div>
        )}
      </div>
    </div>
  )
}

type MoveListWithCommentsProps = {
  moves: string[]
  openingId: number
  moveFens: string[]
  moveIndex: number | null
  onMoveClick: (index: number | null) => void
}

function MoveListWithComments({ moves, openingId, moveFens, moveIndex, onMoveClick }: MoveListWithCommentsProps) {
  const pairCount = Math.ceil(moves.length / 2)
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Moves</h2>
        {moveIndex !== null && (
          <button onClick={() => onMoveClick(null)} className="text-xs text-gray-500 hover:text-gray-300">
            Reset
          </button>
        )}
      </div>
      <table className="w-full text-sm">
        <tbody>
          {Array.from({ length: pairCount }, (_, pairIndex) => {
            const whiteIndex = pairIndex * 2
            const blackIndex = pairIndex * 2 + 1
            return (
              <tr key={pairIndex} className="hover:bg-white/5">
                <td className="text-gray-500 px-3 py-1 w-6 select-none text-xs">{pairIndex + 1}.</td>
                <td className="px-1 py-1">
                  <MoveCell
                    san={moves[whiteIndex]}
                    index={whiteIndex}
                    selected={moveIndex}
                    openingId={openingId}
                    fen={moveFens[whiteIndex]}
                    onClick={onMoveClick}
                  />
                </td>
                <td className="px-1 py-1">
                  {moves[blackIndex] !== undefined && (
                    <MoveCell
                      san={moves[blackIndex]}
                      index={blackIndex}
                      selected={moveIndex}
                      openingId={openingId}
                      fen={moveFens[blackIndex]}
                      onClick={onMoveClick}
                    />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type MoveCellProps = {
  san: string
  index: number
  selected: number | null
  openingId: number
  fen: string
  onClick: (i: number) => void
}

function MoveCell({ san, index, selected, openingId, fen, onClick }: MoveCellProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onClick(index)}
        className={`font-mono text-left px-1 rounded flex-1 ${
          index === selected ? 'bg-amber-500/25 text-amber-200' : 'text-gray-100'
        }`}
      >
        {san}
      </button>
      <PositionComment openingId={openingId} moveIndex={index} fen={fen} />
    </div>
  )
}
