import { ScreenCapturer, Resolution } from '../interfaces/ScreenCapturer.js'
import screenshot from 'screenshot-desktop'
import sharp from 'sharp'

export class LinuxScreenCapturer implements ScreenCapturer {
  private targetRes: Resolution = { width: 1280, height: 720 }

  async capture(): Promise<Buffer> {
    try {
      // Modern Ubuntu blocks ImageMagick by default. Force native `scrot`.
      await new Promise<void>((resolve, reject) => {
        const { exec } = require('node:child_process')
        exec('scrot -z -F /tmp/newhere_frame.jpg', (err: any) => {
          if (err) reject(err)
          else resolve()
        })
      })

      const rawImg = await import('node:fs/promises').then(fs => fs.readFile('/tmp/newhere_frame.jpg'))
      
      const compressed = await sharp(rawImg)
        .resize(this.targetRes.width, this.targetRes.height, { fit: 'inside' })
        .jpeg({ quality: 60, progressive: true })
        .toBuffer()

      return compressed
    } catch (err) {
      // Fallback if scrot is completely missing
      console.warn("scrot capture failed, falling back to screenshot-desktop...", err)
      const rawImg = await screenshot({ format: 'jpg' })
      return sharp(rawImg)
        .resize(this.targetRes.width, this.targetRes.height, { fit: 'inside' })
        .jpeg({ quality: 60, progressive: true })
        .toBuffer()
    }
  }

  getResolution(): Resolution {
    return this.targetRes
  }
}
