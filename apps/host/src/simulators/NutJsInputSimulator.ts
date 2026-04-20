import { mouse, keyboard, Point, Button, Key, clipboard } from '@nut-tree-fork/nut-js'
import { InputEvent } from '@newhere/shared'
import { InputSimulator } from '../interfaces/InputSimulator.js'

// Disable slow motion for performance
mouse.config.mouseSpeed = 2000

export class NutJsInputSimulator implements InputSimulator {
  async simulate(event: InputEvent): Promise<string | undefined> {
    try {
      switch (event.type) {
        case 'mousemove':
          if (event.x !== undefined && event.y !== undefined) {
            await mouse.move([new Point(event.x, event.y)])
          }
          break

        case 'mouseclick':
          if (event.x !== undefined && event.y !== undefined) {
            await mouse.move([new Point(event.x, event.y)])
            const btn =
              event.button === 'right' ? Button.RIGHT :
              event.button === 'middle' ? Button.MIDDLE :
              Button.LEFT
            await mouse.click(btn)
          }
          break

        case 'keypress':
          if (event.key) {
            const k = this.mapKey(event.key)
            if (k !== undefined) await keyboard.pressKey(k)
          }
          break

        case 'keyrelease':
          if (event.key) {
            const k = this.mapKey(event.key)
            if (k !== undefined) await keyboard.releaseKey(k)
          }
          break

        case 'clipboard:write':
          if (event.text !== undefined) {
            await clipboard.copy(event.text)
          }
          break

        case 'clipboard:read':
          return await clipboard.paste()
      }
    } catch (err) {
      console.warn('[Input] Simulation failed:', err)
    }
    return undefined
  }

  private mapKey(key: string): Key | undefined {
    const map: Record<string, Key> = {
      Enter: Key.Return,
      Backspace: Key.Backspace,
      Tab: Key.Tab,
      Escape: Key.Escape,
      Space: Key.Space,
      ArrowLeft: Key.Left,
      ArrowRight: Key.Right,
      ArrowUp: Key.Up,
      ArrowDown: Key.Down,
      ...Object.fromEntries(
        'abcdefghijklmnopqrstuvwxyz'.split('').map((c) => [c, (Key as unknown as Record<string, Key>)[c.toUpperCase()]])
      ),
    }
    return map[key]
  }
}
