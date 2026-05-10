/** @typedef {import('./types.js').ChipDef} ChipDef */

/** @type {ChipDef} */
const NAND = {
  name: 'Nand',
  inputs: [{ name: 'a', width: 1 }, { name: 'b', width: 1 }],
  outputs: [{ name: 'out', width: 1 }],
  builtin: true,
  evaluate: ({ a, b }) => ({ out: (a & b) ^ 1 }),
};

export class ChipRegistry {
  constructor() {
    /** @type {Map<string, ChipDef>} */
    this._chips = new Map();
    this._chips.set('Nand', NAND);
  }

  /**
   * @param {string} name
   * @returns {ChipDef | undefined}
   */
  get(name) {
    return this._chips.get(name);
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this._chips.has(name);
  }

  /**
   * @param {string} name
   * @param {ChipDef} chipDef
   */
  register(name, chipDef) {
    this._chips.set(name, chipDef);
  }

  /** Wipe all chips and re-register the built-in Nand. */
  reset() {
    this._chips.clear();
    this._chips.set('Nand', NAND);
  }

  /** @returns {string[]} */
  getAvailableNames() {
    return [...this._chips.keys()];
  }
}
