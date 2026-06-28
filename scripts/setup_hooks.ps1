# Install git pre-push hook for AI log submission (Windows PowerShell).
# Run once after cloning: powershell -ExecutionPolicy Bypass -File scripts\setup_hooks.ps1

$ErrorActionPreference = 'Stop'

$HookFile = '.git/hooks/pre-push'
$CodexHookFile = '.codex/hooks.json'

# Git on Windows runs hooks via Git Bash, so the hook body must be bash.
$HookBody = @'
#!/usr/bin/env bash
# Pre-push: sweep recent Antigravity / Gemini prompts, then submit AI logs.
bash scripts/_pyrun.sh scripts/log_antigravity.py --auto || true
bash scripts/_pyrun.sh scripts/submit_log.py || true
exit 0
'@

$CodexHookBody = @'
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "scripts\\_pyrun.cmd scripts\\log_hook.py --tool=codex",
            "timeout": 10,
            "statusMessage": "Logging Codex prompt"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "scripts\\_pyrun.cmd scripts\\log_hook.py --tool=codex",
            "timeout": 10,
            "statusMessage": "Logging Codex turn"
          }
        ]
      }
    ]
  }
}
'@

# Write UTF-8 without BOM so Git Bash can execute the hook on Windows.
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $HookFile), $HookBody, $Utf8NoBom)
Write-Host "[ai-log] Git pre-push hook installed."

if (-not (Test-Path .codex)) { New-Item -ItemType Directory -Path .codex | Out-Null }
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $CodexHookFile), $CodexHookBody, $Utf8NoBom)
Write-Host "[ai-log] Codex hooks installed."

if (-not (Test-Path .ai-log)) { New-Item -ItemType Directory -Path .ai-log | Out-Null }
if (-not (Test-Path .ai-log/.gitkeep)) { New-Item -ItemType File -Path .ai-log/.gitkeep | Out-Null }

Write-Host "[ai-log] Setup complete. Codex prompts will be logged locally and submitted on git push."
