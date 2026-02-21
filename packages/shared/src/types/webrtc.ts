// The base envelope for every WebSocket message
export interface SignalingMessage<T = any> {
  type: SignalingMessageType;
  payload: T;
  timestamp: number;
}

export type SignalingMessageType = 
  | 'REGISTER_HOST'
  | 'REGISTER_CLIENT'
  | 'SESSION_CREATED'
  | 'CLIENT_JOINED'
  | 'WEBRTC_OFFER'
  | 'WEBRTC_ANSWER'
  | 'ICE_CANDIDATE'
  | 'ERROR';

// The specific payloads for WebRTC negotiation
export interface WebRTCOfferPayload {
  sessionId: string;
  sdp: string; // Session Description Protocol
}

export interface WebRTCAnswerPayload {
  sessionId: string;
  sdp: string;
}

export interface IceCandidatePayload {
  sessionId: string;
  candidate: any; 
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}