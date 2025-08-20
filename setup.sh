#!/bin/bash

echo "🚀 Setting up Email Swipe App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "✅ Setup complete!"
echo ""
echo "🎯 To start the development server:"
echo "   npm start"
echo ""
echo "📱 To run on iOS simulator:"
echo "   npm run ios"
echo ""
echo "🤖 To run on Android emulator:"
echo "   npm run android"
echo ""
echo "🌐 To run on web:"
echo "   npm run web"
echo ""
echo "📖 Check README.md for more information" 