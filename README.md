# Build Your Own ALU

An interactive web page where you implement every logic gate from NAND up through a simple ALU, using [Nand2Tetris](https://www.nand2tetris.org/) HDL. Covers Chapters 1--2 of *The Elements of Computing Systems*.

## Progress

### Infrastructure

- [x] Project setup (Vite, package.json)
- [x] HDL parser
- [x] HDL simulator
- [x] Exercise UI (editor + truth table + run button)
- [x] Progressive disclosure (unlock next exercise on success)
- [x] localStorage persistence
- [x] Visual design and styling
- [x] GitHub Actions deployment

### Chapter 1 -- Boolean Logic

- [x] Not
- [x] And
- [x] Or
- [x] Xor
- [x] Mux
- [x] DMux
- [x] Not16
- [x] And16
- [x] Or16
- [x] Mux16
- [x] Or8Way
- [x] Mux4Way16
- [x] Mux8Way16
- [x] DMux4Way
- [x] DMux8Way

### Chapter 2 -- Boolean Arithmetic

- [x] HalfAdder
- [x] FullAdder
- [x] Add16
- [x] Inc16
- [x] ALU

### Nice to Have

- [ ] Vim keybindings (via `@replit/codemirror-vim`)
- [x] Logic gate visualization (native SVG, topological column layout)
