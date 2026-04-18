import './style.css';
import { ChipRegistry } from './hdl/chips.js';
import { parseHDL } from './hdl/parser.js';
import { EXERCISES } from './exercises/definitions.js';
import { loadProgress, getHighestUnlocked, clearProgress } from './ui/progress.js';
import { createExerciseSection } from './ui/exercise.js';
import { createTutorialSection } from './ui/tutorial.js';

const registry = new ChipRegistry();
const progress = loadProgress();
let vimEnabled = localStorage.getItem('byoa-vim-enabled') === 'true';
const app = document.getElementById('app');

// Header
const header = document.createElement('header');
header.innerHTML = `
  <h1>Build Your Own ALU</h1>
  <p>Write chips in HDL (Hardware Description Language) — a simple text format for wiring logic gates together. Starting from a single gate called NAND, build increasingly complex chips until you have a complete Arithmetic Logic Unit (ALU) — the component at the heart of every CPU.</p>
`;

const vimToggle = document.createElement('button');
vimToggle.className = 'vim-toggle';
vimToggle.textContent = vimEnabled ? 'Vim: ON' : 'Vim: OFF';
vimToggle.addEventListener('click', () => {
  vimEnabled = !vimEnabled;
  localStorage.setItem('byoa-vim-enabled', vimEnabled);
  vimToggle.textContent = vimEnabled ? 'Vim: ON' : 'Vim: OFF';
  for (const entry of exerciseSections) {
    if (entry) entry.editor.toggleVim(vimEnabled);
  }
});
header.appendChild(vimToggle);

const resetAllBtn = document.createElement('button');
resetAllBtn.className = 'reset-btn';
resetAllBtn.textContent = 'Reset All Progress';
resetAllBtn.addEventListener('click', () => {
  if (confirm('Reset all progress? Your solutions will be deleted.')) {
    clearProgress();
    location.reload();
  }
});
header.appendChild(resetAllBtn);

const repoLink = document.createElement('a');
repoLink.className = 'repo-link';
repoLink.href = 'https://github.com/jaysonvirissimo/build-your-own-alu';
repoLink.target = '_blank';
repoLink.rel = 'noopener';
repoLink.textContent = 'GitHub';
header.appendChild(repoLink);

app.appendChild(header);

const guide = document.createElement('details');
guide.className = 'hdl-guide';
guide.innerHTML = `
  <summary>How to write HDL</summary>
  <p>Each chip is defined with a name, inputs, outputs, and a list of parts that wire together:</p>
  <pre><code>CHIP MyChip {
    IN a, b;
    OUT out;

    PARTS:
    // your parts go here
}</code></pre>
  <p>Each line in <strong>PARTS</strong> places a chip and connects its pins to wires, e.g. <code>Foo(in=x, out=y)</code>.
  The left side of <code>=</code> is the pin on the chip you're placing.
  The right side is the wire name in your design.
  Any name that isn't an input or output becomes an internal wire.</p>
  <p>Start typing a chip name and autocomplete will show available chips with their pins.</p>
  <p>This HDL is from the <a href="https://www.nand2tetris.org/" target="_blank" rel="noopener">Nand2Tetris</a> course by Noam Nisan and Shimon Schocken. The exercises here cover the first two chapters of the book.</p>
`;
app.appendChild(guide);

const boolRef = document.createElement('details');
boolRef.className = 'hdl-guide';
boolRef.innerHTML = `
  <summary>Boolean notation reference</summary>
  <table class="bool-ref-table">
    <tr><td>\u00ACx</td><td>NOT \u2014 opposite of x</td></tr>
    <tr><td>x \u2227 y</td><td>AND \u2014 1 only when both are 1</td></tr>
    <tr><td>x \u2228 y</td><td>OR \u2014 1 when at least one is 1</td></tr>
    <tr><td>x \u2295 y</td><td>XOR \u2014 1 when exactly one is 1</td></tr>
  </table>
  <p><strong>De Morgan\u2019s laws:</strong></p>
  <p>\u00AC(x \u2227 y) = \u00ACx \u2228 \u00ACy<br>
  \u00AC(x \u2228 y) = \u00ACx \u2227 \u00ACy</p>
`;
app.appendChild(boolRef);

const main = document.createElement('main');
app.appendChild(main);

// Replay saved solutions to rebuild the registry
for (const exercise of EXERCISES) {
  const entry = progress.get(exercise.id);
  if (!entry || !entry.solved) break;
  try {
    const chipDef = parseHDL(entry.code);
    registry.register(exercise.name, chipDef);
  } catch {
    // Corrupted save — stop replaying
    break;
  }
}

// Render exercises up to the highest unlocked
const highestUnlocked = getHighestUnlocked(EXERCISES, progress);
const exerciseSections = [];

for (let i = 0; i <= highestUnlocked; i++) {
  appendExercise(i);
}

function appendExercise(index) {
  const exercise = EXERCISES[index];
  const entry = progress.get(exercise.id);

  const builder = exercise.tutorial ? createTutorialSection : createExerciseSection;
  const { section, editor } = builder(
    exercise,
    index,
    registry,
    handleSolved,
    vimEnabled
  );

  // Restore saved code
  if (entry && entry.code) {
    editor.setCode(entry.code);
  }

  if (exercise.preamble) {
    const preamble = document.createElement('details');
    preamble.className = 'hdl-guide';
    preamble.innerHTML = exercise.preamble;
    main.appendChild(preamble);
  }

  main.appendChild(section);
  exerciseSections[index] = { section, editor };
}

function handleSolved(exerciseId) {
  // Find the index of the exercise that was just solved
  const solvedIndex = EXERCISES.findIndex((e) => e.id === exerciseId);
  const nextIndex = solvedIndex + 1;
  // Only append the next exercise if it exists and isn't already rendered
  if (nextIndex < EXERCISES.length && !exerciseSections[nextIndex]) {
    appendExercise(nextIndex);
    exerciseSections[nextIndex].section.scrollIntoView({ behavior: 'smooth' });
  }
}
