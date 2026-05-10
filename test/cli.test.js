const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { writeFile, appendFile, validateHandoff, setConfig } = require('../bin/cli.js');

test('CLI Helpers', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'handoff-test-'));

  t.afterEach(() => {
    setConfig({ DRY_RUN: false, FORCE: false });
  });

  await t.test('writeFile creates a new file', () => {
    const filePath = path.join(tmpDir, 'test.txt');
    writeFile(filePath, 'hello world', 'test file');
    assert.strictEqual(fs.readFileSync(filePath, 'utf8'), 'hello world');
  });

  await t.test('writeFile does not overwrite existing file by default', () => {
    const filePath = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(filePath, 'original', 'utf8');
    writeFile(filePath, 'new content', 'test file');
    assert.strictEqual(fs.readFileSync(filePath, 'utf8'), 'original');
  });

  await t.test('writeFile overwrites existing file with --force', () => {
    const filePath = path.join(tmpDir, 'test-force.txt');
    fs.writeFileSync(filePath, 'original', 'utf8');
    setConfig({ FORCE: true });
    writeFile(filePath, 'new content', 'test file');
    assert.strictEqual(fs.readFileSync(filePath, 'utf8'), 'new content');
  });

  await t.test('writeFile respects --dry-run', () => {
    const filePath = path.join(tmpDir, 'test-dry.txt');
    setConfig({ DRY_RUN: true });
    writeFile(filePath, 'new content', 'test file');
    assert.strictEqual(fs.existsSync(filePath), false);
  });

  await t.test('appendFile creates file if not exists', () => {
    const filePath = path.join(tmpDir, 'append.txt');
    appendFile(filePath, 'new content', 'marker', 'append file');
    assert.strictEqual(fs.readFileSync(filePath, 'utf8'), 'new content');
  });

  await t.test('appendFile appends if marker not present', () => {
    const filePath = path.join(tmpDir, 'append-marker.txt');
    fs.writeFileSync(filePath, 'existing', 'utf8');
    appendFile(filePath, 'appended', 'marker', 'append file');
    assert.strictEqual(fs.readFileSync(filePath, 'utf8'), 'existing\n\nappended');
  });

  await t.test('appendFile skips if marker present', () => {
    const filePath = path.join(tmpDir, 'append-skip.txt');
    fs.writeFileSync(filePath, 'existing marker', 'utf8');
    appendFile(filePath, 'should not append', 'marker', 'append file');
    assert.strictEqual(fs.readFileSync(filePath, 'utf8'), 'existing marker');
  });

  await t.test('appendFile appends even if marker present with --force', () => {
    const filePath = path.join(tmpDir, 'append-force.txt');
    fs.writeFileSync(filePath, 'existing marker', 'utf8');
    setConfig({ FORCE: true });
    appendFile(filePath, 'appended', 'marker', 'append file');
    assert.strictEqual(fs.readFileSync(filePath, 'utf8'), 'existing marker\n\nappended');
  });

  await t.test('appendFile respects --dry-run', () => {
    const filePath = path.join(tmpDir, 'append-dry.txt');
    setConfig({ DRY_RUN: true });
    appendFile(filePath, 'new content', 'marker', 'append file');
    assert.strictEqual(fs.existsSync(filePath), false);
  });

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('Validator', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'handoff-val-test-'));

  await t.test('validateHandoff fails if file missing', () => {
    // We need to mock process.exit or just check if it throws/exits
    // Since validateHandoff calls process.exit(1), we might need to wrap it
    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };
    
    validateHandoff(tmpDir);
    
    assert.strictEqual(exitCode, 1);
    process.exit = originalExit;
  });

  await t.test('validateHandoff fails if sections missing', () => {
    const filePath = path.join(tmpDir, 'handoff.md');
    fs.writeFileSync(filePath, '## Meta\n## Project', 'utf8');
    
    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };
    
    validateHandoff(tmpDir);
    
    assert.strictEqual(exitCode, 1);
    process.exit = originalExit;
  });

  await t.test('validateHandoff succeeds if all sections present', () => {
    const filePath = path.join(tmpDir, 'handoff.md');
    const content = [
      "## Meta",
      "- **exported_at**: 2026-05-10T13:45:00Z",
      "- **exported_from**: gemini-cli",
      "- **session_id**: b9e4d2",
      "",
      "## Project",
      "- **name**: context-handoff",
      "- **stack**: Node.js",
      "- **root**: " + tmpDir,
      "- **package_manager**: npm",
      "",
      "## Current Task",
      "Do something.",
      "",
      "## Progress",
      "- [x] Done",
      "",
      "## Active Files",
      "- bin/cli.js — Main CLI entrypoint",
      "",
      "## Blocker",
      "None",
      "",
      "## Key Decisions",
      "- Decision",
      "",
      "## Environment",
      "- Node.js: v24",
      "",
      "## Next Steps",
      "1. Do next thing",
      "",
      "## For the Next AI",
      "- Read all Active Files",
    ].join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    
    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };
    
    validateHandoff(tmpDir);
    
    assert.strictEqual(exitCode, null); // No exit called
    process.exit = originalExit;
  });

  await t.test('validateHandoff fails if Meta exported_at is not ISO', () => {
    const filePath = path.join(tmpDir, 'handoff.md');
    const content = [
      "## Meta",
      "- **exported_at**: not-a-date",
      "- **exported_from**: gemini-cli",
      "- **session_id**: b9e4d2",
      "",
      "## Project",
      "- **name**: context-handoff",
      "- **stack**: Node.js",
      "- **root**: " + tmpDir,
      "- **package_manager**: npm",
      "",
      "## Current Task",
      "Do something.",
      "",
      "## Progress",
      "- [x] Done",
      "",
      "## Active Files",
      "- bin/cli.js — Main CLI entrypoint",
      "",
      "## Blocker",
      "None",
      "",
      "## Key Decisions",
      "- Decision",
      "",
      "## Environment",
      "- Node.js: v24",
      "",
      "## Next Steps",
      "1. Do next thing",
      "",
      "## For the Next AI",
      "- Read all Active Files",
    ].join('\n');
    fs.writeFileSync(filePath, content, 'utf8');

    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };

    validateHandoff(tmpDir);

    assert.strictEqual(exitCode, 1);
    process.exit = originalExit;
  });

  await t.test('validateHandoff fails if Active Files lacks em dash separator', () => {
    const filePath = path.join(tmpDir, 'handoff.md');
    const content = [
      "## Meta",
      "- **exported_at**: 2026-05-10T13:45:00Z",
      "- **exported_from**: gemini-cli",
      "- **session_id**: b9e4d2",
      "",
      "## Project",
      "- **name**: context-handoff",
      "- **stack**: Node.js",
      "- **root**: " + tmpDir,
      "- **package_manager**: npm",
      "",
      "## Current Task",
      "Do something.",
      "",
      "## Progress",
      "- [x] Done",
      "",
      "## Active Files",
      "- bin/cli.js (missing separator)",
      "",
      "## Blocker",
      "None",
      "",
      "## Key Decisions",
      "- Decision",
      "",
      "## Environment",
      "- Node.js: v24",
      "",
      "## Next Steps",
      "1. Do next thing",
      "",
      "## For the Next AI",
      "- Read all Active Files",
    ].join('\n');
    fs.writeFileSync(filePath, content, 'utf8');

    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };

    validateHandoff(tmpDir);

    assert.strictEqual(exitCode, 1);
    process.exit = originalExit;
  });

  await t.test('validateHandoff fails if Next Steps does not start with 1.', () => {
    const filePath = path.join(tmpDir, 'handoff.md');
    const content = [
      "## Meta",
      "- **exported_at**: 2026-05-10T13:45:00Z",
      "- **exported_from**: gemini-cli",
      "- **session_id**: b9e4d2",
      "",
      "## Project",
      "- **name**: context-handoff",
      "- **stack**: Node.js",
      "- **root**: " + tmpDir,
      "- **package_manager**: npm",
      "",
      "## Current Task",
      "Do something.",
      "",
      "## Progress",
      "- [x] Done",
      "",
      "## Active Files",
      "- bin/cli.js — Main CLI entrypoint",
      "",
      "## Blocker",
      "None",
      "",
      "## Key Decisions",
      "- Decision",
      "",
      "## Environment",
      "- Node.js: v24",
      "",
      "## Next Steps",
      "2. Wrong start",
      "",
      "## For the Next AI",
      "- Read all Active Files",
    ].join('\n');
    fs.writeFileSync(filePath, content, 'utf8');

    const originalExit = process.exit;
    let exitCode = null;
    process.exit = (code) => { exitCode = code; };

    validateHandoff(tmpDir);

    assert.strictEqual(exitCode, 1);
    process.exit = originalExit;
  });

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
