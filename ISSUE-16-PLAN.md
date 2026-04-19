# Plan — Issue #16: Live circuit diagram beside truth table

## Goal

Replace the "diagram appears in the results area only after Run" UX with a **live-updating diagram that sits to the right of the truth table, above the editor**. The diagram re-renders as the user types (debounced). On parse failure, the last good diagram stays visible. The duplicate render inside `resultsArea` on Run is removed so the diagram is never shown twice.

Two exercise variants must behave identically: the standard flow (`src/ui/exercise.js`) and the tutorial flow (`src/ui/tutorial.js`). The editor (`src/ui/editor.js`) is the shared dependency.

---

## What users should experience

1. **On page load**, every rendered exercise shows a diagram to the right of the truth table, rendered from the skeleton (or saved code if restoring progress). If the code doesn't parse, a small placeholder message sits there instead.
2. **As the user types**, the diagram updates ~250ms after the last keystroke. Parse failures silently keep the previous diagram — no red error text flashes in the diagram pane.
3. **Clicking Run** still performs the full simulate-and-compare flow, but the diagram is *not* re-rendered into the results area (no duplicate).
4. **Clicking Reset** restores skeleton code; the diagram pane snaps back to the skeleton diagram.
5. **Clicking "Walk me through it"** in tutorials sets new code; the diagram pane follows along (same debounce path).
6. **On narrow viewports**, the two panes stack vertically (truth table on top, diagram below) instead of side-by-side.
7. **For wide content** (ALU truth table, big diagrams), each pane scrolls horizontally inside its own column; the section doesn't stretch the viewport.

---

## Architecture of the change

### Invariant: one diagram per exercise, owned by the top row

The `resultsArea` below the buttons will no longer hold a diagram. A new **top row** right after the description/analogy/available-chips lines owns the truth table (left) and the diagram (right). The editor, buttons, hint area, and results area stay below that row, unchanged in role.

### A new helper: `createLiveDiagram(chipDef, registry)` in `src/ui/circuit-diagram.js`

Turn `circuit-diagram.js` into a small controller that exposes:

```js
export function createLiveDiagram(registry) {
  const container = document.createElement('div');
  container.className = 'circuit-diagram';
  // placeholder child shown when there's no good parse yet
  return {
    container,
    update(chipDef) { /* render + swap children */ },
    showPlaceholder(message) { /* replace children with a placeholder */ },
  };
}
```

- `update(chipDef)` runs `computeLayout` → `renderCircuitSVG`, then swaps the SVG in. Never throws on expected issues (unknown sub-chip) — the *caller* decides what to pass in.
- `showPlaceholder(message)` is used for the initial "nothing parsed yet" state.
- Keep the existing `createCircuitDiagram(chipDef, registry)` export as a thin wrapper so any other caller (there are none outside `exercise.js`/`tutorial.js`, but keep for safety) still works. Actually: since we're removing both callers, we can delete the wrapper once grep confirms no other use.

**Why a stateful controller instead of rebuilding the DOM from `exercise.js`?** Two reasons:
1. The diagram container's identity is stable — CSS transitions, scroll position on horizontal scroll, and focus don't jump when we replace children.
2. It centralizes the "swap SVG" logic so the debounce callback is a one-liner.

### Debounced live parsing

In `exercise.js` and `tutorial.js`, after wiring up the editor and the diagram controller:

```js
let debounceTimer = null;
let lastGoodChipDef = null;

function scheduleDiagramUpdate() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    const code = editor.getCode();
    let chipDef;
    try {
      chipDef = parseHDL(code);
    } catch {
      return; // silent: keep last good diagram
    }
    try {
      diagram.update(chipDef);
      lastGoodChipDef = chipDef;
    } catch {
      // layout/render threw (e.g. unknown sub-chip) — keep last good
    }
  }, 250);
}

editor.onDocChange(scheduleDiagramUpdate);

// initial attempt — synchronous, no debounce, so users don't see a flicker
try {
  const initialChip = parseHDL(editor.getCode());
  diagram.update(initialChip);
  lastGoodChipDef = initialChip;
} catch {
  diagram.showPlaceholder('Start typing HDL to see the diagram');
}
```

