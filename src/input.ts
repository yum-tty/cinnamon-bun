// input.ts | terminal input handling (raw mode)

import type { KeyMsg, MouseMsgAll, Mouse, MouseClickMsg, MouseReleaseMsg, MouseMotionMsg, MouseWheelMsg } from "./types"
import { MouseNone, MouseLeft, MouseMiddle, MouseRight, MouseWheelUp, MouseWheelDown, MouseWheelLeft, MouseWheelRight } from "./types"

export function enableRawMode(input?: NodeJS.ReadStream): void {
  const stdin = input ?? process.stdin
  if (stdin.isTTY) {
    stdin.setRawMode(true)
  }
  stdin.resume()
  stdin.setEncoding("utf-8")
}

export function disableRawMode(input?: NodeJS.ReadStream): void {
  const stdin = input ?? process.stdin
  if (stdin.isTTY) {
    stdin.setRawMode(false)
  }
  stdin.pause()
}

function modFromParams(params: number[]): number {
  if (params.length === 0) return 0
  const mod = params[0]! - 1
  let result = 0
  if (mod & 1) result |= 1 << 0
  if (mod & 2) result |= 1 << 2
  if (mod & 4) result |= 1 << 1
  if (mod & 8) result |= 1 << 3
  if (mod & 16) result |= 1 << 5
  if (mod & 32) result |= 1 << 4
  return result
}

function parseParams(seq: string): number[] {
  const inner = seq.slice(2, -1)
  if (inner.length === 0) return []
  return inner.split(";").map((s) => parseInt(s, 10) || 0)
}

function keyFromCSI(name: string, data: string): KeyMsg {
  const params = parseParams(data)
  const mod = modFromParams(params)
  return {
    type: "key",
    name,
    ctrl: !!(mod & (1 << 2)),
    shift: !!(mod & (1 << 0)),
    alt: !!(mod & (1 << 1)),
    meta: !!(mod & (1 << 3)),
    sequence: data,
  }
}

