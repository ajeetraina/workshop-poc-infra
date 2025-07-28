# Workshop PoC - React Conversion

This branch contains a React-based conversion of the original HTML workshop environment, featuring a modern frontend with swappable backend adapters for flexible file system navigation.

## 🚀 New Features

### Frontend Improvements
- **React-based Interface**: Modern, component-based architecture
- **Vite Build System**: Fast development and optimized production builds  
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Split Panel Layout**: Resizable panels with file explorer toggle
- **Interactive Tutorial**: Step tracking, progress indication, and command copying

### Backend Architecture
- **Swappable Adapters**: Switch between different file system backends
- **Express.js API**: RESTful endpoints for file operations
- **Multiple Backend Types**:
  - **Local**: Direct file system access within the workspace
  - **Remote**: Simulated remote file system (WebDAV/SSH/FTP)
  - **Container**: Direct Docker container file system access

### Enhanced Functionality
- **File Explorer**: Browse files with different backend adapters
- **Command Copying**: One-click copy of tutorial commands
- **Real-time Updates**: Dynamic content loading and updates
- **Health Monitoring**: Service health checks and status indicators

## 📁 Project Structure

```
workshop-poc-infra/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── data/              # Tutorial data
│   │   └── App.jsx            # Main application
│   ├── Dockerfile             # Frontend container
│   ├── nginx.conf            # Nginx configuration
│   └── package.json          # Frontend dependencies
│
├── backend/                     # Express.js backend
│   ├── adapters/              # Swappable file system adapters
│   │   ├── localFileSystem.js    # Local file access
│   │   ├── remoteFileSystem.js   # Remote system simulation
│   │   └── containerFileSystem.js # Docker container access
│   ├── server.js              # Main server
│   ├── Dockerfile            # Backend container
│   └── package.json          # Backend dependencies
│
├── compose-react.yaml           # React-based Docker Compose
└── README-REACT.md            # This file
```

## 🛠 Setup and Installation

### Prerequisites
- Docker & Docker Compose
- Git

### Quick Start

1. **Clone and switch to React branch**:
   ```bash
   git clone https://github.com/ajeetraina/workshop-poc-infra.git
   cd workshop-poc-infra
   git checkout react-conversion
   ```

2. **Start the React-based environment**:
   ```bash
   docker compose -f compose-react.yaml up -d
   ```

3. **Access the application**:
   - **Main Interface**: http://localhost:8080
   - **VS Code Environment**: http://localhost:8085
   - **Backend API**: http://localhost:8000/api/health
   - **Legacy Instructions**: http://localhost:8001 (for compatibility)

### Development Mode

For frontend development:
```bash
cd frontend
npm install
npm run dev
```

For backend development:
```bash
cd backend
npm install
npm run dev
```

## 🔄 Backend Adapters

### Local File System Adapter
- **Purpose**: Direct access to workspace files
- **Use Case**: Standard file operations within the container
- **Configuration**: Set `WORKSPACE_ROOT` environment variable

### Remote File System Adapter  
- **Purpose**: Simulate remote file systems (WebDAV, SSH, FTP)
- **Use Case**: Demo remote file access patterns
- **Configuration**: Set `REMOTE_HOST`, `REMOTE_PROTOCOL` environment variables

### Container File System Adapter
- **Purpose**: Direct Docker container file system access
- **Use Case**: Inspect files inside running containers
- **Configuration**: Set `TARGET_CONTAINER` environment variable

### Switching Backends

You can switch backends in two ways:

1. **Frontend UI**: Use the dropdown in the File Explorer
2. **API Endpoint**: 
   ```bash
   curl -X POST http://localhost:8000/api/backend/switch \
        -H "Content-Type: application/json" \
        -d '{"backend": "container"}'
   ```

## 🔧 Configuration

### Environment Variables

#### Frontend
- `NODE_ENV`: Environment mode (development/production)

#### Backend  
- `NODE_ENV`: Environment mode (development/production)
- `WORKSPACE_ROOT`: Root directory for local file access
- `TARGET_CONTAINER`: Container name for container adapter
- `REMOTE_HOST`: Remote system hostname
- `REMOTE_PROTOCOL`: Remote system protocol (ssh/ftp/webdav)
- `CONTENT_DIR`: Directory for markdown content

### Port Configuration
- `8080`: Frontend (React app via Nginx)
- `8000`: Backend (Express.js API)
- `8085`: VS Code Server
- `8001`: Legacy instructions server

## 🎯 API Endpoints

### File Operations
- `GET /api/files?path=/&backend=local` - List files
- `GET /api/files/content?path=/file.txt&backend=local` - Get file content
- `POST /api/files` - Create file/folder
- `DELETE /api/files?path=/file.txt&backend=local` - Delete file/folder

### Backend Management
- `GET /api/backends` - List available backends
- `POST /api/backend/switch` - Switch backend adapter
- `GET /api/health` - Health check

### Legacy Compatibility
- `GET /api/content/:file` - Get markdown content (legacy)

## 🏗 Architecture Comparison

### Original HTML Version
```
nginx → Static HTML → Instructions Server (Node.js)
```

### New React Version
```
nginx → React App → Express API → Swappable Adapters
  ↓                      ↓             ↓
Frontend              Backend      File Systems
Components            REST API      (Local/Remote/Container)
```

## 🐛 Troubleshooting

### Common Issues

1. **Backend not responding**:
   ```bash
   docker compose -f compose-react.yaml logs backend
   curl http://localhost:8000/api/health
   ```

2. **File Explorer not loading**:
   - Check backend service status
   - Verify API connectivity
   - Check browser console for errors

3. **Container adapter fails**:
   - Ensure Docker socket is accessible
   - Verify target container is running
   - Check Docker permissions

### Debugging Commands

```bash
# Check service health
docker compose -f compose-react.yaml ps

# View logs
docker compose -f compose-react.yaml logs -f frontend
docker compose -f compose-react.yaml logs -f backend

# Test API directly
curl http://localhost:8000/api/health
curl http://localhost:8000/api/backends

# Restart services
docker compose -f compose-react.yaml restart frontend backend
```

## 🔄 Migration from Original

### Differences from Original HTML Version

1. **Frontend**: React components vs static HTML
2. **Backend**: Express.js with adapters vs simple markdown server
3. **File Explorer**: Dynamic file browsing vs static content
4. **Configuration**: New compose file vs original compose.yaml

### Backward Compatibility

- Legacy instructions server still available on port 8001
- VS Code environment unchanged
- Original compose.yaml still functional
- Same workspace structure and volumes

## 🚀 Future Enhancements

### Planned Features
- [ ] File editing within the File Explorer
- [ ] Real-time file watching and updates
- [ ] SSH/SFTP adapter implementation
- [ ] WebDAV adapter implementation
- [ ] Advanced search and filtering
- [ ] File upload/download functionality
- [ ] Collaborative editing features

### Extension Points
- Additional backend adapters
- Custom file viewers
- Plugin system for tutorials
- Integration with cloud storage
- Enhanced VS Code integration

## 🤝 Contributing

1. Create feature branch from `react-conversion`
2. Make changes in appropriate directories
3. Test with Docker Compose
4. Submit pull request

### Development Guidelines
- Use ESLint for code formatting
- Add tests for new adapters
- Update documentation
- Follow React best practices
- Maintain backward compatibility

---

## Original Workshop Features

All original workshop features remain available:
- VS Code environment
- Docker socket proxy
- Host port forwarding
- Isolated environment
- Tutorial content

The React conversion enhances these features with a modern interface and extensible backend architecture.
