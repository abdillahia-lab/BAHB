# Ralph Loop Command

Start an iterative development loop that continuously feeds the same prompt until completion.

## Usage

```
/ralph-loop "<your prompt here>" [options]
```

## Options

- `--max-iterations <n>`: Maximum number of iterations (default: 10)
- `--completion-promise <text>`: Text that signals completion

## How It Works

1. Ralph saves your prompt to `.ralph-state.json`
2. The stop hook intercepts exit attempts
3. Your prompt is fed back to Claude
4. Claude sees previous work via git history
5. Loop continues until completion or max iterations

## Best Practices

- Define clear completion criteria in your prompt
- Break work into verifiable phases
- Use tests as automatic validators
- Always set iteration limits

## Example

```
/ralph-loop "Implement a REST API for user management. Create models, routes, and tests. Mark as complete when all tests pass." --max-iterations 5
```

---

When this command runs, save the prompt and options to `.ralph-state.json`:
```json
{
  "active": true,
  "prompt": "<user's prompt>",
  "maxIterations": <n>,
  "currentIteration": 1,
  "completionPromise": "<text>",
  "startTime": "<ISO timestamp>"
}
```

Then execute the prompt as your current task.
