@echo off
echo 🎓 UMEvents Installation Script
echo ================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js is installed
echo.

REM Install dependencies
echo 📦 Installing dependencies...
echo.

REM Root dependencies
echo Installing root dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

REM Backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

REM Frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ Dependencies installed successfully!
echo.
echo 📝 Next steps:
echo 1. Set up Firebase project at https://console.firebase.google.com
echo 2. Create backend\.env file with Firebase credentials
echo 3. Create frontend\.env file with Firebase config
echo 4. Run 'npm run dev' to start the application
echo.
echo 📚 See QUICK_START.md for detailed instructions
echo.
echo 🎉 Installation complete!
echo.
pause

