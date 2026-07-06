import { describe, it, expect } from "bun:test"
import {
  NewProgram,
  Quit,
  Batch,
  Sequence,
  Every,
  Tick,
  Print,
  Println,
  Printf,
  CreateView,
  NewView,
  ShowCursor,
  HideCursor,
  EnterAltScreen,
  ExitAltScreen,
  EnableMouseCellMotion,
  DisableMouse,
  ClearScreen,
  MoveCursor,
  SetCursorShape,
  SetWindowTitle,
  Key,
  KeyPressMsg,
  KeyReleaseMsg,
  RequestWindowSize,
  RequestCursorPosition,
  ErrProgramPanic,
  ErrProgramKilled,
  ErrInterrupted,
  MouseLeft,
  MouseMiddle,
  MouseRight,
  MouseWheelUp,
  MouseWheelDown,
  MouseWheelLeft,
  MouseWheelRight,
  MouseBackward,
  MouseForward,
  MouseNone,
  ColorProfileNoColor,
  ColorProfileAscii,
  ColorProfileTrueColor,
  WithAltScreen,
  WithoutAltScreen,
  WithMouseCellMotion,
  WithMouseAllMotion,
  WithFPS,
  WithoutRenderer,
  WithInput,
  WithOutput,
  WithoutSignalHandler,
  WithoutCatchPanics,
  WithFilter,
  WithContext,
  WithEnvironment,
  WithColorProfile,
  WithoutSignals,
  WithWindowSize,
  EnableBracketedPaste,
  DisableBracketedPaste,
  EnableMouseAllMotion,
  EnableReportFocus,
  DisableReportFocus,
  Exec,
  Raw,
  ExecProcess,
  RequestTerminalVersion,
  RequestCapability,
  ShowCursor as ShowCursorCmd,
  HideCursor as HideCursorCmd,
  EnterAltScreen as EnterAltScreenCmd,
  ExitAltScreen as ExitAltScreenCmd,
  ClearScreen as ClearScreenCmd,
  MoveCursor as MoveCursorCmd,
  SetCursorShape as SetCursorShapeCmd,
  SetWindowTitle as SetWindowTitleCmd,
  MouseMode,
} from "../src"
import type { Model, Msg, Cmd, View, ProgramConfig } from "../src"
import {
  ModShift,
  ModAlt,
  ModCtrl,
  ModMeta,
  ModHyper,
  ModSuper,
  ModCapsLock,
  ModNumLock,
  ModScrollLock,
  modContains,
} from "../src/mod"
import {
  ColorProfile,
  detectColorProfile,
  profileFromNumber,
  profileToNumber,
  downsampleColor,
} from "../src/color-profile"
import { ProgressBarState, NewProgressBar, EnvMsg, MouseNone as MouseNoneConst } from "../src/types"

// Minimal Model for tests
class TestModel implements Model {
  constructor(public data: string = "init") {}
  init(): [Model, Cmd] {
    return [this, null]
  }
  update(msg: Msg): [Model, Cmd] {
    return [this, null]
  }
  view(): View {
    return CreateView(this.data)
  }
}

function dummyModel(): TestModel {
  return new TestModel()
}

// ─── 1. NewProgram ────────────────────────────────────────────────────────

describe("NewProgram", () => {
  it("creates a Program instance", () => {
    const p = NewProgram({ model: dummyModel() })
    expect(p).toBeDefined()
    expect(p).toBeInstanceOf(Object)
  })

  it("accepts altScreen option", () => {
    const p = NewProgram({ model: dummyModel(), altScreen: false })
    expect(p).toBeDefined()
  })

  it("accepts mouseMode option", () => {
    const p = NewProgram({ model: dummyModel(), mouseMode: MouseMode.Cell })
    expect(p).toBeDefined()
  })

  it("accepts fps option", () => {
    const p = NewProgram({ model: dummyModel(), fps: 30 })
    expect(p).toBeDefined()
  })
})

// ─── 2. Commands: Quit, Batch, Sequence, Every, Tick ──────────────────────

describe("Quit", () => {
  it("returns a command function", () => {
    const cmd = Quit()
    expect(typeof cmd).toBe("function")
  })

  it("returns a quit message when invoked", () => {
    const cmd = Quit()
    const msg = cmd!()
    expect(msg).toEqual({ type: "quit" })
  })
})

