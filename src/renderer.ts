// renderer.ts | cell-based terminal renderer

const ESC = "\x1b"
const CSI = `${ESC}[`

interface Cell {
  char: string
  style: string
}

export class Renderer {
  private output: NodeJS.WriteStream
  private prevCells: Cell[][] = []
  private currCells: Cell[][] = []
  private width: number = 80
  private height: number = 24
  private cursorVisible: boolean = false
  private altScreen: boolean = false

  constructor(output: NodeJS.WriteStream = process.stdout) {
    this.output = output
    this.width = output.columns || 80
    this.height = output.rows || 24
    this.initCells()
  }

  private initCells(): void {
    this.prevCells = []
    this.currCells = []
    for (let y = 0; y < this.height; y++) {
      this.prevCells.push([])
      this.currCells.push([])
      for (let x = 0; x < this.width; x++) {
        this.prevCells[y]!.push({ char: " ", style: "" })
        this.currCells[y]!.push({ char: " ", style: "" })
      }
    }
  }

  init(altScreen: boolean): void {
    this.altScreen = altScreen
    if (altScreen) {
      this.write(`${CSI}?1049h`)
    }
    this.write(`${CSI}?25l`)
    this.write(`${CSI}2J`)
    this.write(`${CSI}H`)
  }

  private parseView(view: string): void {
    const lines = view.split("\n")
    let x = 0
    let y = 0
    let currentStyle = ""

    for (const line of lines) {
      if (y >= this.height) break
      x = 0

      let i = 0
      while (i < line.length) {
        if (x >= this.width) break

        if (line[i] === "\x1b") {
          let seq = ""
          while (i < line.length && line[i] !== "m") {
            seq += line[i]
            i++
          }
          if (i < line.length) {
            seq += line[i]
            i++
          }
          currentStyle = seq
          continue
        }

        this.currCells[y]![x] = { char: line[i]!, style: currentStyle }
        x++
        i++
      }

      while (x < this.width) {
        this.currCells[y]![x] = { char: " ", style: "" }
        x++
      }
      y++
    }

    while (y < this.height) {
      for (let x = 0; x < this.width; x++) {
        this.currCells[y]![x] = { char: " ", style: "" }
      }
      y++
    }
  }

  private diffAndRender(): void {
    let lastStyle = ""
    let buffer = ""
    let changes = 0

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const prev = this.prevCells[y]![x]!
        const curr = this.currCells[y]![x]!

        if (prev.char !== curr.char || prev.style !== curr.style) {
          buffer += `${CSI}${y + 1};${x + 1}H`

          if (curr.style !== lastStyle) {
            buffer += curr.style
            lastStyle = curr.style
          }

          buffer += curr.char
          changes++
        }
      }
    }

    if (changes > 0) {
      buffer += `${CSI}0m`
      buffer += `${CSI}${this.height};1H`
      this.output.write(buffer)
    }

    const temp = this.prevCells
    this.prevCells = this.currCells
    this.currCells = temp
  }

  render(view: string): void {
    this.parseView(view)
    this.diffAndRender()
  }

  clear(): void {
    this.write(`${CSI}2J${CSI}H`)
    this.initCells()
  }

  showCursor(): void {
    if (!this.cursorVisible) {
      this.write(`${CSI}?25h`)
      this.cursorVisible = true
    }
  }

  hideCursor(): void {
    if (this.cursorVisible) {
      this.write(`${CSI}?25l`)
      this.cursorVisible = false
    }
  }

  moveTo(x: number, y: number): void {
    this.write(`${CSI}${y + 1};${x + 1}H`)
  }

  getSize(): { width: number; height: number } {
    return {
      width: this.output.columns || 80,
      height: this.output.rows || 24,
    }
  }

  restore(): void {
    this.showCursor()
    if (this.altScreen) {
      this.write(`${CSI}?1049l`)
    }
    this.write(`${CSI}0m`)
  }

  flush(): void {}

  private write(data: string): void {
    this.output.write(data)
  }
}
