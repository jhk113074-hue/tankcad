@echo off
chcp 65001 > nul
echo [YSACC TANK CAD] 프로그램을 실행하는 중입니다...
cd /d "%~dp0"

netstat -ano | findstr :8000 | findstr LISTENING > nul
if %errorlevel% neq 0 (
    echo 로컬 서버를 실행합니다...
    start /b python server.py
    timeout /t 1 > nul
)

start http://127.0.0.1:8000/web/index.html
