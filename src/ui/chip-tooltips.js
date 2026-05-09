export const PRIMITIVE_TOOLTIPS = {
  Nand: 'Outputs 0 only when both inputs are 1.',
  Not:  'Flips a bit: 1 becomes 0, 0 becomes 1.',
  And:  '1 only when both inputs are 1.',
  Or:   '1 when at least one input is 1.',
  Xor:  '1 when exactly one input is 1.',
  Nor:  '1 only when both inputs are 0.',
  Mux:  'Picks a or b based on sel.',
};

export function getChipTooltip(chipName) {
  return PRIMITIVE_TOOLTIPS[chipName] ?? null;
}

export function chipNameFromCellId(id) {
  if (!id || !id.startsWith('cell_')) return null;
  const body = id.slice('cell_'.length);
  const dollar = body.lastIndexOf('$');
  return dollar === -1 ? body : body.slice(0, dollar);
}
