// options.ts | program options (bubbletea port)

import type { Program } from "./program"

/**
 * ProgramOption is used to set options when initializing a Program.
 */
export type ProgramOption = (p: Program) => void

/**
 * WithAltScreen puts the program in the alternate screen buffer.
 */
export function WithAltScreen(): ProgramOption {
  return (p) => {
    p.setAltScreen(true)
  }
}

/**
 * WithoutAltScreen disables the alternate screen buffer.
 */
export function WithoutAltScreen(): ProgramOption {
  return (p) => {
    p.setAltScreen(false)
  }
}

/**
 * WithMouseCellMotion enables cell motion mouse events.
 */
export function WithMouseCellMotion(): ProgramOption {
  return (p) => {
    p.setMouseMode("cell")
  }
}

/**
 * WithMouseAllMotion enables all mouse events.
 */
export function WithMouseAllMotion(): ProgramOption {
  return (p) => {
    p.setMouseMode("all")
  }
}

/**
 * WithFPS sets the maximum frames per second.
 */
export function WithFPS(fps: number): ProgramOption {
  return (p) => {
    p.setFPS(fps)
  }
}

/**
 * WithoutRenderer disables the renderer.
 */
export function WithoutRenderer(): ProgramOption {
  return (p) => {
    p.setRendererEnabled(false)
  }
}

/**
 * WithInput sets the input source.
 */
export function WithInput(input: NodeJS.ReadStream): ProgramOption {
  return (p) => {
    p.setInput(input)
  }
}

/**
 * WithOutput sets the output destination.
 */
export function WithOutput(output: NodeJS.WriteStream): ProgramOption {
  return (p) => {
    p.setOutput(output)
  }
}

/**
 * WithoutSignalHandler disables the signal handler.
 */
export function WithoutSignalHandler(): ProgramOption {
  return (p) => {
    p.setSignalHandler(false)
  }
}

/**
 * WithoutCatchPanics disables panic catching.
 */
export function WithoutCatchPanics(): ProgramOption {
  return (p) => {
    p.setCatchPanics(false)
  }
}

/**
 * WithFilter sets a message filter.
 */
export function WithFilter(filter: (msg: any) => any): ProgramOption {
  return (p) => {
    p.setFilter(filter)
  }
}
