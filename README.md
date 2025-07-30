# Workshop PoC

This is only a PoC that demonstrates how one might be able to launch a workshop using containers in a multi-tenant fashion.

![Screenshot of the project opened in the browser using VS Code server](./screenshot.png)

## Architecture

The project uses a combination of containers to create an isolated workshop environment with a modern React frontend and Express backend API, presented as a unified split-screen interface.

### Architecture Flow

```
User (Browser)
    ↓
http://localhost:8080
    ↓
Split-Screen Interface
    ├── Left Side: React Frontend (Workshop UI, Instructions, Controls)
    └── Right Side: VS Code Server (Development Environment)
    
React Frontend communicates with:
    ├── Express Backend (API Server) → Project Files & Docker Socket
    └── Instructions Server (Markdown Content)

Backend Infrastructure:
    ├── Project Setup → Clones workshop repository
    ├── Socket Proxy → Secures Docker API access  
    └── Workspace Cleaner → Resource management
    
Storage:
    ├── Project Volume → Shared workspace files
    └── Socket-Proxy Volume → Secure Docker socket
```

### Component Overview

**Unified Interface:**
- **Split-Screen Interface** (Port 8080) - Single entry point combining React frontend and VS Code Server in a unified workshop experience
- **React Frontend** - Modern React application built with Vite, provides the workshop UI, instructions, and controls
- **VS Code Server** - Integrated browser-based VS Code instance for live development within the same interface

**Backend Services:**
- **Express Backend** (Port 8000) - RESTful API server that handles file operations, workspace management, and communication between frontend and development environment
- **Instructions Server** (Port 8001) - Markdown rendering server that provides workshop documentation content

**Development Environment:**
- **Host Port Forwarder** - Runs in the same network namespace as VS Code, enabling localhost port forwarding for applications started within the IDE

**Infrastructure Layer:**
- **Project Setup** - Initialization container that clones the workshop repository and sets up the workspace
- **[Docker Socket Proxy](https://github.com/mikesir87/docker-socket-proxy)** - Security wrapper for the Docker Socket with protections and remapping:
  - Filters responses to only show workshop-created containers
  - Restricts mount sources to the project workspace
  - Remaps paths to use volumes instead of bind mounts
  - Ensures Testcontainers also uses the proxied socket
- **Workspace Cleaner** - Resource management service for cleanup and maintenance

### Key Features

- **Unified Experience**: Single split-screen interface combining workshop content and development environment
- **Modern Stack**: React frontend with Express backend API
- **Isolated Environment**: Docker socket proxying ensures security and isolation
- **Port Forwarding**: Localhost ports from VS Code are accessible to the frontend
- **Volume Remapping**: File paths are automatically remapped to secure volumes
- **Live Development**: Real-time interaction between web interface and VS Code workspace

## Known limitations

- Running multiple instances will cause port conflicts
- Volume names are currently hard-coded in the Compose file (for remapping/allowlisting of mount sources)

## Try it out

To try it out, you'll first start off by launching the workshop environment. After that, you can try a few things in the workshop environment.

### Start the workshop stack

1. Clone this project

2. Copy .env.example to .env

3. Start the stack using Docker Compose

    ```console
    docker compose up -d --build
    ```

4. Open http://localhost:8080 - This will open the unified split-screen interface with:
   - **Left side**: Workshop instructions and controls
   - **Right side**: VS Code development environment (password: `password`)

### Test out the workshop environment

1. Open http://localhost:8080 to access the unified workshop interface

2. The split-screen will show instructions on the left and VS Code on the right. When prompted for the VS Code password, enter `password`

3. In the VS Code terminal (right side), run a `docker ps`. Notice how you see no other containers, even though there are other containers running on the machine (run the same `docker ps` in another terminal directly on your machine)!

4. Start the application stack by launching Docker Compose:

    ```console
    docker compose up -d
    ````

    You'll see all of the containers start up successfully!

5. Run another `docker ps` and you'll see the containers you started!

6. Try out Testcontainers by running the following command:

    ```console
    npm run integration-test
    ```

### Experiment - volume remapping

1. In the VS Code terminal, start another container and mount the `dev/db` directory into the container:

    ```console
    docker run --rm -tiv ./dev/db:/data --name=data-demo ubuntu
    ```

2. In that newly launched container, run `ls /data` and see the file that's there! 

    ```console
    root@a8f1776a6069:/# ls /data
    1-create-schema.sql
    ```

3. On your host machine, run the following command to look at the mount source:

    ```console
    docker inspect --format='{{range .Mounts}}{{println .Type .Name .Source .Destination}}{{end}}' data-demo
    ```

    What you'll see is this is _not_ a bind mount (as the `./dev/db` argument in the `docker run` command would suggest). Instead, it is a mount to the volume named `project`!

4. Exit the container now by running `exit` (in the VS Code terminal).

### Experiment - Docker Socket remapping

1. Start a new container and share the Docker socket:

    ```console
    docker run --rm -tiv /var/run/docker.sock:/var/run/docker.sock --name=socket-demo docker sh
    ```

2. In the new container, run `docker ps`. You should only see the containers created since you started the workshop environment!

3. Run the following command to inspect the container and see where the Docker Socket is coming from:

    ```console
    docker inspect --format='{{range .Mounts}}{{println .Type .Name .Source .Destination}}{{end}}' socket-demo
    ```

    In the output, you should see an entry for:

    ```
    volume socket-proxy /var/lib/docker/volumes/socket-proxy/_data /var/run/docker.sock
    ```

    The socket is coming from the Docker Socket proxy... meaning this nested container is _also_ being proxied!

### API Endpoints

The Express backend provides RESTful API endpoints for integration:

- `GET /api/health` - Health check endpoint
- `GET /api/files` - List workspace files
- `POST /api/files` - Create/update files
- `GET /api/workspace/status` - Get workspace status
- Additional endpoints for workshop-specific functionality

### Service URLs (for development/debugging)

While the main experience is through the unified interface at port 8080, individual services can be accessed directly:

- **Main Interface**: http://localhost:8080 (Unified split-screen workshop experience)
- **Backend API**: http://localhost:8000 (Direct API access for debugging)
- **Instructions**: http://localhost:8001 (Direct markdown server access)
- **VS Code Server**: http://localhost:8085 (Direct VS Code access - mainly for debugging)
