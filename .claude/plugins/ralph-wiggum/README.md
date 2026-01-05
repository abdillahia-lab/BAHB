# Ralph Wiggum Plugin

**"Ralph is a Bash loop"** — A methodology for iterative AI development through self-referential loops.

## Overview

Ralph Wiggum creates continuous feedback loops where Claude:
1. Works on a task
2. Attempts to exit
3. Gets intercepted by the stop hook
4. Receives the same prompt again
5. Iterates until completion criteria are met

## Installation

The plugin is installed in `.claude/plugins/ralph-wiggum/`.

## Commands

### `/ralph-loop`

Start an iterative development loop:

```bash
/ralph-loop "Your task description here" --max-iterations 5
```

**Options:**
- `--max-iterations <n>`: Maximum iterations (default: 10)
- `--completion-promise <text>`: Text signaling completion

### `/cancel-ralph`

Stop an active loop:

```bash
/cancel-ralph
```

## Best Practices

### Writing Effective Prompts

1. **Clear Completion Criteria**: Define measurable success conditions
2. **Incremental Goals**: Break work into phases for verification
3. **Test-Driven**: Use automated tests as loop validators
4. **Iteration Limits**: Always set `--max-iterations`

### Ideal Use Cases

- Greenfield development with clear specs
- Iterative refinement tasks
- Projects with automated verification (tests, linters)
- Bug fixing with reproducible test cases

### Less Suitable For

- Decisions requiring human judgment
- Ambiguous success criteria
- Tasks without automatic verification

## How It Works

1. `/ralph-loop` saves state to `.ralph-state.json`
2. You work on the task normally
3. When you try to exit, the stop hook intercepts
4. Hook feeds your prompt back with iteration count
5. You see previous work in git history
6. Loop continues until max iterations or `/cancel-ralph`

## Philosophy

> "Operator skill matters" — Success depends on writing clear, well-structured prompts with explicit completion criteria.

Ralph treats failures as informative data and prioritizes iteration over perfection. Each loop iteration builds on previous work visible in git history.

## State File

`.ralph-state.json` tracks:
```json
{
  "active": true,
  "prompt": "Your task...",
  "maxIterations": 10,
  "currentIteration": 3,
  "completionPromise": "All tests pass",
  "startTime": "2024-01-01T00:00:00Z"
}
```
