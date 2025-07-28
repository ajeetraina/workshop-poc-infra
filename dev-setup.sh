#!/bin/bash

# Development setup script for Workshop POC React conversion
# This script sets up the development environment for both frontend and backend

set -e

echo "🚀 Setting up Workshop POC React Development Environment"
echo "======================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and npm."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker and Docker Compose."
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Function to install dependencies
install_deps() {
    local dir=$1
    local name=$2
    
    echo "📦 Installing $name dependencies..."
    cd "$dir"
    
    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found in $dir"
        exit 1
    fi
    
    npm ci
    echo "✅ $name dependencies installed"
    cd ..
}

# Install frontend dependencies
if [ -d "frontend" ]; then
    install_deps "frontend" "Frontend"
else
    echo "❌ Frontend directory not found"
    exit 1
fi

echo ""

# Install backend dependencies
if [ -d "backend" ]; then
    install_deps "backend" "Backend"
else
    echo "❌ Backend directory not found"
    exit 1
fi

echo ""

# Create environment files if they don't exist
echo "🔧 Setting up environment files..."

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
    else
        echo "⚠️  .env.example not found, skipping .env creation"
    fi
else
    echo "✅ .env already exists"
fi

echo ""

# Setup Docker volumes and networks
echo "🐳 Setting up Docker environment..."

# Pull required images
echo "📥 Pulling Docker images..."
docker compose -f compose-react.yaml pull --ignore-pull-failures

echo "✅ Docker setup complete"
echo ""

# Run tests to verify setup
echo "🧪 Running tests to verify setup..."

echo "Testing frontend..."
cd frontend
npm run test --silent
cd ..

echo "Testing backend..."
cd backend
npm run test --silent
cd ..

echo "✅ All tests passed"
echo ""

# Display usage information
echo "🎉 Development environment setup complete!"
echo ""
echo "💡 Usage:"
echo "========="
echo ""
echo "Start the full development environment:"
echo "  docker compose -f compose-react.yaml up -d"
echo ""
echo "Start individual services for development:"
echo ""
echo "Frontend (React + Vite):"
echo "  cd frontend && npm run dev"
echo "  → http://localhost:3000"
echo ""
echo "Backend (Express + Nodemon):"
echo "  cd backend && npm run dev"
echo "  → http://localhost:8000"
echo ""
echo "VS Code Server (via Docker):"
echo "  → http://localhost:8085"
echo ""
echo "Other useful commands:"
echo "====================="
echo ""
echo "Run tests:"
echo "  cd frontend && npm test"
echo "  cd backend && npm test"
echo ""
echo "Run linting:"
echo "  cd frontend && npm run lint"
echo "  cd backend && npm run lint"
echo ""
echo "Build production images:"
echo "  docker compose -f compose-react.yaml build"
echo ""
echo "View logs:"
echo "  docker compose -f compose-react.yaml logs -f"
echo ""
echo "Stop services:"
echo "  docker compose -f compose-react.yaml down"
echo ""
echo "📚 Documentation:"
echo "=================="
echo "See README-REACT.md for detailed information about the React conversion."
echo ""
echo "🔧 Troubleshooting:"
echo "==================="
echo "If you encounter issues:"
echo "1. Check Docker is running: docker info"
echo "2. Check port availability: netstat -tulpn | grep :8080"
echo "3. Check logs: docker compose -f compose-react.yaml logs"
echo "4. Reset everything: docker compose -f compose-react.yaml down -v"
echo ""
echo "🚀 Happy coding!"
