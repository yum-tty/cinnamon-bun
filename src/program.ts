// program.ts | bubbletea event loop

import type { Model, Msg, Cmd, ProgramConfig, KeyMsg, MouseMsg, WindowSizeMsg, View } from "./types"
import { Renderer } from "./renderer"
import { enableRawMode, disableRawMode, readKey, parseMouse } from "./input"
import type { ProgramOption } from "./options"

/**
 * Program is the main bubble tea runtime.
 */
export class Program {
  private model: Model
  private renderer: Renderer
  private altScreen: boolean
  private mouseMode: "none" | "cell" | "all"
  private fps: number
  private running: boolean = false
  private rendererEnabled: boolean = true
  private signalHandler: boolean = true
  private catchPanics: boolean = true
  private filter: ((msg: any) => any) | null = null
  private input: NodeJS.ReadStream = process.stdin
  private output: NodeJS.WriteStream = process.stdout
  private cmds: Cmd[] = []
  private lastFrame: string = ""
  private inputBuffer: string = ""
  private finishedPromise: Promise<void>
  private finishedResolve: () => void = () => {}

  constructor(config: ProgramConfig, ...options: ProgramOption[]) {
    this.model = config.model
    this.renderer = new Renderer(this.output)
    this.altScreen = config.altScreen ?? true
    this.mouseMode = config.mouseMode ?? "none"
    this.fps = config.fps ?? 60

    this.finishedPromise = new Promise<void>((resolve) => {
      this.finishedResolve = resolve
    })

    // Apply options
    for (const opt of options) {
      opt(this)
    }
  }

  // Option setters (called by ProgramOption functions)
  setAltScreen(v: boolean): void { this.altScreen = v }
  setMouseMode(mode: "none" | "cell" | "all"): void { this.mouseMode = mode }
  setFPS(fps: number): void { this.fps = fps }
  setRendererEnabled(v: boolean): void { this.rendererEnabled = v }
  setInput(input: NodeJS.ReadStream): void { this.input = input }
  setOutput(output: NodeJS.WriteStream): void { this.output = output }
  setSignalHandler(v: boolean): void { this.signalHandler = v }
  setCatchPanics(v: boolean): void { this.catchPanics = v }
  setFilter(filter: (msg: any) => any): void { this.filter = filter }

  /**
   * Run starts the program.
   */
  async run(): Promise<Model> {
    this.running = true

    // Init terminal
    if (this.rendererEnabled) {
      this.renderer.init(this.altScreen)
    }
    enableRawMode(this.input)

    // Handle signals
    if (this.signalHandler) {
      const cleanup = () => {
        this.stop()
        process.exit(0)
      }
      process.on("SIGINT", cleanup)
      process.on("SIGTERM", cleanup)
      process.on("exit", () => {
        disableRawMode(this.input)
        if (this.rendererEnabled) {
          this.renderer.restore()
        }
      })
    }

    // Handle resize
    this.output.on("resize", () => {
      const { width, height } = this.renderer.getSize()
      this.send({ type: "windowSize", width, height } as WindowSizeMsg)
    })

    // Send initial window size
    const { width, height } = this.renderer.getSize()
    this.send({ type: "windowSize", width, height } as WindowSizeMsg)

    // Run init
    const [initModel, initCmd] = this.model.init()
    this.model = initModel
    if (initCmd) {
      this.cmds.push(initCmd)
    }

    // Start input reader
    this.readInput()

    // Start render loop
    this.renderLoop()

    // Process commands
    await this.processCmds()

    this.finishedResolve()
    return this.model
  }

  /**
   * Wait waits for the program to finish.
   */
  async wait(): Promise<void> {
    return this.finishedPromise
  }

  /**
   * Quit sends a quit message to the program.
   */
  quit(): void {
    this.send({ type: "quit" })
  }

  /**
   * ReleaseTerminal restores the original terminal state.
   * You can return control with RestoreTerminal.
   */
  releaseTerminal(): void {
    this.running = false
    disableRawMode(this.input)
    if (this.rendererEnabled) {
      this.renderer.restore()
    }
  }

