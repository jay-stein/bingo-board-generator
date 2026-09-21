# Bingo Board Generator

UK 90-ball (tambola) ticket generator — roll the dice for a fresh set of boards, daub the numbers as you play, and export printable PDFs.

**Live demo:** https://jay-stein.github.io/bingo-board-generator/

## Features

- Shows the full set of six boards at a time; the dice deals a fresh set
- Every set of six boards contains each number from 1 to 90 exactly once, so a full set marks on every call
- Printed-ticket layout: 3×9 grid, 15 numbers, exactly five per row, one to three per column, ascending down each column
- Click any number to daub it, with one-click clearing
- Download 1–60 boards as an A4 PDF, three boards per page
- Runs entirely in the browser — no server

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Command           | What it does                                      |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server                         |
| `npm test`        | Validate generated sets and PDF layout with Vitest |
| `npm run lint`    | Run ESLint                                        |
| `npm run build`   | Type-check and build to `dist/`                   |
| `npm run preview` | Serve the production build locally                |

## How the boards are generated

The generator follows the two-part method from the original recipe notebook:

1. Split 1–90 into six groups of 15: seed every board with one number per column, hand one of the last column's spare numbers to a random board, then make four passes over the remaining columns (the first three cap each board at two numbers per column, the fourth allows three).
2. Arrange each group into a 3×9 grid, building one row per pass: columns with as many numbers left as rows left are placed first, then the row is topped up to five without repeating a column. Each column is finally sorted ascending to match printed tickets.

Every generated set is checked against the printed-ticket rules by the test suite.

## Deployment

Pushing to `main` runs the tests and linter, builds the app and deploys `dist/` to GitHub Pages via `.github/workflows/deploy.yml`.
