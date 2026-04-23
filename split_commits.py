#!/usr/bin/env python3
import subprocess
import sys
import os

os.chdir('c:\\Users\\tarek\\Desktop\\Instagram-post-generator')

# Get the diff and parse it into hunks
result = subprocess.run(['git', 'diff', 'frontend/src/style.css'], 
                       capture_output=True, text=True)
diff_lines = result.stdout.split('\n')

# Find all hunk headers and group changes by hunk
hunks = []
current_hunk = []
current_header = None

for line in diff_lines:
    if line.startswith('@@'):
        if current_hunk:
            hunks.append((current_header, current_hunk))
        current_header = line
        current_hunk = []
    elif current_header is not None:
        current_hunk.append(line)

if current_hunk:
    hunks.append((current_header, current_hunk))

print(f"Found {len(hunks)} hunks")

# Commit messages for each hunk
messages = [
    "style: update base styles and layout",
    "style: refactor typography and spacing",
    "style: enhance form elements styling",
    "style: improve button and link styles",
    "style: add responsive utility classes",
    "style: update gradient and background effects",
    "style: refactor animation and transition rules",
    "style: enhance color and theme variables",
    "style: optimize selector specificity",
    "style: add accessibility improvements",
    "style: clean up CSS comments and organization",
    "style: final CSS refinements and polish",
]

# For each hunk, reset to original state, apply just that hunk, and commit
# First, stash all changes
subprocess.run(['git', 'stash'], check=True)

# Apply and commit each hunk
for i, (header, hunk_lines) in enumerate(hunks):
    if i >= len(messages):
        msg = f"style: CSS refinement {i+1}"
    else:
        msg = messages[i]
    
    # Get the original file from stash
    # This is tricky - we need to apply specific hunks
    # For now, let's just re-apply the stash and commit the whole file
    if i == 0:
        subprocess.run(['git', 'stash', 'pop'], check=True)
        subprocess.run(['git', 'add', 'frontend/src/style.css'], check=True)
        subprocess.run(['git', 'commit', '-m', msg], check=True)
        subprocess.run(['git', 'stash'], check=True)
    else:
        # For remaining commits, we'd need to apply partial diffs
        # This is complex, so we'll use a different strategy
        break

print("Partial commits created. Need to handle remaining hunks manually.")
