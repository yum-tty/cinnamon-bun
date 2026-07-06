// clipboard.ts | clipboard support (bubbletea port)

import type { Cmd, Msg } from "./types"

/**
 * ClipboardMsg is a clipboard read message event.
 */
export interface ClipboardMsg {
  type: "clipboard"
  content: string
  selection: "clipboard" | "primary"
}

/**
 * SetClipboard produces a command that sets the system clipboard.
 */
export function SetClipboard(s: string): Cmd {
  return () => ({ type: "setClipboard", content: s } as any)
}

/**
 * ReadClipboard produces a command that reads the system clipboard.
 */
export function ReadClipboard(): Cmd {
  return () => ({ type: "readClipboard" } as any)
}

/**
 * SetPrimaryClipboard produces a command that sets the primary clipboard.
 */
export function SetPrimaryClipboard(s: string): Cmd {
  return () => ({ type: "setPrimaryClipboard", content: s } as any)
}

/**
 * ReadPrimaryClipboard produces a command that reads the primary clipboard.
 */
export function ReadPrimaryClipboard(): Cmd {
  return () => ({ type: "readPrimaryClipboard" } as any)
}
