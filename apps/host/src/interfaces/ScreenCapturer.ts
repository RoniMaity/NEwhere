export interface Resolution {
  width: number
  height: number
}

export interface ScreenCapturer {
  capture(): Promise<Buffer>
  getResolution(): Resolution
}
