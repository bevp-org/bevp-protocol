/**
 * Bitcoin Experience Validation Protocol - JS/TS Client SDK
 * Umbrella re-exports for Stage 1 packages.
 */

const crypto = require('@bevp/crypto');
const core = require('@bevp/core');

/** @deprecated Prefer @bevp/crypto / @bevp/core directly. */
function add(left, right) {
  return left + right;
}

module.exports = {
  add,
  ...crypto,
  ...core,
};