describe("Batch", () => {
  it("returns null for no commands", () => {
    expect(Batch()).toBeNull()
  })

  it("returns the single command when given one", () => {
    const cmd = Quit()
    expect(Batch(cmd)).toBe(cmd)
  })

  it("returns a batch message when given multiple commands", () => {
    const cmd1 = Quit()
    const cmd2 = Quit()
    const batch = Batch(cmd1, cmd2)
    expect(batch).toBeDefined()
    expect(typeof batch).toBe("function")
    const msg = batch!()
    expect(msg).toHaveProperty("type", "batch")
    expect((msg as any).cmds).toHaveLength(2)
  })

  it("filters out null commands and unwraps single", () => {
    const batch = Batch(null, Quit(), null)
    expect(batch).toBeDefined()
    const msg = batch!()
    // After filtering nulls, only 1 cmd remains → Batch returns it directly
    expect(msg).toEqual({ type: "quit" })
  })
})

describe("Sequence", () => {
  it("returns null for no commands", () => {
    expect(Sequence()).toBeNull()
  })

  it("returns the single command when given one", () => {
    const cmd = Quit()
    expect(Sequence(cmd)).toBe(cmd)
  })

  it("returns a sequence message when given multiple commands", () => {
    const seq = Sequence(Quit(), Quit())
    expect(seq).toBeDefined()
    const msg = seq!()
    expect(msg).toHaveProperty("type", "sequence")
    expect((msg as any).cmds).toHaveLength(2)
  })
})

describe("Every", () => {
  it("returns a command function", () => {
    const cmd = Every(1000, (data) => ({ type: "tick", data }))
    expect(typeof cmd).toBe("function")
  })

  it("resolves with a message after the interval", async () => {
    const cmd = Every(50, (data) => ({ type: "tick", data }))
    const msg = await cmd!()
    expect(msg).toHaveProperty("type", "tick")
  })
})

describe("Tick", () => {
  it("returns a command function", () => {
    const cmd = Tick(1000, (data) => ({ type: "tick", data }))
    expect(typeof cmd).toBe("function")
  })

  it("resolves with a message after the delay", async () => {
    const cmd = Tick(10, (data) => ({ type: "tick", data }))
    const msg = await cmd!()
    expect(msg).toHaveProperty("type", "tick")
  })
})

// ─── 3. Print, Println, Printf ────────────────────────────────────────────

describe("Print", () => {
  it("returns a command function", () => {
    const cmd = Print("hello")
    expect(typeof cmd).toBe("function")
  })

  it("returns a print message", () => {
    const cmd = Print("hello world")
    const msg = cmd!()
    expect(msg).toEqual({ type: "print", text: "hello world" })
  })
})

describe("Println", () => {
  it("returns a command function", () => {
    const cmd = Println("hello")
    expect(typeof cmd).toBe("function")
  })

  it("joins arguments with spaces", () => {
    const cmd = Println("a", "b", "c")
    const msg = cmd!()
    expect(msg).toEqual({ type: "print", text: "a b c" })
  })

  it("handles single argument", () => {
    const cmd = Println("solo")
    const msg = cmd!()
    expect(msg).toEqual({ type: "print", text: "solo" })
  })
})

describe("Printf", () => {
  it("returns a command function", () => {
    const cmd = Printf("hello %s", "world")
    expect(typeof cmd).toBe("function")
  })

  it("replaces %s with arguments", () => {
    const cmd = Printf("name: %s age: %s", "alice", 30)
    const msg = cmd!()
    expect(msg).toEqual({ type: "print", text: "name: alice age: 30" })
  })

  it("handles multiple %s placeholders", () => {
    const cmd = Printf("%s + %s = %s", 1, 2, 3)
    const msg = cmd!()
    expect(msg).toEqual({ type: "print", text: "1 + 2 = 3" })
  })
})

// ─── 4. CreateView, NewView ──────────────────────────────────────────────

