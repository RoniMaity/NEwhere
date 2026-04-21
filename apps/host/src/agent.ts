import { SignalingClient } from './signaling.js'
import { HostPeerConnection } from './peer.js'
import { ScreenCapturer } from './interfaces/ScreenCapturer.js'
import { InputSimulator } from './interfaces/InputSimulator.js'
import { ScreenCapturerFactory } from './factories/ScreenCapturerFactory.js'
import { CliInputSimulator } from './simulators/CliInputSimulator.js'
import type { InputEvent } from '@newhere/shared'

const FRAME_INTERVAL_MS = 30  // ~33 FPS

export class HostAgent {
  private signaling = new SignalingClient()
  private peer: HostPeerConnection | null = null
  private sessionCode = ''
  private streaming = false
  private streamTimer: NodeJS.Timeout | null = null
  private capturer: ScreenCapturer
  private inputSim: InputSimulator

  constructor(private password?: string, private token?: string, private deviceId?: string) {
    this.capturer = ScreenCapturerFactory.create()
    this.inputSim = new CliInputSimulator()
  }

  async start(): Promise<void> {
    console.log('[Agent] Connecting to signaling server...')
    await this.signaling.connect()
    console.log('[Agent] Connected. Registering host...')

    const payload: any = {}
    if (this.password && this.password.length >= 4) payload.password = this.password
    if (this.token) payload.token = this.token
    if (this.deviceId) payload.deviceId = this.deviceId

    this.signaling.register(payload)

    // Server confirmed registration → print session code
    this.signaling.on('host:registered', (msg: { sessionCode: string }) => {
      this.sessionCode = msg.sessionCode
      console.log('\n╔══════════════════════════════════════╗')
      console.log(`║  Session Code:  ${msg.sessionCode.padEnd(22)}║`)
      console.log('║  Share this code with the remote user ║')
      console.log('╚══════════════════════════════════════╝\n')
    })

    // Client joined → host waits for READY before sending offer
    this.signaling.on('client:connected', () => {
      console.log('[Agent] Client connected. Waiting for client to be ready...')
    })

    this.signaling.on('webrtc:ready', async () => {
      if (this.peer) {
        console.log('[Agent] Client already connected/ready. Skipping duplicate handshake.')
        return
      }
      console.log('[Agent] Client ready. Starting WebRTC handshake...')
      this.peer = new HostPeerConnection(this.sessionCode)

      this.peer.onLocalIceCandidate((candidate, mid, mLineIndex) => {
        this.signaling.sendIceCandidate({
          sessionCode: this.sessionCode,
          candidate,
          sdpMid: mid,
          sdpMLineIndex: mLineIndex,
        })
      })

      this.peer.onInput(async (event: InputEvent) => {
        try {
          const result = await this.inputSim.simulate(event)
          if (result !== undefined && this.peer) {
            this.peer.sendClipboardContent(result)
          }
        } catch (err) {
          console.error(err)
        }
      })

      const offer = await this.peer.createOffer()
      this.signaling.sendOffer(this.sessionCode, offer)
      console.log('[Agent] SDP offer sent')
    })

    // Server relayed answer from client
    this.signaling.on('webrtc:answer', (msg: { sdp: string }) => {
      console.log('[Agent] Got SDP answer. Setting remote description...')
      this.peer?.setRemoteAnswer(msg.sdp)
      console.log('[Agent] WebRTC connected. Starting screen stream...')
      this.startStreaming()
    })

    // Server relayed ICE candidate from client
    this.signaling.on('webrtc:ice', (msg: { candidate: string; sdpMid: string; sdpMLineIndex: number }) => {
      this.peer?.addIceCandidate(msg.candidate, msg.sdpMid, msg.sdpMLineIndex)
    })

    // Client disconnected
    this.signaling.on('client:disconnected', () => {
      console.log('[Agent] Client disconnected. Stopping stream. Ready for new connection.')
      this.stopStreaming()
      this.peer?.close()
      this.peer = null
    })

    this.signaling.on('error', (msg: { message: string }) => {
      console.error('[Agent] Server error:', msg.message)
    })
  }

  private startStreaming(): void {
    if (this.streaming) return
    this.streaming = true

    const sendFrame = async () => {
      if (!this.streaming || !this.peer) return
      try {
        const frame = await this.capturer.capture()
        this.peer.sendFrame(frame)
      } catch (err) {
        console.warn('[Agent] Frame capture failed:', err)
      }
      this.streamTimer = setTimeout(sendFrame, FRAME_INTERVAL_MS)
    }

    sendFrame()
    console.log(`[Agent] Streaming at ~${Math.round(1000 / FRAME_INTERVAL_MS)} FPS`)
  }

  private stopStreaming(): void {
    this.streaming = false
    if (this.streamTimer) {
      clearTimeout(this.streamTimer)
      this.streamTimer = null
    }
  }

  stop(): void {
    this.stopStreaming()
    this.peer?.close()
    this.signaling.close()
    console.log('[Agent] Stopped.')
  }
}
