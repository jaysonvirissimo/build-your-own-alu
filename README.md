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
- [ ] Not16 (needs bus support)
- [ ] And16 (needs bus support)
- [ ] Or16 (needs bus support)
- [ ] Mux16 (needs bus support)
- [ ] Or8Way (needs bus support)
- [ ] Mux4Way16 (needs bus support)
- [ ] Mux8Way16 (needs bus support)
- [ ] DMux4Way (needs bus support)
- [ ] DMux8Way (needs bus support)

### Chapter 2 -- Boolean Arithmetic

- [x] HalfAdder
- [x] FullAdder
- [ ] Add16 (needs bus support)
- [ ] Inc16 (needs bus support)
- [ ] ALU (needs bus support + constants)

### Nice to Have

- [ ] Vim keybindings (via `@replit/codemirror-vim`)
