import { exec } from 'node:child_process'
import { InputEvent } from '@newhere/shared'
import { InputSimulator } from '../interfaces/InputSimulator.js'

export class CliInputSimulator implements InputSimulator {
  
  // ydotool mouse buttons: left=0xC0/0xC1 (wait, button click is typically 00, 01, 02 or BTN_LEFT)
  // Actually ydotool click 0xC0 means "left button down/up" is 0xC0 (down) and 0xC1 (up). Wait, ydotool click 1 is left, 2 is middle, 3 is right
  // Let's rely on xdotool for standard mapping if ydotool mapping is extremely complex.
  // Wait, the plan was to use xdotool natively, and optionally ydotool. Let's do modern ydotool and xdotool wrapping.
  
  private execCli(command: string): Promise<void> {
    return new Promise((resolve) => {
      exec(command, { env: process.env, timeout: 500 }, (err) => {
        if (err) console.warn(`[CliSimulator] Command failed: ${command} - ${err.message}`)
        resolve()
      })
    })
  }

  async simulate(event: InputEvent): Promise<string | undefined> {
    console.log(`[Input] Received: ${event.type} at x:${event.x} y:${event.y}`)
    try {
      switch (event.type) {
        case 'mousemove':
          if (event.x !== undefined && event.y !== undefined) {
             // Try ydotool first (absolute movement), fallback to xdotool
             const yCmd = `ydotool mousemove -x ${event.x} -y ${event.y} || ydotool mousemove -a ${event.x} ${event.y}`
             const xCmd = `xdotool mousemove ${event.x} ${event.y}`
             await this.execCli(`${yCmd} || ${xCmd}`)
          }
          break

        case 'mousedown':
          if (event.x !== undefined && event.y !== undefined) {
            const btn = event.button === 'right' ? 3 : event.button === 'middle' ? 2 : 1
            const yCmd = `ydotool click 0x40` // usually ydotool click down takes special hex, but let's just use xdotool for standard click holds
            const xCmd = `xdotool mousedown ${btn}`
            // Because ydotool click/down states vary wildly by version, xdotool mousedown is preferred if X11 fallback active.
            // Also some versions of ydotool don't support mousedown reliably.
            await this.execCli(`${xCmd} || ydotool click 1`)
          }
          break

        case 'mouseup':
          if (event.x !== undefined && event.y !== undefined) {
            const btn = event.button === 'right' ? 3 : event.button === 'middle' ? 2 : 1
            const xCmd = `xdotool mouseup ${btn}`
            // Only try xdotool for individual up/down states, since ydotool handles full clicks automatically
            await this.execCli(`${xCmd}`)
          }
          break

        case 'keypress':
          if (event.key) {
            // Very rudimentary key mapping for CLI
            const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
            // xdotool uses standard X11 KeySyms (Return, Tab, Escape)
            const x11Key = event.key === 'Enter' ? 'Return' : event.key === 'Space' ? 'space' : key
            await this.execCli(`xdotool keydown ${x11Key} || ydotool key ${key}:1`)
          }
          break

        case 'keyrelease':
          if (event.key) {
            const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
            const x11Key = event.key === 'Enter' ? 'Return' : event.key === 'Space' ? 'space' : key
            await this.execCli(`xdotool keyup ${x11Key} || ydotool key ${key}:0`)
          }
          break

        case 'clipboard:write':
          if (event.text !== undefined) {
            // Write to system clipboard using xclip or xsel
            await this.execCli(`echo '${event.text.replace(/'/g, "'\\''")}' | xclip -sel clip || echo '${event.text.replace(/'/g, "'\\''")}' | xsel -ib`)
          }
          break

        case 'clipboard:read':
          return new Promise((resolve) => {
             exec('xclip -o -sel clip || xsel -ob', { env: process.env, timeout: 500 }, (err, stdout) => {
               resolve(stdout || undefined)
             })
          })
      }
    } catch (err) {
      console.warn('[Input] CLI Simulation failed:', err)
    }
    return undefined
  }
}
