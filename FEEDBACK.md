# Playtest feedback — "sorta got chapter 1" 13-year-old

Played through all 23 exercises (Not → ALU) in a single session, pretending to be a 13-year-old who read chapter 1 of *The Elements of Computing Systems* (Nand2Tetris) but didn't fully absorb it. Below is what clicked, what didn't, and specific changes that would help a younger first-time learner.

---

## What worked well

- **Walk-me-through tutorials on Not and Xor.** The Xor step-through that shows `w1..w4` first and then renames to `notA, aAndNotB` is the single best teaching moment on the site. It made "name wires for what they carry" stick in a way a paragraph never would.
- **Analogies in the description** (bank vault, mail sorter, car dome light, odometer) gave me an instant intuition before I even looked at the truth table. Keep these — they're great.
- **Circuit diagram after each solve** was the reward I didn't expect. Seeing `a, b → And gate → out` wired up made it feel like I actually built a thing.
- **Available chips: Nand, Not, And** line at the top of each exercise. I always knew what I had to work with.
- **Progressive hint button.** One click at a time meant I wasn't force-fed the answer. (Though — see Concern #5, hint #1 on Or gate is too strong.)
- **Preamble boxes** (multi-bit buses, splitting output to two wires) are well-written. The problem is just that they're collapsed — see Concern #2.
- **Solved chips become available for the next exercise.** This is core Nand2Tetris and you preserved it cleanly.

---

## What tripped me up

### 1. 🔴 Multi-bit truth tables display raw decimals

This is the biggest one. Starting at `Not16`, the expected output column reads `65535`, `43690`, `21845`, `4660`, `22136`. To a 13-year-old these are **opaque**. I can't tell at a glance that `43690 → 21845` is "every bit flipped" (it's 0xAAAA → 0x5555). The entire point of these exercises is bit-level intuition, and the display format hides exactly that.

`definitions.js` already stores values as `0xFFFF` hex literals, but `src/ui/truth-table.js` lines 20 and 64/69/74 do `td.textContent = row[name]`, which JS coerces to decimal.

**Fix options (in order of effort):**
- Quick win: for exercises with any multi-bit pin, render the value in hex (`0xAAAA`) or 16-bit binary with underscores (`1010_1010_1010_1010`).
- Better: a small toggle above each comparison table — `[dec | hex | bin]` — so the learner can flip representations and build fluency.
- Best: binary by default for the first bus exercises (Not16/And16/Or16), hex from Mux4Way16 onward.

### 2. 🔴 Preamble `<details>` boxes are collapsed by default

Both `Working with multi-bit buses` (before Not16) and `Splitting an output to two wires` (before ALUPostprocess) are critical new-syntax lessons. They sit above the exercise as a closed disclosure triangle. A 13-year-old dives straight at the editor, never clicks, and then hits errors with no clue why `in[0]` or `out=a, out=b` syntax is legal.

**Fix:** add `open` to those `<details>` elements on first render. Even better: render them as an inline callout box with a visible "NEW SYNTAX" badge above the editor, not a fold-up.

### 3. 🟡 Wrong-answer feedback is too subtle

When my first And attempt failed, the comparison table cells turned a light pink and that was it. No "3 of 4 test cases failed" banner. No sympathetic nudge toward the hint button. A 13-year-old looking at this doesn't always catch that "these slightly-differently-colored cells" mean "your chip is wrong."

**Fix:**
- Above the comparison table, add a red banner: `❌ 3 of 4 test cases don't match. Try a Hint?`
- Strengthen the mismatch cell color (darker red text + stronger background).
- On success, add a confetti/ceremony beat — a single green checkmark animation goes a long way at this age.

### 4. 🔴 ALU truth table has no operation labels

The final ALU exercise shows 12 rows of cryptic bit patterns:
```
x=0, y=65535, zx=1, nx=0, zy=1, ny=0, f=1, no=0 → out=0, zr=1, ng=0
```
The definitions.js source literally has comments next to each row saying what it computes: `// 0`, `// 1`, `// -1`, `// x`, `// y`, `// !x`, `// -x`, `// x+1`, `// x+y`, `// x-y`, `// x&y`, `// x|y`. **None of this appears in the UI.** This is *the* payoff moment of the entire course — "the same 16-bit chip computes 12 different functions depending on 6 control bits" — and the student can't see it.

**Fix:** add a trailing column or inline caption per row showing the operation. For example:
```
x=0, y=65535, zx=1, nx=0, zy=1, ny=0, f=1, no=0 → out=0       // computes 0
x=17, y=3,    zx=0, nx=0, zy=0, ny=0, f=1, no=0 → out=20      // computes x+y
```
The data is already in the source as comments — just plumb it through to the UI. This single change would probably be the most teaching-value-per-line-of-code improvement on the site.

### 5. 🟡 "How to write HDL" intro spoils Exercise 2

`src/main.js` lines 60–67, the code block under `How to write HDL`:
```hdl
CHIP And {
    IN a, b;
    OUT out;

    PARTS:
    Nand(a=a, b=b, out=nandOut);
    Nand(a=nandOut, b=nandOut, out=out);
}
```
That's a complete, working **solution to Exercise 2 (And)**. A curious learner who opens "How to write HDL" before starting gets the answer handed to them.