describe("CreateView", () => {
  it("creates a view with the given content", () => {
    const v = CreateView("hello")
    expect(v.content).toBe("hello")
  })

  it("sets default values", () => {
    const v = CreateView("")
    expect(v.altScreen).toBe(false)
    expect(v.mouseMode).toBe(MouseMode.None)
    expect(v.reportFocus).toBe(false)
    expect(v.disableBracketedPasteMode).toBe(false)
    expect(v.keyboardEnhancements).toEqual({
      reportEventTypes: false,
      reportAlternateKeys: false,
      reportAllKeysAsEscapeCodes: false,
      reportAssociatedText: false,
    })
  })

  it("has a SetContent method that updates content", () => {
    const v = CreateView("old")
    v.SetContent("new")
    expect(v.content).toBe("new")
  })

  it("does not have cursor by default", () => {
    const v = CreateView("")
    expect(v.cursor).toBeUndefined()
  })
})

describe("NewView", () => {
  it("creates a view identical to CreateView", () => {
    const v = NewView("test")
    expect(v.content).toBe("test")
    expect(v.altScreen).toBe(false)
    expect(v.mouseMode).toBe(MouseMode.None)
  })
})

// ─── 5. ShowCursor, HideCursor, EnterAltScreen, ExitAltScreen ─────────────

describe("ShowCursor", () => {
  it("returns showCursor message", () => {
    const msg = ShowCursor()
    expect(msg).toEqual({ type: "showCursor" })
  })
})

describe("HideCursor", () => {
  it("returns hideCursor message", () => {
    const msg = HideCursor()
    expect(msg).toEqual({ type: "hideCursor" })
  })
})

describe("EnterAltScreen", () => {
  it("returns enterAltScreen message", () => {
    const msg = EnterAltScreen()
    expect(msg).toEqual({ type: "enterAltScreen" })
  })
})

describe("ExitAltScreen", () => {
  it("returns exitAltScreen message", () => {
    const msg = ExitAltScreen()
    expect(msg).toEqual({ type: "exitAltScreen" })
  })
})

// ─── 6. EnableMouseCellMotion, DisableMouse, ClearScreen ──────────────────

describe("EnableMouseCellMotion", () => {
  it("returns enableMouseCellMotion message", () => {
    const msg = EnableMouseCellMotion()
    expect(msg).toEqual({ type: "enableMouseCellMotion" })
  })
})

describe("EnableMouseAllMotion", () => {
  it("returns enableMouseAllMotion message", () => {
    const msg = EnableMouseAllMotion()
    expect(msg).toEqual({ type: "enableMouseAllMotion" })
  })
})

describe("DisableMouse", () => {
  it("returns disableMouse message", () => {
    const msg = DisableMouse()
    expect(msg).toEqual({ type: "disableMouse" })
  })
})

describe("ClearScreen", () => {
  it("returns clearScreen message", () => {
    const msg = ClearScreen()
    expect(msg).toEqual({ type: "clearScreen" })
  })
})

// ─── 7. MoveCursor, SetCursorShape, SetWindowTitle ────────────────────────

describe("MoveCursor", () => {
  it("returns moveCursor message with coordinates", () => {
    const msg = MoveCursor(5, 10)
    expect(msg).toEqual({ type: "moveCursor", x: 5, y: 10 })
  })

  it("handles zero coordinates", () => {
    const msg = MoveCursor(0, 0)
    expect(msg).toEqual({ type: "moveCursor", x: 0, y: 0 })
  })
})

describe("SetCursorShape", () => {
  it("returns setCursorShape with block", () => {
    const msg = SetCursorShape("block")
    expect(msg).toEqual({ type: "setCursorShape", shape: "block" })
  })

  it("returns setCursorShape with underline", () => {
    const msg = SetCursorShape("underline")
    expect(msg).toEqual({ type: "setCursorShape", shape: "underline" })
  })

  it("returns setCursorShape with bar", () => {
    const msg = SetCursorShape("bar")
    expect(msg).toEqual({ type: "setCursorShape", shape: "bar" })
  })
})

describe("SetWindowTitle", () => {
  it("returns setWindowTitle message", () => {
    const msg = SetWindowTitle("My App")
    expect(msg).toEqual({ type: "setWindowTitle", title: "My App" })
  })

  it("handles empty title", () => {
    const msg = SetWindowTitle("")
    expect(msg).toEqual({ type: "setWindowTitle", title: "" })
  })
})

