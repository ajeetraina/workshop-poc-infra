# Workshop PoC - React Conversion

This is an enhanced version of the workshop PoC that includes a React frontend and Express backend, providing a more modern web application architecture for Docker workshops.

![Screenshot of the project opened in the browser using VS Code server](./screenshot.png)

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

## Quick Start

### Prerequisites

- Docker Desktop or Docker Engine
- Docker Compose v2
- At least 4GB available RAM
- Ports 8080, 8000, 8001, 8085, and 3000 available

### Using the Automated Script (Recommended)

1. Clone this repository:
   ```bash
   git clone https://github.com/ajeetraina/workshop-poc-infra.git
   cd workshop-poc-infra
   git checkout react-conversion
   ```

2. Make the script executable and run it:
   ```bash
   chmod +x restart-workshop.sh
   ./restart-workshop.sh
   ```

   This script will:
   - Clean up any existing resources
   - Check for port conflicts
   - Build and start all services
   - Provide health checks and service URLs

### Manual Setup

If you prefer to start the services manually:

1. Clone this repository and switch to the react-conversion branch:
   ```bash
   git clone https://github.com/ajeetraina/workshop-poc-infra.git
   cd workshop-poc-infra
   git checkout react-conversion
   ```

2. Clean up any existing containers (optional but recommended):
   ```bash
   docker compose -f compose-react.yaml down --remove-orphans
   ```

3. Start the stack:
   ```bash
   docker compose -f compose-react.yaml up -d
   ```

4. Wait for all services to start (about 30-60 seconds)

## Service URLs

Once running, you can access:

- **React Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000 
- **Workshop Instructions**: http://localhost:8001
- **VS Code Server**: http://localhost:8085 (password: `password`)

## Troubleshooting

### Port Conflicts

If you encounter "port already in use" errors:

1. Check what's using the ports:
   ```bash
   lsof -i :8080 -i :8000 -i :8001 -i :8085 -i :3000
   ```

2. Stop conflicting services or use the restart script which handles this automatically.

### Networking Issues

If containers can't communicate:

1. Ensure all services are on the same network:
   ```bash
   docker network ls | grep workshop-poc-react
   ```

2. Restart the stack:
   ```bash
   ./restart-workshop.sh
   ```

### Module Type Warnings

The workspace-cleaner warning about MODULE_TYPELESS_PACKAGE_JSON has been fixed in this version.

### Container Cleanup

To clean up all workshop resources:

```bash
# Stop all services
docker compose -f compose-react.yaml down --remove-orphans

# Remove labeled containers, volumes, and networks
docker ps -aq --filter "label=demo-setup=true" | xargs -r docker rm -f
docker volume ls -q --filter "label=demo-setup=true" | xargs -r docker volume rm -f  
docker network ls -q --filter "label=demo-setup=true" | xargs -r docker network rm
```

## Workshop Usage

### Test the Environment

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

### Experiment with Volume Remapping

1. In the VS Code terminal, mount a local directory:
   ```bash
   docker run --rm -tiv ./dev/db:/data --name=data-demo ubuntu
   ```

2. Check the mount source:
   ```bash
   docker inspect --format='{{range .Mounts}}{{println .Type .Name .Source .Destination}}{{end}}' data-demo
   ```

### Experiment with Docker Socket Remapping

1. Start a container with Docker socket access:
   ```bash
   docker run --rm -tiv /var/run/docker.sock:/var/run/docker.sock --name=socket-demo docker sh
   ```

2. Inside the container, run `docker ps` to see the isolated view

## Development

### Building Custom Images

To build and test local changes:

```bash
docker compose -f compose-react.yaml build
docker compose -f compose-react.yaml up -d
```

### Debugging

View logs for all services:
```bash
docker compose -f compose-react.yaml logs -f
```

View logs for a specific service:
```bash
docker compose -f compose-react.yaml logs -f [service-name]
```

## Known Limitations

- Running multiple instances will cause port conflicts
- Volume names are currently hard-coded for security/isolation
- Some Docker features may be limited due to the socket proxy

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and how to contribute to this project.

## Changes from Original

This React conversion includes:

- ✅ Modern React frontend with Express backend
- ✅ Fixed networking issues and port conflicts  
- ✅ Resolved MODULE_TYPELESS_PACKAGE_JSON warnings
- ✅ Added automated cleanup and restart script
- ✅ Enhanced error handling and stability
- ✅ Better resource labeling for cleanup
- ✅ Comprehensive troubleshooting documentation
