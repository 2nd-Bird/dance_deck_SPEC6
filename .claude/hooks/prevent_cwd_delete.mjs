#!/usr/bin/env node
/**
 * Hook: prevent_cwd_delete.mjs
 * Prevents commands that could break shell by deleting CWD or operating from unsafe directories
 *
 * Triggered on: PreToolUse (Bash tool)
 * Input: JSON payload via stdin
 * Output: Exit 1 to deny, Exit 0 to allow
 */

import fs from 'fs';
import path from 'path';

// Read hook payload from stdin
let inputData = '';
process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(inputData);
    const shouldDeny = checkCommand(payload);

    if (shouldDeny) {
      console.error('DENIED: Command violates worktree safety rules');
      console.error('See .claude/rules/worktree-safety.md for details');
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Failed to parse hook payload:', error);
    process.exit(0); // Allow on error to avoid breaking workflow
  }
});

function checkCommand(payload) {
  const command = payload.command || payload.args?.command || '';
  const tool = payload.tool || '';
  const cwd = payload.cwd || process.cwd();

  // Only check Bash commands
  if (tool !== 'Bash') {
    return false;
  }

  const cmd = command.toLowerCase();

  // DENY: cd into worktrees directory
  if (/cd\s+.*\.codex-agent\/worktrees/.test(cmd)) {
    return true;
  }

  // DENY: cleanup operations while inside worktrees
  if (cwd.includes('.codex-agent/worktrees')) {
    if (/git\s+worktree\s+(remove|prune)|codex-agent\s+cleanup/.test(cmd)) {
      return true;
    }
  }

  // DENY: destructive operations without explicit repo root check
  if (/git\s+worktree\s+remove|codex-agent\s+cleanup/.test(cmd)) {
    // Only allow if command explicitly uses absolute path or git -C from safe location
    if (!cmd.includes('/home/second_bird/dance_deck_copy') && !cmd.includes('git -C')) {
      // Check if we're in repo root
      if (!cwd.endsWith('dance_deck_copy') || cwd.includes('.codex-agent')) {
        return true;
      }
    }
  }

  return false;
}