// ─── 8. Key class ────────────────────────────────────────────────────────

describe("Key", () => {
  it("constructs with defaults", () => {
    const k = new Key()
    expect(k.type).toBe("key")
    expect(k.text).toBe("")
    expect(k.mod).toBe(0)
    expect(k.code).toBe(0)
    expect(k.ctrl).toBe(false)
    expect(k.alt).toBe(false)
    expect(k.shift).toBe(false)
    expect(k.meta).toBe(false)
  })

  it("detects ctrl modifier", () => {
    const k = new Key("c", ModCtrl)
    expect(k.ctrl).toBe(true)
    expect(k.alt).toBe(false)
  })

  it("detects alt modifier", () => {
    const k = new Key("x", ModAlt)
    expect(k.alt).toBe(true)
    expect(k.ctrl).toBe(false)
  })

  it("detects shift modifier", () => {
    const k = new Key("A", ModShift)
    expect(k.shift).toBe(true)
  })

  it("detects meta modifier", () => {
    const k = new Key("", ModMeta)
    expect(k.meta).toBe(true)
  })

  it("detects combined modifiers", () => {
    const k = new Key("x", ModCtrl | ModAlt)
    expect(k.ctrl).toBe(true)
    expect(k.alt).toBe(true)
    expect(k.shift).toBe(false)
  })

  it("string() returns text when text is set", () => {
    const k = new Key("hello")
    expect(k.string()).toBe("hello")
  })

  it("string() falls back to keystroke() when no text", () => {
    const k = new Key("", ModCtrl, 65)
    const s = k.string()
    expect(s).toContain("ctrl")
  })

  it("keystroke() includes modifier parts", () => {
    const k = new Key("x", ModCtrl | ModAlt)
    expect(k.keystroke()).toBe("ctrl+alt+x")
  })

  it("keystroke() with no modifiers returns just text/code", () => {
    const k = new Key("a")
    expect(k.keystroke()).toBe("a")
  })

  it("isRepeat defaults to false", () => {
    const k = new Key()
    expect(k.isRepeat).toBe(false)
  })

  it("isRepeat can be set to true", () => {
    const k = new Key("", 0, 0, 0, 0, true)
    expect(k.isRepeat).toBe(true)
  })

  it("name defaults to empty string", () => {
    const k = new Key()
    expect(k.name).toBe("")
  })

  it("name can be set", () => {
    const k = new Key("", 0, 0, 0, 0, false, "enter")
    expect(k.name).toBe("enter")
  })
})

// ─── 9. KeyPressMsg, KeyReleaseMsg ───────────────────────────────────────

describe("KeyPressMsg", () => {
  it("constructs with key properties", () => {
    const k = new KeyPressMsg("a", ModCtrl, 65)
    expect(k.type).toBe("key")
    expect(k.text).toBe("a")
    expect(k.ctrl).toBe(true)
  })

  it("key() returns a Key instance", () => {
    const k = new KeyPressMsg("b", ModAlt, 66)
    const key = k.key()
    expect(key).toBeInstanceOf(Key)
    expect(key.text).toBe("b")
    expect(key.alt).toBe(true)
    expect(key.code).toBe(66)
  })

  it("preserves all key properties in key()", () => {
    const k = new KeyPressMsg("x", ModShift | ModMeta, 100, 200, 300, true, "test")
    const key = k.key()
    expect(key.text).toBe("x")
    expect(key.shift).toBe(true)
    expect(key.meta).toBe(true)
    expect(key.code).toBe(100)
    expect(key.shiftedCode).toBe(200)
    expect(key.baseCode).toBe(300)
    expect(key.isRepeat).toBe(true)
    expect(key.name).toBe("test")
  })
})

describe("KeyReleaseMsg", () => {
  it("constructs with key properties", () => {
    const k = new KeyReleaseMsg("q")
    expect(k.type).toBe("key")
    expect(k.text).toBe("q")
  })

  it("key() returns a Key instance", () => {
    const k = new KeyReleaseMsg("z", ModCtrl)
    const key = k.key()
    expect(key).toBeInstanceOf(Key)
    expect(key.text).toBe("z")
    expect(key.ctrl).toBe(true)
  })
})

