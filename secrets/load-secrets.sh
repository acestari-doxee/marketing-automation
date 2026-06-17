#!/usr/bin/env bash
# Doxee Marketing AI — shared secrets loader (Mac / Linux).
#
# Sourced by each tool's start.command. Decrypts <repo-root>/secrets.env.age
# with the team age key (age-key.txt) and exports the values as environment
# variables for the app that is about to start. Nothing is written to disk in
# plaintext. Returns non-zero (without exiting the caller) if it cannot load.

_doxee_load_secrets() {
    local here secret_file key_file k v arch age_bin
    here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    secret_file="$here/secrets.env.age"
    key_file="$here/age-key.txt"

    # Resolve the age binary: vendored copy in tools/ wins (no install needed),
    # then ~/bin, then PATH.
    arch=$([ "$(uname -m)" = "arm64" ] && echo arm64 || echo amd64)
    if [ -x "$here/tools/age-darwin-$arch" ]; then
        age_bin="$here/tools/age-darwin-$arch"
    elif [ -x "$HOME/bin/age" ]; then
        age_bin="$HOME/bin/age"
    elif command -v age >/dev/null 2>&1; then
        age_bin="age"
    else
        echo ""
        echo "[secrets] 'age' was not found."
        echo "  No-admin install:  see docs/SECRETS.md (downloads to ~/bin, no password needed)"
        echo "  or drop the age binary in: $here/tools/"
        return 1
    fi
    if [ ! -f "$key_file" ]; then
        echo ""
        echo "[secrets] Decryption key not found:"
        echo "  $key_file"
        echo "  Get 'age-key.txt' from the company password manager (ask acestari@doxee.com)"
        echo "  and place it in the secrets/ folder."
        return 1
    fi
    if [ ! -f "$secret_file" ]; then
        echo "[secrets] Encrypted secrets file not found: $secret_file"
        return 1
    fi

    while IFS='=' read -r k v; do
        case "$k" in ''|\#*) continue ;; esac
        v="${v%$'\r'}"          # strip a trailing CR if the file is CRLF
        export "$k=$v"
    done < <("$age_bin" -d -i "$key_file" "$secret_file")

    echo "[secrets] Loaded."
}
