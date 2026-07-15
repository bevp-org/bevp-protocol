export function add(left: number, right: number): number

export {
  bytesToHex,
  toUint8Array,
  sha256Hex,
  shortHash,
} from '@bevp/crypto'

export {
  VOW_DOMAIN,
  buildVowCanonical,
  commitVow,
  type VowCommitment,
} from '@bevp/core'
