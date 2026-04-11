# Build Your Own ALU -- Specification

## Overview

A single-page, scroll-driven, interactive web page where the reader implements every logic gate from NAND up through a simple ALU, following the progression of Chapters 1--2 of *The Elements of Computing Systems* (Nand2Tetris). Every gate is an exercise: the reader writes Nand2Tetris HDL in an in-browser editor and verifies it against the expected truth table.

## Content & Scope

### HDL Language

We use the **exact Nand2Tetris HDL** syntax:

```
CHIP <Name> {
    IN <pins>;
    OUT <pins>;

    PARTS:
    <part-statements>
}
```

Key syntax features to support:

- Pin declarations (comma-separated, semicolon-terminated)
- Bus notation: `a[16]`
- Bus slicing: `a[0..7]`, `a[3]`
- Part instantiation: `ChipName(pin1=wire1, pin2=wire2, ...);`
- Constants: `true`, `false`
- Internal (intermediate) pins (auto-declared by usage)
- Comments: `//`, `/* */`

### Gate Progression

Each gate is an exercise. The reader must implement it before scrolling to the next. Once implemented, a gate becomes available as a building block for subsequent gates.

**Chapter 1 -- Boolean Logic:**

| # | Gate | Inputs | Outputs | Notes |
|---|------|--------|---------|-------|
| 1 | Not | `in` | `out` | Built from Nand |
| 2 | And | `a, b` | `out` | |
| 3 | Or | `a, b` | `out` | |
| 4 | Xor | `a, b` | `out` | |
| 5 | Mux | `a, b, sel` | `out` | |
| 6 | DMux | `in, sel` | `a, b` | |
| 7 | Not16 | `in[16]` | `out[16]` | Multi-bit variant |
| 8 | And16 | `a[16], b[16]` | `out[16]` | |
| 9 | Or16 | `a[16], b[16]` | `out[16]` | |
| 10 | Mux16 | `a[16], b[16], sel` | `out[16]` | |
| 11 | Or8Way | `in[8]` | `out` | |
| 12 | Mux4Way16 | `a[16], b[16], c[16], d[16], sel[2]` | `out[16]` | |
| 13 | Mux8Way16 | `a[16]..h[16], sel[3]` | `out[16]` | |
| 14 | DMux4Way | `in, sel[2]` | `a, b, c, d` | |
| 15 | DMux8Way | `in, sel[3]` | `a, b, c, d, e, f, g, h` | |

**Chapter 2 -- Boolean Arithmetic:**

| # | Gate | Inputs | Outputs | Notes |
|---|------|--------|---------|-------|
| 16 | HalfAdder | `a, b` | `sum, carry` | |
| 17 | FullAdder | `a, b, c` | `sum, carry` | |
| 18 | Add16 | `a[16], b[16]` | `out[16]` | No carry-out |
| 19 | Inc16 | `in[16]` | `out[16]` | Adds 1 |
| 20 | ALU | `x[16], y[16], zx, nx, zy, ny, f, no` | `out[16], zr, ng` | The Hack ALU |

### Available Building Blocks

- **Nand** is always available as the sole primitive.
- Each gate the reader successfully implements becomes available for use in subsequent gate definitions.
- The simulator should reject usage of a gate that hasn't been implemented yet.

## Interaction Model

### Exercise Layout

Each exercise is a self-contained section containing:

1. **Header**: Gate name (e.g., "And")
2. **Specification panel**: Inputs, outputs, and the expected truth table (or a representative subset for 16-bit gates)
3. **Editor panel**: A code editor pre-populated with the chip skeleton:
   ```
   CHIP And {
       IN a, b;
       OUT out;

       PARTS:
       // Your code here
   }
   ```
4. **Run button**: Parses the HDL, simulates it, and displays the result
5. **Result panel**: Shows the user's truth table side-by-side with the expected truth table, with mismatches highlighted. On success, shows a clear "correct" indicator.

