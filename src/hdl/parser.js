const TOKEN_TYPES = {
  IDENT: 'IDENT',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  COMMA: 'COMMA',
  SEMICOLON: 'SEMICOLON',
  EQUALS: 'EQUALS',
  COLON: 'COLON',
  EOF: 'EOF',
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

    const startLine = line;
    const startCol = col;
    const ch = source[pos];

    const single = {
      '{': TOKEN_TYPES.LBRACE,
      '}': TOKEN_TYPES.RBRACE,
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
        `Line ${tok.line}, col ${tok.col}: Expected ${type} ${contextMsg || ''}, got ${tok.type} ('${tok.value}')`
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

  function parsePinList(keyword) {
    expectIdent(keyword);
    const pins = [];
    // Parse comma-separated identifiers until semicolon
    if (current().type !== TOKEN_TYPES.SEMICOLON) {
      pins.push({ name: expect(TOKEN_TYPES.IDENT, `in ${keyword} list`).value, width: 1 });
      while (current().type === TOKEN_TYPES.COMMA) {
        pos++; // skip comma
        pins.push({ name: expect(TOKEN_TYPES.IDENT, `in ${keyword} list`).value, width: 1 });
      }
    }
    expect(TOKEN_TYPES.SEMICOLON, `after ${keyword} list`);
    return pins;
  }

  function parseConnection() {
    const subPin = expect(TOKEN_TYPES.IDENT, 'in connection').value;
    expect(TOKEN_TYPES.EQUALS, 'in connection');
    const wire = expect(TOKEN_TYPES.IDENT, 'in connection').value;
    return { subPin, wire };
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
