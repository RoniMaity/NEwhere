import { PORT, EVENTS } from '@newhere/shared'

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? `ws://localhost:${PORT}`

type Listener = (data: Record<string, unknown>) => void

class SignalingSocket {
  private ws: WebSocket | null = null
  private listeners = new Map<string, Listener[]>()
  private pendingMessages: object[] = []

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(SERVER_URL)

      this.ws.onopen = () => {
        // Flush any messages queued before connect
        this.pendingMessages.forEach((m) => this.ws!.send(JSON.stringify(m)))
        this.pendingMessages = []
        resolve()
      }

      this.ws.onerror = () => reject(new Error('WebSocket connection failed'))

      this.ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as Record<string, unknown>
          const type = msg.type as string
          this.listeners.get(type)?.forEach((cb) => cb(msg))
        } catch {
          console.error('[Socket] Failed to parse message')
        }
      }
    })
  }

  on(type: string, cb: Listener): void {
    const existing = this.listeners.get(type) ?? []
    this.listeners.set(type, [...existing, cb])
  }

  off(type: string, cb: Listener): void {
    const existing = this.listeners.get(type) ?? []
    this.listeners.set(type, existing.filter((l) => l !== cb))
  }

  send(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      this.pendingMessages.push(data)
    }
  }

  // Convenience send methods
  joinSession(payload: { sessionCode?: string; password?: string; token?: string; deviceId?: string }): void {
    this.send({ type: EVENTS.CLIENT_JOIN, ...payload })
  }

  sendAnswer(sessionCode: string, sdp: string): void {
    this.send({ type: EVENTS.ANSWER, sessionCode, sdp })
  }

  sendIce(sessionCode: string, candidate: string, sdpMid: string, sdpMLineIndex: number): void {
    this.send({ type: EVENTS.ICE_CANDIDATE, sessionCode, candidate, sdpMid, sdpMLineIndex })
  }

  sendReady(sessionCode: string): void {
    this.send({ type: EVENTS.READY, sessionCode })
  }

  close(): void {
    this.ws?.close()
    this.ws = null
  }
}

// Singleton — one socket per app
export const socket = new SignalingSocket()
