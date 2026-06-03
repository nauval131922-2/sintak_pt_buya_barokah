# Membuka PowerShell di folder proyek SINTAK.
# Dari Task Scheduler (RunLevel Highest) = sudah Admin, tanpa UAC lagi.

$ProjectDir = "D:\repo github\sintak_pt_buya_barokah"

if (-not (Test-Path -LiteralPath $ProjectDir)) {
    Write-Error "Folder proyek tidak ditemukan: $ProjectDir"
    exit 1
}

$psArgs = @(
    "-NoExit",
    "-NoLogo",
    "-Command",
    "Set-Location -LiteralPath '$ProjectDir'; pm2 status"
)

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    Start-Process powershell.exe -ArgumentList $psArgs
} else {
    Start-Process powershell.exe -Verb RunAs -ArgumentList $psArgs
}
