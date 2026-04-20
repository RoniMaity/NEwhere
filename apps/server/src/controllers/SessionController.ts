import { SessionService } from '../services/SessionService.js'
import { SignalingService } from '../services/SignalingService.js'
import { HostRegisterSchema, ClientJoinSchema } from '@newhere/shared'
import bcrypt from 'bcryptjs'

export class SessionController {
  constructor(
    private sessionService: SessionService,
    private signalingService: SignalingService
  ) {}

  async onRegister(socketId: string, data: any): Promise<{ sessionCode: string }> {
    const parsed = HostRegisterSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error('Invalid registration payload')
    }

    let passwordHash = 'TOKEN_LOGIN'
    if (parsed.data.password) {
      passwordHash = await bcrypt.hash(parsed.data.password, 10)
    }

    const session = await this.sessionService.createSession(
      passwordHash,
      socketId,
      parsed.data.deviceId
    )

    return { sessionCode: session.sessionCode }
  }

  async onJoin(socketId: string, data: any): Promise<{ sessionCode: string }> {
    const parsed = ClientJoinSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error('Invalid join payload')
    }

    const { sessionCode, password, deviceId, token } = parsed.data

    // --- Path A: Device-based join (from Dashboard using JWT token) ---
    if (deviceId && token) {
      // Verify JWT
      const jwt = await import('jsonwebtoken')
      const { JWT_SECRET } = await import('../api/middleware.js')
      let userId: string
      try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
        userId = payload.userId
      } catch {
        throw new Error('Invalid or expired token')
      }

      // Find the active session for this device
      const session = this.sessionService.findByDeviceId(deviceId)
      if (!session) throw new Error('Device is not online or has no active session')

      await this.sessionService.joinSession(session.sessionCode, socketId)
      this.signalingService.relayToHost(session.sessionCode, 'client:connected')
      return { sessionCode: session.sessionCode }
    }

    // --- Path B: Code-based join (from ConnectPage using session code + password) ---
    if (!sessionCode) throw new Error('Session code required')

    const session = this.sessionService.getSessionByCode(sessionCode)
    if (!session) throw new Error('Session not found')

    // If session requires a password (not a token-login session), validate it
    if (session.passwordHash !== 'TOKEN_LOGIN') {
      if (!password) throw new Error('Password required')
      const isValid = await this.sessionService.validateSession(sessionCode, password)
      if (!isValid) throw new Error('Invalid code or password')
    }

    await this.sessionService.joinSession(sessionCode, socketId)
    this.signalingService.relayToHost(sessionCode, 'client:connected')
    return { sessionCode }
  }

  async onDisconnect(socketId: string): Promise<void> {
    const hostSession = this.sessionService.getSessionByHostSocket(socketId)
    if (hostSession) {
      this.signalingService.relayToClient(hostSession.sessionCode, 'host:disconnected')
      await this.sessionService.endSession(hostSession.id)
      return
    }

    const clientSession = this.sessionService.getSessionByClientSocket(socketId)
    if (clientSession) {
      this.signalingService.relayToHost(clientSession.sessionCode, 'client:disconnected')
      // Note: We don't end the session here so host can remain waiting for a new client
    }
  }
}
