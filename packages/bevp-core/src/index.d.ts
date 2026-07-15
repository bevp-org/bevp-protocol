export const VOW_DOMAIN: 'bevp:vow:v1'

export type VowCommitment = {
  partnerA: string
  partnerB: string
  vowText: string
  createdAt: string
  evidenceRoot: string
  photoDigest: string
  audioDigest: string
  domain: string
}

export function buildVowCanonical(fields: {
  partnerA: string
  partnerB: string
  vowText: string
  createdAt: string
  photoDigest?: string
  audioDigest?: string
}): string

export function commitVow(input: {
  partnerA: string
  partnerB: string
  vowText: string
  createdAt?: string
  photo?: string | ArrayBuffer | Uint8Array
  audio?: string | ArrayBuffer | Uint8Array
  photoDigest?: string
  audioDigest?: string
}): Promise<VowCommitment>

export type MerkleNode = {
  id: string
  hash: string
  parentId?: string
  left?: string
  right?: string
  payloadDigest?: string
  kind?: string
}

export type MerkleProofStep = { sibling: string; position: 'left' | 'right' }

export function hashPair(leftHex: string, rightHex: string): Promise<string>
export function merkleRoot(leaves: (string | Uint8Array)[]): Promise<{
  root: string
  layers: string[][]
  nodes: MerkleNode[]
}>
export function merkleProof(
  leaves: (string | Uint8Array)[],
  index: number,
): Promise<{ root: string; leaf: string; path: MerkleProofStep[] }>
export function verifyMerkleProof(
  leafHex: string,
  path: MerkleProofStep[],
  expectedRoot: string,
): Promise<boolean>
