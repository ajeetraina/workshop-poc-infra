# Workshop PoC - React Conversion

This is an enhanced version of the workshop PoC that includes a React frontend and Express backend, providing a modern web application architecture for Docker workshops.

![Screenshot of the project opened in the browser using VS Code server](./screenshot.png)

## 🚀 Quick Start (TL;DR)

**Having issues? Try this first:**

```bash
git clone https://github.com/ajeetraina/workshop-poc-infra.git
cd workshop-poc-infra
git checkout react-conversion
chmod +x *.sh
./force-rebuild.sh  # This fixes most issues
```

## 🛠️ Troubleshooting Flow

If you're experiencing issues, follow this flow:

### 1. Quick Diagnosis
```bash
chmod +x diagnose.sh
./diagnose.sh
```

### 2. Smart Restart (for minor issues)
```bash
chmod +x restart-workshop.sh
./restart-workshop.sh
```

### 3. Nuclear Option (for persistent issues)
```bash
chmod +x force-rebuild.sh
./force-rebuild.sh
```

### 4. Manual Investigation
```bash
# Check specific logs
docker compose -f compose-react.yaml logs -f [service-name]

# See comprehensive troubleshooting guide
cat TROUBLESHOOTING.md
```

---

## Architecture

The project uses a combination of containers to create an isolated environment with the following services:

