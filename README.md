# Build Your Own ALU

An interactive web page where you implement every logic gate from NAND up through a simple ALU, writing real [Nand2Tetris](https://www.nand2tetris.org/) HDL in your browser. Covers Chapters 1--2 of *The Elements of Computing Systems*.

**[Try it live](https://jaysonvirissimo.github.io/build-your-own-alu/)**

## What You Build

Starting with nothing but a NAND gate, you implement 20 chips in sequence:

| Chapter 1 -- Boolean Logic | Chapter 2 -- Boolean Arithmetic |
|---|---|
| Not, And, Or, Xor, Mux, DMux | HalfAdder, FullAdder |
| Not16, And16, Or16, Mux16 | Add16, Inc16 |
| Or8Way, Mux4Way16, Mux8Way16 | **ALU** |
| DMux4Way, DMux8Way | |

Each gate you solve becomes available as a building block for the next.

## Features

- **In-browser HDL editor** with syntax highlighting and chip autocomplete (powered by CodeMirror 6)
- **Instant verification** against truth tables with side-by-side comparison
- **Circuit diagram** rendered as SVG with conventional gate shapes after each run
- **Progressive hints** using Boolean algebra notation for when you're stuck
- **Progress saved** in localStorage -- pick up where you left off
- **Vim keybindings** (optional, toggle in header)
- **Collapsible HDL guide** for newcomers who haven't seen the syntax before

## Development

```bash
npm install        # Install dependencies
npm run dev        # Start dev server
npm test           # Run tests
npm run build      # Production build
```

## Tech Stack

- [Vite](https://vite.dev/) -- build tool and dev server
- [CodeMirror 6](https://codemirror.net/) -- code editor with custom HDL language mode
- [Vitest](https://vitest.dev/) -- test runner
- Custom HDL parser, simulator, and circuit layout engine -- no heavy dependencies
- Deployed to GitHub Pages via GitHub Actions

## Acknowledgments

Inspired by [Nand2Tetris](https://www.nand2tetris.org/) by Noam Nisan and Shimon Schocken, [Build Your Own React](https://pomb.us/build-your-own-react/) by Rodrigo Pombo, and [Eloquent JavaScript](https://eloquentjavascript.net/) by Marijn Haverbeke.
