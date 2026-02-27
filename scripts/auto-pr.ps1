# auto-pr.ps1
# Automatically moves files into the repository, commits them on a new branch,
# pushes the branch and opens a Pull Request via the GitHub CLI.
#
# Prerequisites:
#   - Git must be installed and available on PATH.
#   - GitHub CLI (gh) must be installed and authenticated (`gh auth login`).
#
# Usage:
#   .\scripts\auto-pr.ps1 -SourcePath "C:\Users\You\Downloads" -RepoPath "C:\Users\You\projects\my-repo"

param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,

    [Parameter(Mandatory = $true)]
    [string]$RepoPath,

    [string]$BaseBranch = "main",
    [string]$PrTitle    = "Dodanie nowych plików",
    [string]$PrBody     = "Automatyczne dodanie plików do repozytorium"
)

# --- Walidacja ścieżek ---
if (-not (Test-Path $SourcePath)) {
    Write-Error "Ścieżka źródłowa nie istnieje: $SourcePath"
    exit 1
}
if (-not (Test-Path (Join-Path $RepoPath ".git"))) {
    Write-Error "Ścieżka repozytorium nie jest poprawnym repozytorium Git: $RepoPath"
    exit 1
}

# --- Generate a unique branch name ---
$branchName = "nowe-pliki-" + (Get-Date -Format "yyyyMMdd-HHmmss")

# --- KROK 1: Przenieś pliki ---
Move-Item "$SourcePath\*" "$RepoPath" -Force

# --- KROK 2: Przejdź do repo ---
Set-Location $RepoPath

# --- KROK 3: Stwórz nową gałąź ---
if (git show-ref --verify --quiet refs/heads/$branchName) {
    git checkout $branchName
} else {
    git checkout -b $branchName
}

# --- KROK 4: Dodaj pliki do Git ---
git add .

# --- KROK 5: Commit jeśli są zmiany ---
if ((git status --porcelain) -ne "") {
    git commit -m "Dodanie nowych plików do repozytorium"
} else {
    Write-Host "Brak nowych plików do commitowania"
    exit 0
}

# --- KROK 6: Wypchnij gałąź do GitHub ---
git push -u origin $branchName

# --- KROK 7: Utwórz Pull Request ---
gh pr create --title "$PrTitle" --body "$PrBody" --base $BaseBranch --head $branchName
