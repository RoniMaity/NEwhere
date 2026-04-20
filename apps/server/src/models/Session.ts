export enum SessionStatus {
  WAITING = 'WAITING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED'
}

export interface SessionDTO {
  id: string
  sessionCode: string
  status: string
  createdAt: Date
}

export class Session {
  id: string
  sessionCode: string
  passwordHash: string
  hostSocketId: string
  clientSocketId: string | null
  status: SessionStatus
  createdAt: Date
  hostDeviceId?: string
  dbSessionId?: string

  constructor(
    id: string,
    sessionCode: string,
    passwordHash: string,
    hostSocketId: string,
    status: SessionStatus = SessionStatus.WAITING,
    createdAt: Date = new Date(),
    hostDeviceId?: string,
    dbSessionId?: string
  ) {
    this.id = id
    this.sessionCode = sessionCode
    this.passwordHash = passwordHash
    this.hostSocketId = hostSocketId
    this.clientSocketId = null
    this.status = status
    this.createdAt = createdAt
    this.hostDeviceId = hostDeviceId
    this.dbSessionId = dbSessionId
  }

  isActive(): boolean {
    return this.status === SessionStatus.CONNECTED || this.status === SessionStatus.WAITING
  }

  toPublicDTO(): SessionDTO {
    return {
      id: this.id,
      sessionCode: this.sessionCode,
      status: this.status,
      createdAt: this.createdAt
    }
  }
}
