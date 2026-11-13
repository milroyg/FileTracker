/**
 * Scanner flow as an explicit state machine. Exactly one thing is on screen
 * at a time, so a dialog can never be left open over a modal, and the camera
 * only reacts to barcodes in the `scanning` phase.
 *
 *   scanning ──code──▶ assign ──not registered──▶ register
 *      ▲  │              │                          │
 *      │  ├─short─▶ invalidCode                     │
 *      │  ├─URL───▶ confirmExternal ──proceed──▶ assign
 *      │  └─manual─▶ manualEntry ──code──▶ (same as camera)
 *      │
 *   cooldown ◀── DISMISS from any of the above (short pause so the same
 *                barcode, still in frame, isn't immediately re-read)
 */

export type ScannerState =
  | { phase: 'scanning' }
  | { phase: 'cooldown' }
  | { phase: 'manualEntry' }
  | { phase: 'invalidCode'; code: string }
  | { phase: 'confirmExternal'; code: string }
  | { phase: 'assign'; code: string }
  | { phase: 'register'; code: string };

export type ScannerEvent =
  | { type: 'CODE_DETECTED'; code: string }
  | { type: 'OPEN_MANUAL_ENTRY' }
  | { type: 'CONFIRM_EXTERNAL' }
  | { type: 'NOT_REGISTERED' }
  | { type: 'DISMISS' }
  | { type: 'RESUME' };

export const INITIAL_SCANNER_STATE: ScannerState = { phase: 'scanning' };
export const SCAN_COOLDOWN_MS = 1500;
const MIN_CODE_LENGTH = 2;
const EXTERNAL_CODE_PATTERN = /^(https?:\/\/|upi:\/\/|mailto:|tel:)/i;

/** WRD barcodes may carry extra fields after a ';' — only the first is the code. */
export function normalizeScannedCode(raw: string): string {
  return (raw.split(';')[0] ?? '').trim();
}

export type CodeKind = 'empty' | 'invalid' | 'external' | 'file';

export function classifyCode(code: string): CodeKind {
  const trimmed = code.trim();
  if (!trimmed) return 'empty';
  if (trimmed.length < MIN_CODE_LENGTH) return 'invalid';
  if (EXTERNAL_CODE_PATTERN.test(trimmed)) return 'external';
  return 'file';
}

export function scannerReducer(state: ScannerState, event: ScannerEvent): ScannerState {
  switch (event.type) {
    case 'CODE_DETECTED': {
      if (state.phase !== 'scanning' && state.phase !== 'manualEntry') return state;
      const code = event.code.trim();
      switch (classifyCode(code)) {
        case 'empty':
          return { phase: 'cooldown' };
        case 'invalid':
          return { phase: 'invalidCode', code };
        case 'external':
          return { phase: 'confirmExternal', code };
        case 'file':
          return { phase: 'assign', code };
      }
      return state;
    }
    case 'OPEN_MANUAL_ENTRY':
      return state.phase === 'scanning' || state.phase === 'cooldown'
        ? { phase: 'manualEntry' }
        : state;
    case 'CONFIRM_EXTERNAL':
      return state.phase === 'confirmExternal' ? { phase: 'assign', code: state.code } : state;
    case 'NOT_REGISTERED':
      return state.phase === 'assign' ? { phase: 'register', code: state.code } : state;
    case 'DISMISS':
      return state.phase === 'scanning' || state.phase === 'cooldown'
        ? state
        : { phase: 'cooldown' };
    case 'RESUME':
      return state.phase === 'cooldown' ? { phase: 'scanning' } : state;
  }
}
