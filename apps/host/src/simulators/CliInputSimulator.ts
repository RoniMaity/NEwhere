import { ChildProcess, spawn } from 'node:child_process'
import { InputEvent } from '@newhere/shared'
import { InputSimulator } from '../interfaces/InputSimulator.js'

export class CliInputSimulator implements InputSimulator {
  private xdotoolProcess: ChildProcess | null = null;

  constructor() {
    this.startXdotool()
  }

  private startXdotool() {
    this.xdotoolProcess = spawn('xdotool', ['-'], { env: process.env })
    this.xdotoolProcess.stdin?.setDefaultEncoding('utf-8')

    this.xdotoolProcess.on('error', (err) => {
      console.warn('[CliSimulator] xdotool process error:', err)
    })

    this.xdotoolProcess.on('exit', () => {
      console.warn('[CliSimulator] xdotool stopped. Restarting in 1s...')
      setTimeout(() => this.startXdotool(), 1000)
    })
  }

  private sendCmd(command: string) {
    if (this.xdotoolProcess && this.xdotoolProcess.stdin && this.xdotoolProcess.stdin.writable) {
       this.xdotoolProcess.stdin.write(command + '\n')
    }
  }

  async simulate(event: InputEvent): Promise<string | undefined> {
    if (event.type !== 'mousemove') {
      console.log(`[Input] Received: ${event.type}`)
    }
    
    try {
      switch (event.type) {
        case 'mousemove':
          if (event.x !== undefined && event.y !== undefined) {
             this.sendCmd(`mousemove ${event.x} ${event.y}`)
          }
          break

        case 'mousedown':
          if (event.x !== undefined && event.y !== undefined) {
            const btn = event.button === 'right' ? 3 : event.button === 'middle' ? 2 : 1
            this.sendCmd(`mousedown ${btn}`)
          }
          break

        case 'mouseup':
          if (event.x !== undefined && event.y !== undefined) {
            const btn = event.button === 'right' ? 3 : event.button === 'middle' ? 2 : 1
            this.sendCmd(`mouseup ${btn}`)
          }
          break

        case 'keypress':
          if (event.key) {
            const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
            const x11Key = event.key === 'Enter' ? 'Return' : event.key === 'Space' ? 'space' : key
            this.sendCmd(`keydown ${x11Key}`)
          }
          break

        case 'keyrelease':
          if (event.key) {
            const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
            const x11Key = event.key === 'Enter' ? 'Return' : event.key === 'Space' ? 'space' : key
            this.sendCmd(`keyup ${x11Key}`)
          }
          break

        case 'clipboard:write':
          return undefined // Omitted for performance

        case 'clipboard:read':
          return undefined // Omitted for performance
      }
    } catch (err) {
      console.warn('[Input] CLI Simulation failed:', err)
    }
    return undefined
  }
}