// ─── 10. MouseMsg and variants ───────────────────────────────────────────

describe("MouseMsg types", () => {
  const mouse = { x: 5, y: 10, button: MouseLeft, alt: false, ctrl: false, shift: false }

  it("MouseMsg has correct type", () => {
    const msg = { type: "mouse" as const, mouse }
    expect(msg.type).toBe("mouse")
    expect(msg.mouse).toEqual(mouse)
  })

  it("MouseClickMsg has correct type", () => {
    const msg = { type: "mouseClick" as const, mouse }
    expect(msg.type).toBe("mouseClick")
  })

  it("MouseReleaseMsg has correct type", () => {
    const msg = { type: "mouseRelease" as const, mouse }
    expect(msg.type).toBe("mouseRelease")
  })

  it("MouseMotionMsg has correct type", () => {
    const msg = { type: "mouseMotion" as const, mouse }
    expect(msg.type).toBe("mouseMotion")
  })

  it("MouseWheelMsg has correct type", () => {
    const msg = { type: "mouseWheel" as const, mouse }
    expect(msg.type).toBe("mouseWheel")
  })
})

// ─── 11. Options ─────────────────────────────────────────────────────────

describe("WithAltScreen", () => {
  it("returns a function", () => {
    const opt = WithAltScreen()
    expect(typeof opt).toBe("function")
  })
})

describe("WithoutAltScreen", () => {
  it("returns a function", () => {
    const opt = WithoutAltScreen()
    expect(typeof opt).toBe("function")
  })
})

describe("WithMouseCellMotion", () => {
  it("returns a function", () => {
    const opt = WithMouseCellMotion()
    expect(typeof opt).toBe("function")
  })
})

describe("WithMouseAllMotion", () => {
  it("returns a function", () => {
    const opt = WithMouseAllMotion()
    expect(typeof opt).toBe("function")
  })
})

describe("WithFPS", () => {
  it("returns a function", () => {
    const opt = WithFPS(60)
    expect(typeof opt).toBe("function")
  })
})

describe("WithoutRenderer", () => {
  it("returns a function", () => {
    const opt = WithoutRenderer()
    expect(typeof opt).toBe("function")
  })
})

describe("WithInput", () => {
  it("returns a function", () => {
    const opt = WithInput(process.stdin)
    expect(typeof opt).toBe("function")
  })
})

describe("WithOutput", () => {
  it("returns a function", () => {
    const opt = WithOutput(process.stdout)
    expect(typeof opt).toBe("function")
  })
})

describe("WithoutSignalHandler", () => {
  it("returns a function", () => {
    const opt = WithoutSignalHandler()
    expect(typeof opt).toBe("function")
  })
})

describe("WithoutCatchPanics", () => {
  it("returns a function", () => {
    const opt = WithoutCatchPanics()
    expect(typeof opt).toBe("function")
  })
})

describe("WithFilter", () => {
  it("returns a function", () => {
    const opt = WithFilter((msg) => msg)
    expect(typeof opt).toBe("function")
  })
})

describe("WithContext", () => {
  it("returns a function", () => {
    const controller = new AbortController()
    const opt = WithContext(controller.signal)
    expect(typeof opt).toBe("function")
  })
})

describe("WithEnvironment", () => {
  it("returns a function", () => {
    const opt = WithEnvironment({ FOO: "bar" })
    expect(typeof opt).toBe("function")
  })
})

describe("WithColorProfile", () => {
  it("returns a function", () => {
    const opt = WithColorProfile(ColorProfileTrueColor)
    expect(typeof opt).toBe("function")
  })
})

describe("WithoutSignals", () => {
  it("returns a function", () => {
    const opt = WithoutSignals()
    expect(typeof opt).toBe("function")
  })
})

describe("WithWindowSize", () => {
  it("returns a function", () => {
    const opt = WithWindowSize(80, 24)
    expect(typeof opt).toBe("function")
  })
})

// ─── 12. RequestWindowSize, RequestCursorPosition ────────────────────────