**Why wrap both `parseHDL` and `diagram.update` in try/catch?** The parser throws `ParseError` on any lexical/syntactic issue. `computeLayout` throws a plain `TypeError` if the user writes a chip name that isn't in the registry (e.g., mid-typing `Nan` or `MyGate`): it calls `registry.get(name).inputs` → `undefined.inputs`. Both are expected during typing and must be absorbed.

**Race consideration.** If the user clicks Run before the debounce timer fires, we want the diagram to reflect the code that was *just* run. Two options:
- Cancel the timer in the Run handler and call `diagram.update(chipDef)` synchronously from Run after parse succeeds.
- Cancel the timer and let the Run handler take over; diagram state updates as a side-effect of Run succeeding.

We go with option 1: in the Run handler, after a successful parse, **cancel the debounce timer** and call `diagram.update(chipDef)` to sync. This also means if Run succeeds the diagram is guaranteed fresh; if Run fails (parse error → error panel), we don't touch the diagram and the last good one stays up (consistent with typing behaviour).

### `editor.onDocChange(fn)` — new API on the editor

CodeMirror 6 exposes a `EditorView.updateListener.of(update => {...})` extension. We add a small compartment or simple dispatcher:

- Collect an array `docChangeHandlers = []` inside the `createEditor` closure.
- Register an `EditorView.updateListener.of(update => { if (update.docChanged) docChangeHandlers.forEach(fn => fn()); })` in the extensions array.
- Return `onDocChange(fn) { docChangeHandlers.push(fn); }` on the editor object.

**Why not pass a callback as a constructor arg?** Two callers today (standard + tutorial) both need it; either approach works, but a post-hoc `onDocChange` keeps the `createEditor` signature clean and leaves room to call it multiple times (e.g., for future features like a minimap).

**Why call synchronously inside the listener?** CodeMirror update listeners run inside its transaction cycle. Calling our debounce scheduler is safe because it only calls `setTimeout`. We do not call `editor.setCode` or dispatch transactions from within — that would be a loop.

**Confirm behaviour when `editor.setCode` is called programmatically (Reset, Walk me through it):** `setCode` uses `view.dispatch({ changes: ... })`, which *does* set `update.docChanged = true`. So the debounce fires naturally. Good.

### Remove duplicate diagram render from the Run handler

In `src/ui/exercise.js` (line 139) and `src/ui/tutorial.js` (line 143):

```js
resultsArea.appendChild(createCircuitDiagram(chipDef, registry));
```

— delete these lines. Replace with the `diagram.update(chipDef)` call discussed above (after cancelling the debounce timer).

### Reset handler

In both files, the reset handler calls `editor.setCode(exercise.skeleton)` (or tutorial step 0). That triggers `onDocChange` → debounced diagram update. Works automatically.

If we want Reset to feel snappy (no 250ms wait), add `cancelDebounce()` + `diagram.update(parseHDL(skeleton))` in the Reset handler. Tradeoff: extra code for a tiny perceptual win. **Recommendation:** skip for v1, keep Reset simple.

---

## File-by-file changes

### `src/ui/editor.js`

- Add `docChangeHandlers` array in the `createEditor` closure.
- Add an `EditorView.updateListener.of(...)` extension that iterates handlers when `update.docChanged`.
- Return `onDocChange(fn)` on the editor object. No-op if already added (not needed, simple push).
- No behaviour change for existing callers — only an added method.

### `src/ui/circuit-diagram.js`

- Keep the file small.
- Export `createLiveDiagram()` that returns `{ container, update, showPlaceholder }`. Internal state is just a reference to the DOM container; each `update` does `container.replaceChildren(svg)`.
- Delete or keep the old `createCircuitDiagram` export — after migrating both callers, grep for the symbol and delete if unused.

### `src/ui/exercise.js`