### Editor

- Syntax-highlighted code editor (CodeMirror 6 or similar)
- Pre-populated with the chip skeleton (IN/OUT filled in, PARTS empty)
- The user only needs to fill in the PARTS section

### Truth Table Display

- For single-bit gates: show the full truth table
- For 16-bit gates: show a representative set of test cases (not all 2^16+ rows)
- Two columns side by side: "Expected" and "Yours"
- Matching rows shown normally; mismatches highlighted in red
- On full match: a success indicator (checkmark, green border, or similar)

### Progressive Disclosure

- The page is one long scroll
- Exercises are revealed sequentially: the next exercise becomes visible (or un-grayed) only after the current one is solved
- Previously solved exercises remain visible and editable (the user can revisit)
- Solutions persist in `localStorage` so progress survives page reloads

## Technical Architecture

### Tech Stack

- **Build tool**: Vite (fast dev server, simple config, good for single-page apps)
- **Editor**: CodeMirror 6 (lightweight, extensible, good mobile support)
- **HDL Parser**: Custom parser written in JavaScript (the HDL is simple enough that a hand-written recursive descent parser is appropriate)
- **Simulator**: Custom JavaScript engine that evaluates chip definitions against input vectors
- **Styling**: Plain CSS (no framework needed for a single page)
- **Deployment**: GitHub Actions -> GitHub Pages

### HDL Engine

The engine has three stages:

1. **Parse**: HDL source -> AST (chip name, pins, parts list with connections)
2. **Resolve**: Validate that all referenced chips exist (either Nand or previously solved gates). Report clear errors for unknown chips.
3. **Simulate**: Given input pin values, propagate signals through the chip's parts to compute output pin values. Must handle:
   - Fan-out (one output feeding multiple inputs)
   - Topological ordering of parts (no combinational loops in Chapters 1--2, so a simple topological sort suffices)
   - Bus operations (slicing, indexing)

### Deployment

GitHub Actions workflow:

- Trigger: push to `main`
- Steps: install dependencies, `vite build`, deploy `dist/` to GitHub Pages
- Uses `actions/deploy-pages` (official GitHub action)

## Visual Design

Clean, readable, content-first design inspired by Eloquent JavaScript:

- **Layout**: Single centered column, max-width ~48em, generous vertical spacing
- **Typography**: Serif body font (Georgia or similar), monospace for code (system monospace or a web font like PT Mono)
- **Colors**: Light background, dark text, minimal accent color for interactive elements (teal/cyan for editor borders, green for success, red for errors)
- **Code editors**: Bordered, slightly inset, monospace font, syntax highlighting with muted colors
- **Truth tables**: Clean bordered tables, alternating row backgrounds for readability
- **Responsive**: Desktop-first. On mobile, panels stack vertically instead of side-by-side. Editor remains usable but not optimized.

## Non-Goals (v1)

- Explanatory prose (no teaching text, just exercise specifications)
- Sequential/clocked chips (DFF, registers, RAM -- these are Chapter 3+)
- Hardware visualization (gate diagrams, waveforms)
- User accounts or server-side persistence
- Automated grading or hints
- Test file (.tst) compatibility

## File Structure

```
build-your-own-alu/
  SPEC.md
  index.html
  package.json
  vite.config.js
  src/
    main.js            # Entry point, initializes exercises
    style.css           # All styles
    hdl/
      parser.js         # HDL -> AST
      simulator.js      # AST + inputs -> outputs
      chips.js          # Built-in Nand definition + chip registry
    exercises/
      definitions.js    # Exercise list: name, pins, truth tables, skeletons
    ui/
      editor.js         # CodeMirror setup
      truth-table.js    # Truth table rendering and comparison
      exercise.js       # Exercise component (editor + table + run button)
      progress.js       # Progressive disclosure + localStorage persistence
  .github/
    workflows/
      deploy.yml        # GitHub Pages deployment
```
