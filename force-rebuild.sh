#!/bin/bash

# Workshop PoC Infrastructure - Nuclear Cleanup and Rebuild
# This script aggressively cleans up everything and forces a complete rebuild

set -e

echo "💥 Workshop PoC Infrastructure - NUCLEAR CLEANUP & REBUILD"
echo "=========================================================="
echo "This will AGGRESSIVELY clean up all resources and force rebuild"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
if ! command_exists docker; then
    echo "❌ Error: Docker is not installed"
    exit 1
fi

echo "✅ Docker and Docker Compose are available"
echo ""

# STEP 1: Nuclear Docker cleanup
echo "💣 STEP 1: Nuclear Docker cleanup..."

# Stop ALL containers
echo "🛑 Stopping ALL Docker containers..."
docker stop $(docker ps -aq) 2>/dev/null || true

# Remove all workshop-related containers
echo "🗑️  Removing ALL workshop containers..."
docker rm -f $(docker ps -aq --filter "label=demo-setup=true") 2>/dev/null || true
docker rm -f $(docker ps -aq --filter "name=workshop-poc") 2>/dev/null || true
docker rm -f $(docker ps -aq --filter "name=react-frontend") 2>/dev/null || true
docker rm -f $(docker ps -aq --filter "name=express-backend") 2>/dev/null || true

# Force stop compose stacks
docker compose -f compose-react.yaml down --remove-orphans --volumes --rmi all --timeout 1 2>/dev/null || true
docker compose -f compose.yaml down --remove-orphans --volumes --rmi all --timeout 1 2>/dev/null || true

# STEP 2: Aggressive port cleanup
echo "💀 STEP 2: Aggressive port cleanup..."
PORTS=(8080 8000 8001 8085 3000 3001)

for port in "${PORTS[@]}"; do
    echo "   🔫 Killing everything on port $port..."
    
    # Method 1: lsof
    if command_exists lsof; then
        pids=$(lsof -t -i:"$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "     lsof found PIDs: $pids"
            echo "$pids" | xargs -r kill -9 2>/dev/null || true
            sleep 1
        fi
    fi
    
    # Method 2: netstat + kill
    if command_exists netstat; then
        netstat_pids=$(netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | grep -v "-" | sort -u || true)
        if [ -n "$netstat_pids" ]; then
            echo "     netstat found PIDs: $netstat_pids"
            echo "$netstat_pids" | xargs -r kill -9 2>/dev/null || true
            sleep 1
        fi
    fi
    
    # Method 3: fuser (if available)
    if command_exists fuser; then
        fuser -k "$port/tcp" 2>/dev/null || true
    fi
    
    # Verify port is free
    if lsof -i :"$port" >/dev/null 2>&1; then
        echo "     ⚠️  Port $port still in use after cleanup attempts"
    else
        echo "     ✅ Port $port is now free"
    fi
done

# STEP 3: Docker resource cleanup
echo "🧹 STEP 3: Docker resource cleanup..."

# Remove specific workshop images with force
echo "🗑️  Force removing workshop images..."
docker rmi -f workshop-poc-infra-frontend 2>/dev/null || true
docker rmi -f workshop-poc-infra-backend 2>/dev/null || true  
docker rmi -f workshop-poc-infra-workspace-cleaner 2>/dev/null || true

# Remove all workshop volumes
echo "🗑️  Removing workshop volumes..."
docker volume rm -f project socket-proxy 2>/dev/null || true
docker volume ls -q --filter "label=demo-setup=true" | xargs -r docker volume rm -f 2>/dev/null || true

# Remove all workshop networks
echo "🗑️  Removing workshop networks..."
docker network rm -f workshop-poc-react workshop-poc workshop-poc-infra_default 2>/dev/null || true
docker network ls -q --filter "label=demo-setup=true" | xargs -r docker network rm 2>/dev/null || true

# Clean up build cache aggressively
echo "🧹 Cleaning ALL Docker build cache..."
docker builder prune -af --keep-storage 0 2>/dev/null || true
docker system prune -af --volumes 2>/dev/null || true

# Wait for cleanup to settle
echo "⏳ Waiting for cleanup to settle..."
sleep 10

# STEP 4: Final verification
echo "🔍 STEP 4: Final verification..."

# Check ports one more time
echo "📊 Final port check:"
PORT_ISSUES=()
for port in "${PORTS[@]}"; do
    if lsof -i :"$port" >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":$port "; then
        PORT_ISSUES+=("$port")
        echo "   ❌ Port $port: Still in use"
        # Show what's using it
        if command_exists lsof; then
            lsof -i :"$port" 2>/dev/null | head -3
        fi
    else
        echo "   ✅ Port $port: Available"
    fi
done

if [ ${#PORT_ISSUES[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  CRITICAL: Some ports are still blocked!"
    echo "   Blocked ports: ${PORT_ISSUES[*]}"
    echo ""
    echo "🤔 Options:"
    echo "   1. Continue anyway and hope for the best (y)"
    echo "   2. Exit and manually fix port conflicts (n)"
    echo "   3. Try to kill more aggressively with sudo (s)"
    echo ""
    read -p "Choose an option (y/n/s): " response
    
    case "$response" in
        [Ss]*)
            echo "💀 Trying sudo kill..."
            for port in "${PORT_ISSUES[@]}"; do
                if command_exists lsof; then
                    sudo lsof -t -i:"$port" | xargs -r sudo kill -9 2>/dev/null || true
                fi
            done
            sleep 2
            ;;
        [Nn]*)
            echo "❌ Aborted by user"
            exit 1
            ;;
        *)
            echo "⚠️  Continuing with port conflicts..."
            ;;
    esac
