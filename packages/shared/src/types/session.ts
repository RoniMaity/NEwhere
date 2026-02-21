export type SessionStatus = 'WAITING' | 'ACTIVE' | 'ENDED';

export interface SessionDTO {
  id: string;
  status: SessionStatus;
  hostDeviceId: string;
  clientDeviceId: string | null;
  startedAt: Date;
}

export interface CreateSessionPayload {
  hostDeviceId: string;
  password?: string;
}

export interface JoinSessionPayload {
  sessionId: string;
  clientDeviceId: string;
  password?: string;
}