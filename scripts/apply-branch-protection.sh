#!/bin/bash
# Sets up branch protection rules for the main branch in your GitHub repository
# You must have the GitHub CLI (gh) installed and authenticated: `gh auth login`

set -e

# Replace 'YOUR_ORG/YOUR_REPO' with your actual repository, e.g. 'mrudula/quests'
# Or leave empty to run in the current repository directory if it's a git repo linked to GitHub
REPO=$(gh repo view --json nameWithOwner -q ".nameWithOwner")

echo "Applying branch protection rules to 'main' branch in $REPO..."

# Require status checks to pass before merging, prevent force pushes, and prevent deletion.
# You can customize these flags based on the exact rules you need.
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/$REPO/branches/main/protection \
  -f "required_status_checks[strict]=true" \
  -f "required_status_checks[contexts][]=build-ios" \
  -f "required_status_checks[contexts][]=ci-build-and-test" \
  -f "enforce_admins=false" \
  -f "required_pull_request_reviews[dismiss_stale_reviews]=true" \
  -f "required_pull_request_reviews[require_code_owner_reviews]=false" \
  -f "required_pull_request_reviews[required_approving_review_count]=1" \
  -f "restrictions=null" \
  -f "allow_force_pushes=false" \
  -f "allow_deletions=false"

echo "Branch protection applied successfully!"
