// types.ts | core types (bubbletea port)

/**
 * Msg is any message from the runtime or user.
 */
export type Msg = Record<string, any> | null

/**
 * KeyMsg represents a keyboard event.
 */
export interface KeyMsg {
  type: "key"
  name: string
  ctrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
  sequence: string
  rune?: string
}

/**
 * CursorShape represents a terminal cursor shape.
 */
export type CursorShape = "block" | "underline" | "bar"

/**
 * Cursor represents a cursor on the terminal screen.
 */
export interface Cursor {
  x: number
  y: number
  color?: string
  shape: CursorShape
  blink: boolean
}

/**
 * Position represents a position in the terminal.
 */
export interface Position {
  x: number
  y: number
}

/**
 * ProgressBarState represents the state of the progress bar.
 */
export type ProgressBarState = "none" | "default" | "error" | "indeterminate" | "warning"

/**
 * ProgressBar represents the terminal progress bar.
 */
export interface ProgressBar {
  state: ProgressBarState
  value: number
}

/**
 * MouseMode represents the mouse mode of a view.
 */
export type MouseMode = "none" | "cell" | "all"

/**
 * QuitMsg signals that the program should quit.
 * You can send a QuitMsg with Quit.
 */
export interface QuitMsg {
  type: "quit"
}

/**
 * SuspendMsg signals the program should suspend.
 */
export interface SuspendMsg {
  type: "suspend"
}

/**
 * ResumeMsg is sent when a program resumes from a suspend state.
 */
export interface ResumeMsg {
  type: "resume"
}

/**
 * InterruptMsg signals the program should interrupt.
 */
export interface InterruptMsg {
  type: "interrupt"
}

/**
 * KeyboardEnhancements describes what keyboard enhancement features
 * should be requested from the terminal.
 */
export interface KeyboardEnhancements {
  reportEventTypes: boolean
  reportAlternateKeys: boolean
  reportAllKeysAsEscapeCodes: boolean
  reportAssociatedText: boolean
}

/**
 * View represents a terminal view.
 */
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

/**
 * CreateView creates a new View with the given content.
 */
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

/**
 * Mouse button constants (X11 codes).
 */
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

/**
 * MouseButton represents the button that was pressed during a mouse message.
 */
export type MouseButton = number

/**
 * Mouse represents a mouse message.
 */
export interface Mouse {
  x: number
  y: number
  button: MouseButton
  alt: boolean
  ctrl: boolean
  shift: boolean
}

/**
 * MouseMsg represents a mouse message.
 */
export interface MouseMsg {
  type: "mouse"
  mouse: Mouse
}

/**
 * MouseClickMsg represents a mouse button click message.
 */
export interface MouseClickMsg {
  type: "mouseClick"
  mouse: Mouse
}

/**
 * MouseReleaseMsg represents a mouse button release message.
 */
export interface MouseReleaseMsg {
  type: "mouseRelease"
  mouse: Mouse
}

/**
 * MouseMotionMsg represents a mouse motion message.
 */
export interface MouseMotionMsg {
  type: "mouseMotion"
  mouse: Mouse
}

/**
 * MouseWheelMsg represents a mouse wheel message.
 */
export interface MouseWheelMsg {
  type: "mouseWheel"
  mouse: Mouse
}

/**
 * WindowSizeMsg is sent when the terminal is resized.
 */
export interface WindowSizeMsg {
  type: "windowSize"
  width: number
  height: number
}

/**
 * CursorPositionMsg represents the terminal cursor position.
 */
export interface CursorPositionMsg {
  type: "cursorPosition"
  x: number
  y: number
}

/**
 * FocusMsg represents terminal focus.
 */
export interface FocusMsg {
  type: "focus"
}

/**
 * BlurMsg represents terminal blur.
 */
export interface BlurMsg {
  type: "blur"
}

/**
 * PasteMsg represents pasted text.
 */
export interface PasteMsg {
  type: "paste"
  content: string
}

/**
 * PasteStartMsg represents the start of bracketed paste.
 */
export interface PasteStartMsg {
  type: "pasteStart"
}

/**
 * PasteEndMsg represents the end of bracketed paste.
 */
export interface PasteEndMsg {
  type: "pasteEnd"
}

/**
 * Cmd is an IO operation that returns a message when complete.
 */
export type Cmd = (() => Msg | Promise<Msg>) | null

/**
 * Model is the core interface for bubble tea components.
 */
export interface Model {
  /**
   * Init is called once at the start.
   * Returns initial command to run.
   */
  init(): [Model, Cmd]

  /**
   * Update is called when a message is received.
   * Returns updated model and optional command.
   */
  update(msg: Msg): [Model, Cmd]

  /**
   * View renders the UI.
   * Returns a View object with content and display options.
   */
  view(): View
}

/**
 * BatchMsg performs multiple commands concurrently.
 */
export interface BatchMsg {
  type: "batch"
  cmds: Cmd[]
}

/**
 * SequenceMsg runs commands in order.
 */
export interface SequenceMsg {
  type: "sequence"
  cmds: Cmd[]
}

/**
 * TickMsg is sent after a delay.
 */
export interface SequenceMsg {
  type: "sequence"
  cmds: Cmd[]
}

/**
 * QuitMsg signals the program should quit.
 */
export interface QuitMsg {
  type: "quit"
}

/**
 * TickMsg is sent after a delay.
 */
export interface TickMsg {
  type: "tick"
  data: any
}

/**
 * PrintMsg prints text above the UI.
 */
export interface PrintMsg {
  type: "print"
  text: string
}

/**
 * ExecCommand can be implemented to execute things in a blocking fashion.
 */
export interface ExecCommand {
  run(): Promise<void>
  setStdin(reader: any): void
  setStdout(writer: any): void
  setStderr(writer: any): void
}

/**
 * ExecCallback is used when executing an ExecCommand.
 */
export type ExecCallback = (error: Error | null) => Msg

/**
 * EnvMsg represents environment variables.
 */
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

/**
 * ProgramConfig is the configuration for creating a new program.
 */
export interface ProgramConfig {
  model: Model
  altScreen?: boolean
  mouseMode?: "none" | "cell" | "all"
  fps?: number
}
