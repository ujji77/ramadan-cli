#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';

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

function main() {
  log('');
  log('   🌙 Ramadan CLI installed successfully!');
  log('');

  if (!isClaudeInstalled()) {
    log('   ➜  Run `ramadan` to get started.');
    log('');
    return;
  }

  if (isSkillInstalled() && isClaudeMdConfigured()) {
    log('   ✓ Claude Code integration already configured');
    log('   Type "ramadan" or "/ramadan" in Claude Code.');
    log('');
    return;
  }

  try {
    createSkill();
    log('   ✓ Claude Code integration configured');
    log('   Type "ramadan" or "/ramadan" in Claude Code.');
  } catch {
    log('   ✗ Could not set up Claude Code integration automatically.');
    log('   Set it up manually: https://ramadan-cal-site.onrender.com/#troubleshooting');
  }
  log('');
}

main();
