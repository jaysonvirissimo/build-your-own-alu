# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build to dist/
npm test             # Run all tests (vitest run)
npm run test:watch   # Run tests in watch mode
npx vitest run src/hdl/__tests__/parser.test.js  # Run a single test file
```

## Architecture

Interactive web page where users implement Nand2Tetris HDL gates (NAND → ALU). Users write HDL in a CodeMirror editor, click Run, and the simulator verifies their implementation against an expected truth table.

### HDL Engine (`src/hdl/`)

Three-stage pipeline: **parse → resolve → simulate**.

- `parser.js` — Hand-written recursive descent parser. Tokenizes HDL source, then parses into an AST: `{name, inputs: Pin[], outputs: Pin[], parts: Part[]}`. Each `Part` has `{chipName, connections: [{subPin, wire}]}` where `subPin` is the pin on the instantiated chip and `wire` is the name in the parent chip's scope.
- `chips.js` — `ChipRegistry` manages available chips. Nand is the sole built-in (with an `evaluate()` function). User-solved chips are registered as raw ASTs and simulated recursively when used as sub-components.
- `simulator.js` — Iterative signal propagation. Builds a wire map, then loops: simulate any part whose input wires are all defined, write its outputs to the wire map, repeat until all parts resolve or deadlock. Built-in chips short-circuit via `evaluate()`; user-defined chips recurse into `simulate()`.

**Current limitation:** Only single-bit pins are supported. Bus notation (`a[16]`), bus slicing (`a[0..7]`), and constants (`true`/`false`) are not yet implemented — this blocks gates 7-20 (Not16 through ALU).

### UI Layer (`src/ui/`)

- `exercise.js` — Creates one exercise section (heading, spec table, editor, Run button, results). The Run handler chains: `parseHDL()` → validate chip name → `simulate()` each truth table row → render comparison → on success, register chip in registry and call `onSolved` callback.
- `editor.js` — CodeMirror 6 wrapper with a custom `StreamLanguage` for HDL keyword/comment highlighting. Returns `{getCode, setCode, setReadOnly}`.
- `truth-table.js` — `renderSpecTable()` shows expected truth table before Run. `renderComparisonTable()` shows merged inputs/expected/yours columns with match/mismatch CSS classes.
- `progress.js` — localStorage persistence under key `byoa-solutions`. Stores `{code, solved}` per exercise. `getHighestUnlocked()` returns the index of the first unsolved exercise for progressive disclosure.

### Data Flow

`main.js` orchestrates startup: creates a `ChipRegistry`, replays saved solutions from localStorage to rebuild the registry (stops on first corrupted/unsolved entry), renders exercises up to the highest unlocked one, and appends the next exercise on solve with smooth scrolling.

### Exercise Definitions (`src/exercises/definitions.js`)

Array of exercise objects with `{id, name, chapter, inputs, outputs, skeleton, truthTable}`. Currently 8 exercises (Not through FullAdder). The skeleton is pre-filled HDL with an empty PARTS section.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`): push to main → `npm ci` → `npm test` → `vite build` → deploy `dist/` to GitHub Pages. Tests must pass to deploy. The Vite `base` is set to `/build-your-own-alu/`.
