// renderer.ts

import { ColorProfile, downsampleAnsiSequence } from "./color-profile"
import { charDisplayWidth } from "caramel"
import { CellPool, EMPTY_CELL, Cell } from "./cell-pool"
import { StringBuilder } from "./string-builder"

const ESC = "\x1b"
const CSI = `${ESC}[`

export class Renderer {
  private output: NodeJS.WriteStream
  private prevCells: Cell[][] = []
  private currCells: Cell[][] = []
  private width: number = 80
  private height: number = 24
  private cursorVisible: boolean = false
  private altScreen: boolean = false
  private pendingBufferBuilder: StringBuilder
  private syncOutput: boolean = false
  private lastViewContent: string = ""
  private colorProfile: ColorProfile = ColorProfile.TrueColor
  private cursorX: number = 0
  private cursorY: number = 0
  private currentStyle: string = ""
  private forceFullRedraw: boolean = true
  private cellPool: CellPool

  constructor(output: NodeJS.WriteStream = process.stdout) {
    this.output = output
    this.width = output.columns ?? 80
    this.height = output.rows ?? 24
    this.cellPool = new CellPool(this.width * this.height)
    this.pendingBufferBuilder = new StringBuilder()
    this.initCells()
  }

  private initCells(): void {
    this.cellPool.releaseAll()
    
    this.prevCells = []
    this.currCells = []
    for (let y = 0; y < this.height; y++) {
      const prevRow: Cell[] = []
      const currRow: Cell[] = []
      for (let x = 0; x < this.width; x++) {
        prevRow.push(this.cellPool.acquire())
        currRow.push(this.cellPool.acquire())
      }
      this.prevCells.push(prevRow)
      this.currCells.push(currRow)
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
    this.cursorX = 0
    this.cursorY = 0
    this.currentStyle = ""
    this.forceFullRedraw = true
    this.cellPool.releaseAll()
    this.prevCells = []
    for (let y = 0; y < this.height; y++) {
      const row: Cell[] = []
      for (let x = 0; x < this.width; x++) {
        row.push(this.cellPool.acquire())
      }
      this.prevCells.push(row)
    }
  }

  setColorProfile(profile: ColorProfile): void {
    this.colorProfile = profile
  }

  setSyncOutput(v: boolean): void {
    this.syncOutput = v
  }

  private downsampleStyle(style: string): string {
    if (this.colorProfile >= ColorProfile.TrueColor) return style
    return downsampleAnsiSequence(this.colorProfile, style)
  }

  private moveToSeq(x: number, y: number): string {
    if (x === this.cursorX && y === this.cursorY) return ""
    const seq = `${CSI}${y + 1};${x + 1}H`
    this.cursorX = x
    this.cursorY = y
    return seq
  }

  private moveCursorRel(dx: number, dy: number): string {
    if (dx === 0 && dy === 0) return ""
    const nx = this.cursorX + dx
    const ny = this.cursorY + dy
    if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) {
      return this.moveToSeq(Math.max(0, Math.min(nx, this.width - 1)), Math.max(0, Math.min(ny, this.height - 1)))
    }
    return this.moveToSeq(nx, ny)
  }

  private static isHighSurrogate(code: number): boolean {
    return code >= 0xD800 && code <= 0xDBFF
  }

  private static charWidth(char: string): number {
    return charDisplayWidth(char)
  }

  private parseView(view: string): void {
    const lines = view.split("\n")
    let x = 0
    let y = 0
    let currentStyle = ""

    for (const line of lines) {
      if (y >= this.height) break
      x = 0
      currentStyle = ""

      let i = 0
      while (i < line.length) {
        if (x >= this.width) break

        if (line[i] === "\x1b") {
          if (i + 1 < line.length && line[i + 1] === "]") {
            let seq = "\x1b]"
            i += 2
            while (i < line.length) {
              if (line[i] === "\x07") {
                seq += line[i]
                i++
                break
              }
              if (line[i] === "\x1b" && i + 1 < line.length && line[i + 1] === "\\") {
                seq += "\x1b\\"
                i += 2
                break
              }
              seq += line[i]
              i++
            }
            continue
          }
          let seq = ""
          while (i < line.length && line[i] !== "m") {
            seq += line[i]
            i++
          }
          if (i < line.length && line[i] === "m") {
            seq += line[i]
            i++
            currentStyle = seq
          } else {
            seq = ""
          }
          continue
        }

        const code = line.charCodeAt(i)
        let char: string
        let w: number

        if (Renderer.isHighSurrogate(code) && i + 1 < line.length) {
          char = line[i]! + line[i + 1]!
          w = Renderer.charWidth(char)
          i += 2
        } else if (Renderer.isHighSurrogate(code)) {
          i++
          continue
        } else {
          char = line[i]!
          w = Renderer.charWidth(char)
          i++
        }

        this.currCells[y]![x] = this.cellPool.acquire(char, currentStyle)
        x++
        if (w === 2 && x < this.width) {
          this.currCells[y]![x] = this.cellPool.acquire(" ", currentStyle)
          x++
        }
      }

      currentStyle = ""
      while (x < this.width) {
        this.currCells[y]![x] = this.cellPool.acquire(" ", "")
        x++
      }
      y++
    }

    while (y < this.height) {
      for (let x = 0; x < this.width; x++) {
        this.currCells[y]![x] = this.cellPool.acquire()
      }
      y++
    }
  }

