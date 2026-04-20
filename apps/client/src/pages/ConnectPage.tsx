import { useState, FormEvent } from 'react'
import { socket } from '../lib/socket'

interface Props {
  onConnected: (sessionCode: string) => void
  onBackToLogin?: () => void
}

export function ConnectPage({ onConnected, onBackToLogin }: Props) {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!code.trim() || !password.trim()) return

    setLoading(true)
    setError(null)

    try {
      await socket.connect()

      const result = await new Promise<'ok' | string>((resolve) => {
        const onJoined = () => resolve('ok')
        const onError = (msg: Record<string, unknown>) => resolve(msg.message as string ?? 'Unknown error')

        socket.on('client:joined', onJoined as () => void)
        socket.on('error', onError)

        socket.joinSession({ sessionCode: code.trim().toUpperCase(), password })

        setTimeout(() => {
          socket.off('client:joined', onJoined as () => void)
          socket.off('error', onError)
          resolve('Connection timed out')
        }, 8000)
      })

      if (result === 'ok') {
        onConnected(code.trim().toUpperCase())
      } else {
        setError(result)
        socket.close()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="connect-page">
      <div className="connect-card">
        <h1>Connect</h1>
        <p className="subtitle">Enter a session code to access a remote machine</p>

        <form onSubmit={handleSubmit} style={{ marginTop: '28px' }}>
          <div className="field">
            <label>Session code</label>
            <input
              id="session-code"
              type="text"
              placeholder="ABCD1234"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              autoComplete="off"
              spellCheck={false}
              disabled={loading}
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px', fontSize: '15px' }}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              id="session-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            id="connect-btn"
            type="submit"
            className="connect-btn"
            disabled={loading || !code || !password}
          >
            {loading ? 'Connecting…' : 'Connect'}
          </button>
        </form>

        {error && <div className="error-msg">{error}</div>}

        {onBackToLogin && (
          <button className="back-link" onClick={onBackToLogin}>
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}
