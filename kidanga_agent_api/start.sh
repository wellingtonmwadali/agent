#!/bin/bash

# Kidanga Lead Generation Agent Startup Script

echo "🚀 Starting Kidanga Lead Generation Agent..."
echo ""

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

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit the .env file with your API keys before running the agent!"
    echo "   Required: GOOGLE_PLACES_API_KEY"
    echo "   Optional: SENDGRID_API_KEY, OPENAI_API_KEY, Google Sheets credentials"
    echo ""
    echo "   Edit with: nano .env"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
fi

# Menu for startup options
echo "🎯 What would you like to do?"
echo ""
echo "1) Start Web UI (Recommended)"
echo "2) Start Command Line Interface"
echo "3) Run Quick Test (5 searches)"
echo "4) Start WhatsApp Server Only"
echo "5) Check System Status"
echo "6) View Available Keywords"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo "🌐 Starting Web UI on http://localhost:3002"
        echo "📱 Keep this terminal open and open your browser to the URL above"
        echo ""
        npm run ui
        ;;
    2)
        echo "💻 Starting Command Line Interface..."
        node src/cli.js
        ;;
    3)
        echo "🧪 Running quick test with 5 searches..."
        npm test
        ;;
    4)
        echo "📱 Starting WhatsApp server on http://localhost:3001"
        echo "🔍 Scan the QR code with your phone when it appears"
        npm run whatsapp
        ;;
    5)
        echo "📊 Checking system status..."
        npm run status
        ;;
    6)
        echo "🔍 Available search keywords:"
        npm run keywords
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac
