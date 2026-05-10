// Shared type declarations for the HDL pipeline. This module exports nothing
// at runtime — every block below is a JSDoc `@typedef` that consuming files
// pull in via `@typedef {import('./types.js').ChipDef} ChipDef`-style imports.
// TypeScript's language server reads these without a `tsc` toolchain, so any
// modern editor surfaces hover-type information on annotated APIs.

/**
 * @typedef {Object} Pin
 * @property {string} name
 * @property {number} width  Bus width in bits; 1 for single-bit pins.
 */

/**
 * @typedef {{ index: number } | { start: number, end: number }} BusRef
 * Bracketed index/slice on a pin or wire. A `null` value (used inline on
 * Connection.subBus and Connection.wireBus) means no bus notation was given.
 */

/**
 * @typedef {Object} Connection
 * @property {string} subPin            Pin name on the sub-chip side of `=`.
 * @property {BusRef | null} subBus
 * @property {string} wire              Right-hand-side wire name. For
 *                                       constants this is the literal
 *                                       `'true'` or `'false'`.
 * @property {BusRef | null} wireBus
 * @property {boolean} isConstant
 */

/**
 * @typedef {Object} Part
 * @property {string} chipName
 * @property {Connection[]} connections
 * @property {number} [line]
 * @property {number} [col]
 */

/**
 * @typedef {Object} ChipDef
 * Either a parsed user chip (with `parts`) or a built-in (with `evaluate`).
 * @property {string} name
 * @property {Pin[]} inputs
 * @property {Pin[]} outputs
 * @property {Part[]} [parts]
 * @property {boolean} [builtin]
 * @property {(inputs: SimInputs) => SimOutputs} [evaluate]
 */

/** @typedef {Record<string, number>} SimInputs */
/** @typedef {Record<string, number>} SimOutputs */

/**
 * @typedef {number | '0' | '1' | 'x'} BitId
 * Yosys netlist bit identifier. Numeric bits are >= 2; '0'/'1' are constant
 * low/high; 'x' is undriven.
 */

/**
 * @typedef {Object} NetlistPort
 * @property {'input' | 'output'} direction
 * @property {BitId[]} bits
 */

/**
 * @typedef {Object} NetlistCell
 * @property {string} type
 * @property {Record<string, 'input' | 'output'>} port_directions
 * @property {Record<string, BitId[]>} connections
 */

/**
 * @typedef {Object} NetlistNetName
 * @property {BitId[]} bits
 * @property {0 | 1} hide_name
 * @property {Record<string, unknown>} attributes
 */

/**
 * @typedef {Object} NetlistModule
 * @property {Record<string, NetlistPort>} ports
 * @property {Record<string, NetlistCell>} cells
 * @property {Record<string, NetlistNetName>} netnames
 */

/**
 * @typedef {{ modules: Record<string, NetlistModule> }} Netlist
 */

export {};
