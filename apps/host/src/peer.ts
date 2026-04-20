import { PeerConnection, type DataChannel } from 'node-datachannel'
import { nanoid } from 'nanoid'
import type { InputEvent } from '@newhere/shared'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

export class HostPeerConnection {
  private pc: InstanceType<typeof PeerConnection>
  private dataChannel: ReturnType<InstanceType<typeof PeerConnection>['createDataChannel']> | null = null
  private onInputCallback: ((event: InputEvent) => void) | null = null
  
  private iceQueue: { candidate: string; mid: string }[] = []
  private hasRemoteDescription = false

  constructor(private sessionCode: string) {
    const peerName = `h-${nanoid(8)}`
    this.pc = new PeerConnection(peerName, {
      iceServers: ['stun:stun.l.google.com:19302'],
    })
  }

  // Called by HostAgent when a client joins — host creates the offer
  async createOffer(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebRTC offer creation timed out (8s)'))
      }, 8000)

      try {
        this.pc.onLocalDescription((sdp, type) => {
          if (type === 'offer') {
            clearTimeout(timeout)
            resolve(sdp)
          }
        })

        this.dataChannel = this.pc.createDataChannel('input')
        
        let currentFileStream: fs.WriteStream | null = null
        let currentFileName = ''

        this.dataChannel.onMessage((msg) => {
          if (Buffer.isBuffer(msg)) {
            if (currentFileStream) currentFileStream.write(msg)
            return
          }

          if (this.onInputCallback) {
            try {
              const event = JSON.parse(msg as string) as InputEvent
              if (event.type === 'file:start') {
                currentFileName = event.name || `transfer_${Date.now()}`
                const downloadDir = path.join(os.homedir(), 'Downloads')
                currentFileStream = fs.createWriteStream(path.join(downloadDir, currentFileName))
                console.log(`[Peer] Receiving file: ${currentFileName}`)
              } else if (event.type === 'file:end') {
                if (currentFileStream) {
                  currentFileStream.end()
                  currentFileStream = null
                  console.log(`[Peer] Completed file: ${currentFileName}`)
                }
              } else {
                this.onInputCallback(event)
              }
            } catch {
              console.error('[Peer] Failed to parse input event')
            }
          }
        })

        this.pc.setLocalDescription('offer')
      } catch (err) {
        clearTimeout(timeout)
        reject(err)
      }
    })
  }

  setRemoteAnswer(sdp: string): void {
    this.pc.setRemoteDescription(sdp, 'answer')
    this.hasRemoteDescription = true

    for (const { candidate, mid } of this.iceQueue) {
      try { this.pc.addRemoteCandidate(candidate, mid) } catch (e) { console.warn(e) }
    }
    this.iceQueue = []
  }

  addIceCandidate(candidate: string, mid: string, _mLineIndex: number): void {
    if (!this.hasRemoteDescription) {
      this.iceQueue.push({ candidate, mid })
      return
    }
    this.pc.addRemoteCandidate(candidate, mid)
  }

  onLocalIceCandidate(callback: (candidate: string, mid: string, mLineIndex: number) => void): void {
    this.pc.onLocalCandidate((candidate, mid) => {
      callback(candidate, mid, 0)
    })
  }

  onInput(callback: (event: InputEvent) => void): void {
    this.onInputCallback = callback
  }

  // Stream a JPEG frame over the data channel (binary)
  sendFrame(jpegBuffer: Buffer): void {
    if (this.dataChannel && this.dataChannel.isOpen()) {
      // Send as base64 string for cross-compat; production would use binary
      this.dataChannel.sendMessage(`FRAME:${jpegBuffer.toString('base64')}`)
    }
  }

  sendClipboardContent(text: string): void {
    if (this.dataChannel && this.dataChannel.isOpen()) {
      this.dataChannel.sendMessage(JSON.stringify({ type: 'clipboard:content', text }))
    }
  }

  close(): void {
    this.pc.close()
  }
}
