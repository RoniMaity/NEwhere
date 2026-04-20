// Server config
export const PORT = 8080

// WebSocket event names
// These are the messages that flow between server, host and client
export const EVENTS = {
  // Host events
  HOST_REGISTER: 'host:register',       
  HOST_REGISTERED: 'host:registered',   

  // Client events  
  CLIENT_JOIN: 'client:join',           
  CLIENT_JOINED: 'client:joined',       

  // WebRTC signaling events
  OFFER: 'webrtc:offer',               
  ANSWER: 'webrtc:answer',             
  ICE_CANDIDATE: 'webrtc:ice',         
  READY: 'webrtc:ready',

  // General
  ERROR: 'error',                      
  DISCONNECT: 'disconnect',             
} as const