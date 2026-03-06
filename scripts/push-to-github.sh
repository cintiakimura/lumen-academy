#!/bin/sh
# Run from project root to push Lumen Academy to https://github.com/cintiakimura/lumen
set -e
cd "$(dirname "$0")/.."

if [ ! -d .git ]; then
  git init
  git remote add origin https://github.com/cintiakimura/lumen.git
fi

git add .
git status
echo "---"
read -p "Commit and push? (y/n) " -n 1 -r
echo
if [ "$REPLY" = "y" ] || [ "$REPLY" = "Y" ]; then
  git commit -m "Lumen Academy: React/Vite, auth, Grok proxy, CourseBox chunking, dashboards, voice, branding"
  git branch -M main
  git push -u origin main
  echo "Done. See https://github.com/cintiakimura/lumen"
fi
