// options.ts | program options (bubbletea port)

import type { Program } from "./program"

export type ProgramOption = (p: Program) => void

export function WithAltScreen(): ProgramOption {
  return (p) => {
    p.setAltScreen(true)
  }
}

export function WithoutAltScreen(): ProgramOption {
  return (p) => {
    p.setAltScreen(false)
  }
}

export function WithMouseCellMotion(): ProgramOption {
  return (p) => {
    p.setMouseMode("cell")
  }
}

export function WithMouseAllMotion(): ProgramOption {
  return (p) => {
    p.setMouseMode("all")
  }
}

export function WithFPS(fps: number): ProgramOption {
  return (p) => {
    p.setFPS(fps)
  }
}

export function WithoutRenderer(): ProgramOption {
  return (p) => {
    p.setRendererEnabled(false)
  }
}

export function WithInput(input: NodeJS.ReadStream): ProgramOption {
  return (p) => {
    p.setInput(input)
  }
}

export function WithOutput(output: NodeJS.WriteStream): ProgramOption {
  return (p) => {
    p.setOutput(output)
  }
}

export function WithoutSignalHandler(): ProgramOption {
  return (p) => {
    p.setSignalHandler(false)
  }
}

export function WithoutCatchPanics(): ProgramOption {
  return (p) => {
    p.setCatchPanics(false)
  }
}

export function WithFilter(filter: (msg: any) => any): ProgramOption {
  return (p) => {
    p.setFilter(filter)
  }
}

export function WithContext(ctx: AbortSignal): ProgramOption {
  return (p) => {
    p.setContext(ctx)
  }
}

export function WithEnvironment(env: Record<string, string>): ProgramOption {
  return (p) => {
    p.setEnvironment(env)
  }
}

export function WithColorProfile(profile: number): ProgramOption {
  return (p) => {
    p.setColorProfile(profile)
  }
}

export function WithoutSignals(): ProgramOption {
  return () => {}
}

export function WithWindowSize(width: number, height: number): ProgramOption {
  return () => {}
}
