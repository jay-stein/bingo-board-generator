import type { jsPDF } from 'jspdf'
import { COLUMN_RANGES, TICKETS_PER_SET, type Ticket } from './bingo'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_X = 14
const BOARD_WIDTH = PAGE_WIDTH - MARGIN_X * 2
const CELL_WIDTH = BOARD_WIDTH / COLUMN_RANGES.length
const CELL_HEIGHT = 26
const BOARD_HEIGHT = CELL_HEIGHT * 3
const BOARDS_PER_PAGE = 3
const HEADER_HEIGHT = 16
const LABEL_HEIGHT = 8
const BLOCK_HEIGHT = LABEL_HEIGHT + BOARD_HEIGHT
const FOOTER_MARGIN = 12

const INK = [30, 34, 66] as const
const MUTED = [130, 134, 160] as const
const GRID_LINE = [199, 203, 219] as const
const BLANK_FILL = [245, 246, 250] as const
const HEAVY_LINE = [58, 63, 102] as const

export { BOARDS_PER_PAGE }

/** Build an A4 PDF with the given tickets laid out three boards per page. */
export async function buildBoardsPdf(tickets: Ticket[]): Promise<jsPDF> {
  const { jsPDF: JsPdf } = await import('jspdf')
  const doc = new JsPdf({ unit: 'mm', format: 'a4' })
  const pageCount = Math.max(1, Math.ceil(tickets.length / BOARDS_PER_PAGE))
  const gapCount = BOARDS_PER_PAGE - 1
  const gap =
    (PAGE_HEIGHT -
      HEADER_HEIGHT -
      BOARDS_PER_PAGE * BLOCK_HEIGHT -
      FOOTER_MARGIN) /
    gapCount

  for (let page = 0; page < pageCount; page += 1) {
    if (page > 0) doc.addPage()
    drawPageHeader(doc, page + 1, pageCount, tickets.length)

    for (let slot = 0; slot < BOARDS_PER_PAGE; slot += 1) {
      const index = page * BOARDS_PER_PAGE + slot
      if (index >= tickets.length) break
      const top = HEADER_HEIGHT + slot * (BLOCK_HEIGHT + gap)
      drawBoard(doc, tickets[index], index + 1, MARGIN_X, top)
    }
  }

  return doc
}

/** Build the PDF and trigger a download in the browser. */
export async function downloadBoardsPdf(tickets: Ticket[], filename: string): Promise<void> {
  const doc = await buildBoardsPdf(tickets)
  doc.save(filename)
}

function drawPageHeader(doc: jsPDF, page: number, pageCount: number, totalBoards: number): void {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...INK)
  doc.text('BINGO', MARGIN_X, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text(
    `UK 90-ball tickets \u00b7 ${totalBoards} board${totalBoards === 1 ? '' : 's'}`,
    MARGIN_X + 24,
    11,
  )
  doc.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH - MARGIN_X, 11, { align: 'right' })

  doc.setDrawColor(...GRID_LINE)
  doc.setLineWidth(0.3)
  doc.line(MARGIN_X, 13.5, PAGE_WIDTH - MARGIN_X, 13.5)
}

function drawBoard(
  doc: jsPDF,
  ticket: Ticket,
  boardNumber: number,
  x: number,
  y: number,
): void {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  doc.text(`Board ${boardNumber}`, x, y + 4.2)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  const setNumber = Math.floor((boardNumber - 1) / TICKETS_PER_SET) + 1
  doc.text(`set ${setNumber}`, x + BOARD_WIDTH, y + 4.2, { align: 'right' })

  const gridY = y + LABEL_HEIGHT

  doc.setFillColor(...BLANK_FILL)
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < COLUMN_RANGES.length; column += 1) {
      if (ticket[row][column] === 0) {
        doc.rect(
          x + column * CELL_WIDTH,
          gridY + row * CELL_HEIGHT,
          CELL_WIDTH,
          CELL_HEIGHT,
          'F',
        )
      }
    }
  }

  doc.setDrawColor(...GRID_LINE)
  doc.setLineWidth(0.2)
  for (let column = 0; column <= COLUMN_RANGES.length; column += 1) {
    const lineX = x + column * CELL_WIDTH
    doc.line(lineX, gridY, lineX, gridY + BOARD_HEIGHT)
  }
  for (let row = 0; row <= 3; row += 1) {
    const lineY = gridY + row * CELL_HEIGHT
    doc.line(x, lineY, x + BOARD_WIDTH, lineY)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...INK)
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < COLUMN_RANGES.length; column += 1) {
      const value = ticket[row][column]
      if (value === 0) continue
      doc.text(
        String(value),
        x + column * CELL_WIDTH + CELL_WIDTH / 2,
        gridY + row * CELL_HEIGHT + CELL_HEIGHT / 2,
        { align: 'center', baseline: 'middle' },
      )
    }
  }

  doc.setDrawColor(...HEAVY_LINE)
  doc.setLineWidth(0.6)
  for (const column of [3, 6]) {
    const lineX = x + column * CELL_WIDTH
    doc.line(lineX, gridY, lineX, gridY + BOARD_HEIGHT)
  }

  doc.setLineWidth(0.8)
  doc.roundedRect(x, gridY, BOARD_WIDTH, BOARD_HEIGHT, 1.5, 1.5, 'S')
}
