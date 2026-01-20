# Fix Plan: Sanitize codex-agent Outputs for Claude Code TUI

## Problem Statement
codex-agent outputs contain control characters from tmux sessions that break the Claude Code TUI:
- ANSI escape sequences (color codes, cursor movement)
- Multi-byte UTF-8 characters rendered as escape sequences
- Carriage returns (`\r`) and other control characters
- Line wrapping artifacts from tmux

## Root Cause
codex-agent captures tmux pane content which includes:
1. Raw terminal output with ANSI codes
2. UTF-8 characters that get mangled in transmission
3. Control characters (^C, ^D, etc.)
4. tmux-specific formatting artifacts

## Solution: Output Sanitization Layer

### Implementation Location
File: `/home/second_bird/orchastrator/src/commands/*.rs` (or shared utility)

### Sanitization Pipeline

```rust
fn sanitize_output(raw: &str) -> String {
    let mut sanitized = raw.to_string();

    // 1. Strip ANSI escape sequences
    sanitized = strip_ansi_escapes(&sanitized);

    // 2. Normalize line endings (remove \r)
    sanitized = sanitized.replace("\r\n", "\n").replace("\r", "\n");

    // 3. Remove control characters (except \n and \t)
    sanitized = remove_control_chars(&sanitized);

    // 4. Normalize UTF-8 (replace invalid sequences)
    sanitized = normalize_utf8(&sanitized);

    sanitized
}

fn strip_ansi_escapes(input: &str) -> String {
    // Regex: \x1B\[[0-9;]*[A-Za-z] (CSI sequences)
    // Also: \x1B[()][AB012] (character set switches)
    // Use `strip-ansi-escapes` crate or regex
    use regex::Regex;
    let ansi_regex = Regex::new(r"\x1B\[[0-9;]*[A-Za-z]|\x1B[()][AB012]").unwrap();
    ansi_regex.replace_all(input, "").to_string()
}

fn remove_control_chars(input: &str) -> String {
    input.chars()
        .filter(|c| {
            let is_allowed = *c == '\n' || *c == '\t' || !c.is_control();
            is_allowed
        })
        .collect()
}

fn normalize_utf8(input: &str) -> String {
    // Replace invalid UTF-8 sequences with U+FFFD (replacement character)
    String::from_utf8_lossy(input.as_bytes()).to_string()
}
```

### Apply to Commands

**Default behavior (sanitized):**
```rust
// In commands/status.rs
pub fn status_command() -> Result<()> {
    let raw_output = capture_tmux_status()?;
    let clean_output = sanitize_output(&raw_output);
    println!("{}", clean_output);
    Ok(())
}

// In commands/logs.rs
pub fn logs_command(worker_id: &str, lines: usize) -> Result<()> {
    let raw_logs = capture_tmux_logs(worker_id, lines)?;
    let clean_logs = sanitize_output(&raw_logs);
    println!("{}", clean_logs);
    Ok(())
}
```

**Opt-out flag (--raw):**
```rust
#[derive(Parser)]
struct StatusArgs {
    #[arg(long, help = "Show raw output without sanitization")]
    raw: bool,
}

pub fn status_command(args: StatusArgs) -> Result<()> {
    let output = capture_tmux_status()?;

    if args.raw {
        println!("{}", output);  // Raw output
    } else {
        println!("{}", sanitize_output(&output));  // Clean output
    }

    Ok(())
}
```

## Affected Commands

Apply sanitization to:
- ✅ `codex-agent status`
- ✅ `codex-agent logs <worker-id>`
- ✅ `codex-agent diff <worker-id>` (git output should be clean, but sanitize anyway)
- ⚠️ `codex-agent send <worker-id> "message"` (sanitize response, not input)

## Testing

### Test Cases

1. **ANSI codes:**
   ```bash
   echo -e "\033[31mRed Text\033[0m" | codex-agent-sanitize
   # Expected: "Red Text"
   ```

2. **Control characters:**
   ```bash
   echo -e "Hello\r\nWorld^C^D" | codex-agent-sanitize
   # Expected: "Hello\nWorld"
   ```

3. **UTF-8 em-dash:**
   ```bash
   echo "CLAUDE.md — Test" | codex-agent-sanitize
   # Expected: "CLAUDE.md — Test" (preserved)
   ```

4. **Long lines (tmux wrapping):**
   ```bash
   # Verify no \ continuation artifacts remain
   ```

### Validation Script
```bash
#!/bin/bash
# Test sanitization

# 1. Capture raw tmux output
tmux capture-pane -p > /tmp/raw.txt

# 2. Sanitize
codex-agent logs task-id -n 50 > /tmp/sanitized.txt

# 3. Check for control chars
if grep -P '[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]' /tmp/sanitized.txt; then
    echo "FAIL: Control characters found"
    exit 1
fi

# 4. Check for ANSI codes
if grep -P '\x1B\[' /tmp/sanitized.txt; then
    echo "FAIL: ANSI codes found"
    exit 1
fi

echo "PASS: Output is clean"
```

## Rust Dependencies

Add to `Cargo.toml`:
```toml
[dependencies]
strip-ansi-escapes = "0.2"  # Or use regex
regex = "1.10"
```

## Implementation Priority

1. **High:** Implement `sanitize_output()` utility function
2. **High:** Apply to `logs` command (most problematic)
3. **Medium:** Apply to `status` command
4. **Medium:** Add `--raw` flag for debugging
5. **Low:** Apply to other commands
6. **Low:** Add comprehensive tests

## Alternative: Sanitize at Claude Code Level

If modifying codex-agent is not feasible, Claude Code can sanitize tool outputs:

```typescript
// In Claude Code Bash tool wrapper
function sanitizeBashOutput(raw: string): string {
    return raw
        .replace(/\x1B\[[0-9;]*[A-Za-z]/g, '')  // Strip ANSI
        .replace(/\r\n/g, '\n')                  // Normalize line endings
        .replace(/\r/g, '\n')
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');  // Remove control chars
}
```

But this is less ideal since it applies to ALL bash commands, not just codex-agent.

## Rollout Plan

1. Implement sanitization in codex-agent (1-2 hours)
2. Test locally with Claude Code (30 min)
3. Commit to `/home/second_bird/orchastrator` repo
4. Update installation instructions in CLAUDE.md
5. Monitor for regression in upcoming sessions

## Success Metrics

- ✅ No more broken TUI rendering in Claude Code
- ✅ codex-agent logs are readable and clean
- ✅ UTF-8 characters (em-dash, etc.) are preserved correctly
- ✅ `--raw` flag available for debugging when needed
