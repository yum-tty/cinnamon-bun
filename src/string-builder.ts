// string-builder.ts | Pre-allocated string builder for JSC optimization

export class StringBuilder {
  private chunks: string[] = []
  private totalLength: number = 0

  constructor(_initialCapacity: number = 4096) {
    // Note: initialCapacity is unused — JS arrays don't support pre-allocation hints
  }

  append(str: string): StringBuilder {
    this.chunks.push(str)
    this.totalLength += str.length
    return this
  }

  appendChar(char: string): StringBuilder {
    this.chunks.push(char)
    this.totalLength += char.length
    return this
  }

  appendLine(str: string = ""): StringBuilder {
    this.chunks.push(str)
    this.chunks.push("\n")
    this.totalLength += str.length + 1
    return this
  }

  clear(): void {
    this.chunks.length = 0
    this.totalLength = 0
  }

  toString(): string {
    return this.chunks.join("")
  }

  get length(): number {
    return this.totalLength
  }
}
