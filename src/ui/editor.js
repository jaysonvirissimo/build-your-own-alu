import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';
import { autocompletion } from '@codemirror/autocomplete';
import { vim } from '@replit/codemirror-vim';

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

function chipCompletions(registry) {
  return (context) => {
    const word = context.matchBefore(/[a-zA-Z_]\w*/);
    if (!word && !context.explicit) return null;

    const names = registry.getAvailableNames();
    const options = names.map((name) => {
      const chip = registry.get(name);
      const allPins = [...chip.inputs, ...chip.outputs];
      const pinTemplate = allPins.map((p) => `${p.name}=`).join(', ');
      return {
        label: name,
        detail: ` (${allPins.map((p) => p.name).join(', ')})`,
        apply: `${name}(${pinTemplate})`,
        type: 'function',
      };
    });

    return {
      from: word ? word.from : context.pos,
      options,
    };
  };
}

export function createEditor(container, initialDoc, registry, vimEnabled) {
  const vimCompartment = new Compartment();
  const readOnlyCompartment = new Compartment();

  const extensions = [
    vimCompartment.of(vimEnabled ? vim() : []),
    readOnlyCompartment.of(EditorState.readOnly.of(false)),
    basicSetup,
    hdlLanguage,
    editorTheme,
  ];
  if (registry) {
    extensions.push(autocompletion({ override: [chipCompletions(registry)] }));
  }

  const state = EditorState.create({
    doc: initialDoc,
    extensions,
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
        effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
      });
    },
    toggleVim(enabled) {
      view.dispatch({
        effects: vimCompartment.reconfigure(enabled ? vim() : []),
      });
    },
  };
}
