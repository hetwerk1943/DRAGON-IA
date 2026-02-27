# ============================================================
# add-files.ps1
# Automates moving local files into the repo, committing them
# on a new branch, pushing, and opening a Pull Request.
# ============================================================

# --- KONFIGURACJA ---
$sourcePath = "C:\Users\TwojUser\Pobrane"
$repoPath   = "C:\Users\TwojUser\projekty\moj-repo"
$branchName = "nowe-pliki-" + (Get-Date -Format "yyyyMMdd-HHmmss")
$prTitle    = "Dodanie nowych plików"
$prBody     = "Automatyczne dodanie plików do repozytorium"
$baseBranch = "main"

# --- KROK 1: Przenieś pliki ---
# UWAGA: -Force nadpisuje istniejące pliki w docelowym katalogu bez ostrzeżenia.
Move-Item "$sourcePath\*" "$repoPath" -Force

# --- KROK 2: Przejdź do repo ---
Set-Location $repoPath

# --- KROK 3: Stwórz nową gałąź lub przejdź jeśli istnieje ---
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

    # --- KROK 6: Wypchnij gałąź do GitHub ---
    git push -u origin $branchName

    # --- KROK 7: Utwórz Pull Request ---
    gh pr create --title "$prTitle" --body "$prBody" --base $baseBranch --head $branchName
} else {
    Write-Host "Brak nowych plików do commitowania"
}