  /**
   * RestoreTerminal reinitializes the terminal and repaints.
   * Use after ReleaseTerminal.
   */
  restoreTerminal(): void {
    this.running = true
    if (this.rendererEnabled) {
      this.renderer.init(this.altScreen)
    }
    enableRawMode(this.input)
    // Flush queued commands
    const view = this.model.view()
    const content = typeof view === "string" ? view : view.content
    if (this.rendererEnabled) {
      this.renderer.render(content)
    }
  }

  /**
   * Println prints a line above the program.
   * This output is unmanaged and persists across renders.
   */
  println(...args: any[]): void {
    this.send({ type: "print", text: args.join(" ") } as any)
  }

  /**
   * Printf prints formatted text above the program.
   * This output is unmanaged and persists across renders.
   */
  printf(template: string, ...args: any[]): void {
    this.send({ type: "print", text: template.replace(/%s/g, () => String(args.shift())) } as any)
  }

  /**
   * Stop the program.
   */
  stop(): void {
    this.running = false
    disableRawMode(this.input)
    if (this.rendererEnabled) {
      this.renderer.restore()
    }
  }

  /**
   * Send a message to the model.
   */
  send(msg: Msg): void {
    if (!this.running || msg === null) return

    // Apply filter
    if (this.filter) {
      msg = this.filter(msg)
      if (msg === null) return
    }

    // Handle special messages
    if ((msg as any).type === "quit") {
      this.stop()
      process.exit(0)
      return
    }

    if ((msg as any).type === "batch") {
      const batch = msg as any
      this.cmds.push(...batch.cmds)
      return
    }

    if ((msg as any).type === "sequence") {
      const seq = msg as any
      this.cmds.push(...seq.cmds)
      return
    }

    if ((msg as any).type === "print") {
      // Print above the UI
      return
    }

    // Update model
    const [newModel, cmd] = this.model.update(msg)
    this.model = newModel

    if (cmd) {
      this.cmds.push(cmd)
    }
  }

  /**
   * Replace the model.
   */
  setModel(model: Model): void {
    this.model = model
  }

  private readInput(): void {
    this.input.on("data", (data: string) => {
      if (!this.running) return

      this.inputBuffer += data

      // Try mouse first
      const mouse = parseMouse(this.inputBuffer)
      if (mouse) {
        this.inputBuffer = ""
        this.send({ type: "mouse", ...mouse } as MouseMsg)
        return
      }

      // Check if we have a complete key sequence
      if (this.isCompleteSequence(this.inputBuffer)) {
        const key = readKey(this.inputBuffer)
        this.inputBuffer = ""
        this.send({ type: "key", ...key } as KeyMsg)
      }
    })
  }

  private isCompleteSequence(data: string): boolean {
    if (data.length === 1) return true

    if (data.startsWith("\x1b")) {
      if (data === "\x1b") return true
      if (data === "\x1b[A" || data === "\x1b[B" || data === "\x1b[C" || data === "\x1b[D") return true
      if (data === "\x1b[1;2A" || data === "\x1b[1;2B" || data === "\x1b[1;2C" || data === "\x1b[1;2D") return true
      if (data === "\x1b[1;5A" || data === "\x1b[1;5B" || data === "\x1b[1;5C" || data === "\x1b[1;5D") return true
      if (data === "\x1b[H" || data === "\x1b[F") return true
      if (data === "\x1b[5~" || data === "\x1b[6~") return true
      if (data === "\x1b[3~" || data === "\x1b[2~") return true
      if (data === "\x1b[Z") return true
      if (data.match(/\x1b\[<\d+;\d+;\d+[Mm]$/)) return true
      return false
    }

    return true
  }

  private renderLoop(): void {
    const interval = 1000 / this.fps

    const render = () => {
      if (!this.running) return

      if (this.rendererEnabled) {
        const view = this.model.view()
        const content = typeof view === "string" ? view : view.content
        if (content !== this.lastFrame) {
          this.renderer.render(content)
          this.lastFrame = content
        }
      }

      setTimeout(render, interval)
    }

    render()
  }

  private async processCmds(): Promise<void> {
    while (this.running) {
      if (this.cmds.length > 0) {
        const cmd = this.cmds.shift()!
        const msg = await cmd()
        this.send(msg)
      } else {
        await new Promise((r) => setTimeout(r, 10))
      }
    }
  }
}

/**
 * Create and run a new program.
 */
export function NewProgram(config: ProgramConfig, ...options: ProgramOption[]): Program {
  return new Program(config, ...options)
}
