#!/usr/bin/env bash
#
# checkout-branch.sh – safely check out a Git branch.
# If the branch already exists locally, switch to it;
# otherwise create it as a new branch.
#
# Usage:
#   ./scripts/checkout-branch.sh <branch-name>

set -euo pipefail

branchName="${1:?Usage: checkout-branch.sh <branch-name>}"

if git show-ref --verify --quiet "refs/heads/$branchName"; then
  git checkout "$branchName"
else
  git checkout -b "$branchName"
fi
