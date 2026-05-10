#!/usr/bin/env node

const fs   = require("fs");
const path = require("path");

// ── constants ────────────────────────────────────────────────────
const VERSION = require(path.join(__dirname, "..", "package.json")).version;
const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

let DRY_RUN = false;
let FORCE = false;

const TOOLS = {
  "claude-code": installClaudeCode,
  "gemini-cli":  installGeminiCli,
  "opencode":    installOpenCode,
  "kiro":        installKiro,
  "codex":       installCodex,
  "aider":       installAider,
  "cursor":      installCursor,
};

// ── colors ───────────────────────────────────────────────────────
const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  red:    "\x1b[31m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
  gray:   "\x1b[90m",
};

const ok  = (msg) => console.log(`${c.green}✅${c.reset} ${msg}`);
const err = (msg) => console.log(`${c.red}❌${c.reset} ${msg}`);
const inf = (msg) => console.log(`${c.cyan}ℹ${c.reset}  ${msg}`);
const hd  = (msg) => console.log(`\n${c.bold}${c.cyan}${msg}${c.reset}`);

// ── helpers ───────────────────────────────────────────────────────
function readTemplate(relPath) {
  return fs.readFileSync(path.join(TEMPLATES_DIR, relPath), "utf8");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function validateHandoff(cwd) {
  const filePath = path.join(cwd, "handoff.md");
  hd("Validating handoff.md");

  if (!fs.existsSync(filePath)) {
    err("handoff.md not found in current directory.");
    process.exit(1);
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const requiredSections = [
    "## Meta",
    "## Project",
    "## Current Task",
    "## Progress",
    "## Active Files",
    "## Blocker",
    "## Key Decisions",
    "## Environment",
    "## Next Steps",
    "## For the Next AI"
  ];

  let missing = [];
  requiredSections.forEach(section => {
    if (!content.includes(section)) {
      missing.push(section);
    }
  });

  if (missing.length > 0) {
    err("handoff.md is missing required sections:");
    missing.forEach(m => console.log(`  ${c.red}•${c.reset} ${m}`));
    process.exit(1);
    return;
  }

  // Content validation: keep it strict enough for downstream tools to parse.
  const lines = content.split(/\r?\n/);
  const findSectionRange = (header) => {
    const startIdx = lines.findIndex(l => l.trim() === header);
    if (startIdx === -1) return null;
    let endIdx = lines.length;
    for (let i = startIdx + 1; i < lines.length; i++) {
      if (lines[i].trim().startsWith("## ")) {
        endIdx = i;
        break;
      }
    }
    return { startIdx, endIdx };
  };

  const sectionLines = (header) => {
    const r = findSectionRange(header);
    if (!r) return [];
    return lines.slice(r.startIdx + 1, r.endIdx);
  };

  const failures = [];
  const requireNonEmptySection = (header, label) => {
    const body = sectionLines(header).join("\n").trim();
    if (!body) failures.push(`${label} section is empty`);
    return body;
  };

  const metaBody = requireNonEmptySection("## Meta", "Meta");
  const projectBody = requireNonEmptySection("## Project", "Project");
  requireNonEmptySection("## Current Task", "Current Task");
  requireNonEmptySection("## Progress", "Progress");
  const activeFilesBody = requireNonEmptySection("## Active Files", "Active Files");
  const blockerBody = requireNonEmptySection("## Blocker", "Blocker");
  requireNonEmptySection("## Next Steps", "Next Steps");
  requireNonEmptySection("## For the Next AI", "For the Next AI");

  const parseBoldKeyValueBullets = (body, expectedKeys, sectionName) => {
    const kv = {};
    const re = /^-\s+\*\*(.+?)\*\*:\s*(.*)\s*$/gm;
    let m;
    while ((m = re.exec(body)) !== null) {
      kv[m[1]] = m[2];
    }
    expectedKeys.forEach((k) => {
      if (!kv.hasOwnProperty(k) || !String(kv[k] || "").trim()) {
        failures.push(`${sectionName} is missing a non-empty "${k}" entry`);
      }
    });
    return kv;
  };

  // Meta: require keys + basic format checks.
  const meta = parseBoldKeyValueBullets(metaBody, ["exported_at", "exported_from", "session_id"], "Meta");
  if (meta.exported_at) {
    const iso = String(meta.exported_at).trim();
    const isoRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
    if (!isoRe.test(iso) || Number.isNaN(Date.parse(iso))) {
      failures.push('Meta "exported_at" must be a valid ISO 8601 timestamp (e.g. 2026-05-10T13:45:00Z)');
    }
  }
  if (meta.exported_from) {
    const from = String(meta.exported_from).trim();
    if (/^\[.*\]$/.test(from)) {
      failures.push('Meta "exported_from" must be a concrete tool name, not a placeholder');
    }
  }
  if (meta.session_id) {
    const sid = String(meta.session_id).trim();
    if (!/^[a-z0-9]{4,12}$/i.test(sid) || /^\[.*\]$/.test(sid)) {
      failures.push('Meta "session_id" must be a short alphanumeric id (4-12 chars), not a placeholder');
    }
  }

  // Project: require keys + root should look like an absolute path.
  const project = parseBoldKeyValueBullets(projectBody, ["name", "stack", "root", "package_manager"], "Project");
  if (project.root) {
    const root = String(project.root).trim();
    if (!path.isAbsolute(root) || /^\[.*\]$/.test(root)) {
      failures.push('Project "root" must be an absolute path');
    }
  }

  // Active Files: require at least one "- path — desc" style entry.
  if (activeFilesBody) {
    const activeLines = activeFilesBody.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const entries = activeLines.filter(l => l.startsWith("- "));
    if (entries.length === 0) {
      failures.push("Active Files must contain at least one bullet entry");
    } else {
      const bad = entries.filter(l => !l.includes(" — ") || l === "-" || l === "-");
      if (bad.length > 0) {
        failures.push('Active Files entries must use: "- path — one-line description"');
      }
    }
  }

  // Blocker: allow "None" or a concrete error, but avoid placeholders.
  if (blockerBody && /^\[.*\]$/.test(blockerBody.trim())) {
    failures.push("Blocker must be \"None\" or a concrete description, not a placeholder");
  }

  // Next Steps: must include a numbered list starting with "1.".
  const nextStepsLines = sectionLines("## Next Steps").map(l => l.trim()).filter(Boolean);
  if (!nextStepsLines.some(l => /^1\./.test(l))) {
    failures.push('Next Steps must include a numbered list starting with "1."');
  }

  if (failures.length > 0) {
    err("handoff.md failed validation:");
    failures.forEach(f => console.log(`  ${c.red}•${c.reset} ${f}`));
    process.exit(1);
    return;
  }

  ok("handoff.md is valid!");
}

function writeFile(filePath, content, label) {
  const dir = path.dirname(filePath);
  if (!DRY_RUN) ensureDir(dir);

  if (fs.existsSync(filePath) && !FORCE) {
    inf(`${label} already exists — skipping (use --force to overwrite)`);
  } else {
    if (DRY_RUN) {
      ok(`[DRY RUN] Would create/overwrite ${path.relative(process.cwd(), filePath)}`);
    } else {
      fs.writeFileSync(filePath, content, "utf8");
      ok(`${fs.existsSync(filePath) && FORCE ? "Overwrote" : "Created"} ${path.relative(process.cwd(), filePath)}`);
    }
  }
}

function appendFile(filePath, content, marker, label) {
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, "utf8");
    if (existing.includes(marker) && !FORCE) {
      inf(`${label} already present in ${path.relative(process.cwd(), filePath)} — skipping (use --force to append anyway)`);
      return;
    }
    if (DRY_RUN) {
      ok(`[DRY RUN] Would append ${label} to ${path.relative(process.cwd(), filePath)}`);
    } else {
      fs.appendFileSync(filePath, "\n\n" + content, "utf8");
      ok(`Appended ${label} to ${path.relative(process.cwd(), filePath)}`);
    }
  } else {
    if (DRY_RUN) {
      ok(`[DRY RUN] Would create ${path.relative(process.cwd(), filePath)}`);
    } else {
      writeFile(filePath, content, label);
    }
  }
}

