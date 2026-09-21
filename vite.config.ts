import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// VITE_BASE is set by the GitHub Pages workflow (e.g. /bingo-board-generator/).
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
})
