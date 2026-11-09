#!/usr/bin/env node
/**
 * check-fingerprint-drift.js
 *
 * Compares the current project's native fingerprint against the last recorded
 * baseline in fingerprint-baseline.json to catch native-relevant changes
 * (new native module, config plugin, native config in app.json, etc.)
 * locally/in CI before an incompatible OTA update is pushed.
 *
 * Usage:
 *   node scripts/check-fingerprint-drift.js          # check for drift; exits 1 if found
 *   node scripts/check-fingerprint-drift.js --update  # recompute and save new baseline
 */

const fs = require('fs');
const path = require('path');
const { createFingerprintAsync, diffFingerprintChangesAsync } = require('@expo/fingerprint');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BASELINE_PATH = path.join(PROJECT_ROOT, 'fingerprint-baseline.json');

function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return null;
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
}

function saveBaseline(fingerprint) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(fingerprint, null, 2) + '\n');
}

function describeSource(source) {
  const label = source.type === 'contents' ? source.id : source.filePath;
  const reasons = source.reasons?.length ? ` (${source.reasons.join(', ')})` : '';
  return `${source.type}:${label}${reasons}`;
}

function printDiff(diff) {
  for (const item of diff) {
    if (item.op === 'added') {
      console.log(`  + added   ${describeSource(item.addedSource)}`);
    } else if (item.op === 'removed') {
      console.log(`  - removed ${describeSource(item.removedSource)}`);
    } else {
      console.log(`  ~ changed ${describeSource(item.afterSource)}`);
    }
  }
}

async function main() {
  const shouldUpdate = process.argv.includes('--update');
  const baseline = loadBaseline();

  if (!baseline) {
    console.log('No fingerprint-baseline.json found — generating an initial baseline.');
    const fingerprint = await createFingerprintAsync(PROJECT_ROOT);
    saveBaseline(fingerprint);
    console.log(`Saved baseline (hash ${fingerprint.hash}) to ${path.basename(BASELINE_PATH)}.`);
    console.log('Commit this file, then re-run this script after future changes to detect drift.');
    return;
  }

  const diff = await diffFingerprintChangesAsync(baseline, PROJECT_ROOT);

  if (diff.length === 0) {
    console.log(`No fingerprint drift — matches baseline (hash ${baseline.hash}).`);
    return;
  }

  console.log(`Fingerprint drift detected against baseline (hash ${baseline.hash}):`);
  printDiff(diff);

  if (shouldUpdate) {
    const fingerprint = await createFingerprintAsync(PROJECT_ROOT);
    saveBaseline(fingerprint);
    console.log(`\nUpdated baseline to new hash ${fingerprint.hash}.`);
    console.log('Commit fingerprint-baseline.json, and make sure a new native build ships before the next OTA update.');
    return;
  }

  console.log('\nThis usually means native-relevant files changed (new native module, config');
  console.log('plugin, app.json native config, etc.) — a new native build is needed before');
  console.log('pushing an OTA update, or it will be considered incompatible with older builds.');
  console.log('\nIf this drift is expected, run: npm run check-drift -- --update');
  process.exitCode = 1;
}

main().catch((error) => {
  console.error('check-fingerprint-drift failed:', error);
  process.exitCode = 1;
});