// ── installers ────────────────────────────────────────────────────
function installClaudeCode(cwd) {
  hd("Installing for Claude Code");
  const dir = path.join(cwd, ".claude", "commands");
  writeFile(
    path.join(dir, "handoff-export.md"),
    readTemplate("tools/claude-code/handoff-export.md"),
    "handoff-export command"
  );
  writeFile(
    path.join(dir, "handoff-load.md"),
    readTemplate("tools/claude-code/handoff-load.md"),
    "handoff-load command"
  );
  inf("Use with: /handoff-export  and  /handoff-load");
}

function installGeminiCli(cwd) {
  hd("Installing for Gemini CLI");
  const dir = path.join(cwd, ".gemini", "commands");
  writeFile(
    path.join(dir, "handoff-export.toml"),
    readTemplate("tools/gemini-cli/handoff-export.toml"),
    "handoff-export command"
  );
  writeFile(
    path.join(dir, "handoff-load.toml"),
    readTemplate("tools/gemini-cli/handoff-load.toml"),
    "handoff-load command"
  );
  inf("Use with: /handoff-export  and  /handoff-load");
  inf("Requires Gemini CLI v0.23.0+ for custom commands support");
}

function installOpenCode(cwd) {
  hd("Installing for OpenCode");
  const dir = path.join(cwd, ".opencode", "commands");
  writeFile(
    path.join(dir, "handoff-export.md"),
    readTemplate("tools/opencode/handoff-export.md"),
    "handoff-export command"
  );
  writeFile(
    path.join(dir, "handoff-load.md"),
    readTemplate("tools/opencode/handoff-load.md"),
    "handoff-load command"
  );
  inf("Use with: /handoff-export  and  /handoff-load");
}