- **React Frontend** - A modern React application served via Nginx
- **Express Backend** - An API server with swappable file system adapters
- **VS Code Server** - Browser-based IDE using [coder/code-server](https://github.com/coder/code-server)
- **Setup container** - Clones the workshop repo into a shared volume
- **[Docker Socket Proxy](https://github.com/mikesir87/docker-socket-proxy)** - Provides security and isolation for Docker operations
- **Host Port Forwarder** - Enables localhost port forwarding within the workspace
- **Instructions Server** - Markdown rendering server for workshop documentation
- **Workspace Cleaner** - Manages cleanup of workshop resources

---

## 📋 Prerequisites

- Docker Desktop or Docker Engine
- Docker Compose v2
- At least 4GB available RAM
- Ports 8080, 8000, 8001, 8085 available

---

## 🎯 Service URLs

Once running successfully, you can access:

- **React Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000 
- **API Health Check**: http://localhost:8000/api/health
- **Workshop Instructions**: http://localhost:8001
- **VS Code Server**: http://localhost:8085 (password: `password`)

---

## 🔧 Available Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `./diagnose.sh` | Quick problem identification | First step when issues occur |
| `./restart-workshop.sh` | Smart restart with conflict detection | Minor issues, first attempt |
| `./force-rebuild.sh` | Nuclear cleanup and rebuild | Persistent issues, port conflicts |

---

## 🏗️ Manual Setup

If you prefer manual control:

### Option 1: Standard Startup
```bash
git clone https://github.com/ajeetraina/workshop-poc-infra.git
cd workshop-poc-infra
git checkout react-conversion
docker compose -f compose-react.yaml up -d
```

### Option 2: Force Clean Build
```bash
docker compose -f compose-react.yaml down --remove-orphans --volumes
docker compose -f compose-react.yaml build --no-cache
docker compose -f compose-react.yaml up -d
```

---

## 🧪 Testing the Environment

### 1. Basic Connectivity Test
```bash
# Test all services
curl -I http://localhost:8080  # Frontend
curl http://localhost:8000/api/health  # Backend
curl -I http://localhost:8001  # Instructions
curl -I http://localhost:8085  # VS Code (will show auth required)
```

### 2. Workshop Environment Test

1. Open VS Code Server at http://localhost:8085 (password: `password`)
2. Open a terminal in VS Code (Menu → Terminal → New Terminal)
3. Run `docker ps` to see isolated container view
4. Start a test application:
   ```bash
   docker compose up -d
   ```
5. Test Testcontainers integration:
   ```bash
   npm run integration-test
   ```

### 3. Volume Remapping Test

1. In the VS Code terminal, mount a local directory:
   ```bash
   docker run --rm -tiv ./dev/db:/data --name=data-demo ubuntu
   ```
2. Check the mount source (should be volume, not bind mount):
   ```bash
   docker inspect --format='{{range .Mounts}}{{println .Type .Name .Source .Destination}}{{end}}' data-demo
   ```

### 4. Docker Socket Remapping Test

1. Start a container with Docker socket access:
   ```bash
   docker run --rm -tiv /var/run/docker.sock:/var/run/docker.sock --name=socket-demo docker sh
   ```
2. Inside the container, run `docker ps` to see the isolated view

---

## 🐛 Common Issues & Quick Fixes

### "Port Already in Use" Errors
```bash
./force-rebuild.sh  # Kills processes using workshop ports
```

### "MODULE_TYPELESS_PACKAGE_JSON" Warning
```bash
./force-rebuild.sh  # Rebuilds images with package.json fix
```

### "Network Namespace" Errors
```bash
./force-rebuild.sh  # Fixes networking configuration
```

### VS Code Server Won't Start
```bash
# Check what's using port 8085
lsof -i :8085
# Then use force rebuild
./force-rebuild.sh
```

### Services Not Responding
```bash
# Check container status
docker compose -f compose-react.yaml ps
# Check logs
docker compose -f compose-react.yaml logs -f
# Restart specific service
docker compose -f compose-react.yaml restart [service-name]
```

---

## 📚 Advanced Usage

### Viewing Logs
```bash
# All services
docker compose -f compose-react.yaml logs -f

# Specific service
docker compose -f compose-react.yaml logs -f workspace

# Last 50 lines
docker compose -f compose-react.yaml logs --tail=50
```

### Managing Services
```bash
# Check status
docker compose -f compose-react.yaml ps

# Restart a service
docker compose -f compose-react.yaml restart [service-name]

# Stop everything
docker compose -f compose-react.yaml down

# Complete cleanup
docker compose -f compose-react.yaml down --remove-orphans --volumes
```

### Development Workflow
```bash
# Build with changes
docker compose -f compose-react.yaml build [service-name]

# Restart after build
docker compose -f compose-react.yaml up -d [service-name]

# View resource usage
docker stats
```

---

## 🔒 Security & Isolation Features

- **Docker Socket Proxy**: Filters and isolates Docker API access
- **Label-based Filtering**: Only containers with `demo-setup=true` are visible
- **Volume Restrictions**: Mount sources limited to allowed volumes
- **Network Isolation**: Services run in isolated networks
- **Resource Labeling**: All resources tagged for easy cleanup

---

## 🆘 Getting Help

1. **Start with diagnostics**: `./diagnose.sh`
2. **Try automated fixes**: `./force-rebuild.sh`
3. **Check troubleshooting guide**: `cat TROUBLESHOOTING.md`
4. **Review logs**: `docker compose -f compose-react.yaml logs -f`
5. **Check GitHub issues**: https://github.com/ajeetraina/workshop-poc-infra/issues

---

## 🔄 Changes from Original

This React conversion includes:

- ✅ Modern React frontend with Express backend
- ✅ Fixed networking issues and port conflicts  
- ✅ Resolved MODULE_TYPELESS_PACKAGE_JSON warnings
- ✅ Added automated cleanup and rebuild scripts
- ✅ Enhanced error handling and stability
- ✅ Better resource labeling for cleanup
- ✅ Comprehensive troubleshooting documentation
- ✅ Intelligent diagnostic tools

---

## 📄 Additional Documentation

- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Comprehensive troubleshooting guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines

---

## ⚡ Performance Tips

- Use `./force-rebuild.sh` for the most reliable startup
- If services are slow to start, wait 60+ seconds before testing
- Monitor resource usage with `docker stats`
- Clean up regularly with `docker system prune`

---

## 🎯 Success Indicators

You'll know everything is working when:

- ✅ All services show "Running" status in `docker compose ps`
- ✅ All URLs respond correctly (see Service URLs section)
- ✅ No error messages in `docker compose logs`
- ✅ VS Code Server loads with password prompt
- ✅ Backend health check returns JSON response

**Happy Workshop Building! 🎉**
