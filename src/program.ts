export enum MouseMode {
  None = "none",
  Cell = "cell",
  All = "all",
}

import type { Model, Msg, Cmd, ProgramConfig, KeyMsg, MouseMsgAll, WindowSizeMsg, View, SystemMsg } from "./types"
import { EnvMsg, isSystemMsg } from "./types"
import { Renderer } from "./renderer"
import { detectColorProfile, ColorProfile } from "./color-profile"
import { enableRawMode, disableRawMode, readKey, parseMouse } from "./input"

const RE_MOUSE = /^\x1b\[<\d+;\d+;\d+[Mm]$/
const RE_MOD_ARROW = /^\x1b\[1;(\d+)[ABCD]$/
const RE_MOD_KEY = /^\x1b\[1;(\d+)[HPQRS]$/
const RE_MOD_TILDE = /^\x1b\[1;(\d+)~$/
const RE_TILDE = /^\x1b\[[0-9]+~$/
const RE_HOME = /^\x1b\[H$/
const RE_END = /^\x1b\[F$/
const RE_REPORT_POS = /^\x1b\[6n$/
const RE_FKEY_MOD = /^\x1b\[1;(\d+)[PRST]$/
const RE_FKEY = /^\x1b[OP-QS]$/

export class Program {
  private model: Model
  private renderer: Renderer
  private altScreen: boolean
  private mouseMode: MouseMode
  private fps: number
  private running: boolean = false
  private rendererEnabled: boolean = true
  private signalHandler: boolean = true
  private catchPanics: boolean = true
  private filter: ((msg: any) => any) | null = null
  private input: NodeJS.ReadStream = process.stdin
  private output: NodeJS.WriteStream = process.stdout
  private cmds: Cmd[] = []
  private cmdSignal: (() => void) | null = null
  private lastFrame: string = ""
  private inputBuffer: string = ""
  private finishedPromise: Promise<void>
  private finishedResolve: () => void = () => {}
  private env: Record<string, string> = process.env as Record<string, string>
  private colorProfile: number = detectColorProfile()
  private ctx: AbortController | null = null
  private ticker: ReturnType<typeof setInterval> | null = null
  private syncOutput: boolean = false
  private onResize: (() => void) | null = null
  private onInputData: ((data: string) => void) | null = null
  private onSigInt: (() => void) | null = null
  private onSigTerm: (() => void) | null = null
  private onExit: (() => void) | null = null
  private shutdownOnceFlag: boolean = false

  constructor(config: ProgramConfig) {
    this.model = config.model
    if (config.input) this.input = config.input
    if (config.output) this.output = config.output
    this.renderer = new Renderer(this.output)
    if (config.colorProfile !== undefined) {
      this.colorProfile = config.colorProfile
      this.renderer.setColorProfile(config.colorProfile as ColorProfile)
    } else {
      this.renderer.setColorProfile(this.colorProfile as ColorProfile)
    }
    this.altScreen = config.altScreen ?? true
    this.mouseMode = config.mouseMode ?? MouseMode.None
    this.fps = config.fps ?? 60
    if (config.signalHandler !== undefined) this.signalHandler = config.signalHandler
    if (config.catchPanics !== undefined) this.catchPanics = config.catchPanics
    if (config.filter) this.filter = config.filter
    if (config.context) this.setContext(config.context)
    if (config.env) this.env = config.env
    if (config.windowSize) this.renderer.resize(config.windowSize.width, config.windowSize.height)
    if (config.renderer !== undefined) this.rendererEnabled = config.renderer

    this.finishedPromise = new Promise<void>((resolve) => {
      this.finishedResolve = resolve
    })
  }

  setAltScreen(v: boolean): void { this.altScreen = v }
  setMouseMode(mode: MouseMode): void { this.mouseMode = mode }
  setFPS(fps: number): void { this.fps = fps }
  setRendererEnabled(v: boolean): void { this.rendererEnabled = v }
  setInput(input: NodeJS.ReadStream): void { this.input = input }
  setOutput(output: NodeJS.WriteStream): void { this.output = output }
  setSignalHandler(v: boolean): void { this.signalHandler = v }
  setCatchPanics(v: boolean): void { this.catchPanics = v }
  setFilter(filter: (msg: any) => any): void { this.filter = filter }
  setContext(ctx: AbortSignal): void {
    this.ctx = new AbortController()
    ctx.addEventListener("abort", () => {
      this.send({ type: "quit" })
    })
  }
  setEnvironment(env: Record<string, string>): void { this.env = env }
  setColorProfile(profile: number): void {
    this.colorProfile = profile
    this.renderer.setColorProfile(profile as ColorProfile)
  }
  setWindowSize(width: number, height: number): void {
    this.renderer.resize(width, height)
  }

  /**
   * Starts the program event loop, initializes the renderer, enables raw mode,
   * and blocks until the program exits.
   * @returns The final model state when the program exits.
   */
  async run(): Promise<Model> {
    this.running = true

    if (this.rendererEnabled) {
      this.renderer.init(this.altScreen)
    }
    enableRawMode(this.input)

    if (this.mouseMode === MouseMode.Cell) {
      this.output.write("\x1b[?1000h\x1b[?1002h\x1b[?1006h")
    } else if (this.mouseMode === MouseMode.All) {
      this.output.write("\x1b[?1000h\x1b[?1002h\x1b[?1003h\x1b[?1006h")
    }

    if (this.signalHandler) {
      this.onSigInt = () => {
        this.send({ type: "interrupt" })
      }
      this.onSigTerm = () => {
        process.exit(0)
      }
      this.onExit = () => {
        disableRawMode(this.input)
        if (this.rendererEnabled) {
          this.renderer.restore()
        }
      }
      process.on("SIGINT", this.onSigInt)
      process.on("SIGTERM", this.onSigTerm)
      process.on("exit", this.onExit)
    }

    this.onResize = () => {
      const { width: outW, height: outH } = this.renderer.getSize()
      const { width: rW, height: rH } = this.renderer.getInternalSize()
      const width = outW || rW
      const height = outH || rH
      this.renderer.resize(width, height)
      this.send({ type: "windowSize", width, height } as WindowSizeMsg)
    }
    this.output.on("resize", this.onResize)

    const { width, height } = this.renderer.getSize()
    this.send({ type: "windowSize", width, height } as WindowSizeMsg)

    this.send({ type: "colorProfile", profile: this.colorProfile } as any)
    this.send(new EnvMsg(this.env) as any)

    if (this.rendererEnabled) {
      this.output.write("\x1b[?2026$p")
    }

    let initModel: Model
    let initCmd: Cmd | null
    try {
      ;[initModel, initCmd] = this.model.init()
    } catch (err) {
      this.recoverFromPanic(err)
      return this.model
    }
    this.model = initModel
    if (initCmd) {
      this.cmds.push(initCmd)
      this.signalCmds()
    }

    if (this.rendererEnabled) {
      try {
        const view = this.model.view()
        const content = typeof view === "string" ? view : view.content
        this.renderer.render(content)
      } catch (err) {
        this.recoverFromPanic(err)
        return this.model
      }
    }

    this.readInput()
    this.startRenderer()

    this.processCmds().catch(() => {})

    await this.finishedPromise
    return this.model
  }

  async wait(): Promise<void> {
    return this.finishedPromise
  }

  /**
   * Sends a message to the program's update loop (public alias for {@link send}).
   * @param msg - The message to send.
   */
  Send(msg: Msg): void {
    this.send(msg)
  }

  /**
   * Gracefully quits the program by sending a quit message.
   */
  quit(): void {
    this.send({ type: "quit" })
  }

  /**
   * Immediately kills the program without waiting for a graceful shutdown.
   */
  kill(): void {
    this.stop()
  }

  /**
   * Releases the terminal by disabling raw mode and restoring the screen.
   * Useful for suspending the program to run shell commands.
   */
  releaseTerminal(): void {
    this.running = false
    disableRawMode(this.input)
    if (this.rendererEnabled) {
      this.renderer.restore()
    }
  }

  /**
   * Restores the terminal after it was released, re-enabling raw mode
   * and re-rendering the current view.
   */
  restoreTerminal(): void {
    this.running = true
    if (this.rendererEnabled) {
      this.renderer.init(this.altScreen)
    }
    enableRawMode(this.input)
    try {
      const view = this.model.view()
      const content = typeof view === "string" ? view : view.content
      if (this.rendererEnabled) {
        this.renderer.render(content)
      }
    } catch (err) {
      this.recoverFromPanic(err)
    }
  }

  /**
   * Prints arguments to stdout separated by spaces, followed by a newline.
   * @param args - Values to print, joined with spaces.
   */
  println(...args: any[]): void {
    this.send({ type: "print", text: args.join(" ") } as any)
  }

  /**
   * Prints a formatted string to stdout using `%s` as a placeholder.
   * @param template - The format string containing `%s` placeholders.
   * @param args - Values substituted into the placeholders in order.
   */
  printf(template: string, ...args: any[]): void {
    this.send({ type: "print", text: template.replace(/%s/g, () => String(args.shift())) } as any)
  }

  /**
   * Stops the program: clears timers, removes listeners, restores the terminal,
   * and resolves the finished promise. Safe to call multiple times.
   */
  stop(): void {
    if (this.shutdownOnceFlag) return
    this.shutdownOnceFlag = true
    this.running = false
    if (this.ticker) {
      clearInterval(this.ticker)
      this.ticker = null
    }
    if (this.cmdSignal) {
      this.cmdSignal()
      this.cmdSignal = null
    }
    disableRawMode(this.input)
    if (this.onInputData) {
      this.input.removeListener("data", this.onInputData)
      this.onInputData = null
    }
    this.flushInputTimer()
    if (this.onResize) {
      this.output.removeListener("resize", this.onResize)
      this.onResize = null
    }
    if (this.onSigInt) {
      process.removeListener("SIGINT", this.onSigInt)
      this.onSigInt = null
    }
    if (this.onSigTerm) {
      process.removeListener("SIGTERM", this.onSigTerm)
      this.onSigTerm = null
    }
    if (this.onExit) {
      process.removeListener("exit", this.onExit)
      this.onExit = null
    }
    if (this.rendererEnabled) {
      this.renderer.restore()
    }
    this.input.unref?.()
    this.finishedResolve()
  }

  /**
   * Sends a message to the model's update function, handles special message
   * types (print, clipboard, cursor, etc.), and triggers a re-render.
   * @param msg - The message to dispatch.
   */
  send(msg: Msg): void {
    if (!this.running || msg == null) return

    if (this.filter) {
      msg = this.filter(msg)
      if (msg === null) return
    }

    // System messages: handle in Program, don't forward to model
    if (isSystemMsg(msg)) {
      this.dispatchSystemMsg(msg)
    }

    // Mouse messages: forward to view.onMouse handler
    const type = (msg as Record<string, any>).type
    if (type === "mouseClick" || type === "mouseRelease" || type === "mouseMotion" || type === "mouseWheel") {
      try {
        const view = this.model.view()
        if (view.onMouse) {
          const cmd = view.onMouse(msg as any)
          if (cmd) {
            const result = (cmd as any)()
            if (result) {
              if (result instanceof Promise) {
                result.then((r: Msg) => this.send(r))
              } else {
                this.send(result)
              }
            }
          }
        }
      } catch (err) {
        this.recoverFromPanic(err)
      }
    }

    let newModel: Model
    let cmd: Cmd | null
    try {
      ;[newModel, cmd] = this.model.update(msg)
    } catch (err) {
      this.recoverFromPanic(err)
      return
    }
    this.model = newModel

    if (type === "quit") {
      this.stop()
      return
    }

    if (type === "interrupt") {
      this.stop()
      return
    }

    if (type === "key" && ((msg as any).name === "escape" || ((msg as any).name === "c" && (msg as any).ctrl))) {
      this.stop()
      return
    }

    if (cmd) {
      this.cmds.push(cmd)
      this.signalCmds()
    }

    if (this.rendererEnabled) {
      try {
        const view = this.model.view()
        const content = typeof view === "string" ? view : view.content
        this.renderer.render(content)
      } catch (err) {
        this.recoverFromPanic(err)
      }
    }
  }

  private dispatchSystemMsg(msg: SystemMsg): void {
    switch (msg.type) {
      case "batch": this.execBatchMsg(msg.cmds); return
      case "sequence": this.execSequenceMsg(msg.cmds); return
      case "print": {
        const text = msg.text ?? ""
        this.output.write(`\x1b[?25l\x1b[1A\r\x1b[2K${text}\r\n\x1b[?25h`)
        return
      }
      case "clearScreen": if (this.rendererEnabled) this.renderer.clear(); return
      case "raw": this.output.write(String((msg as any).msg)); return
      case "requestBackgroundColor": this.output.write("\x1b]11;?\x07"); return
      case "requestForegroundColor": this.output.write("\x1b]10;?\x07"); return
      case "requestCursorColor": this.output.write("\x1b]12;?\x07"); return
      case "readClipboard": this.output.write("\x1b]52;c;?\x07"); return
      case "setClipboard": {
        const raw = msg.content ?? ""
        const content = raw.length > 1048576 ? raw.slice(0, 1048576) : raw
        const b64 = Buffer.from(content).toString("base64")
        this.output.write(`\x1b]52;c;${b64}\x07`)
        return
      }
      case "readPrimaryClipboard": this.output.write("\x1b]52;p;?\x07"); return
      case "setPrimaryClipboard": {
        const b64 = Buffer.from(msg.content ?? "").toString("base64")
        this.output.write(`\x1b]52;p;${b64}\x07`)
        return
      }
      case "requestCursorPosition": this.output.write("\x1b[6n"); return
      case "enableKeyboardEnhancements": this.output.write("\x1b[>31u"); return
      case "disableKeyboardEnhancements": this.output.write("\x1b[<u"); return
      case "modeReport":
        if (msg.mode === 2026 && msg.value === 2) {
          this.syncOutput = true
          if (this.rendererEnabled) this.renderer.setSyncOutput(true)
        }
        return
      case "enterAltScreen": if (this.rendererEnabled) { this.altScreen = true; this.output.write("\x1b[?1049h") }; return
      case "exitAltScreen": if (this.rendererEnabled) { this.output.write("\x1b[?1049l"); this.altScreen = false }; return
      case "moveCursor": this.output.write(`\x1b[${msg.y + 1};${msg.x + 1}H`); return
      case "hideCursor": this.output.write("\x1b[?25l"); return
      case "showCursor": this.output.write("\x1b[?25h"); return
      case "setCursorShape": {
        const shapes: Record<string, string> = { block: "\x1b[2 q", underline: "\x1b[4 q", bar: "\x1b[6 q" }
        this.output.write(shapes[msg.shape] ?? shapes["block"]!)
        return
      }
      case "setWindowTitle": this.output.write(`\x1b]0;${msg.title ?? ""}\x07`); return
      case "enableMouseCellMotion": this.output.write("\x1b[?1000h\x1b[?1002h"); return
      case "enableMouseAllMotion": this.output.write("\x1b[?1003h\x1b[?1006h"); return
      case "disableMouse": this.output.write("\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l"); return
      case "enableBracketedPaste": this.output.write("\x1b[?2004h"); return
      case "disableBracketedPaste": this.output.write("\x1b[?2004l"); return
      case "enableReportFocus": this.output.write("\x1b[?1004h"); return
      case "disableReportFocus": this.output.write("\x1b[?1004l"); return
    }
  }

  /**
   * Replaces the current model instance.
   * @param model - The new model to use.
   */
  setModel(model: Model): void {
    this.model = model
  }

  private execBatchMsg(cmds: Cmd[]): void {
    if (!cmds || cmds.length === 0) return
    const valid = cmds.filter((c): c is NonNullable<Cmd> => c !== null)
    const promises = valid.map(async (cmd) => {
      if (this.catchPanics) {
        try {
          const msg = await cmd()
          this.send(msg)
        } catch (err) {
          this.recoverFromPanic(err)
        }
      } else {
        const msg = await cmd()
        this.send(msg)
      }
    })
    Promise.all(promises).catch(() => {})
  }

  private execSequenceMsg(cmds: Cmd[]): void {
    if (!cmds || cmds.length === 0) return
    const run = async () => {
      for (const cmd of cmds) {
        if (!cmd) continue
        if (this.catchPanics) {
          try {
            const msg = await cmd()
            if (msg && (msg as any).type === "batch") {
              this.execBatchMsg((msg as any).cmds)
            } else if (msg && (msg as any).type === "sequence") {
              this.execSequenceMsg((msg as any).cmds)
            } else {
              this.send(msg)
            }
          } catch (err) {
            this.recoverFromPanic(err)
          }
        } else {
          const msg = await cmd()
          if (msg && (msg as any).type === "batch") {
            this.execBatchMsg((msg as any).cmds)
          } else if (msg && (msg as any).type === "sequence") {
            this.execSequenceMsg((msg as any).cmds)
          } else {
            this.send(msg)
          }
        }
      }
    }
    run().catch(() => {})
  }

  private recoverFromPanic(r: any): void {
    this.running = false
    if (this.ticker) {
      clearInterval(this.ticker)
      this.ticker = null
    }
    if (this.onInputData) {
      this.input.removeListener("data", this.onInputData)
      this.onInputData = null
    }
    if (this.onResize) {
      this.output.removeListener("resize", this.onResize)
      this.onResize = null
    }
    if (this.onSigInt) {
      process.removeListener("SIGINT", this.onSigInt)
      this.onSigInt = null
    }
    if (this.onSigTerm) {
      process.removeListener("SIGTERM", this.onSigTerm)
      this.onSigTerm = null
    }
    if (this.onExit) {
      process.removeListener("exit", this.onExit)
      this.onExit = null
    }
    disableRawMode(this.input)
    if (this.rendererEnabled) {
      this.renderer.restore()
    }
    const rec = String(r).replace(/\n/g, "\r\n")
    process.stderr.write(`Caught panic:\r\n\r\n${rec}\r\n\r\nRestoring terminal...\r\n\r\n`)
    const stack = new Error().stack?.replace(/\n/g, "\r\n") ?? ""
    process.stderr.write(`${stack}\r\n`)
    this.finishedResolve()
  }

  private inputTimer: ReturnType<typeof setTimeout> | null = null

  private readInput(): void {
    this.onInputData = (data: string) => {
      if (!this.running) return

      this.inputBuffer += data

      if (this.inputBuffer.length > 65536) {
        this.inputBuffer = this.inputBuffer.slice(-65536)
      }

      const mouse = parseMouse(this.inputBuffer)
      if (mouse) {
        this.inputBuffer = ""
        this.flushInputTimer()
        this.send(mouse as any)
        return
      }

      if (this.isCompleteSequence(this.inputBuffer)) {
        if (this.inputBuffer === "\x1b[I") {
          this.inputBuffer = ""
          this.flushInputTimer()
          this.send({ type: "focus" } as any)
        } else if (this.inputBuffer === "\x1b[O") {
          this.inputBuffer = ""
          this.flushInputTimer()
          this.send({ type: "blur" } as any)
        } else {
          const key = readKey(this.inputBuffer)
          this.inputBuffer = ""
          this.flushInputTimer()
          this.send(key as KeyMsg)
        }
      } else if (!this.inputTimer) {
        this.inputTimer = setTimeout(() => {
          this.inputTimer = null
          if (this.inputBuffer.length > 0) {
            const key = readKey(this.inputBuffer)
            this.inputBuffer = ""
            this.send(key as KeyMsg)
          }
        }, 100)
      }
    }
    this.input.on("data", this.onInputData)
  }

  private flushInputTimer(): void {
    if (this.inputTimer) {
      clearTimeout(this.inputTimer)
      this.inputTimer = null
    }
  }

  private isCompleteSequence(data: string): boolean {
    if (data.length === 1) return true

    if (data.startsWith("\x1b")) {
      if (data === "\x1b") return true
      if (RE_MOUSE.test(data)) return true
      if (RE_MOD_ARROW.test(data)) return true
      if (RE_MOD_KEY.test(data)) return true
      if (RE_MOD_TILDE.test(data)) return true
      if (RE_TILDE.test(data)) return true
      if (RE_HOME.test(data)) return true
      if (RE_END.test(data)) return true
      if (RE_REPORT_POS.test(data)) return true
      if (data === "\x1b[A" || data === "\x1b[B" || data === "\x1b[C" || data === "\x1b[D") return true
      if (data === "\x1b[H" || data === "\x1b[F") return true
      if (data === "\x1b[5~" || data === "\x1b[6~") return true
      if (data === "\x1b[3~" || data === "\x1b[2~") return true
      if (data === "\x1b[Z") return true
      if (data === "\x1b[I" || data === "\x1b[O") return true
      if (RE_FKEY.test(data)) return true
      if (data.length > 2 && data[1] !== "[") return true
      return false
    }

    return true
  }

  private startRenderer(): void {
    const interval = Math.max(1000 / this.fps, 8)
    this.ticker = setInterval(() => {
      if (!this.running) return
      if (this.rendererEnabled) {
        this.renderer.flush(false)
      }
    }, interval)
  }

  private signalCmds(): void {
    if (this.cmdSignal) {
      const resolve = this.cmdSignal
      this.cmdSignal = null
      resolve()
    }
  }

  private async processCmds(): Promise<void> {
    while (this.running) {
      if (this.cmds.length > 0) {
        while (this.cmds.length > 0) {
          const cmd = this.cmds.shift()!
          if (this.catchPanics) {
            try {
              const msg = await cmd()
              this.send(msg)
            } catch (err) {
              this.recoverFromPanic(err)
            }
          } else {
            const msg = await cmd()
            this.send(msg)
          }
        }
      } else {
        await new Promise<void>((r) => { this.cmdSignal = r })
      }
    }
  }
}

/**
 * Creates a new Program instance.
 * @param config - Program configuration (model, altScreen, mouseMode, fps, etc.).
 * @returns A new Program instance ready to be started with {@link run}.
 */
export function NewProgram(config: ProgramConfig): Program {
  return new Program(config)
}

/**
 * Immediately kills the given program.
 * @param p - The program to kill.
 */
export function kill(p: Program): void {
  p.kill()
}

/**
 * Blocks until the program exits.
 * @param p - The program to wait on.
 * @returns Resolves when the program finishes.
 */
export async function wait(p: Program): Promise<void> {
  return p.wait()
}

/**
 * Releases the terminal for the given program, disabling raw mode and
 * restoring the screen.
 * @param p - The program whose terminal to release.
 */
export function releaseTerminal(p: Program): void {
  p.releaseTerminal()
}

/**
 * Restores the terminal for the given program after it was released,
 * re-enabling raw mode and re-rendering the view.
 * @param p - The program whose terminal to restore.
 */
export function restoreTerminal(p: Program): void {
  p.restoreTerminal()
}