1. After the "Available chips" paragraph, before the old "Spec table" heading:
   - Create `const topRow = document.createElement('div'); topRow.className = 'exercise-top-row';`
   - Create `const specPane = document.createElement('div'); specPane.className = 'exercise-spec-pane';`
   - Create `const diagramPane = document.createElement('div'); diagramPane.className = 'exercise-diagram-pane';`
   - Move the `<h3>Truth Table</h3>` + `renderSpecTable(exercise)` into `specPane`.
   - Add a `<h3>Circuit Diagram</h3>` + the `diagram.container` into `diagramPane`.
   - `topRow.append(specPane, diagramPane); section.appendChild(topRow);`
2. Create the diagram controller: `const diagram = createLiveDiagram(registry);`. Attach `diagram.container` to `diagramPane`.
3. After the editor is created:
   - Register `editor.onDocChange(scheduleDiagramUpdate)`.
   - Do the initial synchronous parse + `diagram.update` (or `showPlaceholder` on failure).
4. In the Run handler:
   - Delete `resultsArea.appendChild(createCircuitDiagram(chipDef, registry));`.
   - After the successful `parseHDL`, `clearTimeout(debounceTimer); diagram.update(chipDef);`.
5. In the Reset handler: no change (auto-updates via `setCode`). Optionally `clearTimeout(debounceTimer)` for hygiene.

### `src/ui/tutorial.js`

Identical changes to `exercise.js`, applied to this file. The walkthrough button already uses `editor.setCode(steps[stepIndex].code)`, which will auto-trigger the debounced update.

### `src/main.js`

No structural changes. The `appendExercise` function that calls `editor.setCode(entry.code)` to restore saved code triggers `onDocChange` naturally — the diagram will render once the debounce fires. To avoid a flicker (skeleton diagram → saved diagram), consider:
- Option A: do the initial diagram render *after* `editor.setCode(entry.code)` in `main.js`. This requires plumbing (main would need access to the diagram controller). Skip.
- Option B: in `exercise.js`, after creating the editor but before doing the initial diagram render, if `entry.code` exists, `editor.setCode(entry.code)` and then do the initial render on the current code. But that reorders — `main.js` restores code *after* the section is created.
- Option C (recommended): inside `exercise.js`, skip the synchronous initial render and instead cancel/fire debounce immediately (`scheduleDiagramUpdate()` with 0ms on mount). If `main.js` sets code before first paint, the handler reads the restored code on first fire. Simpler: fire a one-shot *after* the next animation frame. **This is a perceived-flicker question, not a correctness one.** For v1, the simplest solution is to do the synchronous initial render in `exercise.js` against the skeleton; `main.js`'s subsequent `setCode` will trigger a debounced re-render within 250ms. Flicker cost: one extra render for exercises with saved progress. Acceptable.

### `src/style.css`

New rules, added near the existing `.circuit-diagram` block:

```css
.exercise-top-row {
  display: flex;
  gap: 1.5em;
  align-items: flex-start;
  margin: 1em 0;
  min-height: 280px; /* avoid layout jump when diagram resizes */
}

.exercise-spec-pane,
.exercise-diagram-pane {
  flex: 1 1 0;
  min-width: 0;       /* allow shrink below content size */
  overflow-x: auto;
}

.exercise-spec-pane > h3,
.exercise-diagram-pane > h3 {
  margin-top: 0;
}

.circuit-diagram-placeholder {
  color: #888;
  font-style: italic;
  padding: 1em;
  border: 1px dashed #ccc;
  border-radius: 4px;
}

@media (max-width: 760px) {
  .exercise-top-row {
    flex-direction: column;
    min-height: 0;
  }
}
```

Also adjust the existing `.circuit-diagram svg`: currently `max-width: 100%; height: auto;` causes the diagram to scale down rather than overflow. We want natural-size rendering with the pane providing horizontal scroll:

```css
.circuit-diagram svg {
  display: block;
  /* remove max-width: 100% so the column can overflow horizontally */
}
```

