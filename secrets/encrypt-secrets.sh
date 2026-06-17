#!/usr/bin/env bash
# Re-encrypt secrets.env -> secrets.env.age for the whole team.
# Run this whenever a secret changes. Requires 'age' and a valid .age-recipients.
set -e
cd "$(dirname "$0")"

# Resolve age: vendored tools/ copy wins, then ~/bin, then PATH.
arch=$([ "$(uname -m)" = "arm64" ] && echo arm64 || echo amd64)
if [ -x "tools/age-darwin-$arch" ]; then AGE="./tools/age-darwin-$arch"
elif [ -x "$HOME/bin/age" ]; then AGE="$HOME/bin/age"
elif command -v age >/dev/null 2>&1; then AGE="age"
else
  echo "'age' was not found. See docs/SECRETS.md for the no-admin install (~/bin)."
  exit 1
fi
if [ ! -f secrets.env ]; then
  echo "secrets.env not found."
  echo "Copy secrets.env.example to secrets.env and fill in the values first."
  exit 1
fi
if grep -q "age1REPLACE_WITH_TEAM_PUBLIC_KEY" .age-recipients 2>/dev/null; then
  echo ".age-recipients still has the placeholder."
  echo "Generate the team key once with:  age-keygen -o age-key.txt"
  echo "then paste the printed public key into .age-recipients."
  exit 1
fi

"$AGE" -R .age-recipients -o secrets.env.age secrets.env
echo "secrets.env.age updated. Commit it."
echo "(secrets.env stays local and is gitignored — never commit it.)"
