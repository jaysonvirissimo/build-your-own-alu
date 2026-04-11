const NAND = {
  name: 'Nand',
  inputs: [{ name: 'a', width: 1 }, { name: 'b', width: 1 }],
  outputs: [{ name: 'out', width: 1 }],
  builtin: true,
  evaluate: ({ a, b }) => ({ out: (a & b) ^ 1 }),
};

export class ChipRegistry {
  constructor() {
    this._chips = new Map();
    this._chips.set('Nand', NAND);
  }

  get(name) {
    return this._chips.get(name);
  }

  has(name) {
    return this._chips.has(name);
  }

  register(name, chipDef) {
    this._chips.set(name, chipDef);
  }

  getAvailableNames() {
    return [...this._chips.keys()];
  }
}