(Keep `display: block`; drop `max-width` and `height: auto`.)

**Why `min-height: 280px`?** Picks a value comfortably above typical single-gate diagrams (~160–200px) so the row doesn't collapse when the diagram is small or the placeholder is shown. Tune during manual testing.

**Why `min-width: 0` on flex items?** Without this, flex items refuse to shrink below their intrinsic content width, defeating the horizontal-scroll-per-column intent.

---

## Edge cases — exhaustive list and handling

| Case | Behaviour |
|---|---|
| Empty `PARTS:` (skeleton with only comments) | Parses OK; `computeLayout` renders just input/output pins with no gates. Pleasant feedback. |
| User types partial chip name (e.g. `Nan`) | `parseHDL` may succeed if structure is complete; `computeLayout` throws at `registry.get('Nan')`. Caught — diagram freezes. |
| User types unknown sub-chip pin (e.g. `Nand(x=...)`) | `computeLayout` treats pins not in `subInputs`/`subOutputs` as silent no-ops (its use of `.has()`). Diagram renders with missing edges. Not ideal, but acceptable — the Run-time simulator will surface the real error. |
| Self-referencing wire | Existing code already handles (skip self-loops in topo sort, documented in CLAUDE.md). |
| Chip with >10 parts (ALU) | Collapsed-layout path used. Works unchanged. |
| User clears the editor entirely | `parseHDL('')` throws. Timer fires, catches, leaves last diagram. If it happens on mount (not realistic — skeleton always set), placeholder shown. |
| Chip name doesn't match exercise name (e.g., `CHIP Foo` in a Not exercise) | Parses fine. Diagram renders for whatever was typed. Run-time validation rejects it — that's a Run-time concern, not a live-preview concern. |
| User types very fast | Debounce cancels pending timer, only the last keystroke wins after 250ms. |
| User clicks Run before debounce fires | Run handler cancels debounce and renders synchronously. Diagram always in sync with what was Run. |
| Reset clicked | `setCode(skeleton)` → `docChanged` → debounced update. 250ms later the diagram shows the skeleton. |
| Tutorial "Walk me through it" | Same as Reset — code replaced, debounced update. |
| Exercise has saved code (returning user) | `main.js` `setCode(entry.code)` fires `docChanged` → debounced update. Saved diagram appears within 250ms. Initial render shows skeleton briefly; if flicker is objectionable, revisit with option C above. |
| Wide truth table + wide diagram side-by-side | Each pane scrolls horizontally. No viewport-wide horizontal scroll. |
| Narrow viewport (≤760px) | Media query stacks vertically. Diagram full-width, can still scroll internally. |
| SVG height grows/shrinks between renders | `min-height: 280px` keeps the row stable; editor below doesn't jump. Bigger diagrams push the row taller, which is fine (editor moves down once, not on every keystroke). |

---

## Testing plan

### Unit tests (add to `src/ui/__tests__/`)

Extend the existing fake-DOM pattern used in `truth-table.test.js`. A thin `FakeElement`/`FakeEditor` pair is enough — we don't need jsdom.

1. **`circuit-diagram.test.js`** (new)
   - `createLiveDiagram` returns a container.
   - `update(chipDef)` replaces children with an SVG (assert that `container.firstChild.tagName === 'svg'` via the fake DOM, or assert it calls `renderCircuitSVG` with the computed layout — easier: mock `computeLayout`/`renderCircuitSVG` via the existing test surface).
   - `showPlaceholder(msg)` places a text element with the message.

2. **`editor.test.js`** (new, small)
   - Hard: CodeMirror doesn't work in a fake-DOM test. Either skip editor tests or mount it in jsdom for this one file.
   - **Recommendation:** skip automated testing of `onDocChange`. Manually verify in the browser. Covered by the integration step below.

### Manual browser verification (required per memory `feedback_verify_ui_changes_in_browser`)

