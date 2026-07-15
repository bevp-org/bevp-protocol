export function bytesToHex(bytes: ArrayBuffer | Uint8Array): string
export function toUint8Array(input: string | ArrayBuffer | Uint8Array): Uint8Array
export function sha256Hex(input: string | ArrayBuffer | Uint8Array): Promise<string>
export function shortHash(hex: string, head?: number, tail?: number): string

export type ShamirShare = { index: number; data: Uint8Array }

export function splitSecret(
  secret: Uint8Array,
  shares?: number,
  threshold?: number,
  opts?: { randomBytes?: (n: number) => Uint8Array },
): ShamirShare[]
export function combineShares(shares: ShamirShare[]): Uint8Array
export function split2of3(
  secret: Uint8Array | string,
  opts?: { randomBytes?: (n: number) => Uint8Array },
): ShamirShare[]

export function isWebAuthnAvailable(): boolean
export function createPasskey(input: {
  rpId?: string
  rpName?: string
  userId: Uint8Array | string
  userName: string
  userDisplayName?: string
  challenge?: Uint8Array
}): Promise<{ credentialId: string; rawId: Uint8Array; transports: string[] }>
export function assertPasskey(input: {
  credentialId: string
  challenge?: Uint8Array
  rpId?: string
}): Promise<{
  credentialId: string
  authenticatorData: Uint8Array
  clientDataJSON: Uint8Array
  signature: Uint8Array
}>
export function deriveUnlockKey(
  authenticatorData: Uint8Array,
  clientDataJSON: Uint8Array,
): Promise<Uint8Array>
export function bufferToBase64Url(buf: ArrayBuffer | Uint8Array): string
export function base64UrlToBuffer(value: string): Uint8Array
