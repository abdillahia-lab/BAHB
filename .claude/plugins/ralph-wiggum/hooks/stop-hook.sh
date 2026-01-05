#!/bin/bash
# Ralph Wiggum Stop Hook
# This hook intercepts session exit when a Ralph loop is active

RALPH_STATE=".ralph-state.json"

# Check if Ralph state file exists
if [ ! -f "$RALPH_STATE" ]; then
    exit 0  # No Ralph loop, allow exit
fi

# Read Ralph state
ACTIVE=$(jq -r '.active // false' "$RALPH_STATE" 2>/dev/null)
MAX_ITER=$(jq -r '.maxIterations // 10' "$RALPH_STATE" 2>/dev/null)
CURRENT_ITER=$(jq -r '.currentIteration // 1' "$RALPH_STATE" 2>/dev/null)
PROMPT=$(jq -r '.prompt // ""' "$RALPH_STATE" 2>/dev/null)
COMPLETION=$(jq -r '.completionPromise // ""' "$RALPH_STATE" 2>/dev/null)

# If not active or exceeded iterations, allow exit
if [ "$ACTIVE" != "true" ] || [ "$CURRENT_ITER" -ge "$MAX_ITER" ]; then
    # Mark as complete
    jq '.active = false | .status = "completed" | .endTime = now | tostring' "$RALPH_STATE" > "${RALPH_STATE}.tmp" && mv "${RALPH_STATE}.tmp" "$RALPH_STATE"
    exit 0
fi

# Increment iteration
NEW_ITER=$((CURRENT_ITER + 1))
jq ".currentIteration = $NEW_ITER" "$RALPH_STATE" > "${RALPH_STATE}.tmp" && mv "${RALPH_STATE}.tmp" "$RALPH_STATE"

# Output the prompt for the next iteration
echo "=== RALPH LOOP - Iteration $NEW_ITER of $MAX_ITER ==="
echo ""
echo "Previous work is available in git history. Continue with:"
echo ""
echo "$PROMPT"
echo ""
if [ -n "$COMPLETION" ] && [ "$COMPLETION" != "null" ]; then
    echo "Completion criteria: $COMPLETION"
fi

# Block exit by returning non-zero
exit 1
