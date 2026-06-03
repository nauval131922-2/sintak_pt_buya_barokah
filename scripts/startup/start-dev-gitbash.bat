@echo off
REM Membuka Git Bash di folder SINTAK dan menjalankan dev server port 3001.
REM Dipanggil oleh Task Scheduler saat login.

set "PROJECT_DIR=D:\repo github\sintak_pt_buya_barokah"
set "GIT_BASH=%ProgramFiles%\Git\git-bash.exe"

if not exist "%GIT_BASH%" (
    echo Git Bash tidak ditemukan: %GIT_BASH%
    exit /b 1
)

if not exist "%PROJECT_DIR%" (
    echo Folder proyek tidak ditemukan: %PROJECT_DIR%
    exit /b 1
)

REM start = jendela terlihat; --cd = langsung ke folder proyek
start "SINTAK Dev (3001)" "%GIT_BASH%" --cd="%PROJECT_DIR%" -c "npm run dev -- -p 3001; exec bash"
