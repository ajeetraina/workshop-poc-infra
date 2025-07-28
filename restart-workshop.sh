#!/bin/bash

# Workshop PoC Infrastructure - Cleanup and Restart Script
# This script helps resolve port conflicts and networking issues

set -e

echo "🧹 Workshop PoC Infrastructure - Cleanup and Restart"
echo "=================================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Docker and Docker Compose are available
if ! command_exists docker; then
    echo "❌ Error: Docker is not installed or not in PATH"
    exit 1
fi

if ! command_exists docker && ! docker compose version >/dev/null 2>&1; then
    echo "❌ Error: Docker Compose is not available"
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Stop any existing containers from the stack
echo "🛑 Stopping existing containers..."
docker compose -f compose-react.yaml down --remove-orphans 2>/dev/null || true

# Clean up any containers with demo-setup=true label
echo "🗑️  Cleaning up labeled containers..."
docker ps -aq --filter "label=demo-setup=true" | xargs -r docker rm -f 2>/dev/null || true

# Clean up any volumes with demo-setup=true label
echo "🗑️  Cleaning up labeled volumes..."
docker volume ls -q --filter "label=demo-setup=true" | xargs -r docker volume rm -f 2>/dev/null || true

# Clean up any networks with demo-setup=true label
echo "🗑️  Cleaning up labeled networks..."
docker network ls -q --filter "label=demo-setup=true" | xargs -r docker network rm 2>/dev/null || true

# Check for port conflicts
echo "🔍 Checking for port conflicts..."
PORTS=(8080 8000 8001 8085 3000)
PORT_CONFLICTS=()

for port in "${PORTS[@]}"; do
    if lsof -i :"$port" >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":$port "; then
        PORT_CONFLICTS+=("$port")
    fi
done

if [ ${#PORT_CONFLICTS[@]} -gt 0 ]; then
    echo "⚠️  Warning: The following ports are in use:"
    for port in "${PORT_CONFLICTS[@]}"; do
        echo "   - Port $port"
        # Show what's using the port
        if command_exists lsof; then
            echo "     $(lsof -i :"$port" 2>/dev/null | head -2 | tail -1)"
        fi
    done
    echo ""
    echo "💡 You may need to stop these processes or choose different ports."
    echo "   Do you want to continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Aborted by user"
        exit 1
    fi
fi

# Build and start the stack
echo "🏗️  Building images..."
docker compose -f compose-react.yaml build

echo "🚀 Starting the workshop stack..."
docker compose -f compose-react.yaml up -d

# Wait a moment for containers to initialize
echo "⏳ Waiting for containers to initialize..."
sleep 10

# Check the health of the services
echo "🏥 Checking service health..."
echo ""

# Check if containers are running
SERVICES=(project-setup frontend backend instructions workspace host-forwarding workspace-cleaner socket-proxy)
for service in "${SERVICES[@]}"; do
    if docker compose -f compose-react.yaml ps "$service" --status running >/dev/null 2>&1; then
        echo "✅ $service: Running"
    else
        echo "❌ $service: Not running"
    fi
done

echo ""
echo "🌐 Service URLs:"
echo "   • React Frontend: http://localhost:8080"
echo "   • Backend API: http://localhost:8000"
echo "   • Instructions: http://localhost:8001"
echo "   • VS Code Server: http://localhost:8085 (password: password)"
echo ""

# Show logs for any failed services
echo "📋 Recent logs (use 'docker compose -f compose-react.yaml logs -f' for live logs):"
docker compose -f compose-react.yaml logs --tail=5

echo ""
echo "✅ Workshop stack startup complete!"
echo "   If you see any errors, check the logs with:"
echo "   docker compose -f compose-react.yaml logs -f [service-name]"
