// logging.ts | logging helpers (bubbletea port)

import * as fs from "fs"

export interface LogOptionsSetter {
  setOutput(writer: fs.WriteStream): void
  setPrefix(prefix: string): void
}

export function LogToFile(path: string, prefix: string): fs.WriteStream {
  return LogToFileWith(path, prefix, {
    setOutput: () => {},
    setPrefix: () => {},
  })
}

export function LogToFileWith(path: string, prefix: string, opts: LogOptionsSetter): fs.WriteStream {
  const f = fs.createWriteStream(path, { flags: "a" })
  opts.setOutput(f)
  let finalPrefix = prefix ?? ""
  if (finalPrefix.length > 0) {
    const lastChar = finalPrefix[finalPrefix.length - 1]
    if (lastChar !== " ") {
      finalPrefix += " "
    }
  }
  opts.setPrefix(finalPrefix)
  return f
}
