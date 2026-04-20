import { useState } from 'react'
import { ConnectPage } from './pages/ConnectPage'
import { SessionPage } from './pages/SessionPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { getToken } from './lib/api'

type View = 
  | { name: 'login' } 
  | { name: 'dashboard' } 
  | { name: 'connect' } 
  | { name: 'session'; sessionCode?: string; deviceId?: string }

export default function App() {
  const [view, setView] = useState<View>(() => {
    return getToken() ? { name: 'dashboard' } : { name: 'login' }
  })

  if (view.name === 'session') {
    return (
      <SessionPage
        sessionCode={view.sessionCode}
        deviceId={view.deviceId}
        onDisconnect={() => setView(getToken() ? { name: 'dashboard' } : { name: 'connect' })}
      />
    )
  }

  if (view.name === 'dashboard') {
    return (
      <DashboardPage
        onConnectCode={() => setView({ name: 'connect' })}
        onConnectDevice={(deviceId, sessionCode) => setView({ name: 'session', deviceId, sessionCode })}
        onLogout={() => setView({ name: 'login' })}
      />
    )
  }

  if (view.name === 'login') {
    return (
      <LoginPage 
        onLogin={() => setView({ name: 'dashboard' })} 
        onGuest={() => setView({ name: 'connect' })} 
      />
    )
  }

  return (
    <ConnectPage
      onConnected={(code) => setView({ name: 'session', sessionCode: code })}
      onBackToLogin={() => setView(getToken() ? { name: 'dashboard' } : { name: 'login' })}
    />
  )
}
