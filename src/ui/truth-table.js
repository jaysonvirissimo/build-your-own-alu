import {
  formatValue,
  hasMultiBitPin,
  defaultFormatFor,
  getStoredFormat,
  setStoredFormat,
  VALID_FORMATS,
} from './format-value.js';

const FORMAT_CHANGE_EVENT = 'byoa-format-change';

function getWidth(exercise, pinName) {
  return exercise.widths?.[pinName] ?? 1;
}

function currentFormatFor(exercise) {
  return getStoredFormat() ?? defaultFormatFor(exercise);
}

function renderFormatToggle(wrapper, exercise) {
  const toggle = document.createElement('div');
  toggle.className = 'format-toggle';

  const label = document.createElement('span');
  label.className = 'format-toggle-label';
  label.textContent = 'show as:';
  toggle.appendChild(label);

  const buttons = {};
  for (const fmt of VALID_FORMATS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'format-toggle-btn';
    btn.dataset.format = fmt;
    btn.textContent = fmt;
    btn.addEventListener('click', () => {
      setStoredFormat(fmt);
      document.dispatchEvent(new CustomEvent(FORMAT_CHANGE_EVENT, { detail: { format: fmt } }));
    });
    toggle.appendChild(btn);
    buttons[fmt] = btn;
  }

  const applyActive = (fmt) => {
    for (const f of VALID_FORMATS) {
      buttons[f].classList.toggle('active', f === fmt);
    }
  };
  applyActive(currentFormatFor(exercise));

  const onFormatChange = () => applyActive(currentFormatFor(exercise));
  document.addEventListener(FORMAT_CHANGE_EVENT, onFormatChange);

  wrapper.appendChild(toggle);
}

function makeValueCell(exercise, pinName, value) {
  const td = document.createElement('td');
  td.dataset.pin = pinName;
  td.dataset.value = String(value);
  td.dataset.width = String(getWidth(exercise, pinName));
  td.textContent = formatValue(value, getWidth(exercise, pinName), currentFormatFor(exercise));
  return td;
}

function refreshValueCells(root, exercise) {
  const fmt = currentFormatFor(exercise);
  const cells = root.querySelectorAll('td[data-pin]');
  for (const td of cells) {
    const width = Number(td.dataset.width);
    const value = Number(td.dataset.value);
    td.textContent = formatValue(value, width, fmt);
  }
}

function wrapTable(exercise, table) {
  const wrapper = document.createElement('div');
  wrapper.className = 'truth-table-wrapper';

  if (hasMultiBitPin(exercise)) {
    renderFormatToggle(wrapper, exercise);
    const onFormatChange = () => refreshValueCells(wrapper, exercise);
    document.addEventListener(FORMAT_CHANGE_EVENT, onFormatChange);
  }

  wrapper.appendChild(table);
  return wrapper;
}

export function renderSpecTable(exercise) {
  const table = document.createElement('table');
  table.className = 'truth-table';
  const hasLabels = exercise.truthTable.some(row => row.label !== undefined);

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  if (hasLabels) {
    const th = document.createElement('th');
    th.textContent = 'computes';
    th.className = 'computes-header';
    headerRow.appendChild(th);
  }
  for (const name of [...exercise.inputs, ...exercise.outputs]) {
    const th = document.createElement('th');
    th.textContent = name;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const row of exercise.truthTable) {
    const tr = document.createElement('tr');
    if (hasLabels) {
      const td = document.createElement('td');
      td.textContent = row.label ?? '';
      td.className = 'computes-cell';
      tr.appendChild(td);
    }
    for (const name of [...exercise.inputs, ...exercise.outputs]) {
      tr.appendChild(makeValueCell(exercise, name, row[name]));
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return wrapTable(exercise, table);
}

export function renderComparisonTable(exercise, userOutputs) {
  const table = document.createElement('table');
  table.className = 'truth-table comparison-table';
  const hasLabels = exercise.truthTable.some(row => row.label !== undefined);

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  if (hasLabels) {
    const th = document.createElement('th');
    th.textContent = 'computes';
    th.className = 'computes-header';
    headerRow.appendChild(th);
  }
  for (const name of exercise.inputs) {
    const th = document.createElement('th');
    th.textContent = name;
    headerRow.appendChild(th);
  }
  for (const name of exercise.outputs) {
    const th = document.createElement('th');
    th.textContent = `${name} (expected)`;
    th.className = 'expected-header';
    headerRow.appendChild(th);
  }
  for (const name of exercise.outputs) {
    const th = document.createElement('th');
    th.textContent = `${name} (yours)`;
    th.className = 'yours-header';
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (let i = 0; i < exercise.truthTable.length; i++) {
    const expectedRow = exercise.truthTable[i];
    const userRow = userOutputs[i];
    const tr = document.createElement('tr');

    if (hasLabels) {
      const td = document.createElement('td');
      td.textContent = expectedRow.label ?? '';
      td.className = 'computes-cell';
      tr.appendChild(td);
    }
    for (const name of exercise.inputs) {
      tr.appendChild(makeValueCell(exercise, name, expectedRow[name]));
    }
    for (const name of exercise.outputs) {
      tr.appendChild(makeValueCell(exercise, name, expectedRow[name]));
    }
    for (const name of exercise.outputs) {
      const td = makeValueCell(exercise, name, userRow[name]);
      const matches = userRow[name] === expectedRow[name];
      td.className = matches ? 'match' : 'mismatch';
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return wrapTable(exercise, table);
}

export function checkAllMatch(exercise, userOutputs) {
  for (let i = 0; i < exercise.truthTable.length; i++) {
    for (const name of exercise.outputs) {
      if (userOutputs[i][name] !== exercise.truthTable[i][name]) {
        return false;
      }
    }
  }
  return true;
}

export function countMismatches(exercise, userOutputs) {
  let failed = 0;
  for (let i = 0; i < exercise.truthTable.length; i++) {
    for (const name of exercise.outputs) {
      if (userOutputs[i][name] !== exercise.truthTable[i][name]) {
        failed++;
        break;
      }
    }
  }
  return { failed, total: exercise.truthTable.length };
}
