// input.ts | terminal input handling (raw mode)

import type { KeyMsg, MouseMsg } from "./types"

/**
 * enableRawMode puts the terminal in raw mode.
 */
export function enableRawMode(): void {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
  }
  process.stdin.resume()
  process.stdin.setEncoding("utf-8")
}

/**
 * disableRawMode restores the terminal.
 */
export function disableRawMode(): void {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false)
  }
  process.stdin.pause()
}

/**
 * readKey reads a single keypress.
 */
export function readKey(data: string): KeyMsg {
  const sequence = data

  // Ctrl+C
  if (data === "\x03") {
    return { name: "c", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }

  // Ctrl+D
  if (data === "\x04") {
    return { name: "d", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }

  // Ctrl+Z
  if (data === "\x1a") {
    return { name: "z", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }

  // Ctrl+S
  if (data === "\x13") {
    return { name: "s", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }

  // Escape sequences
  if (data === "\x1b[A") {
    return { name: "up", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[B") {
    return { name: "down", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[C") {
    return { name: "right", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[D") {
    return { name: "left", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  // Shift+Arrow
  if (data === "\x1b[1;2A") {
    return { name: "up", ctrl: false, shift: true, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[1;2B") {
    return { name: "down", ctrl: false, shift: true, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[1;2C") {
    return { name: "right", ctrl: false, shift: true, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[1;2D") {
    return { name: "left", ctrl: false, shift: true, alt: false, meta: false, sequence }
  }

  // Ctrl+Arrow
  if (data === "\x1b[1;5A") {
    return { name: "up", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[1;5B") {
    return { name: "down", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[1;5C") {
    return { name: "right", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[1;5D") {
    return { name: "left", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }

  // Home/End
  if (data === "\x1b[H" || data === "\x1b[1~") {
    return { name: "home", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[F" || data === "\x1b[4~") {
    return { name: "end", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  // Page Up/Down
  if (data === "\x1b[5~") {
    return { name: "pageup", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[6~") {
    return { name: "pagedown", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  // Delete
  if (data === "\x1b[3~") {
    return { name: "delete", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  // Insert
  if (data === "\x1b[2~") {
    return { name: "insert", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  // Tab
  if (data === "\t") {
    return { name: "tab", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  // Shift+Tab
  if (data === "\x1b[Z") {
    return { name: "tab", ctrl: false, shift: true, alt: false, meta: false, sequence }
  }

  // Enter
  if (data === "\r" || data === "\n") {
    return { name: "enter", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  // Backspace
  if (data === "\x7f" || data === "\b") {
    return { name: "backspace", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  // Escape
  if (data === "\x1b") {
    return { name: "escape", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  // Space
  if (data === " ") {
    return { name: "space", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  // Regular character
  if (data.length === 1) {
    const char = data
    const isUpper = char >= "A" && char <= "Z"
    return {
      name: char.toLowerCase(),
      ctrl: false,
      shift: isUpper,
      alt: false,
      meta: false,
      sequence,
    }
  }

  // Unknown
  return { name: "unknown", ctrl: false, shift: false, alt: false, meta: false, sequence }
}

/**
 * parseMouse parses mouse escape sequences.
 */
export function parseMouse(data: string): MouseMsg | null {
  // SGR mouse: \x1b[<button;col;row;M or m
  const match = data.match(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/)
  if (match) {
    const button = parseInt(match[1]!)
    const col = parseInt(match[2]!) - 1
    const row = parseInt(match[3]!) - 1
    const released = match[4] === "m"

    let buttonName = "left"
    if (button & 1) buttonName = "middle"
    if (button & 2) buttonName = "right"
    if (button & 64) buttonName = "wheel"

    return {
      x: col,
      y: row,
      button: buttonName,
      action: released ? "release" : "press",
    }
  }

  return null
}
