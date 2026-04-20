import { customAlphabet } from 'nanoid'

// 8-char alphanumeric code — what the user types to connect (e.g. "V1StGXR8")
const generate = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

export function generateSessionCode(): string {
  return generate()
}
