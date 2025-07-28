#!/bin/bash

# Workshop PoC Infrastructure - Quick Diagnostics
# This script quickly identifies common problems

echo "🔍 Workshop PoC Infrastructure - Quick Diagnostics"
echo "================================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Docker
echo "🐳 Docker Status:"
if command_exists docker; then
    echo "✅ Docker CLI: Available"
    if docker version >/dev/null 2>&1; then
        echo "✅ Docker Daemon: Running"
    else
        echo "❌ Docker Daemon: Not running"
    fi
    
    if docker compose version >/dev/null 2>&1; then
        echo "✅ Docker Compose: Available"
    else
        echo "❌ Docker Compose: Not available"
    fi
else
    echo "❌ Docker CLI: Not found"
fi

echo ""

# Check ports
echo "🌐 Port Status:"
PORTS=(8080 8000 8001 8085 3000 3001)
for port in "${PORTS[@]}"; do
    if lsof -i :"$port" >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "🔴 Port $port: IN USE"
        if command_exists lsof; then
            process=$(lsof -i :"$port" 2>/dev/null | tail -n +2 | head -1)
            if [ -n "$process" ]; then
                echo "    Used by: $process"
            fi
        fi
    else
        echo "🟢 Port $port: Available"
    fi
done

echo ""

# Check containers
echo "📦 Container Status:"
if docker ps >/dev/null 2>&1; then
    workshop_containers=$(docker ps -a --filter "label=demo-setup=true" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | tail -n +2)
    if [ -n "$workshop_containers" ]; then
        echo "Workshop containers found:"
        echo "$workshop_containers"
    else
        echo "No workshop containers found"
    fi
    
    echo ""
    echo "All containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -10
else
    echo "❌ Cannot check containers (Docker not accessible)"
fi

echo ""

# Check networks
echo "🌐 Network Status:"
if docker network ls >/dev/null 2>&1; then
    workshop_networks=$(docker network ls --filter "label=demo-setup=true" --format "table {{.Name}}\t{{.Driver}}")
    if [ -n "$workshop_networks" ] && [ "$workshop_networks" != "NAME DRIVER" ]; then
        echo "Workshop networks found:"
        echo "$workshop_networks"
    else
        echo "No workshop networks found"
    fi
    
    # Check for common networks
    if docker network ls | grep -q "workshop-poc-react"; then
        echo "✅ workshop-poc-react network exists"
    else
        echo "❌ workshop-poc-react network missing"
    fi
    
    if docker network ls | grep -q "workshop-poc-infra_default"; then
        echo "✅ workshop-poc-infra_default network exists"
    else
        echo "❌ workshop-poc-infra_default network missing"
    fi
else
    echo "❌ Cannot check networks (Docker not accessible)"
fi

echo ""

# Check volumes
echo "💾 Volume Status:"
if docker volume ls >/dev/null 2>&1; then
    workshop_volumes=$(docker volume ls --filter "label=demo-setup=true" --format "table {{.Name}}\t{{.Driver}}")
    if [ -n "$workshop_volumes" ] && [ "$workshop_volumes" != "NAME DRIVER" ]; then
        echo "Workshop volumes found:"
        echo "$workshop_volumes"
    else
        echo "No workshop volumes found"
    fi
    
    # Check for required volumes
    if docker volume ls | grep -q "project"; then
        echo "✅ project volume exists"
    else
        echo "❌ project volume missing"
    fi
    
    if docker volume ls | grep -q "socket-proxy"; then
        echo "✅ socket-proxy volume exists"  
    else
        echo "❌ socket-proxy volume missing"
    fi
else
    echo "❌ Cannot check volumes (Docker not accessible)"
fi

echo ""

# Check images
echo "🖼️  Image Status:"
if docker images >/dev/null 2>&1; then
    workshop_images=$(docker images --filter "reference=workshop-poc-infra*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}")
    if [ -n "$workshop_images" ] && [ "$workshop_images" != "REPOSITORY TAG SIZE" ]; then
        echo "Workshop images found:"
        echo "$workshop_images"
    else
        echo "No workshop images found"
    fi
else
    echo "❌ Cannot check images (Docker not accessible)"
fi

echo ""

# Check compose file
echo "📄 Compose File Status:"
if [ -f "compose-react.yaml" ]; then
    echo "✅ compose-react.yaml exists"
    
    # Check for common issues
    if grep -q "workshop-poc-react" compose-react.yaml; then
        echo "⚠️  Found workshop-poc-react network references (might cause issues)"
    fi
    
    if grep -q "workshop-poc-infra_default" compose-react.yaml; then
        echo "✅ Found workshop-poc-infra_default network references"
    fi
    
    if grep -q "no_cache: true" compose-react.yaml; then
        echo "✅ Found no_cache build directives"
    else
        echo "⚠️  Missing no_cache build directives (might use stale images)"
    fi
else
    echo "❌ compose-react.yaml not found"
fi

if [ -f "compose.yaml" ]; then
    echo "✅ compose.yaml exists (original)"
else
    echo "❌ compose.yaml not found"
fi

echo ""

# Quick health check if services are running
echo "🏥 Quick Health Check:"
services_running=false

if command_exists curl; then
    # Check frontend
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|301\|302"; then
        echo "✅ Frontend (8080): Responding"
        services_running=true
    else
        echo "❌ Frontend (8080): Not responding"
    fi
    
    # Check backend
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health | grep -q "200"; then
        echo "✅ Backend (8000): Responding"
        services_running=true
    else
        echo "❌ Backend (8000): Not responding"
    fi
    
    # Check instructions
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8001 | grep -q "200\|301\|302"; then
        echo "✅ Instructions (8001): Responding"
        services_running=true
    else
        echo "❌ Instructions (8001): Not responding"
    fi
    
    # Check VS Code
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8085 | grep -q "200\|301\|302\|401"; then
        echo "✅ VS Code (8085): Responding"
        services_running=true
    else
        echo "❌ VS Code (8085): Not responding"
    fi
else
    echo "⚠️  curl not available - cannot test service health"
fi

echo ""

# Recommendations
echo "💡 Recommendations:"
echo "=================="

if ! $services_running; then
    echo "🚨 No services appear to be running!"
    echo "   → Try: ./force-rebuild.sh"
fi

# Check for port conflicts
port_conflicts=$(lsof -i :8080,:8000,:8001,:8085,:3000,:3001 2>/dev/null | wc -l)
if [ "$port_conflicts" -gt 0 ]; then
    echo "⚠️  Port conflicts detected!"
    echo "   → Try: ./force-rebuild.sh (includes aggressive port cleanup)"
fi

# Check for stale containers
stale_containers=$(docker ps -aq --filter "label=demo-setup=true" 2>/dev/null | wc -l)
if [ "$stale_containers" -gt 0 ]; then
    echo "🧹 Stale workshop containers found!"
    echo "   → Try: docker rm -f \$(docker ps -aq --filter \"label=demo-setup=true\")"
fi

# Check for missing files
if [ ! -f "compose-react.yaml" ]; then
    echo "📁 Missing compose file!"
    echo "   → Make sure you're in the right directory"
    echo "   → Try: git pull origin react-conversion"
fi

echo ""
echo "📚 Available Scripts:"
echo "   • ./diagnose.sh - This diagnostic script"
echo "   • ./restart-workshop.sh - Smart restart with problem detection"
echo "   • ./force-rebuild.sh - Nuclear cleanup and rebuild"
echo "   • ./TROUBLESHOOTING.md - Comprehensive troubleshooting guide"
