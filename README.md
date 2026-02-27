# DRAGON-IA
Backend + Frontend (produkcja)  Node.js / Express lub Python / FastAPI  Klucz API trzymany na serwerze (bezpieczne)  Frontend wysyła zapytania do serwera → serwer do OpenAI API  Możliwość dodania historii czatu, logowania, subskrypcji

## Scripts

### `scripts/auto-pr.ps1`

PowerShell script that automates adding files, creating a timestamped branch, and opening a pull request.

**Prerequisites:** [GitHub CLI (`gh`)](https://cli.github.com/) must be installed and authenticated.

**Parameters:**

| Parameter       | Required | Default          | Description                                    |
|-----------------|----------|------------------|------------------------------------------------|
| `FilePath`      | Yes      | —                | One or more file paths to include in the commit |
| `BaseBranch`    | No       | `main`           | Target branch for the pull request             |
| `BranchPrefix`  | No       | `nowe-pliki-`    | Prefix for the generated branch name           |
| `CommitMessage` | No       | `Add new files`  | Commit message                                 |
| `PrTitle`       | No       | *(CommitMessage)* | Pull request title                            |
| `PrBody`        | No       | *(empty)*        | Pull request body text                         |

**Examples:**

```powershell
# Add a single file with default settings
.\scripts\auto-pr.ps1 -FilePath "src/app.js"

# Add multiple files targeting the develop branch
.\scripts\auto-pr.ps1 -FilePath "src/app.js","src/index.html" -BaseBranch develop -CommitMessage "Feature update"
```
