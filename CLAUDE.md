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
- `circuit-diagram.js` — `createLiveDiagram()` returns `{container, update(chipDef, registry), showPlaceholder(msg)}`. `update()` calls `chipDefToNetlist()` to convert the AST, hands it to `netlistsvg.render()` (which uses ELK for layered layout + orthogonal edge routing), then parses the resulting SVG with `DOMParser` and inserts it via `replaceChildren`. A render-token counter drops out-of-order async results so a fast typist doesn't see flicker.
- `netlist-converter.js` — Pure `chipDefToNetlist(chipDef, registry) → Yosys netlist JSON`. Assigns each named wire an integer bit-ID range (0/1 reserved for constants, `'x'` for undriven pin slots), maps known HDL primitives (`Nand`, `Not`, `And`, `Or`, `Xor`, `Nor`, `Mux`) to their Yosys gate types with pin renaming (`a/b/out` → `A/B/Y`), and falls back to user-defined chip names as generic boxes. Collapses chips with > `COLLAPSE_THRESHOLD` (10) parts into a single labeled black-box cell.
- `netlist-skin.svg` — Themed copy of netlistsvg's default skin. Defines schematic shapes for primitives plus a `generic` template used for user-defined chips and the collapsed black box.
- `build-shims/empty-stub.js` (referenced from `vite.config.js`) — empty module aliased in place of `webworker-threads`, a Node-only dep that one of netlistsvg's transitive elkjs versions bare-requires inside a runtime guard. The vite config also aliases `elkjs` to its modern `elk.bundled.js` to avoid loading a separate worker file.

### Data Flow

`main.js` orchestrates startup: creates a `ChipRegistry`, loads Vim preference from localStorage, replays saved solutions to rebuild the registry, renders exercises up to the highest unlocked one, and appends the next exercise on solve with smooth scrolling. Header contains a global Vim toggle (persisted in localStorage under `byoa-vim-enabled`) and a "Reset All Progress" button.

### Exercise Definitions (`src/exercises/definitions.js`)

Array of 20 exercise objects with `{id, name, chapter, inputs, outputs, skeleton, truthTable, hints}` covering all gates from Not through ALU. Single-bit exercises have full truth tables; multi-bit exercises use representative subsets with decimal integer values. Each exercise has hand-authored progressive hints using conventional Boolean algebra notation (¬, ∧, ∨, ⊕).

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`): push to main → `npm ci` → `npm test` → `vite build` → deploy `dist/` to GitHub Pages. Tests must pass to deploy. The Vite `base` is set to `/build-your-own-alu/`. Requires GitHub Pages source set to "GitHub Actions" in repo settings.
