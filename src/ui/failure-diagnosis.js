function getWidth(exercise, pinName) {
  return exercise.widths?.[pinName] ?? 1;
}

function allOnes(width) {
  return width === 32 ? 0xFFFFFFFF : (1 << width) - 1;
}

function isConstant(values) {
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[0]) return false;
  }
  return true;
}

export function diagnoseFailure(exercise, userOutputs) {
  for (const out of exercise.outputs) {
    const width = getWidth(exercise, out);
    const mask = allOnes(width);
    const expected = exercise.truthTable.map((row) => row[out]);
    const got = userOutputs.map((row) => row[out]);

    if (got.every((v) => v === 0) && !expected.every((v) => v === 0)) {
      return `Your \`${out}\` is always 0. Check whether anything is actually driving it.`;
    }

    if (got.every((v) => v === mask) && !expected.every((v) => v === mask)) {
      const label = width === 1 ? '1' : 'all-ones';
      return `Your \`${out}\` is always ${label}. Some part is forcing it high every time.`;
    }

    for (const inp of exercise.inputs) {
      if (getWidth(exercise, inp) !== width) continue;
      const inputValues = exercise.truthTable.map((row) => row[inp]);
      const echoes = got.every((v, i) => v === inputValues[i]);
      const trivial = expected.every((v, i) => v === inputValues[i]);
      if (echoes && !trivial) {
        return `Your \`${out}\` is just \`${inp}\`. The signal is passing through without the chip's logic.`;
      }
    }

    const inverted = got.every((v, i) => v === ((~expected[i]) & mask));
    if (inverted && !isConstant(expected)) {
      return `Your \`${out}\` looks like the opposite of what's expected on every row. Try negating somewhere.`;
    }
  }

  return null;
}
