import { EventEmitter } from 'node:events'
import { SessionService } from './SessionService.js'

export class SignalingService extends EventEmitter {
  constructor(private sessionService: SessionService) {
    super()
  }

  handleOffer(sessionCode: string, sdp: string) {
    const session = this.sessionService.getSessionByCode(sessionCode)
    if (session && session.clientSocketId) {
      this.emit('relayToClient', session.clientSocketId, { type: 'webrtc:offer', sdp })
    }
  }

  handleAnswer(sessionCode: string, sdp: string) {
    const session = this.sessionService.getSessionByCode(sessionCode)
    if (session && session.hostSocketId) {
      this.emit('relayToHost', session.hostSocketId, { type: 'webrtc:answer', sdp })
    }
  }

  handleIceCandidate(sessionCode: string, candidate: string, sdpMid: string, sdpMLineIndex: number, fromClient: boolean) {
    const session = this.sessionService.getSessionByCode(sessionCode)
    if (!session) return

    const payload = { type: 'webrtc:ice', candidate, sdpMid, sdpMLineIndex }
    
    if (fromClient && session.hostSocketId) {
      this.emit('relayToHost', session.hostSocketId, payload)
    } else if (!fromClient && session.clientSocketId) {
      this.emit('relayToClient', session.clientSocketId, payload)
    }
  }

  relayToHost(sessionCode: string, event: string, data: any = {}) {
    const session = this.sessionService.getSessionByCode(sessionCode)
    if (session && session.hostSocketId) {
      this.emit('relayToHost', session.hostSocketId, { type: event, ...data })
    }
  }

  relayToClient(sessionCode: string, event: string, data: any = {}) {
    const session = this.sessionService.getSessionByCode(sessionCode)
    if (session && session.clientSocketId) {
      this.emit('relayToClient', session.clientSocketId, { type: event, ...data })
    }
  }
}
