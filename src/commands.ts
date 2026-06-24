// commands.ts | command helpers (bubbletea port)

import type { Cmd, Msg, BatchMsg, SequenceMsg, QuitMsg, TickMsg, PrintMsg, ExecCommand, ExecCallback, CursorPositionMsg, FocusMsg, BlurMsg, PasteMsg, PasteStartMsg, PasteEndMsg } from "./types"

/**
 * Quit returns a command that quits the program.
 */
export function Quit(): Msg {
  return { type: "quit" } as QuitMsg
}

/**
 * Batch performs multiple commands concurrently.
 */
export function Batch(...cmds: Cmd[]): Cmd {
  const valid = cmds.filter((c): c is Cmd => c !== null)
  if (valid.length === 0) return null
  if (valid.length === 1) return valid[0]!

  return () => ({ type: "batch", cmds: valid } as BatchMsg)
}

/**
 * Sequence runs commands one at a time.
 */
export function Sequence(...cmds: Cmd[]): Cmd {
  const valid = cmds.filter((c): c is Cmd => c !== null)
  if (valid.length === 0) return null
  if (valid.length === 1) return valid[0]!

  return () => ({ type: "sequence", cmds: valid } as SequenceMsg)
}

/**
 * Every ticks at an interval.
 */
export function Every(ms: number, fn: (data: any) => Msg): Cmd {
  return () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(fn(Date.now()))
      }, ms)
    })
  }
}

/**
 * Tick produces a command after a delay.
 */
export function Tick(ms: number, fn: (data: any) => Msg): Cmd {
  return () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(fn(Date.now()))
      }, ms)
    })
  }
}

/**
 * Print prints text above the UI.
 */
export function Print(text: string): Msg {
  return { type: "print", text } as PrintMsg
}

/**
 * Println prints a line above the UI.
 */
export function Println(...args: any[]): Msg {
  return { type: "print", text: args.join(" ") } as PrintMsg
}

/**
 * Printf prints formatted text above the UI.
 */
export function Printf(template: string, ...args: any[]): Msg {
  return { type: "print", text: template.replace(/%s/g, () => String(args.shift())) } as PrintMsg
}

/**
 * RequestWindowSize requests the current window size.
 */
export function RequestWindowSize(): Msg {
  return { type: "requestWindowSize" }
}

/**
 * RequestCursorPosition requests the cursor position.
 */
export function RequestCursorPosition(): Msg {
  return { type: "requestCursorPosition" }
}

/**
 * Exec executes a command in a blocking fashion.
 */
export function Exec(c: ExecCommand, fn: ExecCallback): Cmd {
  return () => {
    return new Promise(async (resolve) => {
      try {
        await c.run()
        resolve(fn(null))
      } catch (err) {
        resolve(fn(err as Error))
      }
    })
  }
}

/**
 * ShowCursor shows the terminal cursor.
 */
export function ShowCursor(): Msg {
  return { type: "showCursor" }
}

/**
 * HideCursor hides the terminal cursor.
 */
export function HideCursor(): Msg {
  return { type: "hideCursor" }
}

/**
 * EnableBracketedPaste enables bracketed paste mode.
 */
export function EnableBracketedPaste(): Msg {
  return { type: "enableBracketedPaste" }
}

/**
 * DisableBracketedPaste disables bracketed paste mode.
 */
export function DisableBracketedPaste(): Msg {
  return { type: "disableBracketedPaste" }
}

/**
 * EnableMouseCellMotion enables cell motion mouse events.
 */
export function EnableMouseCellMotion(): Msg {
  return { type: "enableMouseCellMotion" }
}

/**
 * EnableMouseAllMotion enables all mouse events.
 */
export function EnableMouseAllMotion(): Msg {
  return { type: "enableMouseAllMotion" }
}

/**
 * DisableMouse disables mouse events.
 */
export function DisableMouse(): Msg {
  return { type: "disableMouse" }
}

/**
 * EnterAltScreen enters the alternate screen buffer.
 */
export function EnterAltScreen(): Msg {
  return { type: "enterAltScreen" }
}

/**
 * ExitAltScreen exits the alternate screen buffer.
 */
export function ExitAltScreen(): Msg {
  return { type: "exitAltScreen" }
}

/**
 * EnableReportFocus enables focus reporting.
 */
export function EnableReportFocus(): Msg {
  return { type: "enableReportFocus" }
}

/**
 * DisableReportFocus disables focus reporting.
 */
export function DisableReportFocus(): Msg {
  return { type: "disableReportFocus" }
}

/**
 * ClearScreen clears the terminal screen.
 */
export function ClearScreen(): Msg {
  return { type: "clearScreen" }
}

/**
 * MoveCursor moves the cursor to a position.
 */
export function MoveCursor(x: number, y: number): Msg {
  return { type: "moveCursor", x, y }
}

/**
 * SetCursorShape sets the cursor shape.
 */
export function SetCursorShape(shape: "block" | "underline" | "bar"): Msg {
  return { type: "setCursorShape", shape }
}

/**
 * SetWindowTitle sets the terminal window title.
 */
export function SetWindowTitle(title: string): Msg {
  return { type: "setWindowTitle", title }
}
