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
      const td = document.createElement('td');
      td.textContent = row[name];
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

export function renderComparisonTable(exercise, userOutputs) {
  const table = document.createElement('table');
  table.className = 'truth-table comparison-table';
  const hasLabels = exercise.truthTable.some(row => row.label !== undefined);

  // Header: computes? | inputs | expected outputs | your outputs
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
      const td = document.createElement('td');
      td.textContent = expectedRow[name];
      tr.appendChild(td);
    }
    for (const name of exercise.outputs) {
      const td = document.createElement('td');
      td.textContent = expectedRow[name];
      tr.appendChild(td);
    }
    for (const name of exercise.outputs) {
      const td = document.createElement('td');
      td.textContent = userRow[name];
      const matches = userRow[name] === expectedRow[name];
      td.className = matches ? 'match' : 'mismatch';
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
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
