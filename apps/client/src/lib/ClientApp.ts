import { ClientPeer } from './peer'
import { socket } from './socket'
import { InputCapture } from './InputCapture'
import { InputEvent } from '@newhere/shared'

export class ClientApp {
  private peerConnection: ClientPeer | null = null
  private inputCapture: InputCapture | null = null

  private frameCallback?: (frame: string) => void
  private cbClipboard?: (text: string) => void
  private cbConnected?: () => void
  private cbDisconnected?: () => void

  constructor() {}

  public async connect(sessionCode: string, targetElement: HTMLElement): Promise<void> {
    this.inputCapture = new InputCapture(targetElement)
    this.inputCapture.captureMouseMove((e) => this.sendInput(e))
    this.inputCapture.captureClick((e) => this.sendInput(e))
    this.inputCapture.captureKeyboard((e) => this.sendInput(e))

    this.peerConnection = new ClientPeer(
      (candidate) => {
        socket.sendIce(sessionCode, candidate.candidate!, candidate.sdpMid!, candidate.sdpMLineIndex!)
      },
      () => {
        if (this.cbConnected) this.cbConnected()
      }
    )

    this.peerConnection.onFrame((frame) => {
      if (this.frameCallback) this.frameCallback(frame)
    })

    this.peerConnection.onClipboardContent((text) => {
      if (this.cbClipboard) this.cbClipboard(text)
    })

    // Listeners for signaling
    const onOffer = async (msg: Record<string, unknown>) => {
      const sdp = msg.sdp as string
      const answerSdp = await this.peerConnection!.setOffer(sdp)
      socket.sendAnswer(sessionCode, answerSdp)
    }

    const onIce = async (msg: Record<string, unknown>) => {
      await this.peerConnection!.addIceCandidate({
        candidate: msg.candidate as string,
        sdpMid: msg.sdpMid as string,
        sdpMLineIndex: msg.sdpMLineIndex as number,
      })
    }

    const onHostDisconnected = () => {
      if (this.cbDisconnected) this.cbDisconnected()
    }

    socket.on('webrtc:offer', onOffer)
    socket.on('webrtc:ice', onIce)
    socket.on('host:disconnected', onHostDisconnected)

    // Notify ready to receive offer
    socket.sendReady(sessionCode)
  }

  public disconnect() {
    this.inputCapture?.stop()
    this.peerConnection?.close()
    // Could manually rip out socket listeners if needed, 
    // but in a SPA usually tearing down the whole thing drops it, or call socket.off()
    socket.close()
  }

  public onFrame(cb: (frame: string) => void) {
    this.frameCallback = cb
  }

  public onClipboardContent(cb: (text: string) => void) {
    this.cbClipboard = cb
  }

  public onConnected(cb: () => void) {
    this.cbConnected = cb
  }

  public onDisconnected(cb: () => void) {
    this.cbDisconnected = cb
  }

  public sendInput(event: InputEvent) {
    if (this.peerConnection) {
      this.peerConnection.sendInput(event)
    }
  }

  public sendFileChunk(chunk: ArrayBuffer) {
    if (this.peerConnection) {
      this.peerConnection.sendFileChunk(chunk)
    }
  }
}
