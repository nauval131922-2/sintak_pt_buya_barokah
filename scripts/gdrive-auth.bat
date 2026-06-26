@echo off
chcp 65001 >nul 2>&1
title SINTAK - Google Drive Auth
color 0A

echo ============================================
echo   SINTAK — Google Drive OAuth Setup
echo ============================================
echo.

set "PLINK=C:\Program Files\PuTTY\plink.exe"
set "HOST=202.10.34.157"
set "USER=root"
set "PASS=!9s7E31G0NP$dR"
set "LOCAL_PORT=15368"

echo 1. Konek SSH ke VPS dengan tunnel (port %LOCAL_PORT%)
echo 2. rclone authorize akan jalan otomatis di VPS
echo.
echo ============================================
echo.

echo.
echo         *** PENTING ***
echo.
echo Saat muncul URL seperti:
echo   http://127.0.0.1:53682/auth?state=...
echo.
echo GANTI port 53682 -^> %LOCAL_PORT%:
echo   http://127.0.0.1:%LOCAL_PORT%/auth?state=...
echo.
echo Copy URL tsb dan buka di BROWSER.
echo Login Google -^> Allow -^> selesai.
echo.
echo ============================================
echo.
echo Tunggu proses authorize...
echo.

"%PLINK%" -ssh -L %LOCAL_PORT%:127.0.0.1:53682 -pw %PASS% %USER%@%HOST% "/usr/local/bin/gdrive-auth.sh"

echo.
echo ============================================
if %ERRORLEVEL% EQU 0 (
    echo [OK] Google Drive berhasil terhubung!
) else (
    echo [INFO] Proses selesai (mungkin Ctrl+C).
    echo Cek koneksi dengan:
    echo   "%PLINK%" -pw %PASS% %USER%@%HOST% "rclone ls gdrive:"
)
echo.
echo Test backup:
echo   "%PLINK%" -pw %PASS% %USER%@%HOST% "/usr/local/bin/sintak-backup.sh"
echo ============================================
echo.
pause
