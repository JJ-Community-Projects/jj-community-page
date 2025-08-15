#!/usr/bin/env bash
set -Eeuo pipefail

# Default parameters
search_dir="src"
output_file=".tmp/consolidated_files.txt"
file_pattern="impl.ts"

# Usage helper
usage() {
  cat <<EOF
Usage: $(basename "$0") [-s SEARCH_DIR] [-o OUTPUT_FILE] [-p FILE_PATTERN]
Options:
  -s SEARCH_DIR     Directory to search (default: src)
  -o OUTPUT_FILE    Output file path (default: .tmp/consolidated_files.txt)
  -p FILE_PATTERN   File name pattern passed to 'find -name' (default: impl.ts)
                    Examples: "*.ts", "index.tsx", "schema.*.ts"

This script searches for files matching the pattern in the specified directory
and consolidates all file contents into a single text file with clear separators.
EOF
  exit 1
}

# Parse options
while getopts ":s:o:p:h" opt; do
  case $opt in
    s) search_dir="$OPTARG" ;;
    o) output_file="$OPTARG" ;;
    p) file_pattern="$OPTARG" ;;
    h) usage ;;
    *) usage ;;
  esac
done
shift $((OPTIND -1))

echo "Searching in: $search_dir"
echo "Pattern:      $file_pattern"
echo "Will write to: $output_file"

# Ensure output directory exists
mkdir -p "$(dirname "$output_file")"

# Initialize output file with header
cat > "$output_file" <<EOF
================================================================================
CONSOLIDATED FILE CONTENTS
================================================================================
Search Directory: $search_dir
File Pattern: $file_pattern
Generated: $(date)
================================================================================

EOF

# Counter for files processed
file_count=0

# Process each file matching the pattern
find "$search_dir" -type f -name "$file_pattern" | sort | while IFS= read -r file; do
  file_count=$((file_count + 1))

  echo "Processing: $file"

  # Add file separator and header
  cat >> "$output_file" <<EOF

================================================================================
FILE: $file
================================================================================

EOF

  # Add file contents
  cat "$file" >> "$output_file"

  # Add footer separator
  cat >> "$output_file" <<EOF


================================================================================
END OF FILE: $file
================================================================================

EOF
done

# Add final summary
cat >> "$output_file" <<EOF

================================================================================
SUMMARY
================================================================================
Total files processed: $(find "$search_dir" -type f -name "$file_pattern" | wc -l | tr -d ' ')
Generated: $(date)
================================================================================
EOF

echo "Done! Consolidated $(find "$search_dir" -type f -name "$file_pattern" | wc -l | tr -d ' ') files into $output_file"
