#!/bin/bash
# git-status: Scan directory for git repos and show status summary

TARGET_DIR="${1:-.}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'  # No Color
BOLD='\033[1m'

# Find git repos (immediate subdirectories with .git folders)
for dir in "$TARGET_DIR"/*/; do
  if [ ! -d "$dir/.git" ]; then
    continue
  fi

  repo_name=$(basename "$dir")

  # Get branch name
  branch=$(git -C "$dir" symbolic-ref --short HEAD 2>/dev/null)
  if [ -z "$branch" ]; then
    branch="detached"
  fi

  # Get dirty file count
  dirty_count=$(git -C "$dir" status --porcelain 2>/dev/null | wc -l | tr -d ' ')

  # Get stash count
  stash_count=$(git -C "$dir" stash list 2>/dev/null | wc -l | tr -d ' ')

  # Get ahead/behind counts
  ahead=0
  behind=0
  tracking=$(git -C "$dir" rev-parse --abbrev-ref '@{upstream}' 2>/dev/null)
  if [ -n "$tracking" ]; then
    counts=$(git -C "$dir" rev-list --left-right --count HEAD...'@{upstream}' 2>/dev/null)
    if [ -n "$counts" ]; then
      ahead=$(echo "$counts" | awk '{print $1}')
      behind=$(echo "$counts" | awk '{print $2}')
    fi
  fi

  # Determine color based on status
  color="$GREEN"
  if [ "$dirty_count" -gt 0 ]; then
    color="$YELLOW"
  fi
  if [ "$behind" -gt 0 ]; then
    color="$RED"
  fi

  # Build status string
  status_parts=""
  if [ "$dirty_count" -gt 0 ]; then
    status_parts="${status_parts} ${YELLOW}${dirty_count} dirty${NC}"
  fi
  if [ "$ahead" -gt 0 ]; then
    status_parts="${status_parts} ${GREEN}+${ahead}${NC}"
  fi
  if [ "$behind" -gt 0 ]; then
    status_parts="${status_parts} ${RED}-${behind}${NC}"
  fi
  if [ "$stash_count" -gt 0 ]; then
    status_parts="${status_parts} ${CYAN}${stash_count} stash${NC}"
  fi
  if [ -z "$status_parts" ]; then
    status_parts=" ${GREEN}clean${NC}"
  fi

  # Print the line
  printf "${color}${BOLD}%-30s${NC} ${CYAN}%-20s${NC}%s\n" "$repo_name" "$branch" "$status_parts"
done
