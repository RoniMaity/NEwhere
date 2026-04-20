import { SignalingService } from '../services/SignalingService.js'

export class SignalingController {
  constructor(private signalingService: SignalingService) {}

  onOffer(sessionCode: string, offerSdp: string) {
    this.signalingService.handleOffer(sessionCode, offerSdp)
  }

  onAnswer(sessionCode: string, answerSdp: string) {
    this.signalingService.handleAnswer(sessionCode, answerSdp)
  }

  onIceCandidate(sessionCode: string, candidate: string, sdpMid: string, sdpMLineIndex: number, fromClient: boolean) {
    this.signalingService.handleIceCandidate(sessionCode, candidate, sdpMid, sdpMLineIndex, fromClient)
  }

  onReady(sessionCode: string) {
    this.signalingService.relayToHost(sessionCode, 'webrtc:ready')
  }
}
