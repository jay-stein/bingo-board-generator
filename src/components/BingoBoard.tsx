import type { CSSProperties } from 'react'
import type { Ticket } from '../lib/bingo'

interface BingoBoardProps {
  ticket: Ticket
  marked: ReadonlySet<number>
  rolling: boolean
  rollKey: number
  onToggle: (value: number) => void
}

export function BingoBoard({ ticket, marked, rolling, rollKey, onToggle }: BingoBoardProps) {
  return (
    <div className={`board-shell${rolling ? ' is-rolling' : ''}`}>
      <div className="bingo-board" key={rollKey} aria-label="Bingo ticket">
        {ticket.map((row, rowIndex) =>
          row.map((value, columnIndex) => {
            const cellIndex = rowIndex * row.length + columnIndex
            const isBlank = value === 0
            const isMarked = !isBlank && marked.has(value)
            const isColumnEdge = columnIndex === 2 || columnIndex === 5

            return (
              <button
                key={`${rowIndex}-${columnIndex}`}
                type="button"
                className={[
                  'cell',
                  isBlank ? 'is-blank' : '',
                  isMarked ? 'is-marked' : '',
                  isColumnEdge ? 'col-edge' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ '--cell-index': cellIndex } as CSSProperties}
                onClick={() => {
                  if (!isBlank) onToggle(value)
                }}
                disabled={isBlank}
                aria-label={isBlank ? 'Blank cell' : `Number ${value}${isMarked ? ', daubed' : ''}`}
              >
                {!isBlank && <span className="cell-number">{value}</span>}
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}
