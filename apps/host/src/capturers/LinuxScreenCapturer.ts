import { ScreenCapturer, Resolution } from '../interfaces/ScreenCapturer.js'
import sharp from 'sharp'
import { exec } from 'node:child_process'
import { readFile } from 'node:fs/promises'

export class LinuxScreenCapturer implements ScreenCapturer {
  private targetRes: Resolution = { width: 1280, height: 720 }

  async capture(): Promise<Buffer> {
    try {
      await new Promise<void>((resolve, reject) => {
        // Standard scrot command, unconditionally overwrites the temp file.
        exec('scrot /dev/shm/newhere_frame.jpg -F /dev/shm/newhere_frame.jpg -o -z', { 
          env: process.env, 
          timeout: 2000 
        }, (err: any) => {
          if (err) {
            // Try standard fallback scrot if newer flags like -F -o -z are rejected
            exec('scrot /dev/shm/newhere_frame.jpg', { env: process.env, timeout: 2000 }, (err2: any) => {
              if (err2) {
                // Ubuntu specific fallback
                exec('gnome-screenshot -f /dev/shm/newhere_frame.jpg', { env: process.env, timeout: 2000 }, (err3: any) => {
                  if (err3) reject(err3)
                  else resolve()
                })
              }
              else resolve()
            })
          }
          else resolve()
        })
      })

      const rawImg = await readFile('/dev/shm/newhere_frame.jpg')
      
      const compressed = await sharp(rawImg)
        .resize(this.targetRes.width, this.targetRes.height, { fit: 'inside' })
        .jpeg({ quality: 60, progressive: true })
        .toBuffer()

      return compressed
    } catch (err) {
      console.warn("[Capturer] Scrot failed:", err)
      // Return a blank frame instead of crashing the server so the stream stays alive
      return sharp({
        create: {
          width: this.targetRes.width,
          height: this.targetRes.height,
          channels: 3,
          background: { r: 0, g: 0, b: 0 }
        }
      }).jpeg().toBuffer()
    }
  }

  getResolution(): Resolution {
    return this.targetRes
  }
}
