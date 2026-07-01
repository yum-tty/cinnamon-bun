// input.ts | terminal input handling (raw mode)

import { KeyPressMsg } from "./types"
import type { KeyMod } from "./mod"
import { ModCtrl, ModShift, ModAlt, ModMeta } from "./mod"
import {
  KeyUp, KeyDown, KeyRight, KeyLeft, KeyHome, KeyEnd,
  KeyPgUp, KeyPgDown, KeyInsert, KeyDelete, KeySelect, KeyFind,
  KeyF1, KeyF2, KeyF3, KeyF4, KeyF5, KeyF6, KeyF7, KeyF8,
  KeyF9, KeyF10, KeyF11, KeyF12,
  KeyTab, KeyEnter, KeySpace, KeyBackspace, KeyEscape,
} from "./key-constants"

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
  if (mod & 1) result |= ModShift
  if (mod & 2) result |= ModAlt
  if (mod & 4) result |= ModCtrl
  if (mod & 8) result |= ModMeta
  if (mod & 16) result |= 1 << 4
  if (mod & 32) result |= 1 << 5
  return result
}

function parseParams(seq: string): number[] {
  const inner = seq.slice(2, -1)
  if (inner.length === 0) return []
  return inner.split(";").map((s) => parseInt(s, 10) || 0)
}

const nameToCode: Record<string, number> = {
  up: KeyUp, down: KeyDown, right: KeyRight, left: KeyLeft,
  home: KeyHome, end: KeyEnd, pageup: KeyPgUp, pagedown: KeyPgDown,
  insert: KeyInsert, delete: KeyDelete, select: KeySelect, find: KeyFind,
  f1: KeyF1, f2: KeyF2, f3: KeyF3, f4: KeyF4, f5: KeyF5, f6: KeyF6,
  f7: KeyF7, f8: KeyF8, f9: KeyF9, f10: KeyF10, f11: KeyF11, f12: KeyF12,
  tab: KeyTab, enter: KeyEnter, backspace: KeyBackspace, escape: KeyEscape, space: KeySpace,
}

function makeKey(name: string, mod: KeyMod, text: string = "", sequence: string = ""): KeyPressMsg {
  const code = nameToCode[name] ?? (text.length === 1 ? text.charCodeAt(0) : 0)
  return new KeyPressMsg(text, mod, code, 0, 0, false, name)
}

function makeKeyFromCSI(name: string, data: string): KeyPressMsg {
  const params = parseParams(data)
  const mod = modFromParams(params)
  return makeKey(name, mod)
}

