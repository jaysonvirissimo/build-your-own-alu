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
      case 'output-unassigned': {
        const missing = err.message.match(/Output '([^']+)'/)?.[1];
        if (missing) {
          return `Output '${missing}' was never connected. Chips with multiple outputs need each output connected separately.`;
        }
        return 'This chip has an output pin that was never connected. Make sure every output listed after OUT is driven by some part.';
      }
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
    if (/Expected '\(' after chip name/.test(err.message)) {
      return 'Chip calls look like `Nand(a=x, b=y, out=z)`. Did you forget the opening `(` after the chip name?';
    }
    if (/Expected '=' between sub-pin and wire/.test(err.message)) {
      return 'Each connection looks like `pinName=wireName`. Did you forget the `=`?';
    }
    if (/Expected an identifier as sub-pin name/.test(err.message)) {
      return 'Each connection needs a sub-pin name on the left of `=`, like `a=in`. Check the start of this connection.';
    }
    if (/Expected an identifier as wire name/.test(err.message)) {
      return 'After `=`, write a wire name (or `true`/`false`). Each connection looks like `pinName=wireName`.';
    }
    if (/Expected '\['/.test(err.message) || /Expected '\]'/.test(err.message)) {
      return 'Bus slots use square brackets: `a[3]` for one bit, `a[0..7]` for a range.';
    }
    if (/Did you mean '\.\.'/.test(err.message)) {
      return 'Bus ranges use two dots: `a[0..7]` selects bits 0 through 7.';
    }
    if (/Unterminated block comment/.test(err.message)) {
      return 'Block comments need a closing `*/`. Find the `/*` and add `*/` where the comment should end.';
    }
    if (/Expected 'CHIP'/.test(err.message)) {
      return 'Every file starts with `CHIP <name> { … }`. Begin with the keyword `CHIP` (in capitals).';
    }
    if (/Expected 'IN'/.test(err.message) || /Expected 'OUT'/.test(err.message) || /Expected 'PARTS'/.test(err.message)) {
      return 'Inside a chip, declare `IN <pins>;`, then `OUT <pins>;`, then `PARTS:`. Check the order and capitalization.';
    }
    if (/Unexpected content after chip definition/.test(err.message)) {
      return 'Everything must live inside the `{ … }` of one chip. Delete the stray text after the closing `}`.';
    }
    if (/Expected an identifier as chip name, got end of input/.test(err.message)) {
      return 'The parser ran out of input mid-chip. Each part starts with a chip name and ends with `;`. If you\'ve finished, add the closing `}` for the chip.';
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