**Fix:** use a syntactic example that isn't one of the exercises. A hypothetical 3-input gate, or just the skeleton structure without a solved PARTS section.

### 6. 🟡 Hint #1 on Or gives away the answer as a formula

The first hint for Or is literally `out = a ∨ b`, which is just the spec. The second hint is `By De Morgan's law: a ∨ b = ¬(¬a ∧ ¬b)` — that's the complete recipe. No softer "think about it" layer in between.

**Fix:** make hint #1 a thinking prompt, not an equation. E.g. "When should out be 1? Can you write the negative version ('out is 0 when…')?" Then keep the existing formula hints as hint #2+. This mirrors real tutoring: ask, suggest, show.

### 7. 🟡 No binary / hex / two's complement reference

The "Boolean notation reference" covers `¬ ∧ ∨ ⊕`, but there's nowhere to learn that `65535` = all-ones = -1 in two's complement. Chapter 2 exercises (Add16, Inc16, ALU) lean heavily on two's complement arithmetic; a 13-year-old who only sorta got chapter 1 is stranded.

**Fix:** add a third disclosure box, `Binary numbers`, covering: hex digits, powers of 2, how a 16-bit number represents negative values, and maybe a tiny in-line hex⇄binary⇄decimal converter. Link to it from the multi-bit bus preamble.

### 8. 🟡 "Available chips" list grows until it's noise

By the ALU exercise, the list reads: `Available chips: Nand, Not, And, Or, Xor, Mux, DMux, Not16, And16, Or16, Mux16, Or8Way, Mux4Way16, Mux8Way16, DMux4Way, DMux8Way, HalfAdder, FullAdder, Add16, Inc16, ALUPreprocess, ALUCompute, ALUPostprocess`. That's a wall of text I scan over, not a helpful prompt.

**Fix:** for each exercise, highlight the 3–5 chips you're *most likely* to use and collapse the rest behind a "…and N others" disclosure. Or group: `Single-bit logic: Nand, Not, And, Or, Xor, Mux, DMux | 16-bit: Not16, And16, … | Arithmetic: HalfAdder, FullAdder, …`.

### 9. 🟢 "Walk me through it" lacks a progress indicator

The button advances one step per click but doesn't tell me how many steps remain. I clicked, got one snippet, clicked again, got another, clicked again, nothing happened. Unclear when a tutorial is done.

**Fix:** label the button `Walk me through it (1 of 2)` / `(2 of 2)` / `Done ✓`.

### 10. 🟢 No chapter breaks / progress map

As I scroll through 23 exercises I never see "Chapter 1 — Multi-bit" or "Chapter 2 — Arithmetic" as visible dividers. The `chapter` field is in the data but not rendered. After 10 exercises I have no mental map of where I am.

**Fix:** render a section heading between chapters (`<h2>Chapter 2 — Boolean Arithmetic</h2>`). Optional bonus: a sticky sidebar / top-bar progress breadcrumb: "✓ Not, ✓ And, ✓ Or, → Xor, · Mux, · DMux, …".

### 11. 🟢 Wide truth tables (DMux8Way, ALU) force horizontal scroll

DMux8Way has 10 columns; ALU has 11. On a 1280-wide viewport I still had to scroll horizontally. On a tablet or phone this is unusable.

**Fix:** pin the first column (inputs) as sticky on horizontal scroll, or shrink font + tighten padding on wide tables.

### 12. 🟢 Naming lesson from Xor tutorial never reinforced

The Xor walkthrough teaches "name wires for what they carry, not `w1..w4`." Lovely. But then nothing in later exercises checks or nudges. In my own Add16 I named carries `c0, c1, …, c15` — no complaint. If naming matters, consider a lightweight "lint" hint after solve: "Nice — but `c0..c15` are positional names. Try `carryFrom0`, `carryFrom1`, …"

### 13. 🟢 No circuit-diagram legend

Some gates draw as D-shapes (AND), shields (OR), triangles (NOT); others are generic rectangles. A first-time reader doesn't know the conventional shape language. A small once-shown legend ("AND = D-shape, OR = shield, NOT = triangle with bubble, NAND = AND with bubble") would demystify it.

### 14. 🟢 ALU stage names are jargon

`ALUPreprocess`, `ALUCompute`, `ALUPostprocess` are fine engineering names but kids don't know why they're being asked to build three chips that aren't in the book. A framing sentence on the first of the three ("We'll tackle the book's ALU in 3 stages — this is stage 1 of 3: conditioning the inputs") would connect it to chapter 2 for them. A breadcrumb like "ALU · stage 1/3" at the top of each would make the relationship visible.

---

## Summary of highest-impact fixes (my ranking)

1. **Display multi-bit values in hex or binary, not decimal.** (#1)
2. **Label ALU truth-table rows with the operation each computes.** (#4)
3. **Open the `Working with multi-bit buses` and `Splitting an output to two wires` preambles by default.** (#2)
4. **Add a red "N of M failed" headline above the comparison table on error, and a visible success animation on pass.** (#3)
5. **Replace the HDL-intro example (currently the And solution) with something that isn't an exercise answer.** (#5)

Any of these alone is a solid afternoon of work and would noticeably raise the floor for younger learners.
