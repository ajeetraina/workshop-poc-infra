# Workshop PoC Troubleshooting Guide

This guide helps resolve common issues with the workshop infrastructure.

## Quick Fix Commands

### 🚀 Recommended: Force Rebuild (Solves Most Issues)
```bash
chmod +x force-rebuild.sh
./force-rebuild.sh
```

### 🔄 Smart Restart (For Minor Issues)
```bash
chmod +x restart-workshop.sh  
./restart-workshop.sh
```

---

## Common Issues & Solutions

### 1. "MODULE_TYPELESS_PACKAGE_JSON" Warning

**Symptom:** 
```
workspace-cleaner-1 | (node:1) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///usr/local/app/src/index.js is not specified
```

**Cause:** The workspace-cleaner Docker image wasn't rebuilt with the package.json fix.

**Solution:** Force rebuild to pick up the updated package.json:
```bash
./force-rebuild.sh
```

### 2. "Port Already in Use" Errors

**Symptom:**
```
error listen EADDRINUSE: address already in use 0.0.0.0:8085
```

**Cause:** Previous containers or other processes are using the ports.

**Solution:** Use force rebuild to kill processes and clean ports:
```bash
./force-rebuild.sh
```

**Manual Solution:**
```bash
# Find what's using the port
lsof -i :8085

# Kill the process
kill -9 <PID>

# Or restart everything
./restart-workshop.sh
```

### 3. "Container sharing network namespace" Error

**Symptom:**
```
Error starting container: container sharing network namespace with another container or host cannot be connected to any other network
```

**Cause:** The workspace container was configured for both explicit networks and network_mode sharing.

**Solution:** This has been fixed in the updated compose-react.yaml. Use force rebuild:
```bash
./force-rebuild.sh
```

### 4. Workspace Container Exits with Code 1

**Symptom:**
```
workspace-1 exited with code 1
```

**Cause:** Usually port conflicts or networking issues.

**Solution:**
```bash
# Check logs first
docker compose -f compose-react.yaml logs workspace

# Then force rebuild
./force-rebuild.sh
```

### 5. Services Not Responding

**Symptom:** Can't access http://localhost:8080, 8000, 8001, or 8085

**Quick Check:**
```bash
# Test all ports
nc -z localhost 8080 && echo "8080 OK" || echo "8080 FAIL"
nc -z localhost 8000 && echo "8000 OK" || echo "8000 FAIL"  
nc -z localhost 8001 && echo "8001 OK" || echo "8001 FAIL"
nc -z localhost 8085 && echo "8085 OK" || echo "8085 FAIL"
```

**Solution:**
```bash
# Check service status
docker compose -f compose-react.yaml ps

# Restart failed services
docker compose -f compose-react.yaml restart <service-name>

# Or force rebuild everything
./force-rebuild.sh
```

---

## Debug Commands

### View Logs
```bash
# All services
docker compose -f compose-react.yaml logs -f

# Specific service
docker compose -f compose-react.yaml logs -f workspace

# Last 50 lines for all services
docker compose -f compose-react.yaml logs --tail=50
```

### Check Container Status
```bash
# Container status
docker compose -f compose-react.yaml ps

# Detailed container info
docker compose -f compose-react.yaml ps --format json

# Resource usage
docker stats
```

### Check Networks
```bash
# List networks
docker network ls | grep workshop

# Inspect network
docker network inspect workshop-poc-react
```

### Check Volumes
```bash
# List volumes
docker volume ls | grep -E "(project|socket-proxy)"

# Inspect volume
docker volume inspect project
```

---

## Clean Slate Recovery

If everything is broken and you want to start completely fresh:

```bash
# Nuclear option - removes everything
docker compose -f compose-react.yaml down --remove-orphans --volumes --rmi all
docker system prune -a --volumes -f
docker builder prune -a -f

# Kill processes on workshop ports
sudo lsof -ti:8080,8000,8001,8085,3000 | xargs -r kill -9

# Start fresh
./force-rebuild.sh
```

---

## Service URLs & Passwords

Once working properly:

- **React Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/api/health  
- **Instructions**: http://localhost:8001
- **VS Code Server**: http://localhost:8085
  - **Password**: `password`

---

## Architecture Notes

### Network Configuration
- Most services are on the `workshop-poc-react` network
- The `workspace` container shares network namespace with `host-forwarding`
- This allows port forwarding while maintaining isolation

### Volume Mapping
- `project` volume: Contains workshop files
- `socket-proxy` volume: Provides isolated Docker socket access

### Security Features
- Docker socket is proxied and filtered
- Only containers with `demo-setup=true` label are visible
- Mount sources are restricted to allowed volumes

---

## Getting Help

1. **Check this troubleshooting guide first**
2. **Try the force-rebuild script**: `./force-rebuild.sh`
3. **Check logs**: `docker compose -f compose-react.yaml logs -f`
4. **Test individual components**: Use the debug commands above
5. **Check for port conflicts**: `lsof -i :8080 -i :8000 -i :8001 -i :8085 -i :3000`

Most issues are resolved by the force-rebuild script, which handles:
- ✅ Port conflicts and cleanup
- ✅ Stale containers and images  
- ✅ Network configuration issues
- ✅ Volume permission problems
- ✅ Cache invalidation
