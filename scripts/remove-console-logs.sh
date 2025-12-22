#!/bin/bash
# Remove console.log statements from production code
# Keep console.error, console.warn, and console statements in scripts/

echo "Removing console.log statements from production code..."

# Find all .ts and .tsx files except in scripts/, node_modules/, and .next/
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./scripts/*" \
  -not -path "./supabase/migrations/*" \
  | while read file; do

  # Count console.log statements
  count=$(grep -c "console\.log" "$file" 2>/dev/null || echo 0)

  if [ "$count" -gt 0 ]; then
    echo "Cleaning $file ($count console.log statements)"

    # Remove lines with just console.log (entire line)
    sed -i '/^\s*console\.log.*$/d' "$file"

    # Comment out inline console.log statements
    sed -i 's/console\.log(/\/\/ console.log(/g' "$file"
  fi
done

echo "✓ Console.log cleanup complete!"
echo ""
echo "Remaining console.log statements:"
grep -r "console\.log" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=scripts . | wc -l
