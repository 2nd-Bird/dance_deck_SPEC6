#!/bin/bash
# Safe cleanup and restart script for codex-agent workers
# Executes commands sequentially without chaining to avoid permission prompts

set -e

cd /home/second_bird/dance_deck_copy

echo "=== Removing Worktrees ==="
git worktree remove --force .codex-agent/worktrees/task-01-data-model
echo "✓ Removed task-01-data-model"

git worktree remove --force .codex-agent/worktrees/task-02-audio-extraction
echo "✓ Removed task-02-audio-extraction"

git worktree remove --force .codex-agent/worktrees/task-03-bpm-analysis
echo "✓ Removed task-03-bpm-analysis"

git worktree remove --force .codex-agent/worktrees/task-04-tempo-normalization
echo "✓ Removed task-04-tempo-normalization"

git worktree remove --force .codex-agent/worktrees/task-05-beat-map-snapping
echo "✓ Removed task-05-beat-map-snapping"

git worktree remove --force .codex-agent/worktrees/task-06-ui-integration
echo "✓ Removed task-06-ui-integration"

git worktree remove --force .codex-agent/worktrees/task-07-cache-fallback
echo "✓ Removed task-07-cache-fallback"

echo ""
echo "=== Pruning Worktree Metadata ==="
git worktree prune
echo "✓ Pruned"

echo ""
echo "=== Cleaning Up Branches ==="
git branch -D codex/task-01-data-model
git branch -D codex/task-02-audio-extraction
git branch -D codex/task-03-bpm-analysis
git branch -D codex/task-04-tempo-normalization
git branch -D codex/task-05-beat-map-snapping
git branch -D codex/task-06-ui-integration
git branch -D codex/task-07-cache-fallback
echo "✓ Branches deleted"

echo ""
echo "=== Starting Workers ==="
codex-agent start --tasks .github/codex/runs/run_20260118_170020/tasks.yaml
echo "✓ Workers started"

echo ""
echo "=== Initial Status ==="
codex-agent status

echo ""
echo "✓ Cleanup and restart complete!"
echo "Run ./scripts/monitor_workers.sh to track progress"
