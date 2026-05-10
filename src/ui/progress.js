const STORAGE_KEY = 'byoa-solutions';

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw);
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}

export function saveExercise(id, code, solved) {
  const progress = loadProgress();
  progress.set(id, { code, solved });
  const obj = Object.fromEntries(progress);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}

export function clearProgressFrom(exerciseId, exercises) {
  const idx = exercises.findIndex((e) => e.id === exerciseId);
  const progress = loadProgress();
  if (idx < 0) return progress;
  for (let i = idx; i < exercises.length; i++) {
    progress.delete(exercises[i].id);
  }
  const obj = Object.fromEntries(progress);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  return progress;
}

export function getHighestUnlocked(exercises, progress) {
  for (let i = 0; i < exercises.length; i++) {
    const entry = progress.get(exercises[i].id);
    if (!entry || !entry.solved) {
      return i;
    }
  }
  return exercises.length - 1;
}
