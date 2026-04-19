import { createEditor } from './editor.js';
import { renderSpecTable, renderComparisonTable, checkAllMatch, countMismatches } from './truth-table.js';
import { parseHDL } from '../hdl/parser.js';
import { simulate } from '../hdl/simulator.js';
import { saveExercise, loadProgress } from './progress.js';
import { createLiveDiagram } from './circuit-diagram.js';
import { renderErrorPanel } from './error-panel.js';
import { burstConfetti } from './confetti.js';

export function createExerciseSection(exercise, index, registry, onSolved, vimEnabled) {
  const section = document.createElement('section');
  section.className = 'exercise';
  section.id = `exercise-${exercise.id}`;

  // Header
  const heading = document.createElement('h2');
  heading.textContent = `${index + 1}. ${exercise.name}`;
  section.appendChild(heading);

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

  // Top row: truth table left, circuit diagram right
  const topRow = document.createElement('div');
  topRow.className = 'exercise-top-row';

  const specPane = document.createElement('div');
  specPane.className = 'exercise-spec-pane';
  const specLabel = document.createElement('h3');
  specLabel.textContent = 'Truth Table';
  specPane.append(specLabel, renderSpecTable(exercise));

  const diagramPane = document.createElement('div');
  diagramPane.className = 'exercise-diagram-pane';
  const diagLabel = document.createElement('h3');
  diagLabel.textContent = 'Circuit Diagram';
  const diagram = createLiveDiagram();
  diagramPane.append(diagLabel, diagram.container);

  topRow.append(specPane, diagramPane);
  section.appendChild(topRow);

  // Editor
  const editorContainer = document.createElement('div');
  editorContainer.className = 'editor-container';
  section.appendChild(editorContainer);

  const editor = createEditor(editorContainer, exercise.skeleton, registry, vimEnabled);

  let debounceTimer = null;
  function scheduleDiagramUpdate() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      let chipDef;
      try { chipDef = parseHDL(editor.getCode()); } catch { return; }
      try { diagram.update(chipDef, registry); } catch { /* unknown sub-chip mid-type */ }
    }, 250);
  }
  editor.onDocChange(scheduleDiagramUpdate);

  try {
    diagram.update(parseHDL(editor.getCode()), registry);
  } catch {
    diagram.showPlaceholder('Start typing HDL to see the diagram');
  }

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

  // Hint button
  let hintIndex = 0;
  const hasHints = exercise.hints && exercise.hints.length > 0;

  const hintBtn = document.createElement('button');
  hintBtn.className = 'hint-btn';
  hintBtn.textContent = 'Hint';
  if (!hasHints) hintBtn.style.display = 'none';
  buttonRow.appendChild(hintBtn);

  section.appendChild(buttonRow);

  // Hint area
  const hintArea = document.createElement('div');
  hintArea.className = 'hint-area';
  section.appendChild(hintArea);

  hintBtn.addEventListener('click', () => {
    if (hintIndex < exercise.hints.length) {
      const hint = document.createElement('div');
      hint.className = 'hint';
      hint.textContent = exercise.hints[hintIndex];
      hintArea.appendChild(hint);
      hintIndex++;
    }
    if (hintIndex >= exercise.hints.length) {
      hintBtn.disabled = true;
      hintBtn.textContent = 'No more hints';
    }
  });

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

    // Validate chip name
    if (chipDef.name !== exercise.name) {
      renderErrorPanel(
        resultsArea,
        new Error(`Expected CHIP ${exercise.name}, but found CHIP ${chipDef.name}`),
        editor
      );
      saveExercise(exercise.id, code, false);
      return;
    }

    // Sync live diagram with what we just parsed (Run may have preempted the debounce)
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    try { diagram.update(chipDef, registry); } catch { /* keep last good */ }

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
        renderErrorPanel(resultsArea, err, editor);
        saveExercise(exercise.id, code, false);
        return;
      }
    }

    // Render comparison table
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

      if (hasHints && hintIndex < exercise.hints.length) {
        const cta = document.createElement('button');
        cta.type = 'button';
        cta.className = 'failure-banner__cta';
        cta.textContent = 'Try a Hint?';
        cta.addEventListener('click', () => {
          hintBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          hintBtn.click();
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

  resetExBtn.addEventListener('click', () => {
    editor.setCode(exercise.skeleton);
    editor.clearErrorHighlight();
    resultsArea.innerHTML = '';
    successIndicator.style.display = 'none';
    successIndicator.classList.remove('playing');
    hintArea.innerHTML = '';
    hintIndex = 0;
    if (hasHints) {
      hintBtn.disabled = false;
      hintBtn.textContent = 'Hint';
    }
    saveExercise(exercise.id, '', false);
  });

  return { section, editor };
}
