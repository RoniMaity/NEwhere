import { EventEmitter } from 'node:events'
import WebSocket from 'ws'
import { PORT, EVENTS } from '@newhere/shared'
import type { OfferPayload, AnswerPayload, IceCandidatePayload } from '@newhere/shared'

const SERVER_URL = process.env.SERVER_URL ?? `ws://localhost:${PORT}`

type SignalingEvent =
  | 'client:connected'
  | 'client:disconnected'
  | 'host:registered'
  | 'webrtc:offer'
  | 'webrtc:answer'
  | 'webrtc:ice'
  | 'error'

export class SignalingClient extends EventEmitter {
  private ws: WebSocket | null = null

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(SERVER_URL)

      this.ws.on('open', () => resolve())
      this.ws.on('error', (err) => reject(err))

      this.ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString()) as { type: string; [k: string]: unknown }
          this.emit(msg.type as SignalingEvent, msg)
        } catch {
          console.error('[SignalingClient] Failed to parse message')
        }
      })

      this.ws.on('close', () => {
        console.log('[SignalingClient] Disconnected from server')
      })
    })
  }

  sendOffer(sessionCode: string, sdp: string): void {
    this.send({ type: EVENTS.OFFER, sessionCode, sdp } satisfies OfferPayload & { type: string })
  }

  sendAnswer(sessionCode: string, sdp: string): void {
    this.send({ type: EVENTS.ANSWER, sessionCode, sdp } satisfies AnswerPayload & { type: string })
  }

  sendIceCandidate(payload: IceCandidatePayload): void {
    this.send({ type: EVENTS.ICE_CANDIDATE, ...payload })
  }

  // Send registration to server
  register(payload: { password?: string; token?: string; deviceId?: string }): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }
    this.ws.send(JSON.stringify({
      type: EVENTS.HOST_REGISTER,
      ...payload
    }))
  }

  private send(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  close(): void {
    this.ws?.close()
  }
}
