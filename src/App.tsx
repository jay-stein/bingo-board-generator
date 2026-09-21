import { useCallback, useEffect, useRef, useState } from 'react'
import { BingoBoard } from './components/BingoBoard'
import { DiceButton } from './components/DiceButton'
import { generateBoards, generateTicketSet, TICKETS_PER_SET, type Ticket } from './lib/bingo'
import { BOARDS_PER_PAGE, downloadBoardsPdf } from './lib/pdf'

const ROLL_DURATION_MS = 620
const COUNT_MIN = 1
const COUNT_MAX = 60

const BACKDROP_BALLS = [
  { value: 7, top: '6%', left: '3%', size: 108, delay: -1 },
  { value: 23, top: '13%', left: '87%', size: 82, delay: -5 },
  { value: 41, top: '46%', left: '92%', size: 62, delay: -2 },
  { value: 58, top: '72%', left: '5%', size: 92, delay: -7 },
  { value: 66, top: '33%', left: '0%', size: 54, delay: -4 },
  { value: 88, top: '80%', left: '79%', size: 118, delay: -6 },
  { value: 15, top: '90%', left: '34%', size: 68, delay: -3 },
  { value: 72, top: '3%', left: '49%', size: 56, delay: -8 },
]

interface ShownBoard {
  ticket: Ticket
  setNumber: number
  position: number
}

function dealBoard(setNumber: number): ShownBoard {
  const set = generateTicketSet()
  const index = Math.floor(Math.random() * set.length)
  return { ticket: set[index], setNumber, position: index + 1 }
}

function clampCount(raw: string): number {
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed)) return COUNT_MIN
  return Math.min(COUNT_MAX, Math.max(COUNT_MIN, parsed))
}

export default function App() {
  const [shown, setShown] = useState<ShownBoard>(() => dealBoard(1))
  const [rollKey, setRollKey] = useState(0)
  const [rolling, setRolling] = useState(false)
  const [marked, setMarked] = useState<ReadonlySet<number>>(() => new Set())
  const [countText, setCountText] = useState('6')
  const [pdfBusy, setPdfBusy] = useState(false)
  const setCounter = useRef(1)
  const rollTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(rollTimer.current), [])

  const boardCount = clampCount(countText)
  const pageCount = Math.ceil(boardCount / BOARDS_PER_PAGE)

  const roll = useCallback(() => {
    if (rolling) return
    const next = dealBoard(setCounter.current + 1)
    setRolling(true)
    rollTimer.current = window.setTimeout(() => {
      setCounter.current += 1
      setShown(next)
      setMarked(new Set())
      setRollKey((key) => key + 1)
      setRolling(false)
    }, ROLL_DURATION_MS)
  }, [rolling])

  const toggleMark = useCallback((value: number) => {
    setMarked((previous) => {
      const next = new Set(previous)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }, [])

  const clearMarks = useCallback(() => setMarked(new Set()), [])

  const downloadPdf = useCallback(async () => {
    if (pdfBusy) return
    setPdfBusy(true)
    try {
      const boards = generateBoards(boardCount)
      await downloadBoardsPdf(boards, `bingo-boards-${boardCount}.pdf`)
    } finally {
      setPdfBusy(false)
    }
  }, [boardCount, pdfBusy])

  return (
    <div className="app">
      <div className="backdrop" aria-hidden="true">
        {BACKDROP_BALLS.map((ball) => (
          <span
            key={ball.value}
            className="backdrop-ball"
            style={{
              top: ball.top,
              left: ball.left,
              width: ball.size,
              height: ball.size,
              fontSize: ball.size * 0.3,
              animationDelay: `${ball.delay}s`,
            }}
          >
            {ball.value}
          </span>
        ))}
      </div>

      <header className="app-header">
        <div className="brand">
          <span className="brand-ball">90</span>
          <div>
            <h1>Bingo Board Generator</h1>
            <p>
              UK 90-ball tickets built with the <code>bingo_recipe.ipynb</code> method and finished
              like printed tickets — every roll deals a fresh set of {TICKETS_PER_SET} boards that
              together use all 90 numbers exactly once.
            </p>
          </div>
        </div>
      </header>

      <main className="stage">
        <section className="board-card">
          <div className="board-meta">
            <span className="meta-chip">Set #{shown.setNumber}</span>
            <span className="meta-chip">
              Board {shown.position} of {TICKETS_PER_SET}
            </span>
            {marked.size > 0 && (
              <button type="button" className="meta-clear" onClick={clearMarks}>
                Clear {marked.size} daub{marked.size === 1 ? '' : 's'}
              </button>
            )}
          </div>
          <BingoBoard
            ticket={shown.ticket}
            marked={marked}
            rolling={rolling}
            rollKey={rollKey}
            onToggle={toggleMark}
          />
        </section>

        <section className="controls">
          <DiceButton rolling={rolling} onRoll={roll} />

          <div className="controls-right">
            <label className="field">
              <span className="field-label">Boards in PDF</span>
              <input
                type="number"
                min={COUNT_MIN}
                max={COUNT_MAX}
                inputMode="numeric"
                value={countText}
                onChange={(event) => setCountText(event.target.value)}
                onBlur={() => setCountText(String(boardCount))}
              />
              <span className="field-hint">
                {pageCount} A4 page{pageCount === 1 ? '' : 's'} · {BOARDS_PER_PAGE} boards per page
              </span>
            </label>

            <button type="button" className="btn-download" onClick={downloadPdf} disabled={pdfBusy}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M5 20h14"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {pdfBusy ? 'Building PDF…' : 'Download PDF'}
            </button>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        Tap numbers to daub them, roll the die for a brand new board, or export as many printable
        boards as you need. One set of {TICKETS_PER_SET} boards always shares the full 1–90 pool.
      </footer>
    </div>
  )
}