  private diffAndRender(): string {
    let lastStyle = ""
    const builder = new StringBuilder()
    let changes = 0
    let cursorX = -1
    let cursorY = -1
    let skipX = -1
    let skipY = -1

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (x === skipX && y === skipY) {
          skipX = -1
          skipY = -1
          continue
        }

        const prev = this.prevCells[y]![x]!
        const curr = this.currCells[y]![x]!

        if (prev.char === curr.char && prev.style === curr.style) continue

        const needMove = changes === 0 || x !== cursorX || y !== cursorY
        if (needMove) {
          builder.append(this.moveToSeq(x, y))
        }

        const downsampledStyle = this.downsampleStyle(curr.style)
        if (downsampledStyle !== lastStyle) {
          if (lastStyle !== "" && downsampledStyle === "") {
            builder.append(`${CSI}0m`)
          } else {
            builder.append(downsampledStyle)
          }
          lastStyle = downsampledStyle
        }

        builder.append(curr.char)
        changes++
        const cw = Renderer.charWidth(curr.char)
        cursorX = x + cw
        cursorY = y
        if (cw >= 2 && x + 1 < this.width) {
          skipX = x + 1
          skipY = y
        }
        if (cursorX >= this.width) {
          cursorX = 0
          cursorY = y + 1
        }
      }
    }

    if (changes > 0) {
      if (lastStyle !== "") {
        builder.append(`${CSI}0m`)
      }
      if (this.altScreen) {
        builder.append(this.moveToSeq(0, 0))
      }
    }

    const temp = this.prevCells
    this.prevCells = this.currCells
    this.currCells = temp
    this.forceFullRedraw = false

    return builder.toString()
  }

  render(view: string): void {
    this.lastViewContent = view
    this.parseView(view)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.prevCells[y]![x] = this.cellPool.acquire("\x00", "")
      }
    }
    const diff = this.diffAndRender()
    if (diff) {
      this.pendingBufferBuilder.append(diff)
    }
  }

  flush(lastFrame: boolean): void {
    if (this.pendingBufferBuilder.length === 0) return
    if (this.syncOutput) {
      this.output.write(`${CSI}?2026h`)
    }
    this.output.write(this.pendingBufferBuilder.toString())
    if (this.syncOutput) {
      this.output.write(`${CSI}?2026l`)
    }
    this.pendingBufferBuilder.clear()
  }

  clear(): void {
    this.write(`${CSI}2J${CSI}H`)
    this.cursorX = 0
    this.cursorY = 0
    this.currentStyle = ""
    this.forceFullRedraw = true
    this.initCells()
    this.lastViewContent = ""
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
    const seq = this.moveToSeq(x, y)
    if (seq) this.write(seq)
  }

  resize(w: number, h: number): void {
    this.width = Math.max(1, w)
    this.height = Math.max(1, h)
    this.forceFullRedraw = true
    this.initCells()
  }

  getSize(): { width: number; height: number } {
    return {
      width: this.output.columns ?? 80,
      height: this.output.rows ?? 24,
    }
  }

  getInternalSize(): { width: number; height: number } {
    return {
      width: this.width,
      height: this.height,
    }
  }

  restore(): void {
    this.showCursor()
    if (this.altScreen) {
      this.write(`${CSI}?1049l`)
    }
    this.write(`${CSI}0m`)
    this.cursorX = 0
    this.cursorY = 0
    this.currentStyle = ""
  }

  private write(data: string): void {
    this.output.write(data)
  }
}
