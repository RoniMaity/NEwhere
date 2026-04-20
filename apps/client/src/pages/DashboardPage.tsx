import { useEffect, useState } from 'react'
import { api, clearToken, getToken } from '../lib/api'
import { socket } from '../lib/socket'

export function DashboardPage({
  onConnectCode,
  onConnectDevice,
  onLogout
}: {
  onConnectCode: () => void
  onConnectDevice: (deviceId: string, sessionCode: string) => void
  onLogout: () => void
}) {
  const [devices, setDevices] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [connectingTo, setConnectingTo] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [u, d] = await Promise.all([api.me(), api.getDevices()])
      setUser(u.user)
      setDevices(d)
    } catch {
      handleLogout()
    }
  }

  const handleLogout = () => {
    clearToken()
    onLogout()
  }

  const handleConnect = async (deviceId: string) => {
    try {
      setError('')
      setConnectingTo(deviceId)
      await socket.connect()

      const result = await new Promise<{ type: 'ok'; sessionCode: string } | { type: 'error'; message: string }>((resolve) => {
        const onJoined = (msg: any) => resolve({ type: 'ok', sessionCode: msg.sessionCode })
        const onError = (msg: Record<string, unknown>) => resolve({ type: 'error', message: msg.message as string ?? 'Unknown error' })

        socket.on('client:joined', onJoined)
        socket.on('error', onError)
        socket.joinSession({ deviceId, token: getToken() as string })

        setTimeout(() => {
          socket.off('client:joined', onJoined)
          socket.off('error', onError)
          resolve({ type: 'error', message: 'Connection timed out' })
        }, 8000)
      })

      if (result.type === 'ok') {
        onConnectDevice(deviceId, result.sessionCode)
      } else {
        setError(result.message)
        socket.close()
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setConnectingTo(null)
    }
  }

  const onlineDevices = devices.filter(d => d.isOnline)
  const offlineDevices = devices.filter(d => !d.isOnline)

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>NEwhere</h1>
          {user && (
            <p className="subtitle" style={{ marginTop: '2px' }}>
              {user.displayName} · {user.email}
            </p>
          )}
        </div>
        <button
          className="icon-btn"
          style={{ WebkitAppRegion: 'no-drag' } as any}
          onClick={handleLogout}
        >
          Sign out
        </button>
      </div>

      {/* Body */}
      <div className="dashboard-body">
        {/* Left: Devices */}
        <div className="card-section">
          <h3>My Devices</h3>

          {devices.length === 0 ? (
            <div className="empty-state">
              <p>No devices saved yet.</p>
              <p style={{ marginTop: '4px', color: 'var(--gray-5)', fontSize: '12px' }}>
                Install the NEwhere host agent on your machine and log in to save it here.
              </p>
            </div>
          ) : (
            <div>
              {onlineDevices.map(device => (
                <div key={device.id} className="device-row">
                  <div className="device-info">
                    <span className="device-name">{device.name}</span>
                    <div className="device-meta">
                      <span className="badge">
                        <span className="badge-dot online" />
                        Online
                      </span>
                      {device.os && (
                        <span className="code-badge">{device.os}</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="connect-device-btn"
                    onClick={() => handleConnect(device.id)}
                    disabled={connectingTo === device.id}
                  >
                    {connectingTo === device.id ? 'Connecting…' : 'Connect'}
                  </button>
                </div>
              ))}

              {offlineDevices.length > 0 && (
                <>
                  {onlineDevices.length > 0 && (
                    <div style={{ height: '1px', background: 'var(--gray-3)', margin: '4px 0 8px' }} />
                  )}
                  {offlineDevices.map(device => (
                    <div key={device.id} className="device-row" style={{ opacity: 0.45 }}>
                      <div className="device-info">
                        <span className="device-name">{device.name}</span>
                        <div className="device-meta">
                          <span className="badge">
                            <span className="badge-dot" />
                            Offline
                          </span>
                          {device.os && (
                            <span className="code-badge">{device.os}</span>
                          )}
                        </div>
                      </div>
                      <button className="connect-device-btn" disabled style={{ opacity: 0.3 }}>
                        Connect
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {error && <div className="error-box" style={{ marginTop: '16px' }}>{error}</div>}
        </div>

        {/* Right: Manual connect */}
        <div className="card-section" style={{ height: 'fit-content' }}>
          <h3>Guest Access</h3>
          <p className="subtitle" style={{ marginBottom: '16px' }}>
            Connect to any machine using a temporary session code and password.
          </p>
          <button className="primary-btn" onClick={onConnectCode}>
            Enter session code
          </button>
        </div>
      </div>
    </div>
  )
}
