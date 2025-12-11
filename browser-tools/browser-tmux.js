#!/usr/bin/env node

/**
 * browser-tmux.js - Launch Chrome in tmux for persistent browser sessions
 * 
 * CRITICAL: Always use this instead of browser-start.js for agent workflows.
 * Chrome started directly will crash when the agent session ends.
 * 
 * Usage:
 *   browser-tmux.js [options]
 * 
 * Options:
 *   --user <username>     Run as specific user (default: current user)
 *   --display <display>   X display (default: $DISPLAY or :9)
 *   --profile <name>      Chrome profile directory name (default: "Default")
 *   --user-data <path>    Chrome user data dir (default: ~/.config/google-chrome)
 *   --session <name>      tmux session name (default: "browser")
 *   --port <port>         Remote debugging port (default: 9222)
 *   --kill                Kill existing session without starting new one
 *   --help                Show this help
 * 
 * Examples:
 *   browser-tmux.js
 *   browser-tmux.js --user alex-work --display :1 --profile "Profile 3"
 *   browser-tmux.js --session mew-browser --port 9223
 *   browser-tmux.js --kill
 */

import { execSync, spawn } from "node:child_process";
import puppeteer from "puppeteer-core";

// Parse arguments
const args = process.argv.slice(2);
const opts = {
  user: null,
  display: process.env.DISPLAY || ":9",
  profile: null,
  userData: null,
  session: "browser",
  port: 9222,
  kill: false,
  help: false,
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--user":
      opts.user = args[++i];
      break;
    case "--display":
      opts.display = args[++i];
      break;
    case "--profile":
      opts.profile = args[++i];
      break;
    case "--user-data":
      opts.userData = args[++i];
      break;
    case "--session":
      opts.session = args[++i];
      break;
    case "--port":
      opts.port = parseInt(args[++i], 10);
      break;
    case "--kill":
      opts.kill = true;
      break;
    case "--help":
      opts.help = true;
      break;
  }
}

if (opts.help) {
  console.log(`browser-tmux.js - Launch Chrome in tmux for persistent browser sessions

Usage: browser-tmux.js [options]

Options:
  --user <username>     Run as specific user (default: current user)
  --display <display>   X display (default: $DISPLAY or :9)
  --profile <name>      Chrome profile directory name (e.g., "Profile 3")
  --user-data <path>    Chrome user data dir (default: ~/.config/google-chrome)
  --session <name>      tmux session name (default: "browser")
  --port <port>         Remote debugging port (default: 9222)
  --kill                Kill existing session without starting new one
  --help                Show this help

Examples:
  browser-tmux.js
  browser-tmux.js --user alex-work --display :1 --profile "Profile 3"
  browser-tmux.js --session mew-browser --port 9223
  browser-tmux.js --kill

Known Profiles:
  alex-work "Profile 3" = mew@ideaflow.io (DISPLAY :1)
  alex "Default" = personal (DISPLAY :9)
`);
  process.exit(0);
}

// Detect Chrome path
function getChromePath() {
  const paths = [
    "/usr/bin/google-chrome",
    "/opt/google/chrome/chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];
  for (const p of paths) {
    try {
      execSync(`test -x ${p}`, { stdio: "ignore" });
      return p;
    } catch {}
  }
  throw new Error("Chrome/Chromium not found");
}

// Build the command to run
function buildCommand() {
  const chromePath = getChromePath();
  const homeDir = opts.user ? `/home/${opts.user}` : process.env.HOME;
  const userDataDir = opts.userData || `${homeDir}/.config/google-chrome`;
  
  let cmd = `DISPLAY=${opts.display} ${chromePath} --remote-debugging-port=${opts.port} --user-data-dir=${userDataDir}`;
  
  if (opts.profile) {
    cmd += ` --profile-directory="${opts.profile}"`;
  }
  
  cmd += " --no-first-run";
  
  return cmd;
}

// Kill existing tmux session
function killSession() {
  const sudoPrefix = opts.user ? `sudo -u ${opts.user} ` : "";
  try {
    execSync(`${sudoPrefix}tmux kill-session -t ${opts.session} 2>/dev/null`, { stdio: "ignore" });
    console.log(`✓ Killed existing tmux session: ${opts.session}`);
    return true;
  } catch {
    return false;
  }
}

// Start new tmux session with Chrome
function startSession() {
  const sudoPrefix = opts.user ? `sudo -u ${opts.user} ` : "";
  const chromeCmd = buildCommand();
  const tmuxCmd = `${sudoPrefix}tmux new-session -d -s ${opts.session} '${chromeCmd}'`;
  
  try {
    execSync(tmuxCmd, { stdio: "pipe" });
    console.log(`✓ Started tmux session: ${opts.session}`);
    console.log(`  Command: ${chromeCmd}`);
    return true;
  } catch (e) {
    console.error(`✗ Failed to start tmux session: ${e.message}`);
    return false;
  }
}

// Wait for Chrome to be ready
async function waitForChrome(maxAttempts = 30) {
  console.log(`  Waiting for Chrome on port ${opts.port}...`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const browser = await puppeteer.connect({
        browserURL: `http://localhost:${opts.port}`,
        defaultViewport: null,
      });
      await browser.disconnect();
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

// Main
async function main() {
  // Always try to kill existing session first
  killSession();
  
  if (opts.kill) {
    process.exit(0);
  }
  
  // Start new session
  if (!startSession()) {
    process.exit(1);
  }
  
  // Wait for Chrome
  await new Promise((r) => setTimeout(r, 2000)); // Initial delay
  
  const connected = await waitForChrome();
  
  if (connected) {
    console.log(`✓ Chrome ready on http://localhost:${opts.port}`);
    console.log(`\nTo attach to session: tmux attach -t ${opts.session}`);
    console.log(`To kill session: browser-tmux.js --kill --session ${opts.session}`);
  } else {
    console.error(`✗ Chrome failed to start or connect`);
    console.log(`\nDebug: Check tmux session with: tmux attach -t ${opts.session}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
