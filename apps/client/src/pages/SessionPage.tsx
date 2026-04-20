import { useEffect, useRef, useState, useCallback } from 'react'
import { ClientApp } from '../lib/ClientApp'
import { socket } from '../lib/socket'

interface Props {
  sessionCode?: string
  deviceId?: string
  onDisconnect: () => void
}

type Status = 'connecting' | 'handshaking' | 'connected' | 'disconnected'

export function SessionPage({ sessionCode, deviceId, onDisconnect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const clientAppRef = useRef<ClientApp | null>(null)
  const [status, setStatus] = useState<Status>('connecting')
  const [isDragging, setIsDragging] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!sessionCode && !deviceId) return
    const app = new ClientApp()
    clientAppRef.current = app

    app.onConnected(() => setStatus('connected'))
    app.onDisconnected(() => {
      setStatus('disconnected')
      onDisconnect()
    })

    app.onFrame((base64) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const img = new Image()
      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0)
      }
      img.src = `data:image/jpeg;base64,${base64}`
    })

    app.onClipboardContent((text) => {
      navigator.clipboard?.writeText(text).then(() => showToast('Clipboard synced'))
    })

    if (canvasRef.current) {
      setStatus('handshaking')
      app.connect(sessionCode || deviceId || '', canvasRef.current).catch(console.error)
    }

    return () => { app.disconnect() }
  }, [sessionCode, deviceId, onDisconnect])

  function handleDisconnect() {
    clientAppRef.current?.disconnect()
    onDisconnect()
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const handlePushClipboard = async () => {
    if (!navigator.clipboard) return
    try {
      const text = await navigator.clipboard.readText()
      clientAppRef.current?.sendInput({ type: 'clipboard:write', text })
      showToast('Pushed to host clipboard')
    } catch {
      showToast('Cannot read clipboard')
    }
  }

  const handlePullClipboard = () => {
    clientAppRef.current?.sendInput({ type: 'clipboard:read' })
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
  }, [])

  const uploadFiles = async (files: File[]) => {
    if (!clientAppRef.current || status !== 'connected') return
    for (const file of files) {
      showToast(`Sending ${file.name}…`)
      clientAppRef.current.sendInput({ type: 'file:start', name: file.name, size: file.size })
      const buf = await file.arrayBuffer()
      const chunk = 64 * 1024
      for (let offset = 0; offset < buf.byteLength; offset += chunk) {
        clientAppRef.current.sendFileChunk(buf.slice(offset, offset + chunk))
      }
      clientAppRef.current.sendInput({ type: 'file:end' })
      showToast(`Sent ${file.name}`)
    }
  }

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    await uploadFiles(Array.from(e.dataTransfer.files))
  }, [status])

  const onFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await uploadFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const statusLabel = {
    connecting: 'Waiting for host…',
    handshaking: 'Establishing connection…',
    connected: sessionCode || deviceId || '',
    disconnected: 'Disconnected',
  }[status]

  return (
    <div className="session-page" ref={containerRef}>
      {/* Top bar */}
      <div className="session-bar">
        <span className={`status ${status === 'connected' ? 'connected' : ''}`}>
          {statusLabel}
        </span>

        <div className="session-controls">
          {status === 'connected' && (
            <>
              <button className="btn-secondary" onClick={handlePushClipboard}>
                Push clipboard
              </button>
              <button className="btn-secondary" onClick={handlePullClipboard}>
                Pull clipboard
              </button>
              <button className="btn-secondary" onClick={() => document.getElementById('file-input')?.click()}>
                Send file
              </button>
            </>
          )}
          <input id="file-input" type="file" style={{ display: 'none' }} multiple onChange={onFileInput} />
          <button id="disconnect-btn" className="disconnect-btn" onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        className="video-wrapper"
        style={{ position: 'relative' }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {status !== 'connected' && (
          <div className="connecting-overlay">
            <div className="spinner" />
            <span>{status === 'connecting' ? 'Connecting…' : 'Negotiating P2P…'}</span>
          </div>
        )}

        {/* Drop overlay */}
        {isDragging && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.05)',
            border: '1px dashed #444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, pointerEvents: 'none'
          }}>
            <span style={{ color: '#666', fontSize: '13px', letterSpacing: '0.2px' }}>
              Drop to send to host
            </span>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'absolute', bottom: 16, left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            color: '#888',
            padding: '6px 14px',
            borderRadius: '4px',
            fontSize: '11px',
            letterSpacing: '0.1px',
            zIndex: 20,
            whiteSpace: 'nowrap',
          }}>
            {toast}
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="remote-canvas"
          style={{ display: status === 'connected' ? 'block' : 'none' }}
        />
      </div>
    </div>
  )
}
