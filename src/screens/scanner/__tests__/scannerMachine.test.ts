import {
  INITIAL_SCANNER_STATE,
  classifyCode,
  normalizeScannedCode,
  scannerReducer,
  type ScannerEvent,
  type ScannerState,
} from '../scannerMachine';

const run = (events: ScannerEvent[], start: ScannerState = INITIAL_SCANNER_STATE) =>
  events.reduce(scannerReducer, start);

describe('normalizeScannedCode', () => {
  it('keeps only the part before the first ";"', () => {
    expect(normalizeScannedCode(' 1024;extra;fields ')).toBe('1024');
    expect(normalizeScannedCode('1024')).toBe('1024');
  });
});

describe('classifyCode', () => {
  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['7', 'invalid'],
    ['https://example.com', 'external'],
    ['upi://pay?pa=x', 'external'],
    ['WRD-2024-101', 'file'],
  ])('%p -> %s', (code, kind) => {
    expect(classifyCode(code)).toBe(kind);
  });
});

describe('scannerReducer', () => {
  it('goes straight to employee assignment for a file code', () => {
    expect(run([{ type: 'CODE_DETECTED', code: '1024' }])).toEqual({
      phase: 'assign',
      code: '1024',
    });
  });

  it('closing the invalid-code dialog cools down, then resumes scanning', () => {
    const afterDismiss = run([{ type: 'CODE_DETECTED', code: '7' }, { type: 'DISMISS' }]);
    expect(afterDismiss).toEqual({ phase: 'cooldown' });
    expect(scannerReducer(afterDismiss, { type: 'RESUME' })).toEqual({ phase: 'scanning' });
  });

  it('cancelling the external-link confirmation closes the dialog', () => {
    expect(run([{ type: 'CODE_DETECTED', code: 'https://x.y' }, { type: 'DISMISS' }]).phase).toBe(
      'cooldown',
    );
  });

  it('proceeding past the external-link confirmation opens assignment for that code', () => {
    expect(
      run([{ type: 'CODE_DETECTED', code: 'https://x.y' }, { type: 'CONFIRM_EXTERNAL' }]),
    ).toEqual({ phase: 'assign', code: 'https://x.y' });
  });

  it('moves from assignment to registration for an unregistered code', () => {
    expect(run([{ type: 'CODE_DETECTED', code: '1024' }, { type: 'NOT_REGISTERED' }])).toEqual({
      phase: 'register',
      code: '1024',
    });
  });

  it('ignores barcodes while a modal or dialog is open', () => {
    const assigning: ScannerState = { phase: 'assign', code: '1024' };
    expect(scannerReducer(assigning, { type: 'CODE_DETECTED', code: '9999' })).toBe(assigning);
    const cooling: ScannerState = { phase: 'cooldown' };
    expect(scannerReducer(cooling, { type: 'CODE_DETECTED', code: '9999' })).toBe(cooling);
  });

  it('accepts a code typed in manual entry', () => {
    expect(run([{ type: 'OPEN_MANUAL_ENTRY' }, { type: 'CODE_DETECTED', code: '1024' }])).toEqual({
      phase: 'assign',
      code: '1024',
    });
  });

  it('an empty detection just cools down', () => {
    expect(run([{ type: 'CODE_DETECTED', code: '  ' }])).toEqual({ phase: 'cooldown' });
  });
});
