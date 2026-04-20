import React, { useState } from 'react'
import { api, setToken } from '../lib/api'

export function LoginPage({ onLogin, onGuest }: { onLogin: () => void; onGuest: () => void }) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let result
      if (isRegister) {
        result = await api.register({ email, password, displayName })
      } else {
        result = await api.login({ email, password })
      }
      setToken(result.token)
      onLogin()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>NEwhere</h1>
        <p className="subtitle" style={{ marginBottom: '28px' }}>
          {isRegister ? 'Create an account to save your devices' : 'Sign in to access your saved devices'}
        </p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} className="form-group">
          {isRegister && (
            <div>
              <label>Display name</label>
              <input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}
          <div>
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="primary-btn mt-2" disabled={loading}>
            {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="divider" />

        <div className="stack-vertical">
          <button className="secondary-btn" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
          <button className="secondary-btn" onClick={onGuest}>
            Continue without account
          </button>
        </div>
      </div>
    </div>
  )
}
