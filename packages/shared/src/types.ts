// Session status — the 3 states a session can be in
export type SessionStatus = 'WAITING' | 'CONNECTED' | 'DISCONNECTED'

// What a session looks like in memory on the server
export interface Session {
  id: string
  sessionCode: string
  passwordHash: string
  hostSocketId: string
  clientSocketId: string | null
  status: SessionStatus
  createdAt: Date
}

// What we send back to the host/client — never expose passwordHash
export interface SessionDTO {
  id: string
  sessionCode: string
  status: SessionStatus
  createdAt: Date
}

// Input events that client sends to host
// Input events that client sends to host
export type InputEventType = 'mousemove' | 'mouseclick' | 'mousedown' | 'mouseup' | 'keypress' | 'keyrelease' | 'clipboard:read' | 'clipboard:write' | 'clipboard:content' | 'file:start' | 'file:chunk' | 'file:end'

export interface InputEvent {
  type: InputEventType
  x?: number        // for mouse events
  y?: number        // for mouse events
  key?: string      // for keyboard events
  button?: 'left' | 'right' | 'middle'  // for click events
  
  // Custom payloads
  text?: string     // for clipboard text
  name?: string     // for file transfer start
  size?: number     // for file transfer start
  chunkId?: number  // for file chunks
  data?: string     // base64 encoded chunks
}