import { useState } from 'react'

interface DiceButtonProps {
  rolling: boolean
  onRoll: () => void
}

const PIPS: Record<number, ReadonlyArray<readonly [number, number]>> = {
  1: [[50, 50]],
  2: [
    [31, 31],
    [69, 69],
  ],
  3: [
    [29, 29],
    [50, 50],
    [71, 71],
  ],
  4: [
    [31, 31],
    [69, 31],
    [31, 69],
    [69, 69],
  ],
  5: [
    [31, 31],
    [69, 31],
    [50, 50],
    [31, 69],
    [69, 69],
  ],
  6: [
    [31, 28],
    [69, 28],
    [31, 50],
    [69, 50],
    [31, 72],
    [69, 72],
  ],
}

export function DiceButton({ rolling, onRoll }: DiceButtonProps) {
  const [face, setFace] = useState(5)

  const roll = () => {
    setFace(1 + Math.floor(Math.random() * 6))
    onRoll()
  }

  return (
    <div className="dice-wrap">
      <button
        type="button"
        className={`dice-button${rolling ? ' is-rolling' : ''}`}
        onClick={roll}
        disabled={rolling}
        aria-label="Roll a brand new bingo board"
        title="Roll a brand new board"
      >
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="dice-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ffd9e6" />
            </linearGradient>
          </defs>
          <rect
            x="6"
            y="6"
            width="88"
            height="88"
            rx="20"
            fill="url(#dice-body)"
            stroke="#1d2140"
            strokeWidth="3"
          />
          {PIPS[face].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="8.5" fill="#1d2140" />
          ))}
        </svg>
      </button>
      <span className="dice-label">
        <strong>{rolling ? 'Rolling…' : 'Roll a board'}</strong>
        <span>Deals a fresh set of six</span>
      </span>
    </div>
  )
}
