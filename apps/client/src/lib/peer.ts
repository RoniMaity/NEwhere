import type { InputEvent } from '@newhere/shared'

const STUN = 'stun:stun.l.google.com:19302'

export type OnFrameCallback = (jpegBase64: string) => void
export type OnIceCallback = (candidate: RTCIceCandidateInit) => void
export type OnConnectedCallback = () => void

export class ClientPeer {
  private pc: RTCPeerConnection
  private dataChannel: RTCDataChannel | null = null
  private onFrameCallback: OnFrameCallback | null = null
  private onClipboardCallback: ((text: string) => void) | null = null
  
  private iceQueue: RTCIceCandidateInit[] = []
  private hasRemoteDescription = false

  constructor(
    private onIce: OnIceCallback,
    private onConnected: OnConnectedCallback,
  ) {
    this.pc = new RTCPeerConnection({ iceServers: [{ urls: STUN }] })

    this.pc.onicecandidate = (ev) => {
      if (ev.candidate) this.onIce(ev.candidate.toJSON())
    }

    this.pc.onconnectionstatechange = () => {
      if (this.pc.connectionState === 'connected') this.onConnected()
    }

    // Host sends frames over the data channel labelled "input"
    this.pc.ondatachannel = (ev) => {
      const ch = ev.channel
      this.dataChannel = ch

      ch.onmessage = (msgEv) => {
        const data = msgEv.data as string
        if (data.startsWith('FRAME:') && this.onFrameCallback) {
          this.onFrameCallback(data.slice(6))
        } else {
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'clipboard:content' && this.onClipboardCallback) {
              this.onClipboardCallback(parsed.text)
            }
          } catch {
            // Ignore non-JSON
          }
        }
      }
    }
  }

  async setOffer(sdp: string): Promise<string> {
    await this.pc.setRemoteDescription({ type: 'offer', sdp })
    this.hasRemoteDescription = true

    // Process any ICE candidates that arrived before the offer
    for (const candidate of this.iceQueue) {
      await this.pc.addIceCandidate(candidate).catch(console.warn)
    }
    this.iceQueue = []

    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    return answer.sdp!
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.hasRemoteDescription) {
      this.iceQueue.push(candidate)
      return
    }
    await this.pc.addIceCandidate(candidate)
  }

  onFrame(cb: OnFrameCallback): void {
    this.onFrameCallback = cb
  }

  onClipboardContent(cb: (text: string) => void): void {
    this.onClipboardCallback = cb
  }

  // Send input event to host via data channel
  sendInput(event: InputEvent): void {
    if (this.dataChannel?.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(event))
    }
  }

  sendFileChunk(chunk: ArrayBuffer): void {
    if (this.dataChannel?.readyState === 'open') {
      this.dataChannel.send(chunk)
    }
  }

  close(): void {
    this.pc.close()
  }
}
