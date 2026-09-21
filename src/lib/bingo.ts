/**
 * UK 90-ball (tambola) ticket generation.
 *
 * Implements the two-part recipe from `bingo_recipe.ipynb`:
 *
 * 1. Split the 90 numbers into six groups of 15.
 *    - Seed every ticket with one number per column.
 *    - Hand one of the last column's spare numbers to a random ticket.
 *    - Make four passes over the remaining columns, assigning each number to a
 *      random eligible ticket. The first three passes cap a ticket at two
 *      numbers per column so the final pass always has room.
 * 2. Arrange each group of 15 into a 3x9 grid. Each row is built in a pass:
 *    columns that must place a number on that row are filled first, then the
 *    row is topped up to five numbers without repeating a column.
 */

export type Ticket = number[][]

export type RandomSource = () => number

export const TICKETS_PER_SET = 6
export const TICKET_ROWS = 3
export const TICKET_COLUMNS = 9
export const NUMBERS_PER_ROW = 5
export const NUMBERS_PER_TICKET = TICKET_ROWS * NUMBERS_PER_ROW
export const TOTAL_NUMBERS = 90

export const COLUMN_RANGES: ReadonlyArray<readonly [number, number]> = [
  [1, 9],
  [10, 19],
  [20, 29],
  [30, 39],
  [40, 49],
  [50, 59],
  [60, 69],
  [70, 79],
  [80, 90],
]

function range(lo: number, hi: number): number[] {
  const values: number[] = []
  for (let value = lo; value <= hi; value += 1) values.push(value)
  return values
}

function shuffle<T>(items: readonly T[], random: RandomSource): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function drawRandom<T>(items: T[], random: RandomSource): T {
  const index = Math.floor(random() * items.length)
  return items.splice(index, 1)[0]
}

/**
 * Build one complete set of six tickets. All 90 numbers appear exactly once
 * across the set and every ticket holds 15 numbers.
 */
export function generateTicketSet(random: RandomSource = Math.random): Ticket[] {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      return generateTicketSetOnce(random)
    } catch {
      // The pass caps make dead ends practically impossible; retry anyway.
    }
  }
  throw new Error('Could not generate a valid ticket set.')
}

function generateTicketSetOnce(random: RandomSource): Ticket[] {
  const columns = COLUMN_RANGES.map(([lo, hi]) => shuffle(range(lo, hi), random))
  const ticketColumns: number[][][] = Array.from({ length: TICKETS_PER_SET }, () =>
    Array.from({ length: TICKET_COLUMNS }, () => [] as number[]),
  )

  // 1.1 - one number from each column into each ticket.
  for (let column = 0; column < TICKET_COLUMNS; column += 1) {
    for (let ticket = 0; ticket < TICKETS_PER_SET; ticket += 1) {
      ticketColumns[ticket][column].push(columns[column][ticket])
    }
    columns[column] = columns[column].slice(TICKETS_PER_SET)
  }

  const numbersOnTicket = (ticket: number) =>
    ticketColumns[ticket].reduce((total, column) => total + column.length, 0)

  // 1.2 - give one of the last column's spare numbers to a random ticket.
  const luckyTicket = Math.floor(random() * TICKETS_PER_SET)
  ticketColumns[luckyTicket][TICKET_COLUMNS - 1].push(
    drawRandom(columns[TICKET_COLUMNS - 1], random),
  )

  // 1.3 - four passes over the remaining columns.
  for (let pass = 1; pass <= 4; pass += 1) {
    const cap = pass <= 3 ? 2 : 3
    const columnOrder = shuffle(range(0, TICKET_COLUMNS - 1), random)

    for (const column of columnOrder) {
      if (columns[column].length === 0) continue

      const candidates: number[] = []
      for (let ticket = 0; ticket < TICKETS_PER_SET; ticket += 1) {
        if (
          ticketColumns[ticket][column].length < cap &&
          numbersOnTicket(ticket) < NUMBERS_PER_TICKET
        ) {
          candidates.push(ticket)
        }
      }
      if (candidates.length === 0) throw new Error('No eligible ticket for column.')

      const ticket = candidates[Math.floor(random() * candidates.length)]
      ticketColumns[ticket][column].push(drawRandom(columns[column], random))
    }
  }

  for (const column of columns) {
    if (column.length > 0) throw new Error('Numbers left over after distribution.')
  }

  return ticketColumns.map((columnNumbers) => arrangeTicket(columnNumbers, random))
}

/**
 * Distribute a ticket's 15 numbers into three rows of five. Columns that have
 * run out of spare rows are placed first so the greedy fill never corners
 * itself.
 */
