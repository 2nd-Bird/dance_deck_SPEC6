#!/usr/bin/env node
/**
 * Hook: check_task_conflicts.mjs
 * Detects file conflicts in parallel task definitions before spawning workers
 *
 * Triggered on: PreToolUse (Bash tool)
 * Input: JSON payload via stdin
 * Output: Exit 1 to deny (conflicts found), Exit 0 to allow
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
    const conflicts = checkForConflicts(payload);

    if (conflicts.length > 0) {
      console.error('DENIED: Task file conflicts detected');
      console.error('\nConflicting tasks:');
      conflicts.forEach(c => {
        console.error(`  - ${c.task1} and ${c.task2} both touch: ${c.files.join(', ')}`);
      });
      console.error('\nSolution: Add depends_on relationship or split into sequential phases');
      console.error('See .github/codex/skills/no-conflict-task-decomposition.md');
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    // Allow on error to avoid breaking workflow
    process.exit(0);
  }
});

function checkForConflicts(payload) {
  const command = payload.command || payload.args?.command || '';
  const tool = payload.tool || '';

  // Only check Bash commands
  if (tool !== 'Bash') {
    return [];
  }

  // Only check codex-agent start commands
  if (!command.includes('codex-agent start')) {
    return [];
  }

  // Extract --tasks argument
  const tasksMatch = command.match(/--tasks\s+(\S+)/);
  if (!tasksMatch) {
    return [];
  }

  const tasksPath = tasksMatch[1];

  // If using --file flag (for standalone validation), extract that instead
  const fileMatch = command.match(/--file\s+(\S+)/);
  const filePath = fileMatch ? fileMatch[1] : tasksPath;

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return [];
  }

  // Parse tasks file
  const tasks = parseTasksFile(filePath);

  // Find conflicts
  return findFileConflicts(tasks);
}

function parseTasksFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Simple YAML parser for tasks structure
  // Expected format:
  // tasks:
  //   - id: task-01
  //     files: [file1, file2]
  //     depends_on: [task-00]
  //   - id: task-02
  //     files: [file3]

  const tasks = [];
  const lines = content.split('\n');
  let currentTask = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // New task entry
    if (line.match(/^\s*-\s+id:/)) {
      if (currentTask) {
        tasks.push(currentTask);
      }
      const idMatch = line.match(/id:\s*(\S+)/);
      currentTask = {
        id: idMatch ? idMatch[1] : `task-${tasks.length}`,
        files: [],
        depends_on: []
      };
    }
    // Files array
    else if (line.match(/^\s+files:/)) {
      if (currentTask) {
        const filesMatch = line.match(/files:\s*\[(.*)\]/);
        if (filesMatch) {
          currentTask.files = filesMatch[1]
            .split(',')
            .map(f => f.trim().replace(/['"]/g, ''))
            .filter(f => f.length > 0);
        }
      }
    }
    // Dependencies
    else if (line.match(/^\s+depends_on:/)) {
      if (currentTask) {
        const depsMatch = line.match(/depends_on:\s*\[(.*)\]/);
        if (depsMatch) {
          currentTask.depends_on = depsMatch[1]
            .split(',')
            .map(d => d.trim().replace(/['"]/g, ''))
            .filter(d => d.length > 0);
        }
      }
    }
  }

  if (currentTask) {
    tasks.push(currentTask);
  }

  return tasks;
}

function findFileConflicts(tasks) {
  const conflicts = [];

  // Build dependency graph
  const dependsMap = new Map();
  tasks.forEach(task => {
    dependsMap.set(task.id, new Set(task.depends_on || []));
  });

  // Check each pair of tasks
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const task1 = tasks[i];
      const task2 = tasks[j];

      // Skip if tasks have explicit dependency relationship
      if (hasDependency(task1.id, task2.id, dependsMap) ||
          hasDependency(task2.id, task1.id, dependsMap)) {
        continue;
      }

      // Check for file overlaps
      const overlaps = task1.files.filter(f => task2.files.includes(f));
      if (overlaps.length > 0) {
        conflicts.push({
          task1: task1.id,
          task2: task2.id,
          files: overlaps
        });
      }
    }
  }

  return conflicts;
}

function hasDependency(taskA, taskB, dependsMap) {
  // Check if taskA depends on taskB (directly or transitively)
  const visited = new Set();
  const queue = [taskA];

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    const deps = dependsMap.get(current);
    if (!deps) continue;

    if (deps.has(taskB)) {
      return true;
    }

    deps.forEach(dep => queue.push(dep));
  }

  return false;
}
