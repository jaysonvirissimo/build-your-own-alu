import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';

export const setErrorLine = StateEffect.define();

const errorLineDeco = Decoration.line({ class: 'cm-error-line' });

const errorLineField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decos, tr) {
    decos = decos.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setErrorLine)) {
        const line = effect.value;
        if (line === null || line === undefined) {
          decos = Decoration.none;
        } else {
          const doc = tr.state.doc;
          if (line >= 1 && line <= doc.lines) {
            const pos = doc.line(line).from;
            decos = Decoration.set([errorLineDeco.range(pos)]);
          } else {
            decos = Decoration.none;
          }
        }
      }
    }
    return decos;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export const errorHighlightExtension = [errorLineField];

export function highlightError(view, line) {
  view.dispatch({ effects: setErrorLine.of(line ?? null) });
}
