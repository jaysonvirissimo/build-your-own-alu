export const STORAGE_KEY = 'byoa-number-format';
export const VALID_FORMATS = ['dec', 'hex', 'bin'];

export function formatValue(value, width, format) {
  const w = Math.max(1, width | 0);
  const v = Number(value) >>> 0;
  if (w === 1) return String(v & 1);

  if (format === 'hex') {
    const digits = Math.ceil(w / 4);
    return '0x' + v.toString(16).toUpperCase().padStart(digits, '0');
  }
  if (format === 'bin') {
    const padded = v.toString(2).padStart(w, '0');
    return padded.length > 4
      ? padded.match(/.{1,4}(?=(.{4})*$)/g).join('_')
      : padded;
  }
  return String(v);
}

export function hasMultiBitPin(exercise) {
  const widths = exercise.widths;
  if (!widths) return false;
  for (const name in widths) {
    if (widths[name] > 1) return true;
  }
  return false;
}

export function defaultFormatFor(exercise) {
  if (exercise.defaultFormat && VALID_FORMATS.includes(exercise.defaultFormat)) {
    return exercise.defaultFormat;
  }
  return hasMultiBitPin(exercise) ? 'hex' : 'dec';
}

export function getStoredFormat() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return VALID_FORMATS.includes(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function setStoredFormat(format) {
  if (!VALID_FORMATS.includes(format)) return;
  try {
    localStorage.setItem(STORAGE_KEY, format);
  } catch {
    // Silently ignore localStorage failures (private mode, etc.)
  }
}
