import { createInterface } from 'node:readline'
import os from 'node:os'
import { HostAgent } from './agent.js'

const SERVER_URL = process.env.VITE_SERVER_URL 
  ? process.env.VITE_SERVER_URL.replace('ws://', 'http://').replace('wss://', 'https://') 
  : 'http://localhost:8080'

async function main() {
  const envPassword = process.env.NEWHERE_PASSWORD
  let password = ''
  let token: string | undefined
  let deviceId: string | undefined

  if (!envPassword) {
    const isLogin = await promptQuestion('Log in to save this device? (y/n): ')
    if (isLogin.toLowerCase().startsWith('y')) {
      const email = await promptQuestion('Email: ')
      const pass = await promptQuestion('Password: ')
      
      try {
        const res = await fetch(`${SERVER_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass })
        })
        const data: any = await res.json()
        if (!res.ok) throw new Error(data.error)
        
        token = data.token

        // Register device
        const devRes = await fetch(`${SERVER_URL}/devices`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: os.hostname(), os: os.platform() })
        })
        const devData: any = await devRes.json()
        if (!devRes.ok) throw new Error(devData.error)
        
        deviceId = devData.id
        console.log(`[Host] Authenticated! Device saved as "${devData.name}".`)
      } catch (err: any) {
        console.error(`[Host] Login failed: ${err.message}`)
        process.exit(1)
      }
    } else {
      password = await promptQuestion('Set a session password (for guest access): ')
      if (password.length < 4) {
        console.error('Password must be at least 4 characters.')
        process.exit(1)
      }
    }
  } else {
    password = envPassword
  }

  const agent = new HostAgent(password, token, deviceId)
  await agent.start()

  // Graceful shutdown on Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n[Host] Shutting down...')
    agent.stop()
    process.exit(0)
  })
}

function promptQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(query, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

main().catch((err) => {
  console.error('[Host] Fatal error:', err)
  process.exit(1)
})
