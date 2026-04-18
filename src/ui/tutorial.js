import { createEditor } from './editor.js';
import { renderSpecTable, renderComparisonTable, checkAllMatch, countMismatches } from './truth-table.js';
import { parseHDL } from '../hdl/parser.js';
import { simulate } from '../hdl/simulator.js';
import { saveExercise, loadProgress } from './progress.js';
import { createCircuitDiagram } from './circuit-diagram.js';
import { renderErrorPanel } from './error-panel.js';
import { burstConfetti } from './confetti.js';

export function createTutorialSection(exercise, index, registry, onSolved, vimEnabled) {
  const section = document.createElement('section');
  section.className = 'exercise exercise--tutorial';
  section.id = `exercise-${exercise.id}`;

  // Header with tutorial badge
  const heading = document.createElement('h2');
  heading.innerHTML = `${index + 1}. ${exercise.name} <span class="tutorial-badge">Tutorial</span>`;
  section.appendChild(heading);

  // Lead-in
  const leadIn = document.createElement('p');
  leadIn.className = 'tutorial-lead-in';
  leadIn.textContent = exercise.tutorialLeadIn;
  section.appendChild(leadIn);

  // Description + analogy
  if (exercise.description) {
    const desc = document.createElement('p');
    desc.className = 'exercise-description';
    desc.textContent = exercise.description;
    section.appendChild(desc);
  }

  if (exercise.analogy) {
    const analogy = document.createElement('p');
    analogy.className = 'exercise-analogy';
    analogy.textContent = exercise.analogy;
    section.appendChild(analogy);
  }

  // Available chips
  const available = document.createElement('p');
  available.className = 'available-chips';
  available.textContent = 'Available chips: ' + registry.getAvailableNames().join(', ');
  section.appendChild(available);

  // Spec table
  const specLabel = document.createElement('h3');
  specLabel.textContent = 'Truth Table';
  section.appendChild(specLabel);
  section.appendChild(renderSpecTable(exercise));

  // Editor (starts read-only with the first step's code)
  const editorContainer = document.createElement('div');
  editorContainer.className = 'editor-container';
  section.appendChild(editorContainer);

  const editor = createEditor(editorContainer, exercise.tutorialSteps[0].code, registry, vimEnabled);
  editor.setReadOnly(true);

  // Buttons
  const buttonRow = document.createElement('div');
  buttonRow.className = 'exercise-buttons';

  const runBtn = document.createElement('button');
  runBtn.className = 'run-btn';
  runBtn.textContent = 'Run';
  buttonRow.appendChild(runBtn);

  const resetExBtn = document.createElement('button');
  resetExBtn.className = 'reset-exercise-btn';
  resetExBtn.textContent = 'Reset';
  buttonRow.appendChild(resetExBtn);

  const walkthroughBtn = document.createElement('button');
  walkthroughBtn.className = 'walkthrough-btn';
  walkthroughBtn.textContent = 'Walk me through it';
  buttonRow.appendChild(walkthroughBtn);

  section.appendChild(buttonRow);

  // Explanation area
  const explanationArea = document.createElement('div');
  explanationArea.className = 'tutorial-explanation';
  explanationArea.textContent = exercise.tutorialSteps[0].explanation;
  section.appendChild(explanationArea);

  // Results area
  const resultsArea = document.createElement('div');
  resultsArea.className = 'results-area';
  section.appendChild(resultsArea);

  // Success indicator
  const successIndicator = document.createElement('div');
  successIndicator.className = 'success-indicator';
  successIndicator.style.display = 'none';
  successIndicator.textContent = 'Correct!';
  section.appendChild(successIndicator);

  // Walkthrough state
  let stepIndex = 0;
  const steps = exercise.tutorialSteps;

  walkthroughBtn.addEventListener('click', () => {
    if (stepIndex < steps.length - 1) {
      stepIndex++;
      editor.setCode(steps[stepIndex].code);
      explanationArea.textContent = steps[stepIndex].explanation;
    }
    if (stepIndex >= steps.length - 1) {
      walkthroughBtn.disabled = true;
      walkthroughBtn.textContent = 'Now click Run';
    }
  });

  // Run
  runBtn.addEventListener('click', () => {
    resultsArea.innerHTML = '';
    successIndicator.style.display = 'none';
    editor.clearErrorHighlight();

    const code = editor.getCode();
    let chipDef;

    try {
      chipDef = parseHDL(code);
    } catch (err) {
      renderErrorPanel(resultsArea, err, editor);
      saveExercise(exercise.id, code, false);
      return;
    }

    if (chipDef.name !== exercise.name) {
      renderErrorPanel(
        resultsArea,
        new Error(`Expected CHIP ${exercise.name}, but found CHIP ${chipDef.name}`),
        editor
      );
      saveExercise(exercise.id, code, false);
      return;
    }

    resultsArea.appendChild(createCircuitDiagram(chipDef, registry));

    const userOutputs = [];
    for (const row of exercise.truthTable) {
      const inputs = {};
      for (const name of exercise.inputs) {
        inputs[name] = row[name];
      }
      try {
        const outputs = simulate(chipDef, inputs, registry);
        userOutputs.push(outputs);
      } catch (err) {
        renderErrorPanel(resultsArea, err, editor);
        saveExercise(exercise.id, code, false);
        return;
      }
    }

    const comparisonTable = renderComparisonTable(exercise, userOutputs);
    resultsArea.appendChild(comparisonTable);

    const allMatch = checkAllMatch(exercise, userOutputs);

    if (!allMatch) {
      const { failed, total } = countMismatches(exercise, userOutputs);
      const banner = document.createElement('div');
      banner.className = 'failure-banner';

      const text = document.createElement('span');
      text.textContent = `❌ ${failed} of ${total} test case${total === 1 ? '' : 's'} don't match the expected output. `;
      banner.appendChild(text);

      if (stepIndex < steps.length - 1) {
        const cta = document.createElement('button');
        cta.type = 'button';
        cta.className = 'failure-banner__cta';
        cta.textContent = 'Walk me through it?';
        cta.addEventListener('click', () => {
          walkthroughBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          walkthroughBtn.click();
        });
        banner.appendChild(cta);
      }

      resultsArea.insertBefore(banner, comparisonTable);
    }

    const wasAlreadySolved = loadProgress().get(exercise.id)?.solved === true;
    saveExercise(exercise.id, code, allMatch);

    if (allMatch) {
      successIndicator.textContent = 'Correct! ✓';
      successIndicator.classList.remove('playing');
      void successIndicator.offsetWidth;
      successIndicator.classList.add('playing');
      successIndicator.style.display = 'block';
      if (!wasAlreadySolved) burstConfetti(successIndicator);
      registry.register(exercise.name, chipDef);
      onSolved(exercise.id, chipDef, code);
    }
  });

  // Reset
  resetExBtn.addEventListener('click', () => {
    stepIndex = 0;
    editor.setCode(steps[0].code);
    editor.clearErrorHighlight();
    explanationArea.textContent = steps[0].explanation;
    walkthroughBtn.disabled = false;
    walkthroughBtn.textContent = 'Walk me through it';
    resultsArea.innerHTML = '';
    successIndicator.style.display = 'none';
    successIndicator.classList.remove('playing');
    saveExercise(exercise.id, '', false);
  });

  return { section, editor };
}