Start the dev server and use Chrome DevTools MCP:
1. Screenshot the Not exercise before the change (baseline) — already captured via prior visits, or capture now on `main` before touching anything.
2. After the change, for at least three exercises (Not, And, ALU or Mux16):
   - Screenshot on page load.
   - Type a valid partial change → screenshot 300ms later → confirm diagram updated.
   - Type an invalid partial change (delete a closing brace) → screenshot → confirm diagram did **not** change and no error appears in the diagram pane.
   - Resize browser to 700px wide → screenshot → confirm columns stacked.
   - Click Run → confirm no duplicate diagram appears below.
   - Click Reset → confirm diagram shows skeleton diagram.
3. For the Not tutorial: click "Walk me through it" and confirm the diagram updates as the code advances.
4. Console: confirm no errors during typing.

### Regression surface

- `npm test` must continue to pass. The existing `circuit-layout.test.js` imports `computeLayout` directly — unaffected.
- `vite build` must succeed (GitHub Actions runs this on push). No new dependencies, so no lockfile changes.

---

## Implementation order (suggested commits)

1. **Add `onDocChange` to the editor.** Surgical change to `editor.js`. No behavioral effect on existing code. Verify `npm test` passes.
2. **Refactor `circuit-diagram.js` to expose `createLiveDiagram`.** Add the new export; leave `createCircuitDiagram` in place temporarily.
3. **Wire live diagram into `exercise.js`.** Add the top row, diagram pane, debounce, Run-handler sync, remove duplicate. Keep tutorial untouched for now to isolate regressions.
4. **Apply the same changes to `tutorial.js`.** Identical pattern.
5. **Add CSS** for `.exercise-top-row`, panes, placeholder, and the narrow-viewport media query. Drop `max-width: 100%` on `.circuit-diagram svg`.
6. **Delete the now-unused `createCircuitDiagram` wrapper** after grep confirms no callers.
7. **Manual browser verification** with screenshots (Not, And, Mux16 or Alu, tutorial step-through).
8. **Commit + push.** Reference "Closes #16" in the commit message.

Each step keeps `npm test` green and the page renders, so a bisect stays useful if something goes wrong.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Debounce fires after the user has navigated away from the exercise section | Not possible — sections aren't destroyed. No cleanup needed. |
| Debounce timer leaks memory across resets | `clearTimeout` is called before rescheduling. Single timer per section. Safe. |
| `computeLayout` throws in unexpected ways on partial HDL | All calls wrapped in try/catch. Fallback: last good diagram. |
| `#app` max-width too narrow for two-column layout | Horizontal scroll per column handles wide content. If cramped on 900–1100px screens, revisit `#app` max-width or use a per-section wider container. Defer to post-merge iteration if needed. |
| Users with Vim mode on dispatch edits differently | CodeMirror's update listener fires for all transactions, including Vim commands. No special handling. |
| `setCode` during mount triggers an extra render (flicker) | Accepted tradeoff for v1. Revisit if QA flags it. |
| `resultsArea` users elsewhere expect a diagram there | Grep confirms no external consumers; only Run handlers put content there. Safe to drop. |

---

## Acceptance checklist (to run through before calling it done)

- [ ] On first load of any exercise, a diagram is visible next to the truth table (or a placeholder if code doesn't parse).
- [ ] Typing valid HDL updates the diagram ~250ms after the last keystroke.
- [ ] Typing invalid HDL leaves the last good diagram untouched; no error in the diagram pane.
- [ ] Clicking Run does not produce a second diagram in the results area.
- [ ] Clicking Run syncs the diagram synchronously (no debounce wait).
- [ ] Reset restores the skeleton diagram.
- [ ] Tutorial's "Walk me through it" advances the diagram along with the code.
- [ ] Returning users with saved progress see their saved code's diagram.
- [ ] Viewport ≤ 760px stacks vertically; both columns scroll horizontally on wider viewports when content overflows.
- [ ] `npm test` passes.
- [ ] `npm run build` succeeds.
- [ ] Screenshots captured for at least Not, And, and one multi-bit exercise (Mux16 or Alu).
- [ ] No console errors during normal use.
