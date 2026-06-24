// screen.ts | screen management (bubbletea port)

import type { Msg } from "./types"

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
 * HideCursor hides the terminal cursor.
 */
export function HideCursor(): Msg {
  return { type: "hideCursor" }
}

/**
 * ShowCursor shows the terminal cursor.
 */
export function ShowCursor(): Msg {
  return { type: "showCursor" }
}

/**
 * CursorShape represents a terminal cursor shape.
 */
export type CursorShape = "block" | "underline" | "bar"

/**
 * SetCursorShape sets the cursor shape.
 */
export function SetCursorShape(shape: CursorShape): Msg {
  return { type: "setCursorShape", shape }
}

/**
 * SetWindowTitle sets the terminal window title.
 */
export function SetWindowTitle(title: string): Msg {
  return { type: "setWindowTitle", title }
}
