// keyboard.ts | keyboard enhancements (bubbletea port)

import type { Msg } from "./types"

/**
 * KeyboardEnhancementsMsg indicates which keyboard features are available.
 */
export interface KeyboardEnhancementsMsg {
  type: "keyboardEnhancements"
  reportEventTypes: boolean
  reportAlternateKeys: boolean
  reportAllKeysAsEscapeCodes: boolean
  reportAssociatedText: boolean
}

/**
 * EnableKeyboardEnhancements enables keyboard enhancement features.
 */
export function EnableKeyboardEnhancements(): Msg {
  return { type: "enableKeyboardEnhancements" }
}

/**
 * DisableKeyboardEnhancements disables keyboard enhancement features.
 */
export function DisableKeyboardEnhancements(): Msg {
  return { type: "disableKeyboardEnhancements" }
}