describe("RequestWindowSize", () => {
  it("returns requestWindowSize message", () => {
    const msg = RequestWindowSize()
    expect(msg).toEqual({ type: "requestWindowSize" })
  })
})

describe("RequestCursorPosition", () => {
  it("returns requestCursorPosition message", () => {
    const msg = RequestCursorPosition()
    expect(msg).toEqual({ type: "requestCursorPosition" })
  })
})

// ─── 13. Error values ────────────────────────────────────────────────────

describe("ErrProgramPanic", () => {
  it("is an Error instance", () => {
    expect(ErrProgramPanic).toBeInstanceOf(Error)
  })

  it("has correct message", () => {
    expect(ErrProgramPanic.message).toBe("program experienced a panic")
  })
})

describe("ErrProgramKilled", () => {
  it("is an Error instance", () => {
    expect(ErrProgramKilled).toBeInstanceOf(Error)
  })

  it("has correct message", () => {
    expect(ErrProgramKilled.message).toBe("program was killed")
  })
})

describe("ErrInterrupted", () => {
  it("is an Error instance", () => {
    expect(ErrInterrupted).toBeInstanceOf(Error)
  })

  it("has correct message", () => {
    expect(ErrInterrupted.message).toBe("program was interrupted")
  })
})

// ─── 14. Mouse constants ─────────────────────────────────────────────────

describe("Mouse constants", () => {
  it("MouseNone is 0", () => {
    expect(MouseNone).toBe(0)
  })

  it("MouseLeft is 1", () => {
    expect(MouseLeft).toBe(1)
  })

  it("MouseMiddle is 2", () => {
    expect(MouseMiddle).toBe(2)
  })

  it("MouseRight is 3", () => {
    expect(MouseRight).toBe(3)
  })

  it("MouseWheelUp is 4", () => {
    expect(MouseWheelUp).toBe(4)
  })

  it("MouseWheelDown is 5", () => {
    expect(MouseWheelDown).toBe(5)
  })

  it("MouseWheelLeft is 6", () => {
    expect(MouseWheelLeft).toBe(6)
  })

  it("MouseWheelRight is 7", () => {
    expect(MouseWheelRight).toBe(7)
  })

  it("MouseBackward is 8", () => {
    expect(MouseBackward).toBe(8)
  })

  it("MouseForward is 9", () => {
    expect(MouseForward).toBe(9)
  })
})

// ─── 15. ColorProfile constants and detection ────────────────────────────

describe("ColorProfile constants", () => {
  it("ColorProfileNoColor is 0", () => {
    expect(ColorProfileNoColor).toBe(0)
  })

  it("ColorProfileAscii is 1", () => {
    expect(ColorProfileAscii).toBe(1)
  })

  it("ColorProfileTrueColor is 2", () => {
    expect(ColorProfileTrueColor).toBe(2)
  })
})

describe("ColorProfile enum", () => {
  it("TrueColor is 2", () => {
    expect(ColorProfile.TrueColor).toBe(2)
  })

  it("ANSI256 is 1", () => {
    expect(ColorProfile.ANSI256).toBe(1)
  })

  it("ANSI is 0", () => {
    expect(ColorProfile.ANSI).toBe(0)
  })

  it("Ascii is -1", () => {
    expect(ColorProfile.Ascii).toBe(-1)
  })

  it("NoColor is -2", () => {
    expect(ColorProfile.NoColor).toBe(-2)
  })
})

describe("detectColorProfile", () => {
  it("returns a ColorProfile value", () => {
    const profile = detectColorProfile()
    expect(typeof profile).toBe("number")
    expect(Object.values(ColorProfile)).toContain(profile)
  })
})

describe("profileFromNumber", () => {
  it("maps 2 to TrueColor", () => {
    expect(profileFromNumber(2)).toBe(ColorProfile.TrueColor)
  })

  it("maps 1 to ANSI256", () => {
    expect(profileFromNumber(1)).toBe(ColorProfile.ANSI256)
  })

  it("maps 0 to ANSI", () => {
    expect(profileFromNumber(0)).toBe(ColorProfile.ANSI)
  })

  it("maps -1 to Ascii", () => {
    expect(profileFromNumber(-1)).toBe(ColorProfile.Ascii)
  })

  it("maps unknown to TrueColor", () => {
    expect(profileFromNumber(99)).toBe(ColorProfile.TrueColor)
  })
})

