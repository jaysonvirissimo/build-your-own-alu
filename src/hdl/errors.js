export class ParseError extends Error {
  constructor(message, { line, col }) {
    super(message);
    this.name = 'ParseError';
    this.line = line;
    this.col = col;
  }
}

export class SimError extends Error {
  constructor(message, { line = null, col = null, kind = 'sim' } = {}) {
    super(message);
    this.name = 'SimError';
    this.line = line;
    this.col = col;
    this.kind = kind;
  }
}
