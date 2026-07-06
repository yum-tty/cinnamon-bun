// commands.ts | command helpers (bubbletea port)

import type { Cmd, Msg, BatchMsg, SequenceMsg, QuitMsg, SuspendMsg, InterruptMsg, TickMsg, PrintMsg, ExecCommand, ExecCallback, RawMsg } from "./types"
import type { KeyMsg, KeyReleaseMsg } from "./types"

export function Quit(): Cmd {
  return () => ({ type: "quit" } as QuitMsg)
}

export function Suspend(): Cmd {
  return () => ({ type: "suspend" } as SuspendMsg)
}

export function Interrupt(): Cmd {
  return () => ({ type: "interrupt" } as InterruptMsg)
}

export function Batch(...cmds: Cmd[]): Cmd {
  const valid = cmds.filter((c): c is Cmd => c !== null)
  if (valid.length === 0) return null
  if (valid.length === 1) return valid[0]!
  return () => ({ type: "batch", cmds: valid } as BatchMsg)
}

export function Sequence(...cmds: Cmd[]): Cmd {
  const valid = cmds.filter((c): c is Cmd => c !== null)
  if (valid.length === 0) return null
  if (valid.length === 1) return valid[0]!
  return () => ({ type: "sequence", cmds: valid } as SequenceMsg)
}

export function Every(ms: number, fn: (data: any) => Msg): Cmd {
  return () => {
    return new Promise((resolve) => {
      const now = Date.now()
      const aligned = Math.ceil(now / ms) * ms
      const delay = aligned - now
      setTimeout(() => {
        resolve(fn(Date.now()))
      }, delay)
    })
  }
}

export function Tick(ms: number, fn: (data: any) => Msg): Cmd {
  return () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(fn(Date.now()))
      }, ms)
    })
  }
}

export function Print(text: string): Cmd {
  return () => ({ type: "print", text } as PrintMsg)
}

export function Println(...args: any[]): Cmd {
  return () => ({ type: "print", text: args.join(" ") } as PrintMsg)
}

export function Printf(template: string, ...args: any[]): Cmd {
  return () => ({ type: "print", text: template.replace(/%s/g, () => String(args.shift())) } as PrintMsg)
}

export function RequestWindowSize(): Msg {
  return { type: "requestWindowSize" }
}

export function RequestCursorPosition(): Msg {
  return { type: "requestCursorPosition" }
}

export function Exec(c: ExecCommand, fn: ExecCallback, releaseTerminal?: () => void, restoreTerminal?: () => void): Cmd {
  return () => {
    return new Promise(async (resolve) => {
      if (releaseTerminal) releaseTerminal()
      try {
        await c.run()
        resolve(fn(null))
      } catch (err) {
        resolve(fn(err as Error))
      } finally {
        if (restoreTerminal) restoreTerminal()
      }
    })
  }
}

export function ShowCursor(): Msg {
  return { type: "showCursor" }
}

export function HideCursor(): Msg {
  return { type: "hideCursor" }
}

export function EnableBracketedPaste(): Msg {
  return { type: "enableBracketedPaste" }
}

export function DisableBracketedPaste(): Msg {
  return { type: "disableBracketedPaste" }
}

export function EnableMouseCellMotion(): Msg {
  return { type: "enableMouseCellMotion" }
}

export function EnableMouseAllMotion(): Msg {
  return { type: "enableMouseAllMotion" }
}

export function DisableMouse(): Msg {
  return { type: "disableMouse" }
}

export function EnterAltScreen(): Msg {
  return { type: "enterAltScreen" }
}

export function ExitAltScreen(): Msg {
  return { type: "exitAltScreen" }
}

export function EnableReportFocus(): Msg {
  return { type: "enableReportFocus" }
}

export function DisableReportFocus(): Msg {
  return { type: "disableReportFocus" }
}

export function ClearScreen(): Msg {
  return { type: "clearScreen" }
}

export function MoveCursor(x: number, y: number): Msg {
  return { type: "moveCursor", x, y }
}

export function SetCursorShape(shape: "block" | "underline" | "bar"): Msg {
  return { type: "setCursorShape", shape }
}

export function SetWindowTitle(title: string): Msg {
  return { type: "setWindowTitle", title }
}

export function Raw(r: any): Cmd {
  return () => ({ type: "raw", msg: r } as RawMsg)
}

export function ExecProcess(
  execFn: () => Promise<void>,
  fn: (error: Error | null) => Msg,
  releaseTerminal?: () => void,
  restoreTerminal?: () => void,
): Cmd {
  return async () => {
    if (releaseTerminal) releaseTerminal()
    try {
      await execFn()
      return fn(null)
    } catch (err) {
      return fn(err as Error)
    } finally {
      if (restoreTerminal) restoreTerminal()
    }
  }
}

export function RequestTerminalVersion(): Msg {
  return { type: "terminalVersion" }
}

export function RequestCapability(capability: string): Cmd {
  return () => ({ type: "requestCapability", content: capability })
}
