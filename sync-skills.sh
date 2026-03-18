#!/bin/bash
REPO_DIR="$HOME/Documents/GitHub/ahhc"

cd "$REPO_DIR"
git add -A
git commit -m "Update skills: $(date '+%Y-%m-%d %H:%M')"
git push

echo "✅ Skills 已推上 GitHub！"
