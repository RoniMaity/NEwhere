import { SessionRepository } from '../repositories/SessionRepository.js'
import { IdGenerator } from './IdGenerator.js'
import { Session, SessionStatus } from '../models/Session.js'
import bcrypt from 'bcryptjs'

export class SessionService {
  constructor(
    private sessionRepo: SessionRepository,
    private idGenerator: IdGenerator
  ) {}

  async createSession(
    passwordHash: string,
    hostSocketId: string,
    hostDeviceId?: string
  ): Promise<Session> {
    const sessionCode = this.idGenerator.generateSessionCode()
    const id = this.idGenerator.generate()
    
    const session = new Session(
      id,
      sessionCode,
      passwordHash,
      hostSocketId,
      SessionStatus.WAITING,
      new Date(),
      hostDeviceId
    )

    await this.sessionRepo.save(session)
    return session
  }

  async validateSession(sessionCode: string, passwordAttempt: string): Promise<boolean> {
    const session = this.sessionRepo.findBySessionCode(sessionCode)
    if (!session) return false
    return bcrypt.compare(passwordAttempt, session.passwordHash)
  }

  async joinSession(sessionCode: string, clientSocketId: string): Promise<Session | undefined> {
    const session = this.sessionRepo.findBySessionCode(sessionCode)
    if (!session) return undefined
    
    session.clientSocketId = clientSocketId
    session.status = SessionStatus.CONNECTED
    await this.sessionRepo.save(session)
    return session
  }

  async endSession(id: string): Promise<void> {
    await this.sessionRepo.delete(id)
  }

  getSessionByCode(sessionCode: string): Session | undefined {
    return this.sessionRepo.findBySessionCode(sessionCode)
  }

  getSessionByHostSocket(socketId: string): Session | undefined {
    return this.sessionRepo.findByHostSocketId(socketId)
  }

  getSessionByClientSocket(socketId: string): Session | undefined {
    return this.sessionRepo.findByClientSocketId(socketId)
  }

  findByDeviceId(deviceId: string): Session | undefined {
    return this.sessionRepo.findByDeviceId(deviceId)
  }
}
