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

Interactive web page where users implement Nand2Tetris HDL gates (NAND → ALU). Users write HDL in a CodeMirror editor, click Run, and the simulator verifies their implementation against an expected truth table. A circuit diagram is rendered on each run, and progressive hints guide stuck users.

### HDL Engine (`src/hdl/`)

Three-stage pipeline: **parse → resolve → simulate**.

- `parser.js` — Hand-written recursive descent parser. Tokenizes HDL source, then parses into an AST: `{name, inputs: Pin[], outputs: Pin[], parts: Part[]}`. Each `Part` has `{chipName, connections: [{subPin, subBus, wire, wireBus, isConstant}]}`. Supports bus notation (`a[16]`), indexing (`a[3]`), slicing (`a[0..7]`), sub-pin indexing (`b[0]=true`), constants (`true`/`false`), and `//`/`/* */` comments. Error messages use human-readable token names via a `TOKEN_DISPLAY` map.
- `chips.js` — `ChipRegistry` manages available chips. Nand is the sole built-in (with an `evaluate()` function). User-solved chips are registered as raw ASTs and simulated recursively when used as sub-components.
- `simulator.js` — Iterative signal propagation with multi-bit bus support. Builds a wire map (values are JS numbers, supporting up to 32-bit buses), infers internal wire widths from sub-chip pin definitions, checks for bit-level driver conflicts, handles constants, and supports bit indexing/slicing for both reading and writing wires.

### UI Layer (`src/ui/`)

- `exercise.js` — Creates one exercise section: heading, spec table, editor, button row (Run / Reset / Hint), hint area, results area, success indicator. The Run handler chains: parse → render circuit diagram → simulate each truth table row → render comparison → on success, register chip and unlock next exercise.
- `editor.js` — CodeMirror 6 wrapper with custom HDL syntax highlighting (`StreamLanguage`), chip autocomplete (queries `ChipRegistry` for available chips, inserts templates with pin names), and optional Vim keybindings (via `@replit/codemirror-vim`, toggled with a `Compartment`). Returns `{getCode, setCode, setReadOnly, toggleVim}`.
- `truth-table.js` — `renderSpecTable()` shows expected truth table before Run. `renderComparisonTable()` shows merged inputs/expected/yours columns with match/mismatch CSS classes. `checkAllMatch()` validates results.
- `progress.js` — localStorage persistence under key `byoa-solutions`. Stores `{code, solved}` per exercise. `getHighestUnlocked()` returns the index of the first unsolved exercise for progressive disclosure. `clearProgress()` resets all saved data.
- `circuit-layout.js` — Pure function `computeLayout(chipDef, registry)` that topologically sorts parts into columns and produces a positioned node/edge graph with per-pin port information. Collapses chips with >10 parts into a single box. Handles self-referencing wires without hanging.
- `circuit-render.js` — `renderCircuitSVG(layout)` converts the layout graph into an SVG DOM element. Renders conventional gate shapes (AND, OR, NOT, NAND, XOR) for known gates, rectangles for others. Per-pin wire routing with L-shaped paths. Deduplicates wire labels with white text halos.
- `circuit-diagram.js` — Thin orchestrator combining layout + render.

### Data Flow

`main.js` orchestrates startup: creates a `ChipRegistry`, loads Vim preference from localStorage, replays saved solutions to rebuild the registry, renders exercises up to the highest unlocked one, and appends the next exercise on solve with smooth scrolling. Header contains a global Vim toggle (persisted in localStorage under `byoa-vim-enabled`) and a "Reset All Progress" button.

### Exercise Definitions (`src/exercises/definitions.js`)

Array of 20 exercise objects with `{id, name, chapter, inputs, outputs, skeleton, truthTable, hints}` covering all gates from Not through ALU. Single-bit exercises have full truth tables; multi-bit exercises use representative subsets with decimal integer values. Each exercise has hand-authored progressive hints using conventional Boolean algebra notation (¬, ∧, ∨, ⊕).

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`): push to main → `npm ci` → `npm test` → `vite build` → deploy `dist/` to GitHub Pages. Tests must pass to deploy. The Vite `base` is set to `/build-your-own-alu/`. Requires GitHub Pages source set to "GitHub Actions" in repo settings.
