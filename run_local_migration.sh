#!/bin/bash

# Define the directory to search
DIRECTORY="./drizzle/"

# Check if the directory exists
if [ ! -d "$DIRECTORY" ]; then
  echo "Directory $DIRECTORY does not exist."
  exit 1
fi

# Find the newest .sql file
NEWEST_FILE=$(ls -t "$DIRECTORY"/*.sql 2>/dev/null | head -n 1)

# Check if there are any .sql files
if [ -z "$NEWEST_FILE" ]; then
  echo "No .sql files found in $DIRECTORY."
else
  # Output the name of the newest file
  wrangler d1 execute DB --local --file="$NEWEST_FILE"
fi
