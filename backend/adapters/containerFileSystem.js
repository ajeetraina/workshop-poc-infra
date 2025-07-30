const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

class ContainerFileSystemAdapter {
  constructor() {
    this.description = 'Container file system adapter (Docker exec)';
    this.capabilities = ['read', 'write', 'delete', 'create'];
    this.containerName = process.env.TARGET_CONTAINER || 'workspace';
  }

  async listFiles(targetPath = '/') {
    try {
      console.log(`Container listing files at: ${targetPath} in container: ${this.containerName}`);
      
      // First check if container exists and is running
      await this.checkContainer();
      
      // Use docker exec to list files
      const command = `docker exec ${this.containerName} ls -la "${targetPath}" --time-style=iso`;
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('ls:')) {
        console.warn('Docker exec stderr:', stderr);
      }
      
      return this.parseLsOutput(stdout, targetPath);

    } catch (error) {
      console.error('Error listing container files:', error);
      
      // Fallback to mock data if container operations fail
      if (error.message.includes('No such container') || error.message.includes('not running')) {
        console.log('Container not available, using mock data');
        return this.getMockContainerData(targetPath);
      }
      
      throw new Error(`Failed to list container files: ${error.message}`);
    }
  }

  async getFileContent(filePath) {
    try {
      console.log(`Container getting file content: ${filePath} from container: ${this.containerName}`);
      
      await this.checkContainer();
      
      // Use docker exec to read file content
      const command = `docker exec ${this.containerName} cat "${filePath}"`;
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        throw new Error(`Error reading file: ${stderr}`);
      }
      
      return stdout;

    } catch (error) {
      console.error('Error reading container file:', error);
      
      // Fallback for development
      if (error.message.includes('No such container') || error.message.includes('not running')) {
        return this.getMockFileContent(filePath);
      }
      
      throw new Error(`Failed to read container file: ${error.message}`);
    }
  }

  async createItem(targetPath, type = 'file', content = '') {
    try {
      console.log(`Container creating ${type}: ${targetPath} in container: ${this.containerName}`);
      
      await this.checkContainer();
      
      let command;
      if (type === 'folder') {
        command = `docker exec ${this.containerName} mkdir -p "${targetPath}"`;
      } else {
        // For files, we need to handle content properly
        const escapedContent = content.replace(/"/g, '\\"');
        command = `docker exec ${this.containerName} sh -c 'echo "${escapedContent}" > "${targetPath}"'`;
      }
      
      const { stderr } = await execAsync(command);
      
      if (stderr) {
        throw new Error(`Error creating item: ${stderr}`);
      }
      
      return {
        path: targetPath,
        type,
        created: new Date().toISOString(),
        source: 'container'
      };

    } catch (error) {
      console.error('Error creating container item:', error);
      throw new Error(`Failed to create container ${type}: ${error.message}`);
    }
  }

  async deleteItem(targetPath) {
    try {
      console.log(`Container deleting: ${targetPath} from container: ${this.containerName}`);
      
      await this.checkContainer();
      
      const command = `docker exec ${this.containerName} rm -rf "${targetPath}"`;
      const { stderr } = await execAsync(command);
      
      if (stderr) {
        throw new Error(`Error deleting item: ${stderr}`);
      }
      
      return {
        path: targetPath,
        deleted: new Date().toISOString(),
        source: 'container'
      };

    } catch (error) {
      console.error('Error deleting container item:', error);
      throw new Error(`Failed to delete container item: ${error.message}`);
    }
  }

  async checkContainer() {
    try {
      const command = `docker inspect ${this.containerName} --format '{{.State.Running}}'`;
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr || stdout.trim() !== 'true') {
        throw new Error(`Container ${this.containerName} is not running or does not exist`);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Container check failed: ${error.message}`);
    }
  }

  parseLsOutput(output, basePath) {
    const lines = output.split('\n').filter(line => line.trim());
    const files = [];
    
    // Skip the first line (total) and parse each file entry
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        // Parse ls -la output: permissions links owner group size date time name
        const parts = line.split(/\s+/);
        if (parts.length < 9) continue;
        
        const permissions = parts[0];
        const name = parts.slice(8).join(' '); // Handle names with spaces
        
        // Skip . and .. entries
        if (name === '.' || name === '..') continue;
        
        const isDirectory = permissions.startsWith('d');
        const size = parseInt(parts[4]) || 0;
        
        // Construct full path
        const fullPath = path.posix.join(basePath, name);
        
        files.push({
          name,
          type: isDirectory ? 'folder' : 'file',
          path: fullPath,
          size: isDirectory ? null : size,
          permissions: permissions,
          modified: new Date(), // Could parse the date from ls output
        });
      } catch (parseError) {
        console.warn(`Error parsing ls line: ${line}`, parseError);
      }
    }
    
    // Sort: folders first, then files
    return files.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  getMockContainerData(targetPath) {
    const mockStructure = {
      '/': [
        { name: 'home', type: 'folder', path: '/home', modified: new Date() },
        { name: 'app', type: 'folder', path: '/app', modified: new Date() },
        { name: 'var', type: 'folder', path: '/var', modified: new Date() },
        { name: 'tmp', type: 'folder', path: '/tmp', modified: new Date() },
        { name: 'etc', type: 'folder', path: '/etc', modified: new Date() },
      ],
      '/home': [
        { name: 'coder', type: 'folder', path: '/home/coder', modified: new Date() },
      ],
      '/home/coder': [
        { name: 'project', type: 'folder', path: '/home/coder/project', modified: new Date() },
        { name: '.bashrc', type: 'file', path: '/home/coder/.bashrc', size: 1024, modified: new Date() },
      ],
      '/app': [
        { name: 'docker-compose.yml', type: 'file', path: '/app/docker-compose.yml', size: 2048, modified: new Date() },
        { name: 'Dockerfile', type: 'file', path: '/app/Dockerfile', size: 512, modified: new Date() },
        { name: 'src', type: 'folder', path: '/app/src', modified: new Date() },
      ]
    };
    
    return mockStructure[targetPath] || [];
  }

  getMockFileContent(filePath) {
    const fileName = path.basename(filePath);
    return `# Container File: ${fileName}\n\nThis is mock content from container file system.\n\nContainer: ${this.containerName}\nPath: ${filePath}\nTimestamp: ${new Date().toISOString()}`;
  }

  async getContainerInfo() {
    try {
      const command = `docker inspect ${this.containerName} --format '{{json .}}'`;
      const { stdout } = await execAsync(command);
      return JSON.parse(stdout);
    } catch (error) {
      throw new Error(`Failed to get container info: ${error.message}`);
    }
  }

  async getRunningContainers() {
    try {
      const command = 'docker ps --format "{{.Names}}"';
      const { stdout } = await execAsync(command);
      return stdout.split('\n').filter(name => name.trim());
    } catch (error) {
      throw new Error(`Failed to get running containers: ${error.message}`);
    }
  }
}

module.exports = new ContainerFileSystemAdapter();
