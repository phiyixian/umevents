#!/bin/bash

echo "🎓 UMEvents Installation Script"
echo "================================"
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) is installed"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) is installed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo ""

# Root dependencies
echo "Installing root dependencies..."
npm install

# Backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Set up Firebase project at https://console.firebase.google.com"
echo "2. Create backend/.env file with Firebase credentials"
echo "3. Create frontend/.env file with Firebase config"
echo "4. Run 'npm run dev' to start the application"
echo ""
echo "📚 See QUICK_START.md for detailed instructions"
echo ""
echo "🎉 Installation complete!"

