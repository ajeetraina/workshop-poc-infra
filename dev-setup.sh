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
    
    # Use npm install for initial setup, npm ci for when lock file exists
    if [ -f "package-lock.json" ]; then
        echo "🔒 Using npm ci (lock file exists)"
        npm ci
    else
        echo "📦 Using npm install (generating lock file)"
        npm install
    fi
    
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

# Create networks and volumes if they don't exist
docker network create workshop-poc-react 2>/dev/null || echo "✅ Network workshop-poc-react already exists"
docker volume create socket-proxy 2>/dev/null || echo "✅ Volume socket-proxy already exists"  
docker volume create project 2>/dev/null || echo "✅ Volume project already exists"

# Pull required images (only the ones that exist)
echo "📥 Pulling base Docker images..."
docker pull node:18-alpine 2>/dev/null || echo "⚠️  Could not pull node:18-alpine (will build from scratch)"
docker pull nginx:alpine 2>/dev/null || echo "⚠️  Could not pull nginx:alpine (will build from scratch)"

echo "✅ Docker setup complete"
echo ""

# Build the custom images separately to avoid build context issues
echo "🔨 Building Docker images..."
echo "This may take a few minutes on first run..."

# Build backend first (usually faster)
echo "🔨 Building backend image..."
if ! docker build -t workshop-poc-backend:latest ./backend; then
    echo "❌ Backend build failed. Trying with no cache..."
    docker build --no-cache -t workshop-poc-backend:latest ./backend
fi
echo "✅ Backend image built successfully"

# Build frontend (takes longer due to npm install and build)
echo "🔨 Building frontend image..."
if ! docker build -t workshop-poc-frontend:latest ./frontend; then
    echo "❌ Frontend build failed. Trying with no cache..."
    docker build --no-cache -t workshop-poc-frontend:latest ./frontend
fi
echo "✅ Frontend image built successfully"

echo "✅ All Docker images built successfully"
echo ""

# Run a quick test to verify basic functionality
echo "🧪 Running basic verification tests..."

# Test frontend build locally
if [ -d "frontend" ]; then
    echo "Testing frontend build..."
    cd frontend
    if npm run build --silent > /dev/null 2>&1; then
        echo "✅ Frontend builds successfully"
    else
        echo "⚠️  Frontend build test failed, but installation completed"
    fi
    cd ..
fi

# Test Docker Compose configuration
echo "Testing Docker Compose configuration..."
if docker compose -f compose-react.yaml config > /dev/null 2>&1; then
    echo "✅ Docker Compose configuration is valid"
else
    echo "⚠️  Docker Compose configuration has issues"
fi

echo "✅ Basic verification complete"
echo ""

# Optional: Start the environment
read -p "🚀 Would you like to start the Docker environment now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting Docker environment..."
    docker compose -f compose-react.yaml up -d
    
    echo ""
    echo "⏳ Waiting for services to start up..."
    sleep 10
    
    # Check if services are running
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ Frontend is running at http://localhost:8080"
    else
        echo "⚠️  Frontend may still be starting up"
    fi
    
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "✅ Backend is running at http://localhost:8000"
    else
        echo "⚠️  Backend may still be starting up"
    fi
    
    echo ""
    echo "🎉 Environment is starting up!"
    echo "💻 Open http://localhost:8080 in your browser"
    echo "📊 Check status with: docker compose -f compose-react.yaml ps"
    echo "📝 View logs with: docker compose -f compose-react.yaml logs -f"
fi

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
echo "5. Rebuild images: docker compose -f compose-react.yaml build --no-cache"
echo ""
echo "🚀 Happy coding!"
