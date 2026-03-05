import { z } from 'zod'

// Message the host sends when it starts up and registers itself
export const HostRegisterSchema = z.object({
  password: z.string().min(4, 'Password must be at least 4 characters'),
})

// Message the client sends when it wants to join a session
export const ClientJoinSchema = z.object({
  sessionCode: z.string().length(8, 'Session code must be 8 characters'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
})

// WebRTC signaling messages
export const OfferSchema = z.object({
  sessionCode: z.string(),
  sdp: z.string(),
})

export const AnswerSchema = z.object({
  sessionCode: z.string(),
  sdp: z.string(),
})

export const IceCandidateSchema = z.object({
  sessionCode: z.string(),
  candidate: z.string(),
  sdpMid: z.string(),
  sdpMLineIndex: z.number(),
})

// Infer TypeScript types from schemas — no need to define them twice
export type HostRegisterPayload = z.infer<typeof HostRegisterSchema>
export type ClientJoinPayload = z.infer<typeof ClientJoinSchema>
export type OfferPayload = z.infer<typeof OfferSchema>
export type AnswerPayload = z.infer<typeof AnswerSchema>
export type IceCandidatePayload = z.infer<typeof IceCandidateSchema>