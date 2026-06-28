// color-profile.ts | terminal color profile detection and downsampling

export enum ColorProfile {
  TrueColor = 2,
  ANSI256 = 1,
  ANSI = 0,
  Ascii = -1,
  NoColor = -2,
}

export function detectColorProfile(): ColorProfile {
  const colorterm = (process.env.COLORTERM ?? "").toLowerCase()
  if (colorterm === "truecolor" || colorterm === "24bit") return ColorProfile.TrueColor

  const termProgram = (process.env.TERM_PROGRAM ?? "").toLowerCase()
  if (
    termProgram === "wezterm" ||
    termProgram === "vscode" ||
    termProgram === "hyper" ||
    termProgram === "iterm.app" ||
    termProgram === "mintty" ||
    termProgram === "tabby"
  ) return ColorProfile.TrueColor

  const vteVersion = process.env.VTE_VERSION ?? ""
  if (vteVersion !== "") {
    const parts = vteVersion.split(".")
    const major = parseInt(parts[0] ?? "0", 10)
    const minor = parseInt(parts[1] ?? "0", 10)
    if (major > 0 || minor >= 50) return ColorProfile.TrueColor
  }

  const term = (process.env.TERM ?? "").toLowerCase()
  if (term.includes("truecolor") || term.includes("24bit")) return ColorProfile.TrueColor
  if (term.includes("256color")) return ColorProfile.ANSI256
  if (term.includes("color")) return ColorProfile.ANSI
  if (term === "dumb") return ColorProfile.NoColor
  if (term === "") return ColorProfile.ANSI

  return ColorProfile.ANSI
}

export function profileFromNumber(n: number): ColorProfile {
  switch (n) {
    case 2: return ColorProfile.TrueColor
    case 1: return ColorProfile.ANSI256
    case 0: return ColorProfile.ANSI
    case -1: return ColorProfile.Ascii
    default: return ColorProfile.TrueColor
  }
}

export function profileToNumber(p: ColorProfile): number {
  if (p >= 0) return p
  if (p === ColorProfile.Ascii) return 0
  return 0
}

function rgbToAnsi256(r: number, g: number, b: number): number {
  if (r === g && g === b) {
    if (r < 8) return 16
    if (r > 248) return 231
    return Math.round(((r - 8) / 247) * 24) + 232
  }
  return (
    16 +
    36 * Math.round((r / 255) * 5) +
    6 * Math.round((g / 255) * 5) +
    Math.round((b / 255) * 5)
  )
}

function rgbToAnsi(r: number, g: number, b: number): number {
  const rAdj = Math.round((r / 255) * 5)
  const gAdj = Math.round((g / 255) * 5)
  const bAdj = Math.round((b / 255) * 5)
  if (rAdj === gAdj && gAdj === bAdj) {
    if (r < 8) return 0
    if (r < 128) return 0
    return 7
  }
  return 16 + 36 * rAdj + 6 * gAdj + bAdj
}

export function downsampleColor(profile: ColorProfile, fgOrBg: "38" | "48" | "58", r: number, g: number, b: number): string {
  if (profile === ColorProfile.TrueColor || profile >= ColorProfile.TrueColor) {
    return `${fgOrBg};2;${r};${g};${b}`
  }
  if (profile === ColorProfile.ANSI256) {
    return `${fgOrBg};5;${rgbToAnsi256(r, g, b)}`
  }
  if (profile === ColorProfile.ANSI || profile === ColorProfile.Ascii) {
    const idx = rgbToAnsi(r, g, b)
    return `${fgOrBg};5;${idx}`
  }
  return ""
}

const CSI_RE = /\x1b\[([0-9;]*)m/g
const OSC_RE = /\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g

export function downsampleAnsiSequence(profile: ColorProfile, seq: string): string {
  if (profile === ColorProfile.TrueColor) return seq

  return seq.replace(CSI_RE, (match, params: string) => {
    return downsampleSgrParams(profile, params)
  }).replace(OSC_RE, (match) => {
    return downsampleOsc(profile, match)
  })
}

function downsampleSgrParams(profile: ColorProfile, params: string): string {
  const parts = params.split(";").map(Number).filter((n) => !Number.isNaN(n))
  const result: number[] = []
  let i = 0
  while (i < parts.length) {
    const p = parts[i]!
    if (p === 38 && parts[i + 1] === 5 && parts[i + 2] !== undefined) {
      result.push(38, 5, parts[i + 2])
      i += 3
      continue
    }
    if (p === 38 && parts[i + 1] === 2 && parts[i + 4] !== undefined) {
      const r = parts[i + 2]!
      const g = parts[i + 3]!
      const b = parts[i + 4]!
      const down = downsampleColor(profile, "38", r, g, b)
      if (down) {
        const downParts = down.split(";").map(Number)
        result.push(...downParts)
      }
      i += 5
      continue
    }
    if (p === 48 && parts[i + 1] === 5 && parts[i + 2] !== undefined) {
      result.push(48, 5, parts[i + 2])
      i += 3
      continue
    }
    if (p === 48 && parts[i + 1] === 2 && parts[i + 4] !== undefined) {
      const r = parts[i + 2]!
      const g = parts[i + 3]!
      const b = parts[i + 4]!
      const down = downsampleColor(profile, "48", r, g, b)
      if (down) {
        const downParts = down.split(";").map(Number)
        result.push(...downParts)
      }
      i += 5
      continue
    }
    if (p === 58 && parts[i + 1] === 2 && parts[i + 4] !== undefined) {
      const r = parts[i + 2]!
      const g = parts[i + 3]!
      const b = parts[i + 4]!
      const down = downsampleColor(profile, "58", r, g, b)
      if (down) {
        const downParts = down.split(";").map(Number)
        result.push(...downParts)
      }
      i += 5
      continue
    }
    result.push(p)
    i++
  }
  return `\x1b[${result.join(";")}m`
}

function downsampleOsc(profile: ColorProfile, seq: string): string {
  if (profile === ColorProfile.Ascii || profile === ColorProfile.NoColor) {
    return ""
  }
  return seq
}
