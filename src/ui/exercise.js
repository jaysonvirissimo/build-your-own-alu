import { createEditor } from './editor.js';
import { renderSpecTable, renderComparisonTable, checkAllMatch } from './truth-table.js';
import { parseHDL } from '../hdl/parser.js';
import { simulate } from '../hdl/simulator.js';
import { saveExercise } from './progress.js';
import { createCircuitDiagram } from './circuit-diagram.js';

export function createExerciseSection(exercise, index, registry, onSolved) {
  const section = document.createElement('section');
  section.className = 'exercise';
  section.id = `exercise-${exercise.id}`;

  // Header
  const heading = document.createElement('h2');
  heading.textContent = `${index + 1}. ${exercise.name}`;
  section.appendChild(heading);

  // Spec table
  const specLabel = document.createElement('h3');
  specLabel.textContent = 'Truth Table';
  section.appendChild(specLabel);
  section.appendChild(renderSpecTable(exercise));

  // Editor
  const editorContainer = document.createElement('div');
  editorContainer.className = 'editor-container';
  section.appendChild(editorContainer);

  const editor = createEditor(editorContainer, exercise.skeleton);

  // Run button
  const runBtn = document.createElement('button');
  runBtn.className = 'run-btn';
  runBtn.textContent = 'Run';
  section.appendChild(runBtn);

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

  runBtn.addEventListener('click', () => {
    resultsArea.innerHTML = '';
    successIndicator.style.display = 'none';

    const code = editor.getCode();
    let chipDef;

    try {
      chipDef = parseHDL(code);
    } catch (err) {
      showError(resultsArea, err.message);
      saveExercise(exercise.id, code, false);
      return;
    }

    // Validate chip name
    if (chipDef.name !== exercise.name) {
      showError(
        resultsArea,
        `Expected CHIP ${exercise.name}, but found CHIP ${chipDef.name}`
      );
      saveExercise(exercise.id, code, false);
      return;
    }

    // Render circuit diagram
    resultsArea.appendChild(createCircuitDiagram(chipDef, registry));

    // Run simulation for each truth table row
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
        showError(resultsArea, err.message);
        saveExercise(exercise.id, code, false);
        return;
      }
    }

    // Render comparison table
    resultsArea.appendChild(renderComparisonTable(exercise, userOutputs));

    const allMatch = checkAllMatch(exercise, userOutputs);
    saveExercise(exercise.id, code, allMatch);

    if (allMatch) {
      successIndicator.style.display = 'block';
      registry.register(exercise.name, chipDef);
      onSolved(exercise.id, chipDef, code);
    }
  });

  return { section, editor };
}

function showError(container, message) {
  const pre = document.createElement('pre');
  pre.className = 'error';
  pre.textContent = message;
  container.appendChild(pre);
}
