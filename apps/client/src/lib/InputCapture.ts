import { InputEvent } from '@newhere/shared'

export class InputCapture {
  private element: HTMLElement
  private mouseMoveCb?: (e: InputEvent) => void
  private clickCb?: (e: InputEvent) => void
  private keyCb?: (e: InputEvent) => void

  constructor(element: HTMLElement) {
    this.element = element
    this.bindEvents()
  }

  private bindEvents() {
    this.element.addEventListener('mousemove', this.onMouseMove)
    this.element.addEventListener('mousedown', this.onMouseDown)
    // Bind pointer up globally to catch clicks released outside the canvas bound
    window.addEventListener('pointerup', this.onMouseUp)
    this.element.addEventListener('contextmenu', this.onContextMenu)
    this.element.addEventListener('keydown', this.onKeyDown)
    this.element.addEventListener('keyup', this.onKeyUp)
    
    // Completely disable native HTML5 drag-and-drop to stop event swallowing
    this.element.addEventListener('dragstart', (e) => e.preventDefault())
    
    // Ensure element can receive keyboard events
    if (this.element.tabIndex === -1) {
       this.element.tabIndex = 0
    }
  }

  public captureMouseMove(cb: (e: InputEvent) => void) {
    this.mouseMoveCb = cb
  }

  public captureClick(cb: (e: InputEvent) => void) {
    this.clickCb = cb
  }

  public captureKeyboard(cb: (e: InputEvent) => void) {
    this.keyCb = cb
  }

  public stop() {
    this.element.removeEventListener('mousemove', this.onMouseMove)
    this.element.removeEventListener('mousedown', this.onMouseDown)
    window.removeEventListener('pointerup', this.onMouseUp)
    this.element.removeEventListener('contextmenu', this.onContextMenu)
    this.element.removeEventListener('keydown', this.onKeyDown)
    this.element.removeEventListener('keyup', this.onKeyUp)
  }

  // Event handlers
  private lastMouseMove = 0

  private onMouseMove = (e: MouseEvent) => {
    if (!this.mouseMoveCb) return
    
    // Throttle to ~60Hz to prevent WebRTC DataChannel flooding
    const now = Date.now()
    if (now - this.lastMouseMove < 16) return
    this.lastMouseMove = now

    const rect = this.element.getBoundingClientRect()
    // Assume element is a canvas
    const canvas = this.element as HTMLCanvasElement
    const scaleX = canvas.width ? canvas.width / rect.width : 1
    const scaleY = canvas.height ? canvas.height / rect.height : 1
    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top) * scaleY)
    this.mouseMoveCb({ type: 'mousemove', x, y })
  }

  private onMouseDown = (e: MouseEvent) => {
    if (!this.clickCb) return
    const rect = this.element.getBoundingClientRect()
    const canvas = this.element as HTMLCanvasElement
    const scaleX = canvas.width ? canvas.width / rect.width : 1
    const scaleY = canvas.height ? canvas.height / rect.height : 1
    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top) * scaleY)
    const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left'
    this.clickCb({ type: 'mousedown', x, y, button })
  }

  private onMouseUp = (e: MouseEvent) => {
    if (!this.clickCb) return
    const rect = this.element.getBoundingClientRect()
    const canvas = this.element as HTMLCanvasElement
    const scaleX = canvas.width ? canvas.width / rect.width : 1
    const scaleY = canvas.height ? canvas.height / rect.height : 1
    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top) * scaleY)
    const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left'
    this.clickCb({ type: 'mouseup', x, y, button })
  }

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault()
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.keyCb) return
    e.preventDefault()
    this.keyCb({ type: 'keypress', key: e.key })
  }

  private onKeyUp = (e: KeyboardEvent) => {
    if (!this.keyCb) return
    e.preventDefault()
    this.keyCb({ type: 'keyrelease', key: e.key })
  }
}
