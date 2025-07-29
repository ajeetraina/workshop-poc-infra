#!/bin/bash

# Workshop PoC Infrastructure - Smart Restart Script
# This script provides intelligent restart with conflict detection

set -e

echo "🔄 Workshop PoC Infrastructure - Smart Restart"
echo "=============================================="

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

# Check for existing issues
echo "🔍 Checking for existing issues..."

# Check if any workshop containers are stuck
STUCK_CONTAINERS=$(docker ps -aq --filter "label=demo-setup=true" 2>/dev/null || true)
if [ -n "$STUCK_CONTAINERS" ]; then
    echo "⚠️  Found existing workshop containers. This might cause conflicts."
    echo "   Consider using the force-rebuild script for a clean start."
fi

# Stop any existing containers from the stack
echo "🛑 Stopping existing containers..."
docker compose -f compose-react.yaml down --remove-orphans 2>/dev/null || true

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
            process_info=$(lsof -i :"$port" 2>/dev/null | tail -n +2 | head -1)
            if [ -n "$process_info" ]; then
                echo "     Used by: $process_info"
            fi
        fi
    done
    echo ""
    echo "🤔 Options:"
    echo "   1. Continue anyway (y)"
    echo "   2. Use force-rebuild script for aggressive cleanup (f)"  
    echo "   3. Exit and manually resolve conflicts (n)"
    echo ""
    read -p "Choose an option (y/f/n): " response
    
    case "$response" in
        [Ff]*)
            echo "🔥 Starting force rebuild..."
            chmod +x force-rebuild.sh
            exec ./force-rebuild.sh
            ;;
        [Yy]*)
            echo "⚠️  Continuing with port conflicts..."
            ;;
        *)
            echo "❌ Aborted by user"
            exit 1
            ;;
    esac
fi

# Start with existing images first (faster)
echo "🚀 Starting the workshop stack..."
docker compose -f compose-react.yaml up -d

# Wait a moment for containers to initialize
echo "⏳ Waiting for containers to initialize..."
sleep 15

# Check the health of the services
echo "🏥 Checking service health..."
echo ""

# Check if containers are running
SERVICES=(project-setup frontend backend instructions workspace host-forwarding workspace-cleaner socket-proxy)
FAILED_SERVICES=()

for service in "${SERVICES[@]}"; do
    if docker compose -f compose-react.yaml ps "$service" --status running >/dev/null 2>&1; then
        echo "✅ $service: Running"
    elif [ "$service" = "project-setup" ] && docker compose -f compose-react.yaml ps "$service" --status exited >/dev/null 2>&1; then
        echo "✅ $service: Completed (expected)"
    else
        echo "❌ $service: Not running"
        FAILED_SERVICES+=("$service")
    fi
done

# If services failed, suggest force rebuild
if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Some services failed to start: ${FAILED_SERVICES[*]}"
    echo ""
    echo "🔧 Troubleshooting options:"
    echo "   1. View logs: docker compose -f compose-react.yaml logs [service-name]"
    echo "   2. Try force rebuild: ./force-rebuild.sh"
    echo "   3. Restart failed services: docker compose -f compose-react.yaml restart [service-name]"
    echo ""
    echo "🤔 Would you like to run force rebuild now? (y/N)"
    read -r rebuild_response
    if [[ "$rebuild_response" =~ ^[Yy]$ ]]; then
        echo "🔥 Starting force rebuild..."
        chmod +x force-rebuild.sh
        exec ./force-rebuild.sh
    fi
fi

echo ""
echo "🌐 Service URLs:"
echo "   • React Frontend: http://localhost:8080"
echo "   • Backend API: http://localhost:8000" 
echo "   • Instructions: http://localhost:8001"
echo "   • VS Code Server: http://localhost:8085 (password: password)"
echo ""

# Show logs for any failed services or recent activity
if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    echo "📋 Logs for failed services:"
    for service in "${FAILED_SERVICES[@]}"; do
        echo "--- $service ---"
        docker compose -f compose-react.yaml logs --tail=5 "$service" 2>/dev/null || echo "No logs available"
    done
else
    echo "📋 Recent logs (use 'docker compose -f compose-react.yaml logs -f' for live logs):"
    docker compose -f compose-react.yaml logs --tail=3
fi

echo ""
if [ ${#FAILED_SERVICES[@]} -eq 0 ] && [ ${#PORT_CONFLICTS[@]} -eq 0 ]; then
    echo "✅ Workshop stack started successfully!"
else
    echo "⚠️  Workshop stack started with some issues."
    echo "   💡 For a completely clean start, run: ./force-rebuild.sh"
fi

echo ""
echo "📚 Available scripts:"
echo "   • ./restart-workshop.sh - Smart restart (this script)"
echo "   • ./force-rebuild.sh - Aggressive cleanup and rebuild"
echo "   • docker compose -f compose-react.yaml logs -f - View live logs"
