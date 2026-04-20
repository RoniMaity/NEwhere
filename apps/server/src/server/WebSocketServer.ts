import { WebSocketServer as WSS, WebSocket } from 'ws'
import { Server } from 'http'
import { randomUUID } from 'crypto'
import { SessionController } from '../controllers/SessionController.js'
import { SignalingController } from '../controllers/SignalingController.js'
import { log } from '../index.js'
import { SignalingService } from '../services/SignalingService.js'

export class WebSocketServer {
  private static instance: WebSocketServer
  private wss!: WSS
  private sessionController!: SessionController
  private signalingController!: SignalingController
  public sockets = new Map<string, WebSocket>()

  private constructor() {}

  public static getInstance(): WebSocketServer {
    if (!WebSocketServer.instance) {
      WebSocketServer.instance = new WebSocketServer()
    }
    return WebSocketServer.instance
  }

  public init(
    server: Server,
    sessionController: SessionController,
    signalingController: SignalingController,
    signalingService: SignalingService
  ) {
    this.wss = new WSS({ server })
    this.sessionController = sessionController
    this.signalingController = signalingController

    // Bind event listeners for outgoing relays
    signalingService.on('relayToHost', (socketId: string, data: any) => {
      this.send(socketId, data)
    })
    signalingService.on('relayToClient', (socketId: string, data: any) => {
      this.send(socketId, data)
    })

    this.wss.on('connection', (socket: WebSocket) => {
      const socketId = randomUUID()
      this.sockets.set(socketId, socket)
      log.info(`New WebSocket connection: ${socketId}`)

      socket.on('message', async (raw) => {
        let msg: any
        try {
          msg = JSON.parse(raw.toString())
        } catch {
          socket.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
          return
        }

        try {
          switch (msg.type) {
            case 'host:register': {
              const res = await this.sessionController.onRegister(socketId, msg)
              socket.send(JSON.stringify({ type: 'host:registered', sessionCode: res.sessionCode }))
              break
            }
            case 'client:join': {
              const res = await this.sessionController.onJoin(socketId, msg)
              socket.send(JSON.stringify({ type: 'client:joined', sessionCode: res.sessionCode }))
              break
            }
            case 'webrtc:offer':
              this.signalingController.onOffer(msg.sessionCode, msg.sdp)
              break
            case 'webrtc:answer':
              this.signalingController.onAnswer(msg.sessionCode, msg.sdp)
              break
            case 'webrtc:ice':
              this.signalingController.onIceCandidate(msg.sessionCode, msg.candidate, msg.sdpMid, msg.sdpMLineIndex, msg.fromClient ?? false)
              break
            case 'webrtc:ready':
              this.signalingController.onReady(msg.sessionCode)
              break
            default:
              socket.send(JSON.stringify({ type: 'error', message: `Unknown message: ${msg.type}` }))
          }
        } catch (err: any) {
          log.error({ err }, 'Error processing message')
          socket.send(JSON.stringify({ type: 'error', message: err.message }))
        }
      })

      socket.on('close', async () => {
        await this.sessionController.onDisconnect(socketId)
        this.sockets.delete(socketId)
      })

      socket.on('error', (err) => {
        log.error({ err }, 'WebSocket error')
      })
    })
  }

  public send(socketId: string, data: any) {
    const socket = this.sockets.get(socketId)
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data))
    }
  }

  public broadcast(event: string, data: any) {
    for (const socket of this.sockets.values()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: event, ...data }))
      }
    }
  }
}
