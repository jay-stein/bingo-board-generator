import { describe, expect, it } from 'vitest'
import {
  generateBoards,
  generateTicketSet,
  isValidTicketSet,
  validateTicketSet,
  TICKETS_PER_SET,
} from './bingo'
import { BOARDS_PER_PAGE, buildBoardsPdf } from './pdf'

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('generateTicketSet', () => {
  it('builds six valid tickets that use every number 1-90 exactly once', () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const tickets = generateTicketSet(mulberry32(seed))
      expect(tickets).toHaveLength(TICKETS_PER_SET)
      expect(validateTicketSet(tickets)).toEqual([])
      expect(isValidTicketSet(tickets)).toBe(true)
    }
  })

  it('produces different sets for different seeds', () => {
    const first = JSON.stringify(generateTicketSet(mulberry32(1)))
    const second = JSON.stringify(generateTicketSet(mulberry32(2)))
    expect(first).not.toBe(second)
  })
})

describe('generateBoards', () => {
  it('returns exactly the requested number of boards', () => {
    for (const count of [1, 6, 7, 18, 25]) {
      expect(generateBoards(count, mulberry32(count))).toHaveLength(count)
    }
  })

  it('keeps every generated set valid', () => {
    const boards = generateBoards(12, mulberry32(4))
    const problems = validateTicketSet(boards.slice(0, TICKETS_PER_SET))
    expect(problems).toEqual([])
  })
})

describe('validateTicketSet', () => {
  it('flags a corrupted ticket', () => {
    const tickets = generateTicketSet(mulberry32(3))
    tickets[0][0][0] = 0
    expect(validateTicketSet(tickets).length).toBeGreaterThan(0)
  })

  it('flags a column that is not in ascending order', () => {
    const tickets = generateTicketSet(mulberry32(11))
    const ticket = tickets[0]
    const column = [0, 1, 2, 3, 4, 5, 6, 7, 8].find(
      (candidate) => [0, 1, 2].filter((row) => ticket[row][candidate] !== 0).length >= 2,
    )
    expect(column).toBeDefined()

    const rows = [0, 1, 2].filter((row) => ticket[row][column!] !== 0)
    const top = rows[0]
    const bottom = rows[rows.length - 1]
    ;[ticket[top][column!], ticket[bottom][column!]] = [
      ticket[bottom][column!],
      ticket[top][column!],
    ]

    const problems = validateTicketSet(tickets)
    expect(problems.some((problem) => problem.includes('ascending'))).toBe(true)
  })
})

describe('buildBoardsPdf', () => {
  it('lays out three boards per page', async () => {
    const boards = generateBoards(7, mulberry32(5))
    const doc = await buildBoardsPdf(boards)
    expect(doc.getNumberOfPages()).toBe(Math.ceil(7 / BOARDS_PER_PAGE))
  })

  it('renders a single page for zero boards', async () => {
    const doc = await buildBoardsPdf([])
    expect(doc.getNumberOfPages()).toBe(1)
  })
})
