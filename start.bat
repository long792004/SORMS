@echo off
echo =======================================================
echo     Khoi dong he thong SORMS (Smart Office)
echo =======================================================
echo.

echo [1/2] Dang khoi dong Backend (ASP.NET Core API)...
start "SORMS Backend (API)" cmd /c "title SORMS Backend API && cd SORMS.API && set ASPNETCORE_ENVIRONMENT=Development && set ASPNETCORE_URLS=http://localhost:5183 && dotnet run"

echo [2/2] Dang khoi dong Frontend (React + Vite)...
start "SORMS Frontend (UI)" cmd /c "title SORMS Frontend UI && cd sorms-fe && set VITE_API_BASE_URL=http://localhost:5183/api && set VITE_API_ORIGIN=http://localhost:5183 && npm run dev"

echo.
echo =======================================================
echo He thong dang duoc khoi dong trong 2 cua so moi.
echo Vui long KHONG TAT 2 cua so mau den do.
echo.
echo - Frontend chay o: http://localhost:5173
echo - Backend API chay o: http://localhost:5183
echo =======================================================
pause
