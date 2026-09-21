import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import App from './App'

describe('App', () => {
  it('renders a board, the dice control, and the export control', () => {
    const html = renderToString(<App />)
    expect(html).toContain('Bingo Board Generator')
    expect(html).toContain('aria-label="Bingo ticket"')
    expect(html).toContain('Set #')
    expect(html).toContain('Roll a board')
    expect(html).toContain('Download PDF')
    expect(html).toContain('Boards in PDF')
  })
})
