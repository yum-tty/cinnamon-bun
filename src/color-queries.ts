// color-queries.ts | color query commands (bubbletea port)

import type { Msg } from "./types"

/**
 * BackgroundColorMsg represents a background color message.
 * This message is emitted when the program requests the terminal
 * background color with RequestBackgroundColor.
 */
export interface BackgroundColorMsg {
  type: "backgroundColor"
  color: string
  isDark: boolean
}

/**
 * ForegroundColorMsg represents a foreground color message.
 * This message is emitted when the program requests the terminal
 * foreground color with RequestForegroundColor.
 */
export interface ForegroundColorMsg {
  type: "foregroundColor"
  color: string
  isDark: boolean
}

/**
 * CursorColorMsg represents a cursor color message.
 * This message is emitted when the program requests the terminal
 * cursor color with RequestCursorColor.
 */
export interface CursorColorMsg {
  type: "cursorColor"
  color: string
  isDark: boolean
}

/**
 * RequestBackgroundColor is a command that requests the terminal background color.
 * The result is sent as a BackgroundColorMsg.
 */
export function RequestBackgroundColor(): Msg {
  return { type: "requestBackgroundColor" }
}

/**
 * RequestForegroundColor is a command that requests the terminal foreground color.
 * The result is sent as a ForegroundColorMsg.
 */
export function RequestForegroundColor(): Msg {
  return { type: "requestForegroundColor" }
}

/**
 * RequestCursorColor is a command that requests the terminal cursor color.
 * The result is sent as a CursorColorMsg.
 */
export function RequestCursorColor(): Msg {
  return { type: "requestCursorColor" }
}
