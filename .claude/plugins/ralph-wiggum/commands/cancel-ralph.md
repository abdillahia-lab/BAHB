# Cancel Ralph Command

Terminates an active Ralph loop.

## Usage

```
/cancel-ralph
```

## What It Does

1. Reads `.ralph-state.json`
2. Sets `active` to `false`
3. Reports final iteration count
4. Allows normal session exit

## Example Output

```
Ralph loop cancelled.
- Completed iterations: 3
- Total time: 15 minutes
- State saved to .ralph-state.json
```

---

When this command runs, update `.ralph-state.json`:
```json
{
  "active": false,
  "endTime": "<ISO timestamp>",
  "status": "cancelled"
}
```

Report the loop statistics and confirm cancellation.