function installKiro(cwd) {
  hd("Installing for Kiro CLI");
  const dir = path.join(cwd, ".kiro", "skills");
  writeFile(
    path.join(dir, "handoff-export", "SKILL.md"),
    readTemplate("tools/kiro/handoff-export/SKILL.md"),
    "handoff-export skill"
  );
  writeFile(
    path.join(dir, "handoff-load", "SKILL.md"),
    readTemplate("tools/kiro/handoff-load/SKILL.md"),
    "handoff-load skill"
  );
  inf("Use with: /handoff-export  and  /handoff-load");
}

function installCodex(cwd) {
  hd("Installing for Codex");
  const dir = path.join(cwd, ".codex", "prompts");
  writeFile(
    path.join(dir, "handoff-export.md"),
    readTemplate("tools/codex/handoff-export.md"),
    "handoff-export prompt"
  );
  writeFile(
    path.join(dir, "handoff-load.md"),
    readTemplate("tools/codex/handoff-load.md"),
    "handoff-load prompt"
  );
  inf("Use with: /handoff-export  and  /handoff-load");
}

function installAider(cwd) {
  hd("Installing for Aider");
  const dir = path.join(cwd, ".aider", "commands");
  writeFile(
    path.join(dir, "handoff-export"),
    readTemplate("tools/aider/handoff-export.md"),
    "handoff-export command"
  );
  writeFile(
    path.join(dir, "handoff-load"),
    readTemplate("tools/aider/handoff-load.md"),
    "handoff-load command"
  );
  inf("Use with: /handoff-export  and  /handoff-load");
  inf("Requires Aider v0.50.0+ for /commands support");
}

function installCursor(cwd) {
  hd("Installing for Cursor");
  const snippetsFile = path.join(cwd, ".cursor", "context-handoff-snippets.md");
  writeFile(
    snippetsFile,
    readTemplate("tools/cursor/CURSOR_snippets.md"),
    "Cursor snippets"
  );
  inf("Cursor doesn't support custom slash commands.");
  inf(`Copy-paste snippets from: ${path.relative(cwd, snippetsFile)}`);
}

// ── usage ─────────────────────────────────────────────────────────
function printHelp() {
  console.log(`
${c.bold}context-handoff${c.reset} v${VERSION}
Universal AI session handoff skill installer

${c.bold}Usage:${c.reset}
  npx context-handoff --tool <name>   Install for a specific tool
  npx context-handoff --all           Install for all supported tools
  npx context-handoff --validate      Verify handoff.md follows schema
  npx context-handoff --list          List supported tools
  npx context-handoff --version       Show version
  npx context-handoff --help          Show this help

${c.bold}Supported tools:${c.reset}
  ${Object.keys(TOOLS).join("  ")}

${c.bold}Examples:${c.reset}
  npx context-handoff --tool claude-code
  npx context-handoff --tool gemini-cli
  npx context-handoff --all

${c.gray}Files are written to the current working directory.
Existing files are never overwritten.${c.reset}
`);
}

// ── main ──────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(VERSION);
    process.exit(0);
  }

  if (args.includes("--list")) {
    console.log("\nSupported tools:");
    Object.keys(TOOLS).forEach(t => console.log(`  • ${t}`));
    console.log();
    process.exit(0);
  }

  const cwd = process.cwd();

  if (args.includes("--dry-run")) DRY_RUN = true;
  if (args.includes("--force")) FORCE = true;

  console.log(`\n${c.bold}context-handoff${c.reset} v${VERSION}`);
  if (DRY_RUN) console.log(`${c.yellow}${c.bold}[DRY RUN] No files will be modified${c.reset}`);
  console.log(`${c.gray}Installing to: ${cwd}${c.reset}`);

  if (args.includes("--all")) {
    Object.entries(TOOLS).forEach(([, fn]) => fn(cwd));
    console.log(`\n${c.bold}${c.green}All tools installed!${c.reset}`);
    console.log(`${c.gray}Use /handoff-export to export, /handoff-load to import.${c.reset}\n`);
    return;
  }

  if (args.includes("--validate")) {
    validateHandoff(cwd);
    return;
  }

  const toolIdx = args.indexOf("--tool");
  if (toolIdx === -1 || !args[toolIdx + 1]) {
    err("Please specify a tool with --tool <name> or use --all");
    printHelp();
    process.exit(1);
  }

  const toolName = args[toolIdx + 1].toLowerCase();
  if (!TOOLS[toolName]) {
    err(`Unknown tool: "${toolName}"`);
    inf(`Supported: ${Object.keys(TOOLS).join(", ")}`);
    process.exit(1);
  }

  TOOLS[toolName](cwd);

  console.log(`\n${c.bold}${c.green}Done!${c.reset}`);
  console.log(`${c.gray}Run /handoff-export in ${toolName} when you want to hand off.${c.reset}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  TOOLS,
  validateHandoff,
  writeFile,
  appendFile,
  installClaudeCode,
  installGeminiCli,
  installOpenCode,
  installKiro,
  installCodex,
  installAider,
  installCursor,
  getConfig: () => ({ DRY_RUN, FORCE }),
  setConfig: (config) => {
    if (config.hasOwnProperty("DRY_RUN")) DRY_RUN = config.DRY_RUN;
    if (config.hasOwnProperty("FORCE")) FORCE = config.FORCE;
  }
};
