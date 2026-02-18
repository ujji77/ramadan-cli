#!/usr/bin/env node

/**
 * Postinstall script — runs automatically after npm install.
 * Interactively sets up Claude Code integration if the user wants it.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
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
  const content = readFileSync(claudeMd, 'utf-8');
  return content.includes(MARKER);
}

function isSkillInstalled() {
  if (!existsSync(ramadanSkillFile)) return false;
  const content = readFileSync(ramadanSkillFile, 'utf-8');
  return content.includes(SKILL_MARKER);
}

function isConflictingSkill() {
  if (!existsSync(ramadanSkillFile)) return false;
  const content = readFileSync(ramadanSkillFile, 'utf-8');
  return !content.includes(SKILL_MARKER);
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  console.log('');
  console.log('   🌙 Ramadan CLI installed successfully!');
  console.log('   Run `ramadan` to get started.');
  console.log('');

  const claudeMdConfigured = isClaudeMdConfigured();
  const skillInstalled = isSkillInstalled();

  // Check if already fully configured
  if (claudeMdConfigured && skillInstalled) {
    console.log('   ✓ Claude Code integration already configured');
    return;
  }

  // Check if Claude is installed
  const claudeInstalled = isClaudeInstalled();

  if (!claudeInstalled) {
    const answer = await ask('   Do you use Claude Code? (y/n) ');

    if (answer !== 'y' && answer !== 'yes') {
      console.log('   ✓ Skipping Claude Code setup. You\'re all set!\n');
      return;
    }

    // They use Claude Code but it's not on PATH
    console.log('   ℹ Claude Code wasn\'t detected on your PATH.');

    const proceed = await ask('   Set up the integration anyway? (y/n) ');

    if (proceed !== 'y' && proceed !== 'yes') {
      console.log('   ✓ No worries — run `npm rebuild ramadan-cal` anytime to set it up later.\n');
      return;
    }
  } else {
    console.log('   ✓ Claude Code detected');

    const answer = await ask('   Set up Claude Code integration? Type `ramadan` or `/ramadan` in Claude Code. (y/n) ');

    if (answer !== 'y' && answer !== 'yes') {
      console.log('   ✓ Skipped. Run `npm rebuild ramadan-cal` anytime to set it up later.\n');
      return;
    }
  }

  // Create .claude directory if needed
  if (!existsSync(claudeDir)) {
    mkdirSync(claudeDir, { recursive: true });
    console.log('   ✓ Created ~/.claude/');
  }

  // Write or append to CLAUDE.md
  if (!claudeMdConfigured) {
    if (existsSync(claudeMd)) {
      appendFileSync(claudeMd, CLAUDE_ENTRY);
      console.log('   ✓ Added ramadan command to ~/.claude/CLAUDE.md');
    } else {
      writeFileSync(claudeMd, CLAUDE_ENTRY.trimStart());
      console.log('   ✓ Created ~/.claude/CLAUDE.md');
    }
  }

  // Create skills directory and ramadan skill
  if (!skillInstalled) {
    if (isConflictingSkill()) {
      console.log('   ⚠ ~/.claude/skills/ramadan/SKILL.md already exists (not created by this package).');
      const overwrite = await ask('   Overwrite it? (y/n) ');
      if (overwrite !== 'y' && overwrite !== 'yes') {
        console.log('   ✓ Skipped skill creation. You can add it manually later.');
      } else {
        writeFileSync(ramadanSkillFile, RAMADAN_SKILL);
        console.log('   ✓ Created ramadan skill — type `/ramadan` in Claude Code');
      }
    } else {
      if (!existsSync(skillsDir)) {
        mkdirSync(skillsDir, { recursive: true });
        console.log('   ✓ Created ~/.claude/skills/');
      }
      if (!existsSync(ramadanSkillDir)) {
        mkdirSync(ramadanSkillDir, { recursive: true });
      }
      writeFileSync(ramadanSkillFile, RAMADAN_SKILL);
      console.log('   ✓ Created ramadan skill — type `/ramadan` in Claude Code');
    }
  }

  console.log('   ✓ Done! Type "ramadan" or "/ramadan" inside Claude Code.\n');
}

// Handle non-interactive environments (CI, piped input)
if (!process.stdin.isTTY) {
  console.log('');
  console.log('   🌙 Ramadan CLI installed successfully!');
  console.log('   Run `ramadan` to get started.');
  console.log('   Run `npm rebuild ramadan-cal` in an interactive terminal to set up Claude Code.\n');
  process.exit(0);
}

main().catch(() => {
  // Non-fatal — never block the install
  process.exit(0);
});
