# Daftarkan task Windows: Admin PowerShell + Git Bash dev saat user login.
# Jalankan sekali: PowerShell "Run as Administrator"
#
#   cd "D:\repo github\sintak_pt_buya_barokah"
#   .\scripts\startup\install-logon-tasks.ps1
#
# Copot: .\scripts\startup\install-logon-tasks.ps1 -Uninstall

param(
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"

$ProjectDir = "D:\repo github\sintak_pt_buya_barokah"
$AdminPsScript = Join-Path $ProjectDir "scripts\startup\open-admin-powershell.ps1"
$DevBat = Join-Path $ProjectDir "scripts\startup\start-dev-gitbash.bat"

$TaskAdmin = "SINTAK-Logon-AdminPowerShell"
$TaskDev = "SINTAK-Logon-DevGitBash"

function Remove-SintakLogonTasks {
    foreach ($name in @($TaskAdmin, $TaskDev)) {
        $existing = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
        if ($existing) {
            Unregister-ScheduledTask -TaskName $name -Confirm:$false
            Write-Host "Dihapus: $name"
        }
    }
}

if ($Uninstall) {
    Remove-SintakLogonTasks
    Write-Host "Task logon SINTAK sudah dicopot."
    exit 0
}

if (-not (Test-Path -LiteralPath $AdminPsScript)) {
    throw "File tidak ada: $AdminPsScript"
}
if (-not (Test-Path -LiteralPath $DevBat)) {
    throw "File tidak ada: $DevBat"
}

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    throw "Jalankan script ini dengan PowerShell Run as Administrator."
}

Remove-SintakLogonTasks

$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

# 1) PowerShell elevated + cd ke proyek (akan ada prompt UAC sekali per login)
$actionAdmin = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$AdminPsScript`""

$principalAdmin = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

Register-ScheduledTask `
    -TaskName $TaskAdmin `
    -Action $actionAdmin `
    -Trigger $trigger `
    -Principal $principalAdmin `
    -Description "Buka PowerShell Admin di folder SINTAK saat login" | Out-Null

Write-Host "Terdaftar: $TaskAdmin"

# 2) Git Bash + npm run dev port 3001
$actionDev = New-ScheduledTaskAction -Execute $DevBat -WorkingDirectory $ProjectDir

$principalDev = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask `
    -TaskName $TaskDev `
    -Action $actionDev `
    -Trigger $trigger `
    -Principal $principalDev `
    -Description "Buka Git Bash dan jalankan npm run dev -p 3001 saat login" | Out-Null

Write-Host "Terdaftar: $TaskDev"
Write-Host ""
Write-Host "Selesai. Saat login Windows:"
Write-Host "  - PowerShell Admin (UAC) -> folder SINTAK"
Write-Host "  - Git Bash -> npm run dev -- -p 3001"
Write-Host "  - PM2 (jika sudah pm2-startup install) -> sintak-prod port 3000"
Write-Host ""
Write-Host "Cek di: taskschd.msc  atau  Get-ScheduledTask SINTAK-*"
Write-Host "Copot: .\scripts\startup\install-logon-tasks.ps1 -Uninstall"
