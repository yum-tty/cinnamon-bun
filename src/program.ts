// program.ts | bubbletea event loop

import type { Model, Msg, Cmd, ProgramConfig, KeyMsg, MouseMsgAll, WindowSizeMsg, View } from "./types"
import { EnvMsg } from "./types"
import { Renderer } from "./renderer"
import { detectColorProfile, ColorProfile } from "./color-profile"
import { enableRawMode, disableRawMode, readKey, parseMouse } from "./input"
import type { ProgramOption } from "./options"

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

  constructor(config: ProgramConfig, ...options: ProgramOption[]) {
    this.model = config.model
    this.renderer = new Renderer(this.output)
    this.renderer.setColorProfile(this.colorProfile as ColorProfile)
    this.altScreen = config.altScreen ?? true
    this.mouseMode = config.mouseMode ?? "none"
    this.fps = config.fps ?? 60

    this.finishedPromise = new Promise<void>((resolve) => {
      this.finishedResolve = resolve
    })

    for (const opt of options) {
      opt(this)
    }
  }

  setAltScreen(v: boolean): void { this.altScreen = v }
  setMouseMode(mode: "none" | "cell" | "all"): void { this.mouseMode = mode }
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

  async run(): Promise<Model> {
    this.running = true

    if (this.rendererEnabled) {
      this.renderer.init(this.altScreen)
    }
    enableRawMode(this.input)

    if (this.signalHandler) {
      this.onSigInt = () => {
        this.send({ type: "interrupt" })
      }
      this.onSigTerm = () => {
        this.stop()
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

    const [initModel, initCmd] = this.model.init()
    this.model = initModel
    if (initCmd) {
      this.cmds.push(initCmd)
      this.signalCmds()
    }

    if (this.rendererEnabled) {
      const view = this.model.view()
      const content = typeof view === "string" ? view : view.content
      this.renderer.render(content)
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

  Send(msg: Msg): void {
    this.send(msg)
  }

  quit(): void {
    this.send({ type: "quit" })
  }

  kill(): void {
    this.stop()
  }

  releaseTerminal(): void {
    this.running = false
    disableRawMode(this.input)
    if (this.rendererEnabled) {
      this.renderer.restore()
    }
  }

  restoreTerminal(): void {
    this.running = true
    if (this.rendererEnabled) {
      this.renderer.init(this.altScreen)
    }
    enableRawMode(this.input)
    const view = this.model.view()
    const content = typeof view === "string" ? view : view.content
    if (this.rendererEnabled) {
      this.renderer.render(content)
    }
  }

  println(...args: any[]): void {
    this.send({ type: "print", text: args.join(" ") } as any)
  }

  printf(template: string, ...args: any[]): void {
    this.send({ type: "print", text: template.replace(/%s/g, () => String(args.shift())) } as any)
  }

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

  send(msg: Msg): void {
    if (!this.running || msg == null) return

    if (this.filter) {
      msg = this.filter(msg)
      if (msg === null) return
    }

    const m = msg as any

    // Messages that skip Update entirely
    if (m.type === "batch") {
      this.execBatchMsg(m.cmds)
      return
    }
    if (m.type === "sequence") {
      this.execSequenceMsg(m.cmds)
      return
    }

    // Special message side effects (fall through to Update after)
    if (m.type === "print") {
      const text = m.text ?? ""
      this.output.write(`\x1b[?25l\x1b[1A\r\x1b[2K${text}\r\n\x1b[?25h`)
    } else if (m.type === "clearScreen") {
      if (this.rendererEnabled) this.renderer.clear()
    } else if (m.type === "raw") {
      this.output.write(String(m.msg))
    } else if (m.type === "requestBackgroundColor") {
      this.output.write("\x1b]11;?\x07")
    } else if (m.type === "requestForegroundColor") {
      this.output.write("\x1b]10;?\x07")
    } else if (m.type === "requestCursorColor") {
      this.output.write("\x1b]12;?\x07")
    } else if (m.type === "readClipboard") {
      this.output.write("\x1b]52;c;?\x07")
    } else if (m.type === "setClipboard") {
      const raw = m.content ?? ""
      const content = raw.length > 1048576 ? raw.slice(0, 1048576) : raw
      const b64 = Buffer.from(content).toString("base64")
      this.output.write(`\x1b]52;c;${b64}\x07`)
    } else if (m.type === "readPrimaryClipboard") {
      this.output.write("\x1b]52;p;?\x07")
    } else if (m.type === "setPrimaryClipboard") {
      const b64 = Buffer.from(m.content ?? "").toString("base64")
      this.output.write(`\x1b]52;p;${b64}\x07`)
    } else if (m.type === "requestCursorPosition") {
      this.output.write("\x1b[6n")
    } else if (m.type === "enableKeyboardEnhancements") {
      this.output.write("\x1b[>31u")
    } else if (m.type === "disableKeyboardEnhancements") {
      this.output.write("\x1b[<u")
    } else if (m.type === "modeReport") {
      if (m.mode === 2026 && m.value === 2) {
        this.syncOutput = true
        if (this.rendererEnabled) this.renderer.setSyncOutput(true)
      }
    } else if (["mouseClick","mouseRelease","mouseMotion","mouseWheel"].includes(m.type)) {
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
    } else if (m.type === "enterAltScreen") {
      if (this.rendererEnabled) {
        this.altScreen = true
        this.output.write("\x1b[?1049h")
      }
    } else if (m.type === "exitAltScreen") {
      if (this.rendererEnabled) {
        this.output.write("\x1b[?1049l")
        this.altScreen = false
      }
    } else if (m.type === "moveCursor") {
      const x = m.x ?? 0
      const y = m.y ?? 0
      this.output.write(`\x1b[${y + 1};${x + 1}H`)
    } else if (m.type === "hideCursor") {
      this.output.write("\x1b[?25l")
    } else if (m.type === "showCursor") {
      this.output.write("\x1b[?25h")
    } else if (m.type === "setCursorShape") {
      const shapes: Record<string, string> = {
        block: "\x1b[2 q",
        underline: "\x1b[4 q",
        bar: "\x1b[6 q",
      }
      this.output.write(shapes[m.shape] ?? shapes["block"]!)
    } else if (m.type === "setWindowTitle") {
      this.output.write(`\x1b]0;${m.title ?? ""}\x07`)
    }

    // Update model and render (Go: model.Update + p.render for ALL messages)
    const [newModel, cmd] = this.model.update(msg)
    this.model = newModel

    if (m.type === "quit") {
      this.stop()
      return
    }

    if (m.type === "interrupt") {
      this.stop()
      return
    }

    // System quit keys bypass cmd queue — stop immediately
    if (m.type === "key" && (m.name === "escape" || (m.name === "c" && m.ctrl))) {
      this.stop()
      return
    }

    if (cmd) {
      this.cmds.push(cmd)
      this.signalCmds()
    }

    if (this.rendererEnabled) {
      const view = this.model.view()
      const content = typeof view === "string" ? view : view.content
      this.renderer.render(content)
    }
  }

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
    disableRawMode(this.input)
    if (this.rendererEnabled) {
      this.renderer.restore()
    }
    const rec = String(r).replace(/\n/g, "\r\n")
    process.stderr.write(`Caught panic:\r\n\r\n${rec}\r\n\r\nRestoring terminal...\r\n\r\n`)
    const stack = new Error().stack?.replace(/\n/g, "\r\n") || ""
    process.stderr.write(stack + "\r\n")
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
        const key = readKey(this.inputBuffer)
        this.inputBuffer = ""
        this.flushInputTimer()
        this.send(key as KeyMsg)
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

export function NewProgram(config: ProgramConfig, ...options: ProgramOption[]): Program {
  return new Program(config, ...options)
}

export function kill(p: Program): void {
  p.kill()
}

export async function wait(p: Program): Promise<void> {
  return p.wait()
}

export function releaseTerminal(p: Program): void {
  p.releaseTerminal()
}

export function restoreTerminal(p: Program): void {
  p.restoreTerminal()
}
