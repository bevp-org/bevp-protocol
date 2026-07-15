const { sha256Hex } = require('@bevp/crypto');

const VOW_DOMAIN = 'bevp:vow:v1';

/**
 * @typedef {object} VowMediaDigests
 * @property {string} [photo] lowercase sha256 hex of photo bytes
 * @property {string} [audio] lowercase sha256 hex of audio bytes
 */

/**
 * @typedef {object} VowCommitment
 * @property {string} partnerA
 * @property {string} partnerB
 * @property {string} vowText
 * @property {string} createdAt ISO-8601
 * @property {string} evidenceRoot
 * @property {string} photoDigest empty string when absent
 * @property {string} audioDigest empty string when absent
 * @property {string} domain
 */

/**
 * Build the canonical UTF-8 payload that is hashed into evidence_root.
 * Field order is consensus-critical — do not reorder.
 *
 * @param {{
 *   partnerA: string,
 *   partnerB: string,
 *   vowText: string,
 *   createdAt: string,
 *   photoDigest?: string,
 *   audioDigest?: string,
 * }} fields
 * @returns {string}
 */
function buildVowCanonical(fields) {
  const photoDigest = fields.photoDigest || '';
  const audioDigest = fields.audioDigest || '';
  return [
    VOW_DOMAIN,
    fields.partnerA.trim(),
    fields.partnerB.trim(),
    fields.vowText.trim(),
    fields.createdAt,
    `photo:${photoDigest}`,
    `audio:${audioDigest}`,
  ].join('\n');
}

/**
 * Commit a vow: hash partners + text + optional media digests.
 * Pass raw media as ArrayBuffer/Uint8Array to hash in-place, or precomputed digests.
 *
 * @param {{
 *   partnerA: string,
 *   partnerB: string,
 *   vowText: string,
 *   createdAt?: string,
 *   photo?: string | ArrayBuffer | Uint8Array,
 *   audio?: string | ArrayBuffer | Uint8Array,
 *   photoDigest?: string,
 *   audioDigest?: string,
 * }} input
 * @returns {Promise<VowCommitment>}
 */
async function commitVow(input) {
  const partnerA = input.partnerA.trim();
  const partnerB = input.partnerB.trim();
  const vowText = input.vowText.trim();
  const createdAt = input.createdAt || new Date().toISOString();

  let photoDigest = input.photoDigest || '';
  let audioDigest = input.audioDigest || '';

  if (input.photo != null && input.photo !== '') {
    photoDigest = await sha256Hex(input.photo);
  }
  if (input.audio != null && input.audio !== '') {
    audioDigest = await sha256Hex(input.audio);
  }

  if (photoDigest && !/^[0-9a-f]{64}$/.test(photoDigest)) {
    throw new Error('@bevp/core: photoDigest must be 64-char lowercase hex');
  }
  if (audioDigest && !/^[0-9a-f]{64}$/.test(audioDigest)) {
    throw new Error('@bevp/core: audioDigest must be 64-char lowercase hex');
  }

  const canonical = buildVowCanonical({
    partnerA,
    partnerB,
    vowText,
    createdAt,
    photoDigest,
    audioDigest,
  });
  const evidenceRoot = await sha256Hex(canonical);

  return {
    partnerA,
    partnerB,
    vowText,
    createdAt,
    evidenceRoot,
    photoDigest,
    audioDigest,
    domain: VOW_DOMAIN,
  };
}

const merkle = require('./merkle.js');

module.exports = {
  VOW_DOMAIN,
  buildVowCanonical,
  commitVow,
  ...merkle,
};
