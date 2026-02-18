#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, createReadStream, createWriteStream, openSync, closeSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';
import { createInterface } from 'readline';

const home = homedir();
const claudeDir = join(home, '.claude');
const claudeMd = join(claudeDir, 'CLAUDE.md');
const skillsDir = join(claudeDir, 'skills');
const ramadanSkillDir = join(skillsDir, 'ramadan');
const ramadanSkillFile = join(ramadanSkillDir, 'SKILL.md');

const MARKER = '<!-- ramadan-cal -->';
const CLAUDE_ENTRY = `
${MARKER}
## Ramadan CLI
When the user types "ramadan" or any command starting with "ramadan" (like "ramadan times", "ramadan reset", "ramadan test mid", "ramadan eid"), run it as a shell command using bash. Do not answer from general knowledge.
${MARKER}
`;

const SKILL_MARKER = '<!-- ramadan-cal-skill -->';
const RAMADAN_SKILL = `---
name: ramadan
description: Show Ramadan prayer times, Eid countdown, and Islamic calendar info. Use when the user invokes /ramadan with optional subcommands: times, calendar, eid YYYY-MM-DD, reset, check.
disable-model-invocation: true
---

${SKILL_MARKER}

Run the Ramadan CLI and display the output exactly as returned:

\`\`\`bash
ramadan $ARGUMENTS
\`\`\`
`;

function log(msg) {
  process.stderr.write(msg + '\n');
}

function isClaudeInstalled() {
  try {
    execSync('which claude', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function isClaudeMdConfigured() {
  if (!existsSync(claudeMd)) return false;
  return readFileSync(claudeMd, 'utf-8').includes(MARKER);
}

function isSkillInstalled() {
  if (!existsSync(ramadanSkillFile)) return false;
  return readFileSync(ramadanSkillFile, 'utf-8').includes(SKILL_MARKER);
}

function configureClaudeMd() {
  if (isClaudeMdConfigured()) return;
  if (!existsSync(claudeDir)) mkdirSync(claudeDir, { recursive: true });
  if (existsSync(claudeMd)) {
    appendFileSync(claudeMd, CLAUDE_ENTRY);
  } else {
    writeFileSync(claudeMd, CLAUDE_ENTRY.trimStart());
  }
}

function createSkill() {
  if (!existsSync(skillsDir)) mkdirSync(skillsDir, { recursive: true });
  if (!existsSync(ramadanSkillDir)) mkdirSync(ramadanSkillDir, { recursive: true });
  writeFileSync(ramadanSkillFile, RAMADAN_SKILL);
  configureClaudeMd();
}

function canPrompt() {
  try {
    const fd = openSync('/dev/tty', 'r+');
    closeSync(fd);
    return true;
  } catch {
    return false;
  }
}

function ask(question) {
  return new Promise((resolve) => {
    // Use /dev/tty so prompts work even when stdin is piped (npm install)
    let ttyInput, ttyOutput;
    try {
      ttyInput = createReadStream('/dev/tty');
      ttyOutput = createWriteStream('/dev/tty', { flags: 'a' });
    } catch {
      const rl = createInterface({ input: process.stdin, output: process.stderr });
      rl.question(question, (answer) => { rl.close(); resolve(answer.trim().toLowerCase()); });
      return;
    }
    const rl = createInterface({ input: ttyInput, output: ttyOutput });
    rl.question(question, (answer) => {
      rl.close();
      ttyInput.destroy();
      ttyOutput.destroy();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  log('');
  log('   🌙 Ramadan CLI installed successfully!');
  log('');

  // Step 1: Check if Claude Code is installed
  if (!isClaudeInstalled()) {
    log('   Claude Code not detected on your PATH.');
    log('   Run `npm rebuild ramadan-cal` to set up Claude Code integration later.');
    log('');
    log('   ➜  Run `ramadan` to get started.');
    log('');
    return;
  }

  log('   ✓ Claude Code detected');
  log('');

  // Already fully set up?
  if (isSkillInstalled() && isClaudeMdConfigured()) {
    log('   ✓ Claude Code integration already configured');
    log('   Type "ramadan" or "/ramadan" in Claude Code.');
    log('');
    return;
  }

  // If we can't open a terminal for prompts, bail out gracefully
  if (!canPrompt()) {
    log('   Run `npm rebuild ramadan-cal` in your terminal to finish Claude Code setup.');
    log('');
    return;
  }

  // Step 2: Check if skills folder exists
  if (!existsSync(skillsDir)) {
    // Skills folder doesn't exist — ask to create it
    const answer = await ask('   Create a Claude Code skills folder and add the ramadan skill? (y/n) ');
    log('');
    if (answer === 'y' || answer === 'yes') {
      createSkill();
      log('   ✓ Created ~/.claude/skills/ramadan/');
      log('   ✓ Ramadan skill added');
      log('');
      log('   Type "ramadan" or "/ramadan" in Claude Code to use it.');
    } else {
      log('   Skipped. Run `npm rebuild ramadan-cal` or type `ramadan` directly in your terminal.');
    }
  } else {
    // Skills folder exists — ask if they want the skill added
    if (isSkillInstalled()) {
      log('   ✓ Ramadan skill already installed');
      configureClaudeMd();
      log('   Type "ramadan" or "/ramadan" in Claude Code.');
      log('');
      return;
    }

    const answer = await ask('   Add the ramadan skill to Claude Code? (y/n) ');
    log('');
    if (answer === 'y' || answer === 'yes') {
      createSkill();
      log('   ✓ Ramadan skill added to ~/.claude/skills/');
      log('');
      log('   Type "ramadan" or "/ramadan" in Claude Code to use it.');
    } else {
      log('   Skipped. Run `npm rebuild ramadan-cal` or type `ramadan` directly in your terminal.');
    }
  }

  log('');
}

main().catch(() => {
  process.exit(0);
});
