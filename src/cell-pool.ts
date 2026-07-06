// cell-pool.ts | Cell object pool for reduced GC pressure

export interface Cell {
  char: string
  style: string
}

const EMPTY_CELL: Cell = { char: " ", style: "" }

export class CellPool {
  private pool: Cell[] = []
  private active: Set<Cell> = new Set()
  
  constructor(initialSize: number = 1024) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push({ char: " ", style: "" })
    }
  }
  
  acquire(char: string = " ", style: string = ""): Cell {
    let cell: Cell
    
    if (this.pool.length > 0) {
      cell = this.pool.pop()!
    } else {
      cell = { char: " ", style: "" }
    }
    
    cell.char = char
    cell.style = style
    this.active.add(cell)
    
    return cell
  }
  
  release(cell: Cell): void {
    if (this.active.has(cell)) {
      this.active.delete(cell)
      cell.char = " "
      cell.style = ""
      this.pool.push(cell)
    }
  }
  
  releaseAll(): void {
    for (const cell of this.active) {
      cell.char = " "
      cell.style = ""
      this.pool.push(cell)
    }
    this.active.clear()
  }
  
  get activeCount(): number {
    return this.active.size
  }
  
  get poolSize(): number {
    return this.pool.length
  }
}

// Static empty cell for read-only access
export { EMPTY_CELL }