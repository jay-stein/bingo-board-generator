import { useCallback, useEffect, useRef, useState } from 'react'
import { BingoBoard } from './components/BingoBoard'
import { DiceButton } from './components/DiceButton'
import { generateBoards, generateTicketSet, TICKETS_PER_SET, type Ticket } from './lib/bingo'
import { BOARDS_PER_PAGE, downloadBoardsPdf } from './lib/pdf'

const ROLL_DURATION_MS = 620
const COUNT_MIN = 1
const COUNT_MAX = 60
const BOARDS_ON_SCREEN = 3

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

interface ShownSet {
  tickets: Ticket[]
  setNumber: number
  offset: number
}

function dealSet(setNumber: number): ShownSet {
  return { tickets: generateTicketSet(), setNumber, offset: 0 }
}

function clampCount(raw: string): number {
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed)) return COUNT_MIN
  return Math.min(COUNT_MAX, Math.max(COUNT_MIN, parsed))
}

export default function App() {
  const [shown, setShown] = useState<ShownSet>(() => dealSet(1))
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
  const visibleBoards = shown.tickets.slice(shown.offset, shown.offset + BOARDS_ON_SCREEN)
  const showingFirstHalf = shown.offset === 0

  const roll = useCallback(() => {
    if (rolling) return
    setRolling(true)
    const firstHalf = showingFirstHalf
    const nextSetNumber = setCounter.current + 1

    rollTimer.current = window.setTimeout(() => {
      if (firstHalf) {
        setShown((previous) => ({ ...previous, offset: BOARDS_ON_SCREEN }))
      } else {
        setCounter.current = nextSetNumber
        setShown(dealSet(nextSetNumber))
      }
      setMarked(new Set())
      setRollKey((key) => key + 1)
      setRolling(false)
    }, ROLL_DURATION_MS)
  }, [rolling, showingFirstHalf])

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
            <p>UK 90-ball tickets built to the printed rules:</p>
          </div>
        </div>
        <ul className="rules">
          <li>3 rows × 9 columns, 15 numbers per board</li>
          <li>Exactly 5 numbers per row, 4 blanks</li>
          <li>Columns cover 1–9, 10–19, … 80–90</li>
          <li>1–3 numbers per column per board</li>
          <li>Numbers ascend down every column</li>
          <li>Sets of six use all 90 numbers exactly once</li>
        </ul>
      </header>

      <main className="stage">
        <section className="board-card">
          <div className="board-meta">
            <span className="meta-chip">Set #{shown.setNumber}</span>
            <span className="meta-chip">
              Boards {shown.offset + 1}–{shown.offset + BOARDS_ON_SCREEN} of {TICKETS_PER_SET}
            </span>
            <span className="meta-chip meta-chip-soft">All 90 numbers in this set</span>
            {marked.size > 0 && (
              <button type="button" className="meta-clear" onClick={clearMarks}>
                Clear {marked.size} daub{marked.size === 1 ? '' : 's'}
              </button>
            )}
          </div>
          <div className="boards">
            {visibleBoards.map((ticket, index) => (
              <div className="board-slot" key={`${shown.setNumber}-${shown.offset}-${index}`}>
                <span className="board-label">Board {shown.offset + index + 1}</span>
                <BingoBoard
                  ticket={ticket}
                  marked={marked}
                  rolling={rolling}
                  rollKey={rollKey}
                  onToggle={toggleMark}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="controls">
          <DiceButton
            rolling={rolling}
            onRoll={roll}
            label={
              showingFirstHalf
                ? `Roll boards ${BOARDS_ON_SCREEN + 1}–${TICKETS_PER_SET}`
                : 'Roll a new set'
            }
            hint={showingFirstHalf ? 'Other half of this set' : 'Six fresh boards'}
          />

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
        Tap numbers to daub them, roll the die for the next three boards, or export as many
        printable boards as you need.
      </footer>
    </div>
  )
}
