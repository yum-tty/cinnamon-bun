// options.ts | program options (bubbletea port)
// @deprecated Use ProgramConfig fields directly in NewProgram() instead.

import { type Program, MouseMode } from "./program"

export type ProgramOption = (p: Program) => void

/** @deprecated Set `altScreen: true` in ProgramConfig instead. */
export function WithAltScreen(): ProgramOption {
  return (p) => {
    p.setAltScreen(true)
  }
}

/** @deprecated Set `altScreen: false` in ProgramConfig instead. */
export function WithoutAltScreen(): ProgramOption {
  return (p) => {
    p.setAltScreen(false)
  }
}

/** @deprecated Set `mouseMode: MouseMode.Cell` in ProgramConfig instead. */
export function WithMouseCellMotion(): ProgramOption {
  return (p) => {
    p.setMouseMode(MouseMode.Cell)
  }
}

/** @deprecated Set `mouseMode: MouseMode.All` in ProgramConfig instead. */
export function WithMouseAllMotion(): ProgramOption {
  return (p) => {
    p.setMouseMode(MouseMode.All)
  }
}

/** @deprecated Set `fps` in ProgramConfig instead. */
export function WithFPS(fps: number): ProgramOption {
  return (p) => {
    p.setFPS(fps)
  }
}

/** @deprecated Set `rendererEnabled: false` in ProgramConfig instead. */
export function WithoutRenderer(): ProgramOption {
  return (p) => {
    p.setRendererEnabled(false)
  }
}

/** @deprecated Set `input` in ProgramConfig instead. */
export function WithInput(input: NodeJS.ReadStream): ProgramOption {
  return (p) => {
    p.setInput(input)
  }
}

/** @deprecated Set `output` in ProgramConfig instead. */
export function WithOutput(output: NodeJS.WriteStream): ProgramOption {
  return (p) => {
    p.setOutput(output)
  }
}

/** @deprecated Set `signalHandler: false` in ProgramConfig instead. */
export function WithoutSignalHandler(): ProgramOption {
  return (p) => {
    p.setSignalHandler(false)
  }
}

/** @deprecated Set `catchPanics: false` in ProgramConfig instead. */
export function WithoutCatchPanics(): ProgramOption {
  return (p) => {
    p.setCatchPanics(false)
  }
}

/** @deprecated Set `filter` in ProgramConfig instead. */
export function WithFilter(filter: (msg: any) => any): ProgramOption {
  return (p) => {
    if (filter) p.setFilter(filter)
  }
}

/** @deprecated Set `context` in ProgramConfig instead. */
export function WithContext(ctx: AbortSignal): ProgramOption {
  return (p) => {
    p.setContext(ctx)
  }
}

/** @deprecated Set `env` in ProgramConfig instead. */
export function WithEnvironment(env: Record<string, string>): ProgramOption {
  return (p) => {
    p.setEnvironment(env)
  }
}

/** @deprecated Set `colorProfile` in ProgramConfig instead. */
export function WithColorProfile(profile: number): ProgramOption {
  return (p) => {
    p.setColorProfile(profile)
  }
}

/** @deprecated No-op. Signal handling is controlled by `signalHandler` in ProgramConfig. */
export function WithoutSignals(): ProgramOption {
  return () => {}
}

/** @deprecated Set `windowSize` in ProgramConfig instead. */
export function WithWindowSize(width: number, height: number): ProgramOption {
  return (p) => { p.setWindowSize(width, height) }
}
