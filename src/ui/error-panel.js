import { ParseError, SimError } from '../hdl/errors.js';

function categorize(err) {
  if (err instanceof ParseError) {
    return { label: 'Parser error', variant: 'parser' };
  }
  if (err instanceof SimError) {
    if (err.kind === 'chip-missing') {
      return { label: 'Chip error', variant: 'chip' };
    }
    return { label: 'Simulation error', variant: 'sim' };
  }
  if (typeof err.message === 'string' && err.message.startsWith('Expected CHIP')) {
    return { label: 'Chip error', variant: 'chip' };
  }
  return { label: 'Error', variant: 'generic' };
}

function suggestionFor(err) {
  if (err instanceof SimError) {
    switch (err.kind) {
      case 'output-unassigned':
        return "This chip's output pin was never connected. Did you forget an `out=<pin>` in one of your sub-chip connections?";
      case 'chip-missing':
        return 'Chip names are case-sensitive. Check spelling — only chips listed below the editor as "Available chips" can be used here.';
      case 'missing-input':
        return 'Every sub-chip needs all of its inputs wired. Did you forget one of the `x=...` connections in your part list?';
      case 'multi-driver':
        return 'Two parts are driving the same wire bit. Each wire bit can only be written by one sub-chip output — use a different wire name, or remove a duplicate connection.';
      case 'unresolved':
        return "Some parts couldn't be simulated — this usually means a wire depends on itself (a loop). Check that each wire is produced before it's consumed.";
      default:
        return null;
    }
  }
  if (err instanceof ParseError) {
    if (/Expected ';'/.test(err.message)) {
      return 'Statements end with `;`. Did you forget a semicolon on the previous line?';
    }
    if (/Expected '}'/.test(err.message)) {
      return 'Every `{` needs a matching `}`. Check that your chip definition is closed.';
    }
    if (/Expected '\)'/.test(err.message)) {
      return 'Every `(` needs a matching `)`. Check that each sub-chip call is closed.';
    }
    if (/Unexpected character/.test(err.message)) {
      return 'The parser hit a character it didn\'t expect. Check for typos, unmatched brackets, or stray punctuation.';
    }
    return null;
  }
  if (typeof err.message === 'string' && err.message.startsWith('Expected CHIP')) {
    return 'The chip\'s name after `CHIP` must match the exercise name exactly. HDL chip names are case-sensitive.';
  }
  return null;
}

function stripLocationPrefix(message) {
  return message.replace(/^Line \d+, col \d+:\s*/, '');
}

export function renderErrorPanel(container, err, editorApi) {
  const { label, variant } = categorize(err);
  const line = err.line ?? null;
  const suggestion = suggestionFor(err);

  const panel = document.createElement('div');
  panel.className = `error-panel error-panel--${variant}`;

  const header = document.createElement('div');
  header.className = 'error-panel__header';

  const badge = document.createElement('span');
  badge.className = 'error-panel__badge';
  badge.textContent = label;
  header.appendChild(badge);

  if (line != null) {
    const loc = document.createElement('span');
    loc.className = 'error-panel__location';
    loc.textContent = `Line ${line}`;
    header.appendChild(loc);
  }

  panel.appendChild(header);

  const friendly = document.createElement('p');
  friendly.className = 'error-panel__message';
  friendly.textContent = stripLocationPrefix(err.message);
  panel.appendChild(friendly);

  if (suggestion) {
    const hint = document.createElement('p');
    hint.className = 'error-panel__suggestion';
    hint.textContent = suggestion;
    panel.appendChild(hint);
  }

  const details = document.createElement('details');
  details.className = 'error-panel__raw';
  const summary = document.createElement('summary');
  summary.textContent = 'Show raw message';
  details.appendChild(summary);
  const pre = document.createElement('pre');
  pre.textContent = err.message;
  details.appendChild(pre);
  panel.appendChild(details);

  container.appendChild(panel);

  if (editorApi && typeof editorApi.highlightError === 'function') {
    editorApi.highlightError(line);
  }
}
