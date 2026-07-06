import type { KeyMod } from "./mod"
import type { MouseMode } from "./program"
import { ModCtrl, ModAlt, ModShift, ModMeta } from "./mod"

export type Msg = Record<string, any> | null

export const ErrProgramPanic = new Error("program experienced a panic")
export const ErrProgramKilled = new Error("program was killed")
export const ErrInterrupted = new Error("program was interrupted")

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
    const codeStr = this.code <= 0x10FFFF ? String.fromCodePoint(this.code) : ""
    if (this.text || codeStr) parts.push(this.text || codeStr)
    return parts.join("+")
  }
}

export class KeyPressMsg extends Key {
  key(): Key {
    return new Key(this.text, this.mod, this.code, this.shiftedCode, this.baseCode, this.isRepeat, this.name)
  }
}

export class KeyReleaseMsg extends Key {
  key(): Key {
    return new Key(this.text, this.mod, this.code, this.shiftedCode, this.baseCode, this.isRepeat, this.name)
  }
}

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

export function NewCursor(x: number, y: number, shape: CursorShape = "block"): Cursor {
  return { x, y, shape, blink: false }
}

export function NewProgressBar(state: ProgressBarState, value: number): ProgressBar {
  return { state, value: Math.max(0, Math.min(value, 100)) }
}

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
  SetContent(s: string): void
}

export function NewView(content: string): View {
  return CreateView(content)
}

export function CreateView(content: string): View {
  const v: View = {
    content,
    altScreen: false,
    mouseMode: "none" as MouseMode,
    keyboardEnhancements: {
      reportEventTypes: false,
      reportAlternateKeys: false,
      reportAllKeysAsEscapeCodes: false,
      reportAssociatedText: false,
    },
    reportFocus: false,
    disableBracketedPasteMode: false,
    SetContent(s: string) { this.content = s },
  }
  return v
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
export const MouseButton10 = 10
export const MouseButton11 = 11

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
  mouseMode?: MouseMode
  fps?: number
  input?: NodeJS.ReadStream
  output?: NodeJS.WriteStream
  signalHandler?: boolean
  catchPanics?: boolean
  filter?: (msg: any) => any
  context?: AbortSignal
  env?: Record<string, string>
  colorProfile?: number
  windowSize?: { width: number; height: number }
  renderer?: boolean
}

export const ColorProfileNoColor = 0
export const ColorProfileAscii = 1
export const ColorProfileTrueColor = 2

// Command-return message types (handled by Program.send())
export interface ClearScreenMsg { type: "clearScreen" }
export interface RequestBackgroundColorMsg { type: "requestBackgroundColor" }
export interface RequestForegroundColorMsg { type: "requestForegroundColor" }
export interface RequestCursorColorMsg { type: "requestCursorColor" }
export interface RequestCursorPositionMsg { type: "requestCursorPosition" }
export interface ReadClipboardMsg { type: "readClipboard" }
export interface SetClipboardMsg { type: "setClipboard"; content: string }
export interface ReadPrimaryClipboardMsg { type: "readPrimaryClipboard" }
export interface SetPrimaryClipboardMsg { type: "setPrimaryClipboard"; content: string }
export interface EnableKeyboardEnhancementsMsg { type: "enableKeyboardEnhancements" }
export interface DisableKeyboardEnhancementsMsg { type: "disableKeyboardEnhancements" }
export interface EnterAltScreenMsg { type: "enterAltScreen" }
export interface ExitAltScreenMsg { type: "exitAltScreen" }
export interface MoveCursorMsg { type: "moveCursor"; x: number; y: number }
export interface HideCursorMsg { type: "hideCursor" }
export interface ShowCursorMsg { type: "showCursor" }
export interface SetCursorShapeMsg { type: "setCursorShape"; shape: string }
export interface SetWindowTitleMsg { type: "setWindowTitle"; title: string }
export interface EnableMouseCellMotionMsg { type: "enableMouseCellMotion" }
export interface EnableMouseAllMotionMsg { type: "enableMouseAllMotion" }
export interface DisableMouseMsg { type: "disableMouse" }
export interface EnableBracketedPasteMsg { type: "enableBracketedPaste" }
export interface DisableBracketedPasteMsg { type: "disableBracketedPaste" }
export interface EnableReportFocusMsg { type: "enableReportFocus" }
export interface DisableReportFocusMsg { type: "disableReportFocus" }

// Union of all system messages handled by Program.send()
export type SystemMsg =
  | BatchMsg | SequenceMsg | PrintMsg | RawMsg
  | ClearScreenMsg | RequestBackgroundColorMsg | RequestForegroundColorMsg
  | RequestCursorColorMsg | ReadClipboardMsg | SetClipboardMsg
  | ReadPrimaryClipboardMsg | SetPrimaryClipboardMsg
  | RequestCursorPositionMsg | EnableKeyboardEnhancementsMsg
  | DisableKeyboardEnhancementsMsg | ModeReportMsg
  | EnterAltScreenMsg | ExitAltScreenMsg
  | MoveCursorMsg | HideCursorMsg | ShowCursorMsg
  | SetCursorShapeMsg | SetWindowTitleMsg
  | EnableMouseCellMotionMsg | EnableMouseAllMotionMsg | DisableMouseMsg
  | EnableBracketedPasteMsg | DisableBracketedPasteMsg
  | EnableReportFocusMsg | DisableReportFocusMsg

// Known user-facing message types (not system messages)
type UserType = "key" | "mouse" | "mouseClick" | "mouseRelease" | "mouseMotion"
  | "mouseWheel" | "windowSize" | "cursorPosition" | "focus" | "blur"
  | "paste" | "pasteStart" | "pasteEnd" | "quit" | "suspend" | "resume"
  | "interrupt" | "tick" | "colorProfile" | "capability" | "env"

const SYSTEM_TYPES = new Set<string>([
  "batch", "sequence", "print", "raw", "clearScreen",
  "requestBackgroundColor", "requestForegroundColor", "requestCursorColor",
  "readClipboard", "setClipboard", "readPrimaryClipboard", "setPrimaryClipboard",
  "requestCursorPosition", "enableKeyboardEnhancements", "disableKeyboardEnhancements",
  "modeReport", "enterAltScreen", "exitAltScreen", "moveCursor",
  "hideCursor", "showCursor", "setCursorShape", "setWindowTitle",
  "enableMouseCellMotion", "enableMouseAllMotion", "disableMouse",
  "enableBracketedPaste", "disableBracketedPaste",
  "enableReportFocus", "disableReportFocus",
])

export function isSystemMsg(msg: Msg): msg is SystemMsg {
  if (msg == null) return false
  const t = (msg as Record<string, any>).type
  return typeof t === "string" && SYSTEM_TYPES.has(t)
}
