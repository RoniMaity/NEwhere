import { BaseRepository } from './BaseRepository.js'
import { Session, SessionStatus } from '../models/Session.js'
import { prisma } from '@newhere/db'

export class SessionRepository extends BaseRepository<Session> {
  private memorySessions = new Map<string, Session>()

  // Since we also have Prisma, we will sync state
  async findById(id: string): Promise<Session | undefined> {
    return this.memorySessions.get(id)
  }

  findBySessionCode(code: string): Session | undefined {
    // Also lookup by sessionCode directly for easy WebRTC signaling
    for (const session of this.memorySessions.values()) {
      if (session.sessionCode === code) return session
    }
    return undefined
  }

  findByHostSocketId(socketId: string): Session | undefined {
    for (const session of this.memorySessions.values()) {
      if (session.hostSocketId === socketId) return session
    }
    return undefined
  }

  findByDeviceId(deviceId: string): Session | undefined {
    for (const session of this.memorySessions.values()) {
      if (session.hostDeviceId === deviceId && session.status !== 'DISCONNECTED') return session
    }
    return undefined
  }

  findByClientSocketId(socketId: string): Session | undefined {
    for (const session of this.memorySessions.values()) {
      if (session.clientSocketId === socketId) return session
    }
    return undefined
  }

  async save(session: Session): Promise<void> {
    this.memorySessions.set(session.id, session)

    // Sync with Prisma
    if (session.dbSessionId) {
      await prisma.session.update({
        where: { id: session.dbSessionId },
        data: { status: session.status }
      }).catch(() => {})
    } else if (session.hostDeviceId && !session.dbSessionId) {
      // creating db session wrapper
      const dbSession = await prisma.session.create({
        data: {
          sessionCode: session.sessionCode,
          passwordHash: session.passwordHash,
          hostDeviceId: session.hostDeviceId,
          status: session.status
        }
      }).catch(() => null)
      if (dbSession) session.dbSessionId = dbSession.id
    }
    
    // Sync device online status
    if (session.hostDeviceId && session.status === SessionStatus.WAITING) {
      await prisma.device.update({
        where: { id: session.hostDeviceId },
        data: { isOnline: true }
      }).catch(() => {})
    }
  }

  async delete(id: string): Promise<void> {
    const session = this.memorySessions.get(id)
    if (session) {
      if (session.dbSessionId) {
         await prisma.session.update({
           where: { id: session.dbSessionId },
           data: { status: 'DISCONNECTED', endedAt: new Date() }
         }).catch(() => {})
         
         if (session.hostDeviceId) {
           await prisma.device.update({
             where: { id: session.hostDeviceId },
             data: { isOnline: false }
           }).catch(() => {})
         }
      }
      this.memorySessions.delete(id)
    }
  }

  findAll(): Session[] {
    return Array.from(this.memorySessions.values())
  }
}
