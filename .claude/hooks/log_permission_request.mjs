#!/usr/bin/env node
/**
 * Hook: log_permission_request.mjs
 * Automatically logs every permission prompt to agent_docs/approvals/APPROVAL_LOG.md
 *
 * Triggered on: PermissionRequest
 * Input: JSON payload via stdin
 * Output: Appends entry to APPROVAL_LOG.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use CLAUDE_PROJECT_DIR if available, otherwise derive from script location
const projectDir = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '../..');
const logPath = path.join(projectDir, 'agent_docs/approvals/APPROVAL_LOG.md');

// Read hook payload from stdin
let inputData = '';
process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(inputData);
    logPermissionRequest(payload);
  } catch (error) {
    console.error('Failed to parse hook payload:', error);
    process.exit(1);
  }
});

function logPermissionRequest(payload) {
  // Extract relevant fields from payload
  const timestamp = new Date().toISOString();
  const command = payload.command || payload.args?.command || 'unknown';
  const tool = payload.tool || 'unknown';
  const pwd = payload.cwd || process.cwd();
  const reason = payload.description || payload.reason || '';

  // Redact secrets
  const redactedCommand = redactSecrets(command);

  // Determine category
  const category = categorizeCommand(redactedCommand);

  // Format log entry
  const entry = `
### ${timestamp}
- **PWD**: \`${pwd}\`
- **Command**: \`${redactedCommand}\`
- **Tool**: ${tool}
- **Reason/Label**: ${reason}
- **User Choice**: (pending)
- **Outcome**: (pending)
- **Category**: ${category}

`;

  // Append to log file
  try {
    // Ensure directory exists
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Append entry
    fs.appendFileSync(logPath, entry, 'utf-8');
    console.log(`Logged permission request to ${logPath}`);
  } catch (error) {
    console.error('Failed to write to approval log:', error);
    process.exit(1);
  }
}

function redactSecrets(text) {
  // Simple secret redaction
  return text.replace(/(token|api[_-]?key|authorization|password|secret)[=:]\s*[^\s]+/gi, '$1=<REDACTED>');
}

function categorizeCommand(command) {
  const cmd = command.toLowerCase();

  if (/for\s+\w+\s+in|while|until/.test(cmd)) {
    return 'LOOP/VARIABLES';
  }
  if (/&&|\|\||;/.test(cmd)) {
    return 'CHAINED';
  }
  if (/cd\s+\.codex-agent\/worktrees|pwd|getcwd/.test(cmd)) {
    return 'PATH/CWD';
  }
  if (/git\s+(reset|clean|push.*--force|worktree\s+remove|branch\s+-D)/.test(cmd)) {
    return 'GIT';
  }
  if (/rm\s+-rf|sudo|mkfs|dd\s+.*of=\/dev/.test(cmd)) {
    return 'DESTRUCTIVE';
  }
  if (/curl.*\||wget.*\||npm\s+publish/.test(cmd)) {
    return 'NETWORK';
  }
  if (/nano|vim|vi|emacs|code|edit/.test(cmd)) {
    return 'FILE_EDIT';
  }

  return 'UNKNOWN';
}
