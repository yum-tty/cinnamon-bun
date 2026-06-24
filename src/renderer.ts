// renderer.ts | terminal renderer

const ESC = "\x1b"
const CSI = `${ESC}[`

/**
 * Renderer handles drawing to the terminal.
 */
export class Renderer {
  private output: NodeJS.WriteStream
  private buffer: string = ""
  private cursorVisible: boolean = false
  private altScreen: boolean = false

  constructor(output: NodeJS.WriteStream = process.stdout) {
    this.output = output
  }

  /**
   * Initialize the renderer.
   */
  init(altScreen: boolean): void {
    this.altScreen = altScreen

    if (altScreen) {
      this.write(`${CSI}?1049h`) // Enter alternate screen
    }

    this.write(`${CSI}?25l`) // Hide cursor
    this.write(`${CSI}2J`) // Clear screen
    this.write(`${CSI}H`) // Move to top-left
  }

  /**
   * Render a frame.
   */
  render(view: string): void {
    this.buffer = ""
    this.buffer += `${CSI}H` // Move to top-left
    this.buffer += view
    this.flush()
  }

  /**
   * Flush the buffer to stdout.
   */
  flush(): void {
    if (this.buffer.length > 0) {
      this.output.write(this.buffer)
      this.buffer = ""
    }
  }

  /**
   * Clear the screen.
   */
  clear(): void {
    this.buffer += `${CSI}2J${CSI}H`
    this.flush()
  }

  /**
   * Show cursor.
   */
  showCursor(): void {
    if (!this.cursorVisible) {
      this.write(`${CSI}?25h`)
      this.cursorVisible = true
    }
  }

  /**
   * Hide cursor.
   */
  hideCursor(): void {
    if (this.cursorVisible) {
      this.write(`${CSI}?25l`)
      this.cursorVisible = false
    }
  }

  /**
   * Move cursor to position.
   */
  moveTo(x: number, y: number): void {
    this.write(`${CSI}${y + 1};${x + 1}H`)
  }

  /**
   * Get terminal size.
   */
  getSize(): { width: number; height: number } {
    return {
      width: this.output.columns || 80,
      height: this.output.rows || 24,
    }
  }

  /**
   * Restore terminal state.
   */
  restore(): void {
    this.showCursor()

    if (this.altScreen) {
      this.write(`${CSI}?1049l`) // Leave alternate screen
    }

    this.write(`${CSI}0m`) // Reset styles
    this.flush()
  }

  private write(data: string): void {
    this.buffer += data
  }
}
