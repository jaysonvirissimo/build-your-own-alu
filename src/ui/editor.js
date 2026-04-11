import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';

const hdlLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.match(/\/\/.*/)) return 'comment';
    if (stream.match('/*')) {
      while (!stream.match('*/') && !stream.eol()) stream.next();
      return 'comment';
    }
    if (stream.match(/\b(CHIP|IN|OUT|PARTS)\b/)) return 'keyword';
    if (stream.match(/\b(true|false)\b/)) return 'atom';
    if (stream.match(/[a-zA-Z_][a-zA-Z0-9_]*/)) return 'variableName';
    if (stream.match(/\d+/)) return 'number';
    if (stream.match(/\.\./)) return 'punctuation';
    if (stream.match(/[{}(),;=:[\]]/)) return 'punctuation';
    stream.next();
    return null;
  },
});

const editorTheme = EditorView.theme({
  '&': { fontSize: '14px' },
  '.cm-content': {
    fontFamily: "'SF Mono', 'Consolas', 'Liberation Mono', monospace",
  },
  '.cm-gutters': {
    backgroundColor: '#f5f5f5',
    borderRight: '1px solid #ddd',
  },
});

export function createEditor(container, initialDoc) {
  const state = EditorState.create({
    doc: initialDoc,
    extensions: [basicSetup, hdlLanguage, editorTheme],
  });
  const view = new EditorView({ state, parent: container });

  return {
    view,
    getCode() {
      return view.state.doc.toString();
    },
    setCode(code) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: code },
      });
    },
    setReadOnly(readOnly) {
      view.dispatch({
        effects: EditorState.readOnly.of(readOnly),
      });
    },
  };
}
