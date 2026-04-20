import os from 'node:os'
import { ScreenCapturer } from '../interfaces/ScreenCapturer.js'
import { LinuxScreenCapturer } from '../capturers/LinuxScreenCapturer.js'
import { MacScreenCapturer } from '../capturers/MacScreenCapturer.js'
import { WindowsScreenCapturer } from '../capturers/WindowsScreenCapturer.js'

export class ScreenCapturerFactory {
  static create(): ScreenCapturer {
    const platform = os.platform()
    switch (platform) {
      case 'darwin':
        return new MacScreenCapturer()
      case 'win32':
        return new WindowsScreenCapturer()
      case 'linux':
        return new LinuxScreenCapturer()
      default:
        // Fallback
        return new LinuxScreenCapturer()
    }
  }
}