function arrangeTicket(columns: number[][], random: RandomSource): Ticket {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const remaining = columns.map((column) => shuffle(column, random))
    const grid: Ticket = Array.from({ length: TICKET_ROWS }, () =>
      Array<number>(TICKET_COLUMNS).fill(0),
    )
    let valid = true

    for (let row = 0; row < TICKET_ROWS && valid; row += 1) {
      const rowsLeft = TICKET_ROWS - row
      let cellsLeft = NUMBERS_PER_ROW
      const usedColumns = new Set<number>()

      const forced: number[] = []
      for (let column = 0; column < TICKET_COLUMNS; column += 1) {
        if (remaining[column].length === rowsLeft) forced.push(column)
      }
      if (forced.length > cellsLeft) {
        valid = false
        break
      }
      for (const column of forced) {
        grid[row][column] = drawRandom(remaining[column], random)
        usedColumns.add(column)
        cellsLeft -= 1
      }

      const flexible = shuffle(
        range(0, TICKET_COLUMNS - 1).filter(
          (column) => !usedColumns.has(column) && remaining[column].length > 0,
        ),
        random,
      )
      if (flexible.length < cellsLeft) {
        valid = false
        break
      }
      for (const column of flexible.slice(0, cellsLeft)) {
        grid[row][column] = drawRandom(remaining[column], random)
      }
    }

    if (valid && remaining.every((column) => column.length === 0)) {
      sortColumnsAscending(grid)
      return grid
    }
  }

  throw new Error('Could not arrange a ticket into rows.')
}

/**
 * Printed tickets list a column's numbers from smallest to largest as you read
 * down the ticket, so tidy each column without moving cells between rows.
 */
function sortColumnsAscending(grid: Ticket): void {
  for (let column = 0; column < TICKET_COLUMNS; column += 1) {
    const filledRows: number[] = []
    for (let row = 0; row < TICKET_ROWS; row += 1) {
      if (grid[row][column] !== 0) filledRows.push(row)
    }

    const values = filledRows
      .map((row) => grid[row][column])
      .sort((first, second) => first - second)

    filledRows.forEach((row, index) => {
      grid[row][column] = values[index]
    })
  }
}

/** Generate `count` boards, drawing from as many complete sets as needed. */
export function generateBoards(count: number, random: RandomSource = Math.random): Ticket[] {
  const boards: Ticket[] = []
  while (boards.length < count) {
    boards.push(...generateTicketSet(random))
  }
  return boards.slice(0, count)
}

/** Returns a list of human-readable problems; empty when the set is valid. */
export function validateTicketSet(tickets: Ticket[]): string[] {
  const problems: string[] = []
  const appearances = new Map<number, number>()

  if (tickets.length !== TICKETS_PER_SET) {
    problems.push(`Expected ${TICKETS_PER_SET} tickets, received ${tickets.length}.`)
  }

  tickets.forEach((ticket, ticketIndex) => {
    const label = `Ticket ${ticketIndex + 1}`
    if (ticket.length !== TICKET_ROWS) {
      problems.push(`${label} has ${ticket.length} rows instead of ${TICKET_ROWS}.`)
      return
    }

    const columnCounts = Array<number>(TICKET_COLUMNS).fill(0)
    const columnValues: number[][] = Array.from({ length: TICKET_COLUMNS }, () => [])
    let total = 0

    ticket.forEach((row, rowIndex) => {
      if (row.length !== TICKET_COLUMNS) {
        problems.push(`${label} row ${rowIndex + 1} has ${row.length} cells.`)
        return
      }

      const filled = row.filter((value) => value > 0).length
      if (filled !== NUMBERS_PER_ROW) {
        problems.push(`${label} row ${rowIndex + 1} holds ${filled} numbers, expected ${NUMBERS_PER_ROW}.`)
      }

      row.forEach((value, columnIndex) => {
        if (value === 0) return
        total += 1
        columnCounts[columnIndex] += 1
        columnValues[columnIndex].push(value)

        const [lo, hi] = COLUMN_RANGES[columnIndex]
        if (value < lo || value > hi) {
          problems.push(`${label} has ${value} in column ${columnIndex + 1} (${lo}-${hi}).`)
        }
        appearances.set(value, (appearances.get(value) ?? 0) + 1)
      })
    })

    if (total !== NUMBERS_PER_TICKET) {
      problems.push(`${label} holds ${total} numbers, expected ${NUMBERS_PER_TICKET}.`)
    }
    columnCounts.forEach((count, columnIndex) => {
      if (count < 1 || count > 3) {
        problems.push(`${label} column ${columnIndex + 1} holds ${count} numbers (allowed 1-3).`)
      }
    })

    columnValues.forEach((values, columnIndex) => {
      for (let index = 1; index < values.length; index += 1) {
        if (values[index] < values[index - 1]) {
          problems.push(`${label} column ${columnIndex + 1} is not in ascending order.`)
          break
        }
      }
    })
  })

  for (let value = 1; value <= TOTAL_NUMBERS; value += 1) {
    const count = appearances.get(value) ?? 0
    if (count !== 1) {
      problems.push(`Number ${value} appears ${count} times across the set.`)
    }
  }

  return problems
}

export function isValidTicketSet(tickets: Ticket[]): boolean {
  return validateTicketSet(tickets).length === 0
}
