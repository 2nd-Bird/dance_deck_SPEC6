#!/bin/bash
# Monitor all codex-agent workers without triggering permission prompts
# Usage: ./scripts/monitor_workers.sh [lines_to_show]

set -e

LINES=${1:-20}

echo "=== Codex Worker Status ==="
echo
codex-agent status
echo
echo "=== Worker Diffs and Logs ==="
echo

# Manually enumerate known worker IDs (avoid for-loops with variables)
# Update this list when adding/removing workers

echo "--- task-01-data-model ---"
codex-agent diff task-01-data-model --stat 2>/dev/null || echo "No diff"
echo
codex-agent logs task-01-data-model -n "$LINES" 2>/dev/null | tail -10 || echo "No logs"
echo

echo "--- task-02-audio-extraction ---"
codex-agent diff task-02-audio-extraction --stat 2>/dev/null || echo "No diff"
echo
codex-agent logs task-02-audio-extraction -n "$LINES" 2>/dev/null | tail -10 || echo "No logs"
echo

echo "--- task-03-bpm-analysis ---"
codex-agent diff task-03-bpm-analysis --stat 2>/dev/null || echo "No diff"
echo
codex-agent logs task-03-bpm-analysis -n "$LINES" 2>/dev/null | tail -10 || echo "No logs"
echo

echo "--- task-04-tempo-normalization ---"
codex-agent diff task-04-tempo-normalization --stat 2>/dev/null || echo "No diff"
echo
codex-agent logs task-04-tempo-normalization -n "$LINES" 2>/dev/null | tail -10 || echo "No logs"
echo

echo "--- task-05-beat-map-snapping ---"
codex-agent diff task-05-beat-map-snapping --stat 2>/dev/null || echo "No diff"
echo
codex-agent logs task-05-beat-map-snapping -n "$LINES" 2>/dev/null | tail -10 || echo "No logs"
echo

echo "--- task-06-ui-integration ---"
codex-agent diff task-06-ui-integration --stat 2>/dev/null || echo "No diff"
echo
codex-agent logs task-06-ui-integration -n "$LINES" 2>/dev/null | tail -10 || echo "No logs"
echo

echo "--- task-07-cache-fallback ---"
codex-agent diff task-07-cache-fallback --stat 2>/dev/null || echo "No diff"
echo
codex-agent logs task-07-cache-fallback -n "$LINES" 2>/dev/null | tail -10 || echo "No logs"
echo

echo "=== Monitoring Complete ==="
