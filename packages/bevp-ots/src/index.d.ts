export type OtsNetwork = 'bitcoin' | 'signet' | 'sandbox'
export type OtsStatus = 'pending' | 'upgraded'

export const SANDBOX_MAGIC: 'bevp-ots-sandbox-v1'
export const BITCOIN_CALENDARS: string[]

export type StampResult = {
  digestHex: string
  ots: Uint8Array
  status: OtsStatus
  network: OtsNetwork
  info: string
  calendarErrors: string[]
  attestations: Record<string, unknown>
}

export type UpgradeResult = {
  digestHex: string
  ots: Uint8Array
  status: OtsStatus
  changed: boolean
  network: OtsNetwork
  info: string
  calendarErrors?: string[]
  attestations: Record<string, unknown>
}

export type VerifyResult = {
  ok: boolean
  digestHex: string
  status: OtsStatus
  network: OtsNetwork
  message: string
  attestations: Record<string, unknown>
  errors: Record<string, unknown>
  info?: string
  canUpgrade?: boolean
}

export function hexToBytes(hex: string): Uint8Array
export function bytesToHex(bytes: Uint8Array | ArrayBuffer): string
export function stampSandbox(digest: string | Uint8Array): Promise<StampResult>
export function stampDigest(
  digest: string | Uint8Array,
  options?: { network?: OtsNetwork; calendars?: string[] },
): Promise<StampResult>
export function upgradeOts(otsBytes: Uint8Array | ArrayBuffer): Promise<UpgradeResult>
export function verifyOts(
  otsBytes: Uint8Array | ArrayBuffer,
  digestOrPayload: string | Uint8Array | ArrayBuffer,
  options?: { verifiers?: unknown },
): Promise<VerifyResult>
export function isSandboxOts(bytes: Uint8Array): boolean
export function infoOts(otsBytes: Uint8Array | ArrayBuffer): string
export function canUpgrade(timestamp: unknown): boolean
export function canVerify(timestamp: unknown): boolean
export function readOts(data: Uint8Array): unknown
export function writeOts(timestamp: unknown): Uint8Array
