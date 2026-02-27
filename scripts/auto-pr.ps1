<#
.SYNOPSIS
    Automates file addition and pull-request creation for the DRAGON-IA repository.

.DESCRIPTION
    Creates a timestamped branch, stages the specified files, commits them,
    pushes the branch, and opens a pull request via the GitHub CLI (gh).

.PARAMETER FilePath
    One or more file paths to add to the commit. Accepts pipeline input.

.PARAMETER BaseBranch
    The branch to target with the pull request. Defaults to "main".

.PARAMETER BranchPrefix
    Prefix used when generating the branch name. Defaults to "nowe-pliki-".

.PARAMETER CommitMessage
    The commit message. Defaults to "Add new files".

.PARAMETER PrTitle
    Title for the pull request. Defaults to the commit message.

.PARAMETER PrBody
    Body text for the pull request. Defaults to an empty string.

.EXAMPLE
    .\scripts\auto-pr.ps1 -FilePath "src/app.js","src/index.html"

.EXAMPLE
    .\scripts\auto-pr.ps1 -FilePath "docs/readme.md" -BaseBranch develop -CommitMessage "Update docs"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, ValueFromPipeline = $true)]
    [string[]]$FilePath,

    [Parameter()]
    [string]$BaseBranch = "main",

    [Parameter()]
    [string]$BranchPrefix = "nowe-pliki-",

    [Parameter()]
    [string]$CommitMessage = "Add new files",

    [Parameter()]
    [string]$PrTitle,

    [Parameter()]
    [string]$PrBody = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Default PR title to the commit message when not provided.
if (-not $PrTitle) {
    $PrTitle = $CommitMessage
}

# ── Generate a unique branch name with a timestamp ──────────────────────
$branchName = $BranchPrefix + (Get-Date -Format "yyyyMMdd-HHmmss")

# ── Ensure we start from the base branch ────────────────────────────────
Write-Host "Switching to base branch '$BaseBranch'..."
git checkout $BaseBranch
if ($LASTEXITCODE -ne 0) { throw "Failed to checkout '$BaseBranch'." }

git pull origin $BaseBranch
if ($LASTEXITCODE -ne 0) { throw "Failed to pull latest changes from '$BaseBranch'." }

# ── Create and switch to the new branch ─────────────────────────────────
Write-Host "Creating branch '$branchName'..."
git checkout -b $branchName
if ($LASTEXITCODE -ne 0) { throw "Failed to create branch '$branchName'." }

# ── Stage the specified files ────────────────────────────────────────────
$stagedCount = 0
foreach ($file in $FilePath) {
    if (-not (Test-Path $file)) {
        Write-Warning "File not found, skipping: $file"
        continue
    }
    git add -- $file
    if ($LASTEXITCODE -ne 0) { throw "Failed to stage file '$file'." }
    Write-Host "Staged: $file"
    $stagedCount++
}

if ($stagedCount -eq 0) {
    throw "No files were staged. Ensure the specified paths exist."
}

# ── Commit ───────────────────────────────────────────────────────────────
git commit -m "$CommitMessage"
if ($LASTEXITCODE -ne 0) { throw "Nothing to commit or commit failed." }

# ── Push the branch ─────────────────────────────────────────────────────
Write-Host "Pushing branch '$branchName'..."
git push -u origin $branchName
if ($LASTEXITCODE -ne 0) { throw "Failed to push branch '$branchName'." }

# ── Open a pull request using the GitHub CLI ─────────────────────────────
Write-Host "Creating pull request..."
gh pr create --base "$BaseBranch" --head "$branchName" --title "$PrTitle" --body "$PrBody"
if ($LASTEXITCODE -ne 0) { throw "Failed to create pull request." }

Write-Host "Done! Pull request created on branch '$branchName'."