export function readKey(data: string): KeyPressMsg {
  const sequence = data

  if (data === "\x03") return makeKey("c", ModCtrl, "", sequence)
  if (data === "\x04") return makeKey("d", ModCtrl, "", sequence)
  if (data === "\x1a") return makeKey("z", ModCtrl, "", sequence)
  if (data === "\x13") return makeKey("s", ModCtrl, "", sequence)
  if (data === "\x01") return makeKey("a", ModCtrl, "", sequence)
  if (data === "\x05") return makeKey("e", ModCtrl, "", sequence)
  if (data === "\x06") return makeKey("f", ModCtrl, "", sequence)
  if (data === "\x02") return makeKey("b", ModCtrl, "", sequence)
  if (data === "\x0e") return makeKey("n", ModCtrl, "", sequence)
  if (data === "\x10") return makeKey("p", ModCtrl, "", sequence)
  if (data === "\x17") return makeKey("w", ModCtrl, "", sequence)
  if (data === "\x0b") return makeKey("k", ModCtrl, "", sequence)
  if (data === "\x0c") return makeKey("l", ModCtrl, "", sequence)

  if (data.startsWith("\x1b[<")) {
    return makeKey("unknown", 0, "", sequence)
  }

  if (data.match(/^\x1b\[1;(\d+)A$/)) return makeKeyFromCSI("up", data)
  if (data.match(/^\x1b\[1;(\d+)B$/)) return makeKeyFromCSI("down", data)
  if (data.match(/^\x1b\[1;(\d+)C$/)) return makeKeyFromCSI("right", data)
  if (data.match(/^\x1b\[1;(\d+)D$/)) return makeKeyFromCSI("left", data)
  if (data === "\x1b[A") return makeKey("up", 0, "", sequence)
  if (data === "\x1b[B") return makeKey("down", 0, "", sequence)
  if (data === "\x1b[C") return makeKey("right", 0, "", sequence)
  if (data === "\x1b[D") return makeKey("left", 0, "", sequence)

  if (data.match(/^\x1b\[1;(\d+)H$/)) return makeKeyFromCSI("home", data)
  if (data === "\x1b[H" || data === "\x1b[1~") return makeKey("home", 0, "", sequence)
  if (data.match(/^\x1b\[1;(\d+)F$/)) return makeKeyFromCSI("end", data)
  if (data === "\x1b[F" || data === "\x1b[4~") return makeKey("end", 0, "", sequence)

  if (data.match(/^\x1b\[5;(\d+)~$/)) return makeKeyFromCSI("pageup", data)
  if (data === "\x1b[5~") return makeKey("pageup", 0, "", sequence)
  if (data.match(/^\x1b\[6;(\d+)~$/)) return makeKeyFromCSI("pagedown", data)
  if (data === "\x1b[6~") return makeKey("pagedown", 0, "", sequence)

  if (data.match(/^\x1b\[3;(\d+)~$/)) return makeKeyFromCSI("delete", data)
  if (data === "\x1b[3~") return makeKey("delete", 0, "", sequence)

  if (data.match(/^\x1b\[2;(\d+)~$/)) return makeKeyFromCSI("insert", data)
  if (data === "\x1b[2~") return makeKey("insert", 0, "", sequence)

  if (data.match(/^\x1bOP$/)) return makeKey("f1", 0, "", sequence)
  if (data.match(/^\x1bOQ$/)) return makeKey("f2", 0, "", sequence)
  if (data.match(/^\x1bOR$/)) return makeKey("f3", 0, "", sequence)
  if (data.match(/^\x1bOS$/)) return makeKey("f4", 0, "", sequence)
  if (data.match(/^\x1b\[15~$/)) return makeKey("f5", 0, "", sequence)
  if (data.match(/^\x1b\[17~$/)) return makeKey("f6", 0, "", sequence)
  if (data.match(/^\x1b\[18~$/)) return makeKey("f7", 0, "", sequence)
  if (data.match(/^\x1b\[19~$/)) return makeKey("f8", 0, "", sequence)
  if (data.match(/^\x1b\[20~$/)) return makeKey("f9", 0, "", sequence)
  if (data.match(/^\x1b\[21~$/)) return makeKey("f10", 0, "", sequence)
  if (data.match(/^\x1b\[23~$/)) return makeKey("f11", 0, "", sequence)
  if (data.match(/^\x1b\[24~$/)) return makeKey("f12", 0, "", sequence)
  if (data.match(/^\x1b\[1;(\d+)P$/)) return makeKeyFromCSI("f1", data)
  if (data.match(/^\x1b\[1;(\d+)Q$/)) return makeKeyFromCSI("f2", data)
  if (data.match(/^\x1b\[1;(\d+)R$/)) return makeKeyFromCSI("f3", data)
  if (data.match(/^\x1b\[1;(\d+)S$/)) return makeKeyFromCSI("f4", data)
  if (data.match(/^\x1b\[15;(\d+)~$/)) return makeKeyFromCSI("f5", data)
  if (data.match(/^\x1b\[17;(\d+)~$/)) return makeKeyFromCSI("f6", data)
  if (data.match(/^\x1b\[18;(\d+)~$/)) return makeKeyFromCSI("f7", data)
  if (data.match(/^\x1b\[19;(\d+)~$/)) return makeKeyFromCSI("f8", data)
  if (data.match(/^\x1b\[20;(\d+)~$/)) return makeKeyFromCSI("f9", data)
  if (data.match(/^\x1b\[21;(\d+)~$/)) return makeKeyFromCSI("f10", data)
  if (data.match(/^\x1b\[23;(\d+)~$/)) return makeKeyFromCSI("f11", data)
  if (data.match(/^\x1b\[24;(\d+)~$/)) return makeKeyFromCSI("f12", data)

  if (data === "\t") return makeKey("tab", 0, "", sequence)
  if (data === "\x1b[Z") return makeKey("tab", ModShift, "", sequence)
  if (data === "\r" || data === "\n") return makeKey("enter", 0, "", sequence)
  if (data === "\x7f" || data === "\b") return makeKey("backspace", 0, "", sequence)
  if (data === "\x1b") return makeKey("escape", 0, "", sequence)
  if (data === " ") return makeKey("space", 0, " ", sequence)

  if (data.length === 1) {
    const char = data
    const isUpper = char >= "A" && char <= "Z"
    const mod = isUpper ? ModShift : 0
    return makeKey(char.toLowerCase(), mod, char, sequence)
  }

  if (data.length === 2 && data[0] === "\x1b") {
    const char = data[1]!
    const isUpper = char >= "A" && char <= "Z"
    const mod = ModAlt | (isUpper ? ModShift : 0)
    return makeKey(char.toLowerCase(), mod, char, sequence)
  }

  if (data === "\x1b[I") {
    return new KeyPressMsg("", 0, 0, 0, 0, false, "focus")
  }
  if (data === "\x1b[O") {
    return new KeyPressMsg("", 0, 0, 0, 0, false, "blur")
  }

  return makeKey("unknown", 0, "", sequence)
}

export function parseMouse(data: string): any | null {
  const match = data.match(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/)
  if (!match) return null

  const rawButton = parseInt(match[1]!)
  const col = parseInt(match[2]!) - 1
  const row = parseInt(match[3]!) - 1
  const released = match[4] === "m"

  const buttonType = rawButton & 3
  const isWheel = !!(rawButton & 64)
  const isMotion = !!(rawButton & 32)

  let button: number = 0 // MouseNone
  if (isWheel) {
    if (buttonType === 0) button = 4  // MouseWheelUp
    else if (buttonType === 1) button = 5  // MouseWheelDown
    else if (buttonType === 2) button = 6  // MouseWheelLeft
    else if (buttonType === 3) button = 7  // MouseWheelRight
  } else {
    if (buttonType === 0) button = 1  // MouseLeft
    else if (buttonType === 1) button = 2  // MouseMiddle
    else if (buttonType === 2) button = 3  // MouseRight
    else if (buttonType === 3) button = 0  // MouseNone
  }

  if (released) button = 0

  const modBits = (rawButton >> 2) & 7
  const mouse = {
    x: col,
    y: row,
    button,
    alt: !!(modBits & 1),
    ctrl: !!(modBits & 4),
    shift: !!(modBits & 2),
  }

  if (isMotion) {
    return { type: "mouseMotion", mouse }
  }

  if (isWheel) {
    return { type: "mouseWheel", mouse }
  }

  if (released) {
    return { type: "mouseRelease", mouse }
  }

  return { type: "mouseClick", mouse }
}
