import { ScreenCapturer, Resolution } from '../interfaces/ScreenCapturer.js'
import screenshot from 'screenshot-desktop'
import sharp from 'sharp'

export class LinuxScreenCapturer implements ScreenCapturer {
  private targetRes: Resolution = { width: 1280, height: 720 }

  async capture(): Promise<Buffer> {
    const rawImg = await screenshot({ format: 'jpg' })
    const compressed = await sharp(rawImg)
      .resize(this.targetRes.width, this.targetRes.height, { fit: 'inside' })
      .jpeg({ quality: 60, progressive: true })
      .toBuffer()

    return compressed
  }

  getResolution(): Resolution {
    return this.targetRes
  }
}
