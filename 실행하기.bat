@echo off
chcp 65001 > nul
echo [YSACC TANK CAD] 프로그램을 실행하는 중입니다...
cd /d "%~dp0"

netstat -ano | findstr :8000 | findstr LISTENING > nul
if %errorlevel% neq 0 (
    echo [DWG/DXF 변환 서버 실행 중...]
    where pythonw > nul 2>&1
    if %errorlevel% equ 0 (
        start "" pythonw server.py
    ) else (
        start "YSACC Tank CAD Server" /min python server.py
    )
    timeout /t 2 > nul
)

start http://127.0.0.1:8000/web/index.html