export function readKey(data: string): KeyMsg {
  const sequence = data

  if (data === "\x03") {
    return { type: "key", name: "c", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x04") {
    return { type: "key", name: "d", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x1a") {
    return { type: "key", name: "z", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x13") {
    return { type: "key", name: "s", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x01") {
    return { type: "key", name: "a", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x05") {
    return { type: "key", name: "e", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x06") {
    return { type: "key", name: "f", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x02") {
    return { type: "key", name: "b", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x0e") {
    return { type: "key", name: "n", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x10") {
    return { type: "key", name: "p", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x17") {
    return { type: "key", name: "w", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x0b") {
    return { type: "key", name: "k", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x0c") {
    return { type: "key", name: "l", ctrl: true, shift: false, alt: false, meta: false, sequence }
  }

  if (data.startsWith("\x1b[<")) {
    return { type: "key", name: "unknown", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  if (data.match(/^\x1b\[1;(\d+)A$/)) {
    const mod = modFromParams(parseParams(data))
    return { type: "key", name: "up", ctrl: !!(mod & (1 << 2)), shift: !!(mod & (1 << 0)), alt: !!(mod & (1 << 1)), meta: !!(mod & (1 << 3)), sequence }
  }
  if (data.match(/^\x1b\[1;(\d+)B$/)) {
    const mod = modFromParams(parseParams(data))
    return { type: "key", name: "down", ctrl: !!(mod & (1 << 2)), shift: !!(mod & (1 << 0)), alt: !!(mod & (1 << 1)), meta: !!(mod & (1 << 3)), sequence }
  }
  if (data.match(/^\x1b\[1;(\d+)C$/)) {
    const mod = modFromParams(parseParams(data))
    return { type: "key", name: "right", ctrl: !!(mod & (1 << 2)), shift: !!(mod & (1 << 0)), alt: !!(mod & (1 << 1)), meta: !!(mod & (1 << 3)), sequence }
  }
  if (data.match(/^\x1b\[1;(\d+)D$/)) {
    const mod = modFromParams(parseParams(data))
    return { type: "key", name: "left", ctrl: !!(mod & (1 << 2)), shift: !!(mod & (1 << 0)), alt: !!(mod & (1 << 1)), meta: !!(mod & (1 << 3)), sequence }
  }
  if (data === "\x1b[A") {
    return { type: "key", name: "up", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[B") {
    return { type: "key", name: "down", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[C") {
    return { type: "key", name: "right", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[D") {
    return { type: "key", name: "left", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  if (data.match(/^\x1b\[1;(\d+)H$/)) {
    return keyFromCSI("home", data)
  }
  if (data === "\x1b[H" || data === "\x1b[1~") {
    return { type: "key", name: "home", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data.match(/^\x1b\[1;(\d+)F$/)) {
    return keyFromCSI("end", data)
  }
  if (data === "\x1b[F" || data === "\x1b[4~") {
    return { type: "key", name: "end", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  if (data.match(/^\x1b\[5;(\d+)~$/)) {
    return keyFromCSI("pageup", data)
  }
  if (data === "\x1b[5~") {
    return { type: "key", name: "pageup", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data.match(/^\x1b\[6;(\d+)~$/)) {
    return keyFromCSI("pagedown", data)
  }
  if (data === "\x1b[6~") {
    return { type: "key", name: "pagedown", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  if (data.match(/^\x1b\[3;(\d+)~$/)) {
    return keyFromCSI("delete", data)
  }
  if (data === "\x1b[3~") {
    return { type: "key", name: "delete", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  if (data.match(/^\x1b\[2;(\d+)~$/)) {
    return keyFromCSI("insert", data)
  }
  if (data === "\x1b[2~") {
    return { type: "key", name: "insert", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  if (data.match(/^\x1bOP$/)) {
    return { type: "key", name: "f1", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data.match(/^\x1bOQ$/)) {
    return { type: "key", name: "f2", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data.match(/^\x1bOR$/)) {
    return { type: "key", name: "f3", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data.match(/^\x1bOS$/)) {
    return { type: "key", name: "f4", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data.match(/^\x1b\[15~$/)) {
    return { type: "key", name: "f5", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data.match(/^\x1b\[17~$/)) {
    return { type: "key", name: "f6", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data.match(/^\x1b\[18~$/)) {
    return { type: "key", name: "f7", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data.match(/^\x1b\[19~$/)) {
    return { type: "key", name: "f8", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data.match(/^\x1b\[20~$/)) {
    return { type: "key", name: "f9", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data.match(/^\x1b\[21~$/)) {
    return { type: "key", name: "f10", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data.match(/^\x1b\[23~$/)) {
    return { type: "key", name: "f11", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data.match(/^\x1b\[24~$/)) {
    return { type: "key", name: "f12", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data.match(/^\x1b\[1;(\d+)P$/)) {
    return keyFromCSI("f1", data)
  }
  if (data.match(/^\x1b\[1;(\d+)Q$/)) {
    return keyFromCSI("f2", data)
  }
  if (data.match(/^\x1b\[1;(\d+)R$/)) {
    return keyFromCSI("f3", data)
  }
  if (data.match(/^\x1b\[1;(\d+)S$/)) {
    return keyFromCSI("f4", data)
  }
  if (data.match(/^\x1b\[15;(\d+)~$/)) {
    return keyFromCSI("f5", data)
  }
  if (data.match(/^\x1b\[17;(\d+)~$/)) {
    return keyFromCSI("f6", data)
  }
  if (data.match(/^\x1b\[18;(\d+)~$/)) {
    return keyFromCSI("f7", data)
  }
  if (data.match(/^\x1b\[19;(\d+)~$/)) {
    return keyFromCSI("f8", data)
  }
  if (data.match(/^\x1b\[20;(\d+)~$/)) {
    return keyFromCSI("f9", data)
  }
  if (data.match(/^\x1b\[21;(\d+)~$/)) {
    return keyFromCSI("f10", data)
  }
  if (data.match(/^\x1b\[23;(\d+)~$/)) {
    return keyFromCSI("f11", data)
  }
  if (data.match(/^\x1b\[24;(\d+)~$/)) {
    return keyFromCSI("f12", data)
  }

  if (data === "\t") {
    return { type: "key", name: "tab", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x1b[Z") {
    return { type: "key", name: "tab", ctrl: false, shift: true, alt: false, meta: false, sequence }
  }
  if (data === "\r" || data === "\n") {
    return { type: "key", name: "enter", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x7f" || data === "\b") {
    return { type: "key", name: "backspace", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data === "\x1b") {
    return { type: "key", name: "escape", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }
  if (data === " ") {
    return { type: "key", name: "space", ctrl: false, shift: false, alt: false, meta: false, sequence }
  }

  if (data.length === 1) {
    const char = data
    const isUpper = char >= "A" && char <= "Z"
    return {
      type: "key",
      name: char.toLowerCase(),
      ctrl: false,
      shift: isUpper,
      alt: false,
      meta: false,
      sequence,
    }
  }

  if (data.length === 2 && data[0] === "\x1b") {
    const char = data[1]!
    const isUpper = char >= "A" && char <= "Z"
    return {
      type: "key",
      name: char.toLowerCase(),
      ctrl: false,
      shift: isUpper,
      alt: true,
      meta: false,
      sequence,
    }
  }

  if (data === "\x1b[I") {
    return { type: "focus" } as any
  }
  if (data === "\x1b[O") {
    return { type: "blur" } as any
  }

  return { type: "key", name: "unknown", ctrl: false, shift: false, alt: false, meta: false, sequence }
}

export function parseMouse(data: string): MouseMsgAll | null {
  const match = data.match(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/)
  if (!match) return null

  const rawButton = parseInt(match[1]!)
  const col = parseInt(match[2]!) - 1
  const row = parseInt(match[3]!) - 1
  const released = match[4] === "m"

  const buttonType = rawButton & 3
  const isWheel = !!(rawButton & 64)
  const isMotion = !!(rawButton & 32)

  let button: number = MouseNone
  if (isWheel) {
    if (buttonType === 0) button = MouseWheelUp
    else if (buttonType === 1) button = MouseWheelDown
    else if (buttonType === 2) button = MouseWheelLeft
    else if (buttonType === 3) button = MouseWheelRight
  } else {
    if (buttonType === 0) button = MouseLeft
    else if (buttonType === 1) button = MouseMiddle
    else if (buttonType === 2) button = MouseRight
    else if (buttonType === 3) button = MouseNone
  }

  if (released) button = MouseNone

  const modBits = (rawButton >> 2) & 7
  const mouse: Mouse = {
    x: col,
    y: row,
    button,
    alt: !!(modBits & 1),
    ctrl: !!(modBits & 4),
    shift: !!(modBits & 2),
  }

  if (isMotion) {
    return { type: "mouseMotion", mouse } as MouseMotionMsg
  }

  if (isWheel) {
    return { type: "mouseWheel", mouse } as MouseWheelMsg
  }

  if (released) {
    return { type: "mouseRelease", mouse } as MouseReleaseMsg
  }

  return { type: "mouseClick", mouse } as MouseClickMsg
}
