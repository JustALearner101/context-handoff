#!/usr/bin/env node

const fs   = require("fs");
const path = require("path");

// ── constants ────────────────────────────────────────────────────
const VERSION = "1.0.0";
const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

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

function writeFile(filePath, content, label) {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  if (fs.existsSync(filePath)) {
    inf(`${label} already exists — skipping (delete to reinstall)`);
  } else {
    fs.writeFileSync(filePath, content, "utf8");
    ok(`Created ${path.relative(process.cwd(), filePath)}`);
  }
}

function appendFile(filePath, content, marker, label) {
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, "utf8");
    if (existing.includes(marker)) {
      inf(`${label} already present in ${path.relative(process.cwd(), filePath)} — skipping`);
      return;
    }
    fs.appendFileSync(filePath, "\n\n" + content, "utf8");
    ok(`Appended ${label} to ${path.relative(process.cwd(), filePath)}`);
  } else {
    fs.writeFileSync(filePath, content, "utf8");
    ok(`Created ${path.relative(process.cwd(), filePath)}`);
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

  console.log(`\n${c.bold}context-handoff${c.reset} v${VERSION}`);
  console.log(`${c.gray}Installing to: ${cwd}${c.reset}`);

  if (args.includes("--all")) {
    Object.entries(TOOLS).forEach(([, fn]) => fn(cwd));
    console.log(`\n${c.bold}${c.green}All tools installed!${c.reset}`);
    console.log(`${c.gray}Use /handoff-export to export, /handoff-load to import.${c.reset}\n`);
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

main();
