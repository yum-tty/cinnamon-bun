// types.ts | core types (bubbletea port)

import type { KeyMod } from "./mod"
import { ModCtrl, ModAlt, ModShift, ModMeta } from "./mod"

export type Msg = Record<string, any> | null

// Error sentinels
export const ErrProgramPanic = new Error("program experienced a panic")
export const ErrProgramKilled = new Error("program was killed")
export const ErrInterrupted = new Error("program was interrupted")

// Key represents a key press or release event.
export class Key {
  type: string
  name: string
  text: string
  mod: KeyMod
  code: number
  shiftedCode: number
  baseCode: number
  isRepeat: boolean

  get ctrl(): boolean { return !!(this.mod & ModCtrl) }
  get alt(): boolean { return !!(this.mod & ModAlt) }
  get shift(): boolean { return !!(this.mod & ModShift) }
  get meta(): boolean { return !!(this.mod & ModMeta) }

  constructor(
    text: string = "",
    mod: KeyMod = 0,
    code: number = 0,
    shiftedCode: number = 0,
    baseCode: number = 0,
    isRepeat: boolean = false,
    name: string = "",
  ) {
    this.type = "key"
    this.name = name
    this.text = text
    this.mod = mod
    this.code = code
    this.shiftedCode = shiftedCode
    this.baseCode = baseCode
    this.isRepeat = isRepeat
  }

  string(): string {
    if (this.text) return this.text
    return this.keystroke()
  }

  keystroke(): string {
    const parts: string[] = []
    if (this.mod & ModCtrl) parts.push("ctrl")
    if (this.mod & ModAlt) parts.push("alt")
    if (this.mod & ModShift) parts.push("shift")
    const codeStr = String.fromCodePoint(this.code)
    if (this.text || codeStr) parts.push(this.text || codeStr)
    return parts.join("+")
  }
}

// KeyPressMsg represents a key press message.
export class KeyPressMsg extends Key {
  key(): Key {
    return new Key(this.text, this.mod, this.code, this.shiftedCode, this.baseCode, this.isRepeat, this.name)
  }
}

// KeyReleaseMsg represents a key release message.
export class KeyReleaseMsg extends Key {
  key(): Key {
    return new Key(this.text, this.mod, this.code, this.shiftedCode, this.baseCode, this.isRepeat, this.name)
  }
}

// KeyMsg represents a key event (press or release).
export interface KeyMsg {
  string(): string
  key(): Key
}

export type CursorShape = "block" | "underline" | "bar"

export interface Cursor {
  x: number
  y: number
  color?: string
  shape: CursorShape
  blink: boolean
}

export interface Position {
  x: number
  y: number
}

// ProgressBarState represents the state of the progress bar.
export enum ProgressBarState {
  None = 0,
  Default,
  Error,
  Indeterminate,
  Warning,
}

export interface ProgressBar {
  state: ProgressBarState
  value: number
}

export function NewProgressBar(state: ProgressBarState, value: number): ProgressBar {
  return { state, value: Math.max(0, Math.min(value, 100)) }
}

export type MouseMode = "none" | "cell" | "all"

export interface QuitMsg {
  type: "quit"
}

export interface SuspendMsg {
  type: "suspend"
}

export interface ResumeMsg {
  type: "resume"
}

export interface InterruptMsg {
  type: "interrupt"
}

export interface KeyboardEnhancements {
  reportEventTypes: boolean
  reportAlternateKeys: boolean
  reportAllKeysAsEscapeCodes: boolean
  reportAssociatedText: boolean
}

export interface View {
  content: string
  altScreen: boolean
  mouseMode: MouseMode
  cursor?: Cursor
  backgroundColor?: string
  foregroundColor?: string
  windowTitle?: string
  progressBar?: ProgressBar
  keyboardEnhancements: KeyboardEnhancements
  reportFocus: boolean
  disableBracketedPasteMode: boolean
  onMouse?: (msg: MouseMsg) => Msg | null
}

export function CreateView(content: string): View {
  return {
    content,
    altScreen: false,
    mouseMode: "none",
    keyboardEnhancements: {
      reportEventTypes: false,
      reportAlternateKeys: false,
      reportAllKeysAsEscapeCodes: false,
      reportAssociatedText: false,
    },
    reportFocus: false,
    disableBracketedPasteMode: false,
  }
}

export const MouseNone = 0
export const MouseLeft = 1
export const MouseMiddle = 2
export const MouseRight = 3
export const MouseWheelUp = 4
export const MouseWheelDown = 5
export const MouseWheelLeft = 6
export const MouseWheelRight = 7
export const MouseBackward = 8
export const MouseForward = 9

export type MouseButton = number

export interface Mouse {
  x: number
  y: number
  button: MouseButton
  alt: boolean
  ctrl: boolean
  shift: boolean
}

export interface MouseMsgBase {
  mouse: Mouse
}

export interface MouseMsg extends MouseMsgBase {
  type: "mouse"
}

export interface MouseClickMsg extends MouseMsgBase {
  type: "mouseClick"
}

export interface MouseReleaseMsg extends MouseMsgBase {
  type: "mouseRelease"
}

export interface MouseMotionMsg extends MouseMsgBase {
  type: "mouseMotion"
}

export interface MouseWheelMsg extends MouseMsgBase {
  type: "mouseWheel"
}

export type MouseMsgAll = MouseMsg | MouseClickMsg | MouseReleaseMsg | MouseMotionMsg | MouseWheelMsg

export interface WindowSizeMsg {
  type: "windowSize"
  width: number
  height: number
}

export interface CursorPositionMsg {
  type: "cursorPosition"
  x: number
  y: number
}

export interface FocusMsg {
  type: "focus"
}

export interface BlurMsg {
  type: "blur"
}

export interface PasteMsg {
  type: "paste"
  content: string
}

export interface PasteStartMsg {
  type: "pasteStart"
}

export interface PasteEndMsg {
  type: "pasteEnd"
}

export type Cmd = (() => Msg | Promise<Msg>) | null

export interface Model {
  init(): [Model, Cmd]
  update(msg: Msg): [Model, Cmd]
  view(): View
}

export interface BatchMsg {
  type: "batch"
  cmds: Cmd[]
}

export interface SequenceMsg {
  type: "sequence"
  cmds: Cmd[]
}

export interface TickMsg {
  type: "tick"
  data: any
}

export interface PrintMsg {
  type: "print"
  text: string
}

export interface RawMsg {
  type: "raw"
  msg: any
}

export interface ColorProfileMsg {
  type: "colorProfile"
  profile: number
}

export interface ModeReportMsg {
  type: "modeReport"
  mode: number
  value: number
}

export interface CapabilityMsg {
  type: "capability"
  content: string
}

export interface ExecCommand {
  run(): Promise<void>
  setStdin(reader: any): void
  setStdout(writer: any): void
  setStderr(writer: any): void
}

export type ExecCallback = (error: Error | null) => Msg

export class EnvMsg extends Map<string, string> {
  constructor(env: Record<string, string> = process.env as Record<string, string>) {
    super(Object.entries(env))
  }

  getEnv(key: string): string {
    return this.get(key) ?? ""
  }

  lookupEnv(key: string): [string, boolean] {
    const value = this.get(key)
    return value !== undefined ? [value, true] : ["", false]
  }
}

export interface ProgramConfig {
  model: Model
  altScreen?: boolean
  mouseMode?: "none" | "cell" | "all"
  fps?: number
}

export const ColorProfileNoColor = 0
export const ColorProfileAscii = 1
export const ColorProfileTrueColor = 2
