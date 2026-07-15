export type PayTier = 'queue' | 'rush'
export type JobStatus = 'pending_payment' | 'paid' | 'submitted' | 'stamped' | 'failed'

export const RUSH_FEE_USD: number
export const QUEUE_FEE_USD: number

export type PayIntent = {
  intentId: string
  tier: PayTier
  amountUsd: number
  currency: string
  digestHex: string
  status: string
  clientSecret?: string
  createdAt: string
  jobId?: string
  paidAt?: string
}

export type StampJob = {
  jobId: string
  intentId: string
  digestHex: string
  tier: PayTier
  status: JobStatus | string
  createdAt: string
  stampedAt?: string
  otsHint?: string
}

export type RelayClient = {
  kind: 'http' | 'mock'
  baseUrl?: string
  createPayIntent(input: { digestHex: string; tier?: PayTier }): Promise<PayIntent>
  confirmPayment(input: {
    intentId: string
    paymentToken?: string
    mockFail?: boolean
  }): Promise<{ intentId: string; status: string; paidAt?: string }>
  submitStamp(input: { intentId: string; digestHex: string }): Promise<StampJob>
  getJob(jobId: string): Promise<StampJob>
}

export function createHttpRelay(
  baseUrl: string,
  opts?: { fetchImpl?: typeof fetch },
): RelayClient

export function createMockRelay(options?: {
  rushFeeUsd?: number
  queueFeeUsd?: number
}): RelayClient

export function payAndSubmitStamp(
  relay: RelayClient,
  input: { digestHex: string; tier?: PayTier; paymentToken?: string },
): Promise<{ intent: PayIntent; payment: { intentId: string; status: string }; job: StampJob }>