describe("profileToNumber", () => {
  it("returns the numeric value of a profile", () => {
    expect(profileToNumber(ColorProfile.TrueColor)).toBe(2)
    expect(profileToNumber(ColorProfile.ANSI256)).toBe(1)
    expect(profileToNumber(ColorProfile.ANSI)).toBe(0)
  })
})

describe("downsampleColor", () => {
  it("returns truecolor format for TrueColor profile", () => {
    const result = downsampleColor(ColorProfile.TrueColor, "38", 255, 128, 0)
    expect(result).toBe("38;2;255;128;0")
  })

  it("returns 256-color format for ANSI256 profile", () => {
    const result = downsampleColor(ColorProfile.ANSI256, "48", 255, 0, 0)
    expect(result).toContain("48;5;")
  })

  it("returns ANSI format for ANSI profile", () => {
    const result = downsampleColor(ColorProfile.ANSI, "38", 255, 0, 0)
    expect(result).toContain("38;5;")
  })

  it("returns empty string for NoColor profile", () => {
    const result = downsampleColor(ColorProfile.NoColor, "38", 255, 0, 0)
    expect(result).toBe("")
  })
})

// ─── 16. Additional command messages ─────────────────────────────────────

describe("EnableBracketedPaste", () => {
  it("returns enableBracketedPaste message", () => {
    const msg = EnableBracketedPaste()
    expect(msg).toEqual({ type: "enableBracketedPaste" })
  })
})

describe("DisableBracketedPaste", () => {
  it("returns disableBracketedPaste message", () => {
    const msg = DisableBracketedPaste()
    expect(msg).toEqual({ type: "disableBracketedPaste" })
  })
})

describe("EnableReportFocus", () => {
  it("returns enableReportFocus message", () => {
    const msg = EnableReportFocus()
    expect(msg).toEqual({ type: "enableReportFocus" })
  })
})

describe("DisableReportFocus", () => {
  it("returns disableReportFocus message", () => {
    const msg = DisableReportFocus()
    expect(msg).toEqual({ type: "disableReportFocus" })
  })
})

describe("Raw", () => {
  it("returns a command function", () => {
    const cmd = Raw("\\x1b[2J")
    expect(typeof cmd).toBe("function")
  })

  it("returns a raw message", () => {
    const cmd = Raw("\\x1b[2J")
    const msg = cmd!()
    expect(msg).toHaveProperty("type", "raw")
    expect((msg as any).msg).toBe("\\x1b[2J")
  })
})

describe("RequestTerminalVersion", () => {
  it("returns terminalVersion message", () => {
    const msg = RequestTerminalVersion()
    expect(msg).toEqual({ type: "terminalVersion" })
  })
})

describe("RequestCapability", () => {
  it("returns a command function", () => {
    const cmd = RequestCapability("RGB")
    expect(typeof cmd).toBe("function")
  })

  it("returns a capability message with content", () => {
    const cmd = RequestCapability("RGB")
    const msg = cmd!()
    expect(msg).toHaveProperty("type", "requestCapability")
    expect((msg as any).content).toBe("RGB")
  })
})

// ─── 17. Modifier constants (mod.ts) ─────────────────────────────────────

describe("Modifier constants", () => {
  it("ModShift is 1", () => {
    expect(ModShift).toBe(1)
  })

  it("ModAlt is 2", () => {
    expect(ModAlt).toBe(2)
  })

  it("ModCtrl is 4", () => {
    expect(ModCtrl).toBe(4)
  })

  it("ModMeta is 8", () => {
    expect(ModMeta).toBe(8)
  })

  it("ModHyper is 16", () => {
    expect(ModHyper).toBe(16)
  })

  it("ModSuper is 32", () => {
    expect(ModSuper).toBe(32)
  })

  it("ModCapsLock is 64", () => {
    expect(ModCapsLock).toBe(64)
  })

  it("ModNumLock is 128", () => {
    expect(ModNumLock).toBe(128)
  })

  it("ModScrollLock is 256", () => {
    expect(ModScrollLock).toBe(256)
  })
})

