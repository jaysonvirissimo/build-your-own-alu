import './style.css';
import { ChipRegistry } from './hdl/chips.js';
import { parseHDL } from './hdl/parser.js';
import { EXERCISES } from './exercises/definitions.js';
import { loadProgress, getHighestUnlocked } from './ui/progress.js';
import { createExerciseSection } from './ui/exercise.js';

const registry = new ChipRegistry();
const progress = loadProgress();
const app = document.getElementById('app');

// Header
const header = document.createElement('header');
header.innerHTML = `
  <h1>Build Your Own ALU</h1>
  <p>Implement every gate from NAND to ALU, one chip at a time.</p>
`;
app.appendChild(header);

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

  const { section, editor } = createExerciseSection(
    exercise,
    index,
    registry,
    handleSolved
  );

  // Restore saved code
  if (entry && entry.code) {
    editor.setCode(entry.code);
  }

  main.appendChild(section);
  exerciseSections[index] = { section, editor };
}

function handleSolved() {
  const nextIndex = exerciseSections.length;
  if (nextIndex < EXERCISES.length) {
    appendExercise(nextIndex);
    exerciseSections[nextIndex].section.scrollIntoView({ behavior: 'smooth' });
  }
}
