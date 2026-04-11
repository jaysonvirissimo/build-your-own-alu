const TOKEN_TYPES = {
  IDENT: 'IDENT',
  NUMBER: 'NUMBER',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  COMMA: 'COMMA',
  SEMICOLON: 'SEMICOLON',
  EQUALS: 'EQUALS',
  COLON: 'COLON',
  DOTDOT: 'DOTDOT',
  EOF: 'EOF',
};

const TOKEN_DISPLAY = {
  IDENT: 'an identifier',
  NUMBER: 'a number',
  LBRACE: "'{'",
  RBRACE: "'}'",
  LBRACKET: "'['",
  RBRACKET: "']'",
  LPAREN: "'('",
  RPAREN: "')'",
  COMMA: "','",
  SEMICOLON: "';'",
  EQUALS: "'='",
  COLON: "':'",
  DOTDOT: "'..'",
  EOF: 'end of input',
};

function tokenize(source) {
  const tokens = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  while (pos < source.length) {
    // Skip whitespace
    if (/\s/.test(source[pos])) {
      if (source[pos] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      pos++;
      continue;
    }

    // Skip // line comments
    if (source[pos] === '/' && source[pos + 1] === '/') {
      pos += 2;
      while (pos < source.length && source[pos] !== '\n') {
        pos++;
      }
      continue;
    }

    // Skip /* */ block comments
    if (source[pos] === '/' && source[pos + 1] === '*') {
      const startLine = line;
      const startCol = col;
      pos += 2;
      col += 2;
      while (pos < source.length) {
        if (source[pos] === '*' && source[pos + 1] === '/') {
          pos += 2;
          col += 2;
          break;
        }
        if (source[pos] === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        pos++;
      }
      if (pos >= source.length && !(source[pos - 2] === '*' && source[pos - 1] === '/')) {
        throw new Error(`Line ${startLine}, col ${startCol}: Unterminated block comment`);
      }
      continue;
    }

    // Double-dot (..)
    if (source[pos] === '.' && source[pos + 1] === '.') {
      tokens.push({ type: TOKEN_TYPES.DOTDOT, value: '..', line, col });
      pos += 2;
      col += 2;
      continue;
    }

    // Single dot is an error
    if (source[pos] === '.' && source[pos + 1] !== '.') {
      throw new Error(`Line ${line}, col ${col}: Unexpected character '.'. Did you mean '..'?`);
    }

    const startLine = line;
    const startCol = col;
    const ch = source[pos];

    const single = {
      '{': TOKEN_TYPES.LBRACE,
      '}': TOKEN_TYPES.RBRACE,
      '[': TOKEN_TYPES.LBRACKET,
      ']': TOKEN_TYPES.RBRACKET,
      '(': TOKEN_TYPES.LPAREN,
      ')': TOKEN_TYPES.RPAREN,
      ',': TOKEN_TYPES.COMMA,
      ';': TOKEN_TYPES.SEMICOLON,
      '=': TOKEN_TYPES.EQUALS,
      ':': TOKEN_TYPES.COLON,
    };

    if (single[ch]) {
      tokens.push({ type: single[ch], value: ch, line: startLine, col: startCol });
      pos++;
      col++;
      continue;
    }

    // Numeric literals
    if (/[0-9]/.test(ch)) {
      let value = '';
      while (pos < source.length && /[0-9]/.test(source[pos])) {
        value += source[pos];
        pos++;
        col++;
      }
      tokens.push({ type: TOKEN_TYPES.NUMBER, value, line: startLine, col: startCol });
      continue;
    }

    // Identifiers: [a-zA-Z_][a-zA-Z0-9_]*
    if (/[a-zA-Z_]/.test(ch)) {
      let value = '';
      while (pos < source.length && /[a-zA-Z0-9_]/.test(source[pos])) {
        value += source[pos];
        pos++;
        col++;
      }
      tokens.push({ type: TOKEN_TYPES.IDENT, value, line: startLine, col: startCol });
      continue;
    }

    throw new Error(`Line ${startLine}, col ${startCol}: Unexpected character '${ch}'`);
  }

  tokens.push({ type: TOKEN_TYPES.EOF, value: '', line, col });
  return tokens;
}

function parse(tokens) {
  let pos = 0;

  function current() {
    return tokens[pos];
  }

  function expect(type, contextMsg) {
    const tok = current();
    if (tok.type !== type) {
      throw new Error(
        `Line ${tok.line}, col ${tok.col}: Expected ${TOKEN_DISPLAY[type]} ${contextMsg || ''}, got ${TOKEN_DISPLAY[tok.type]} '${tok.value}'`
      );
    }
    pos++;
    return tok;
  }

  function expectIdent(value, contextMsg) {
    const tok = current();
    if (tok.type !== TOKEN_TYPES.IDENT || tok.value !== value) {
      throw new Error(
        `Line ${tok.line}, col ${tok.col}: Expected '${value}' ${contextMsg || ''}, got '${tok.value}'`
      );
    }
    pos++;
    return tok;
  }

  function parseBusNotation() {
    if (current().type !== TOKEN_TYPES.LBRACKET) return null;
    pos++; // skip [
    const first = expect(TOKEN_TYPES.NUMBER, 'in bus notation');
    if (current().type === TOKEN_TYPES.DOTDOT) {
      pos++; // skip ..
      const second = expect(TOKEN_TYPES.NUMBER, 'in bus range');
      expect(TOKEN_TYPES.RBRACKET, 'after bus range');
      return { start: parseInt(first.value), end: parseInt(second.value) };
    }
    expect(TOKEN_TYPES.RBRACKET, 'after bus index');
    return { index: parseInt(first.value) };
  }

  function parsePinList(keyword) {
    expectIdent(keyword);
    const pins = [];
    if (current().type !== TOKEN_TYPES.SEMICOLON) {
      const name = expect(TOKEN_TYPES.IDENT, `in ${keyword} list`).value;
      const bus = parseBusNotation();
      pins.push({ name, width: bus ? bus.index || (bus.end - bus.start + 1) : 1 });
      while (current().type === TOKEN_TYPES.COMMA) {
        pos++; // skip comma
        const n = expect(TOKEN_TYPES.IDENT, `in ${keyword} list`).value;
        const b = parseBusNotation();
        pins.push({ name: n, width: b ? b.index || (b.end - b.start + 1) : 1 });
      }
    }
    expect(TOKEN_TYPES.SEMICOLON, `after ${keyword} list`);
    return pins;
  }

  function parseConnection() {
    const subPin = expect(TOKEN_TYPES.IDENT, 'in connection').value;
    const subBus = parseBusNotation();
    expect(TOKEN_TYPES.EQUALS, 'in connection');
    const wire = expect(TOKEN_TYPES.IDENT, 'in connection').value;
    const isConstant = wire === 'true' || wire === 'false';
    const wireBus = isConstant ? null : parseBusNotation();
    return { subPin, subBus, wire, wireBus, isConstant };
  }

  function parsePartStatement() {
    const chipName = expect(TOKEN_TYPES.IDENT, 'as chip name').value;
    expect(TOKEN_TYPES.LPAREN, `after chip name '${chipName}'`);
    const connections = [];
    if (current().type !== TOKEN_TYPES.RPAREN) {
      connections.push(parseConnection());
      while (current().type === TOKEN_TYPES.COMMA) {
        pos++; // skip comma
        connections.push(parseConnection());
      }
    }
    expect(TOKEN_TYPES.RPAREN, `in part '${chipName}'`);
    expect(TOKEN_TYPES.SEMICOLON, `after part '${chipName}'`);
    return { chipName, connections };
  }

  function parseParts() {
    expectIdent('PARTS');
    expect(TOKEN_TYPES.COLON, "after 'PARTS'");
    const parts = [];
    while (current().type !== TOKEN_TYPES.RBRACE) {
      parts.push(parsePartStatement());
    }
    return parts;
  }

  function parseChip() {
    expectIdent('CHIP');
    const name = expect(TOKEN_TYPES.IDENT, 'as chip name').value;
    expect(TOKEN_TYPES.LBRACE, `after chip name '${name}'`);
    const inputs = parsePinList('IN');
    const outputs = parsePinList('OUT');
    const parts = parseParts();
    expect(TOKEN_TYPES.RBRACE, `at end of chip '${name}'`);
    return { name, inputs, outputs, parts };
  }

  const chip = parseChip();

  if (current().type !== TOKEN_TYPES.EOF) {
    const tok = current();
    throw new Error(
      `Line ${tok.line}, col ${tok.col}: Unexpected content after chip definition: '${tok.value}'`
    );
  }

  return chip;
}

export function parseHDL(source) {
  const tokens = tokenize(source);
  return parse(tokens);
}
