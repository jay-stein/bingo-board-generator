import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import App from './App'

describe('App', () => {
  it('renders three boards, the rules, the dice control, and the export control', () => {
    const html = renderToString(<App />)
    expect(html).toContain('Bingo Board Generator')
    expect((html.match(/aria-label="Bingo ticket"/g) ?? []).length).toBe(3)
    expect(html).toContain('Exactly 5 numbers per row')
    expect(html).toContain('Roll boards')
    expect(html).toContain('Download PDF')
    expect(html).toContain('Boards in PDF')
  })
})
