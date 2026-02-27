# DRAGON-IA
Backend + Frontend (produkcja)  Node.js / Express lub Python / FastAPI  Klucz API trzymany na serwerze (bezpieczne)  Frontend wysyła zapytania do serwera → serwer do OpenAI API  Możliwość dodania historii czatu, logowania, subskrypcji

## Scripts

### auto-pr.ps1

PowerShell script that automates adding files to the repository and opening a Pull Request.

**Prerequisites:** Git and [GitHub CLI](https://cli.github.com/) (`gh`) must be installed and authenticated.

```powershell
.\scripts\auto-pr.ps1 -SourcePath "C:\Users\You\Downloads" -RepoPath "C:\Users\You\projects\DRAGON-IA"
```

Optional parameters: `-BaseBranch` (default `main`), `-PrTitle`, `-PrBody`.
