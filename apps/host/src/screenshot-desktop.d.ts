// screenshot-desktop has no types — declare it inline
declare module 'screenshot-desktop' {
  interface ScreenshotOptions {
    format?: 'jpg' | 'png'
    screen?: number | string
  }
  function screenshot(options?: ScreenshotOptions): Promise<Buffer>
  export = screenshot
}
