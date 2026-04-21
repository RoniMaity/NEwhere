import { ChildProcess, spawn } from 'node:child_process'
import { InputEvent } from '@newhere/shared'
import { InputSimulator } from '../interfaces/InputSimulator.js'

export class CliInputSimulator implements InputSimulator {
  private xdotoolProcess: ChildProcess | null = null;

  constructor() {
    this.startXdotool()
  }

  private startXdotool() {
    // We strictly use stdbuf -i0 to completely DISABLE the C-level 4KB block buffer! 
    // Without this, Linux physically refuses to execute the pipelined mouse commands until 4000 bytes stack up.
    this.xdotoolProcess = spawn('stdbuf', ['-i0', '-o0', '-e0', 'xdotool', '-'], { env: process.env })
    this.xdotoolProcess.stdin?.setDefaultEncoding('utf-8')

    this.xdotoolProcess.on('error', (err) => {
      console.warn('[CliSimulator] xdotool process error:', err)
    })

    this.xdotoolProcess.stderr?.on('data', (data) => {
      console.warn(`[CliSimulator] xdotool error: ${data}`)
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
    
    // Hardcore debugging to prove if the webRTC coordinates crossed!
    if (event.type !== 'mousemove' || (event.x && event.x % 10 === 0)) {
         console.log(`[Input] Executing: ${event.type} at ${event.x},${event.y}`)
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
            const x11Key = this.mapX11Key(event.key)
            this.sendCmd(`keydown ${x11Key}`)
          }
          break

        case 'keyrelease':
          if (event.key) {
            const x11Key = this.mapX11Key(event.key)
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

  private mapX11Key(key: string): string {
    const specials: Record<string, string> = {
      'Enter': 'Return',
      'Space': 'space',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right',
      'Backspace': 'BackSpace',
      'Escape': 'Escape',
      'Tab': 'Tab',
      'Shift': 'Shift_L',
      'Control': 'Control_L',
      'Alt': 'Alt_L',
      'Meta': 'Super_L'
    }
    return specials[key] || (key.length === 1 ? key.toLowerCase() : key)
  }
}
