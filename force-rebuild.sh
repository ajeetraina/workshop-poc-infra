#!/bin/bash

# Workshop PoC Infrastructure - Force Rebuild and Clean Start
# This script aggressively cleans up everything and forces a complete rebuild

set -e

echo "🔥 Workshop PoC Infrastructure - FORCE REBUILD"
echo "=============================================="
echo "This will aggressively clean up all resources and rebuild everything"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
if ! command_exists docker; then
    echo "❌ Error: Docker is not installed"
    exit 1
fi

if ! command_exists docker || ! docker compose version >/dev/null 2>&1; then
    echo "❌ Error: Docker Compose is not available"
    exit 1
fi

echo "✅ Docker and Docker Compose are available"
echo ""

# Force stop everything
echo "🛑 Force stopping ALL containers..."
docker compose -f compose-react.yaml down --remove-orphans --volumes --rmi all 2>/dev/null || true
docker compose -f compose.yaml down --remove-orphans --volumes --rmi all 2>/dev/null || true

echo "🧹 Aggressive cleanup of workshop resources..."

# Kill any processes using our ports
echo "💀 Killing processes on workshop ports..."
PORTS=(8080 8000 8001 8085 3000)
for port in "${PORTS[@]}"; do
    echo "   Checking port $port..."
    
    # Find and kill processes using the port
    if command_exists lsof; then
        pids=$(lsof -t -i:"$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "   Killing processes on port $port: $pids"
            echo "$pids" | xargs -r kill -9 2>/dev/null || true
        fi
    fi
    
    # Alternative method using netstat and kill
    if command_exists netstat; then
        pids=$(netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | grep -v "-" || true)
        if [ -n "$pids" ]; then
            echo "   Killing additional processes on port $port: $pids"
            echo "$pids" | xargs -r kill -9 2>/dev/null || true
        fi
    fi
done

# Clean up Docker resources
echo "🗑️  Removing workshop containers..."
docker ps -aq --filter "label=demo-setup=true" | xargs -r docker rm -f 2>/dev/null || true

echo "🗑️  Removing workshop images..."
docker images -q --filter "label=demo-setup=true" | xargs -r docker rmi -f 2>/dev/null || true

# Remove specific workshop images that might be cached
echo "🗑️  Removing cached workshop images..."
docker rmi -f workshop-poc-infra-frontend 2>/dev/null || true
docker rmi -f workshop-poc-infra-backend 2>/dev/null || true  
docker rmi -f workshop-poc-infra-workspace-cleaner 2>/dev/null || true

echo "🗑️  Removing workshop volumes..."
docker volume ls -q --filter "label=demo-setup=true" | xargs -r docker volume rm -f 2>/dev/null || true
docker volume rm -f project socket-proxy 2>/dev/null || true

echo "🗑️  Removing workshop networks..."
docker network ls -q --filter "label=demo-setup=true" | xargs -r docker network rm 2>/dev/null || true
docker network rm -f workshop-poc-react workshop-poc workshop-poc-infra_default 2>/dev/null || true

# Clean up build cache
echo "🧹 Cleaning Docker build cache..."
docker builder prune -f --all 2>/dev/null || true

# Wait for ports to be released
echo "⏳ Waiting for ports to be released..."
sleep 5

# Final port check
echo "🔍 Final port availability check..."
PORT_CONFLICTS=()
for port in "${PORTS[@]}"; do
    if lsof -i :"$port" >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":$port "; then
        PORT_CONFLICTS+=("$port")
    fi
done

if [ ${#PORT_CONFLICTS[@]} -gt 0 ]; then
    echo "⚠️  Warning: Some ports are still in use:"
    for port in "${PORT_CONFLICTS[@]}"; do
        echo "   - Port $port"
    done
    echo ""
    echo "🤔 This might cause issues. Continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Aborted by user"
        exit 1
    fi
fi

# Force rebuild everything
echo "🏗️  Force building all images (no cache)..."
docker compose -f compose-react.yaml build --no-cache --pull

echo "🚀 Starting the workshop stack with fresh images..."
docker compose -f compose-react.yaml up -d

# Extended wait for initialization
echo "⏳ Waiting for containers to fully initialize..."
sleep 30

# Comprehensive health check
echo "🏥 Comprehensive health check..."
echo ""

# Check container status
SERVICES=(project-setup frontend backend instructions workspace host-forwarding workspace-cleaner socket-proxy)
echo "📊 Container Status:"
for service in "${SERVICES[@]}"; do
    status=$(docker compose -f compose-react.yaml ps "$service" --format json 2>/dev/null | jq -r '.State' 2>/dev/null || echo "unknown")
    if [ "$status" = "running" ]; then
        echo "✅ $service: Running"
    elif [ "$status" = "exited" ] && [ "$service" = "project-setup" ]; then
        echo "✅ $service: Completed (expected)"
    else
        echo "❌ $service: $status"
    fi
done

echo ""

# Check port availability
echo "🌐 Port Status:"
PORTS_SERVICES=("8080:React Frontend" "8000:Backend API" "8001:Instructions" "8085:VS Code Server")
for port_service in "${PORTS_SERVICES[@]}"; do
    port=$(echo "$port_service" | cut -d':' -f1)
    service=$(echo "$port_service" | cut -d':' -f2)
    
    if nc -z localhost "$port" 2>/dev/null; then
        echo "✅ $service (http://localhost:$port): Available"
    else
        echo "❌ $service (http://localhost:$port): Not responding"
    fi
done

echo ""
echo "🌐 Service URLs:"
echo "   • React Frontend: http://localhost:8080"
echo "   • Backend API: http://localhost:8000/api/health" 
echo "   • Instructions: http://localhost:8001"
echo "   • VS Code Server: http://localhost:8085 (password: password)"
echo ""

# Show recent logs
echo "📋 Recent logs from all services:"
echo "================================="
docker compose -f compose-react.yaml logs --tail=3

echo ""
echo "🎉 Force rebuild complete!"
echo ""
echo "📝 If you still see issues:"
echo "   • Check logs: docker compose -f compose-react.yaml logs -f [service-name]"
echo "   • Restart a service: docker compose -f compose-react.yaml restart [service-name]"
echo "   • Check container status: docker compose -f compose-react.yaml ps"
