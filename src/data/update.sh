#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Run the Python update script and capture output
echo "Running update.py..."
OUTPUT=$(python3 "$SCRIPT_DIR/update.py")
echo "$OUTPUT"

# Extract the data date from the script output
DATA_DATE=$(echo "$OUTPUT" | sed -n 's/^DATA_DATE=\([0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}\)$/\1/p')

if [ -z "$DATA_DATE" ]; then
    echo "Error: Could not determine data date from update.py output."
    exit 1
fi

echo ""
echo "Detected data date: $DATA_DATE"

# Stage, commit and push from the project root
cd "$PROJECT_ROOT"

git add src/data/json/ src/data/csv/
git commit -m "($DATA_DATE) Update"
git push

echo ""
echo "Done! Committed and pushed: ($DATA_DATE) Update"