fi

# STEP 5: Build everything from scratch
echo "🏗️  STEP 5: Building everything from scratch (no cache)..."

# Build with absolute no cache
docker compose -f compose-react.yaml build --no-cache --pull --parallel

# STEP 6: Start services
echo "🚀 STEP 6: Starting services..."
docker compose -f compose-react.yaml up -d

# STEP 7: Extended health monitoring
echo "⏳ STEP 7: Extended health monitoring (60 seconds)..."
sleep 60

# Comprehensive health check
echo "🏥 COMPREHENSIVE HEALTH CHECK"
echo "=============================="

# Container status
echo "📊 Container Status:"
SERVICES=(project-setup frontend backend instructions workspace host-forwarding workspace-cleaner socket-proxy)
FAILED_SERVICES=()

for service in "${SERVICES[@]}"; do
    status=$(docker compose -f compose-react.yaml ps "$service" --format json 2>/dev/null | jq -r '.State' 2>/dev/null || echo "unknown")
    case "$status" in
        "running")
            echo "✅ $service: Running"
            ;;
        "exited")
            if [ "$service" = "project-setup" ]; then
                echo "✅ $service: Completed (expected)"
            else
                echo "❌ $service: Exited unexpectedly"
                FAILED_SERVICES+=("$service")
            fi
            ;;
        *)
            echo "❌ $service: $status"
            FAILED_SERVICES+=("$service")
            ;;
    esac
done

echo ""

# Port connectivity check
echo "🌐 Port Connectivity:"
PORTS_SERVICES=("8080:React Frontend" "8000:Backend API" "8001:Instructions" "8085:VS Code Server")
ALL_WORKING=true

for port_service in "${PORTS_SERVICES[@]}"; do
    port=$(echo "$port_service" | cut -d':' -f1)
    service=$(echo "$port_service" | cut -d':' -f2)
    
    if timeout 5 nc -z localhost "$port" 2>/dev/null; then
        echo "✅ $service (port $port): Responding"
    else
        echo "❌ $service (port $port): Not responding"
        ALL_WORKING=false
    fi
done

echo ""

# Show logs for failed services
if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    echo "📋 FAILED SERVICE LOGS:"
    echo "======================"
    for service in "${FAILED_SERVICES[@]}"; do
        echo ""
        echo "--- $service logs ---"
        docker compose -f compose-react.yaml logs --tail=10 "$service" 2>/dev/null || echo "No logs available"
    done
    echo ""
fi

# Final status
echo "🎯 FINAL STATUS"
echo "==============="

if [ ${#FAILED_SERVICES[@]} -eq 0 ] && [ "$ALL_WORKING" = "true" ]; then
    echo "🎉 SUCCESS! All services are running properly!"
    echo ""
    echo "🌐 Service URLs:"
    echo "   • React Frontend: http://localhost:8080"
    echo "   • Backend API: http://localhost:8000/api/health"
    echo "   • Instructions: http://localhost:8001"
    echo "   • VS Code Server: http://localhost:8085 (password: password)"
    echo ""
    echo "🎮 You can now start using the workshop environment!"
else
    echo "⚠️  PARTIAL SUCCESS - Some issues remain:"
    echo "   • Failed services: ${FAILED_SERVICES[*]}"
    echo "   • Port issues: $( [ "$ALL_WORKING" = "false" ] && echo "Yes" || echo "None" )"
    echo ""
    echo "🔧 Next steps:"
    echo "   • Check logs: docker compose -f compose-react.yaml logs -f [service-name]"
    echo "   • Check processes: docker compose -f compose-react.yaml ps"
    echo "   • Try restarting failed services: docker compose -f compose-react.yaml restart [service-name]"
fi

echo ""
echo "📚 Available commands:"
echo "   • View all logs: docker compose -f compose-react.yaml logs -f"
echo "   • Check status: docker compose -f compose-react.yaml ps"
echo "   • Restart service: docker compose -f compose-react.yaml restart [service-name]"
echo "   • Stop everything: docker compose -f compose-react.yaml down"
