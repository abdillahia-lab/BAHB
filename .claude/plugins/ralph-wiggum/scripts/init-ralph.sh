#!/bin/bash
# Initialize Ralph state file

PROMPT="$1"
MAX_ITER="${2:-10}"
COMPLETION="${3:-}"

cat > .ralph-state.json << EOF
{
  "active": true,
  "prompt": $(echo "$PROMPT" | jq -R -s '.'),
  "maxIterations": $MAX_ITER,
  "currentIteration": 1,
  "completionPromise": $(echo "$COMPLETION" | jq -R -s '.'),
  "startTime": "$(date -Iseconds)"
}
EOF

echo "Ralph loop initialized with max $MAX_ITER iterations"
