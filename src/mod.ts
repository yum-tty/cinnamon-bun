// mod.ts | key modifier constants (bubbletea port)

/**
 * KeyMod represents modifier keys.
 */
export type KeyMod = number

// Modifier keys.
export const ModShift: KeyMod = 1 << 0
export const ModAlt: KeyMod = 1 << 1
export const ModCtrl: KeyMod = 1 << 2
export const ModMeta: KeyMod = 1 << 3

// These modifiers are used with the Kitty protocol.
// XXX: Meta and Super are swapped in the Kitty protocol,
// this is to preserve compatibility with XTerm modifiers.
export const ModHyper: KeyMod = 1 << 4
export const ModSuper: KeyMod = 1 << 5 // Windows/Command keys

// These are key lock states.
export const ModCapsLock: KeyMod = 1 << 6
export const ModNumLock: KeyMod = 1 << 7
export const ModScrollLock: KeyMod = 1 << 8 // Defined in Windows API only

/**
 * Contains reports whether m contains the given modifiers.
 */
export function modContains(m: KeyMod, mods: KeyMod): boolean {
  return (m & mods) === mods
}
