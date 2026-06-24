// focus.ts | focus handling (bubbletea port)

import type { Msg } from "./types"

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
 * RequestFocus reports focus events.
 */
export function EnableReportFocus(): Msg {
  return { type: "enableReportFocus" }
}

/**
 * DisableReportFocus stops reporting focus events.
 */
export function DisableReportFocus(): Msg {
  return { type: "disableReportFocus" }
}