describe("modContains", () => {
  it("returns true when modifier contains the flag", () => {
    expect(modContains(ModCtrl | ModAlt, ModCtrl)).toBe(true)
  })

  it("returns false when modifier does not contain the flag", () => {
    expect(modContains(ModCtrl, ModAlt)).toBe(false)
  })

  it("returns true for combined flags", () => {
    expect(modContains(ModCtrl | ModAlt | ModShift, ModCtrl | ModAlt)).toBe(true)
  })

  it("returns false for partial combined flags", () => {
    expect(modContains(ModCtrl, ModCtrl | ModAlt)).toBe(false)
  })
})

// ─── 18. ProgressBar ─────────────────────────────────────────────────────

describe("ProgressBarState", () => {
  it("None is 0", () => {
    expect(ProgressBarState.None).toBe(0)
  })

  it("Default is 1", () => {
    expect(ProgressBarState.Default).toBe(1)
  })

  it("Error is 2", () => {
    expect(ProgressBarState.Error).toBe(2)
  })

  it("Indeterminate is 3", () => {
    expect(ProgressBarState.Indeterminate).toBe(3)
  })

  it("Warning is 4", () => {
    expect(ProgressBarState.Warning).toBe(4)
  })
})

describe("NewProgressBar", () => {
  it("creates a progress bar with state and value", () => {
    const pb = NewProgressBar(ProgressBarState.Default, 50)
    expect(pb.state).toBe(ProgressBarState.Default)
    expect(pb.value).toBe(50)
  })

  it("clamps value to 0 minimum", () => {
    const pb = NewProgressBar(ProgressBarState.Default, -10)
    expect(pb.value).toBe(0)
  })

  it("clamps value to 100 maximum", () => {
    const pb = NewProgressBar(ProgressBarState.Default, 200)
    expect(pb.value).toBe(100)
  })
})

// ─── 19. EnvMsg ──────────────────────────────────────────────────────────

describe("EnvMsg", () => {
  it("stores environment variables", () => {
    const env = new EnvMsg({ FOO: "bar", BAZ: "qux" })
    expect(env.getEnv("FOO")).toBe("bar")
    expect(env.getEnv("BAZ")).toBe("qux")
  })

  it("getEnv returns empty string for missing key", () => {
    const env = new EnvMsg({ FOO: "bar" })
    expect(env.getEnv("MISSING")).toBe("")
  })

  it("lookupEnv returns [value, true] for existing key", () => {
    const env = new EnvMsg({ FOO: "bar" })
    const [value, ok] = env.lookupEnv("FOO")
    expect(value).toBe("bar")
    expect(ok).toBe(true)
  })

  it("lookupEnv returns ['', false] for missing key", () => {
    const env = new EnvMsg({ FOO: "bar" })
    const [value, ok] = env.lookupEnv("MISSING")
    expect(value).toBe("")
    expect(ok).toBe(false)
  })
})

// ─── 20. Key constants ───────────────────────────────────────────────────

describe("Key constants", () => {
  it("KeyExtended is 0x10FFFF", () => {
    const { KeyExtended } = require("../src/key-constants")
    expect(KeyExtended).toBe(0x10FFFF)
  })

  it("special keys are above KeyExtended", () => {
    const { KeyExtended, KeyUp, KeyDown, KeyLeft, KeyRight } = require("../src/key-constants")
    expect(KeyUp).toBeGreaterThan(KeyExtended)
    expect(KeyDown).toBeGreaterThan(KeyExtended)
    expect(KeyLeft).toBeGreaterThan(KeyExtended)
    expect(KeyRight).toBeGreaterThan(KeyExtended)
  })

  it("C0 keys have correct values", () => {
    const { KeyBackspace, KeyTab, KeyEnter, KeyReturn, KeyEscape, KeySpace } = require("../src/key-constants")
    expect(KeyBackspace).toBe(0x7F)
    expect(KeyTab).toBe(0x09)
    expect(KeyEnter).toBe(0x0D)
    expect(KeyReturn).toBe(KeyEnter)
    expect(KeyEscape).toBe(0x1B)
    expect(KeySpace).toBe(0x20)
  })
})
