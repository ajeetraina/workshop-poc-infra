const fs = require('fs-extra');
const path = require('path');

class LocalFileSystemAdapter {
  constructor() {
    this.description = 'Local file system adapter';
    this.capabilities = ['read', 'write', 'delete', 'create'];
    this.rootPath = process.env.WORKSPACE_ROOT || '/home/coder/project';
  }

  async listFiles(targetPath = '/') {
    try {
      // Normalize and secure the path
      const safePath = this.getSafePath(targetPath);
      const fullPath = path.join(this.rootPath, safePath);
      
      // Check if path exists
      if (!await fs.pathExists(fullPath)) {
        throw new Error(`Path does not exist: ${targetPath}`);
      }

      const stats = await fs.stat(fullPath);
      
      if (!stats.isDirectory()) {
        // If it's a file, return file info
        return [{
          name: path.basename(fullPath),
          type: 'file',
          path: targetPath,
          size: stats.size,
          modified: stats.mtime,
          permissions: this.getPermissions(stats)
        }];
      }

      // Read directory contents
      const items = await fs.readdir(fullPath);
      const fileList = [];

      for (const item of items) {
        try {
          const itemPath = path.join(fullPath, item);
          const itemStats = await fs.stat(itemPath);
          const relativePath = path.posix.join(targetPath, item);

          fileList.push({
            name: item,
            type: itemStats.isDirectory() ? 'folder' : 'file',
            path: relativePath,
            size: itemStats.isFile() ? itemStats.size : null,
            modified: itemStats.mtime,
            permissions: this.getPermissions(itemStats)
          });
        } catch (itemError) {
          console.warn(`Error reading item ${item}:`, itemError.message);
          // Continue processing other items
        }
      }

      // Sort: folders first, then files, both alphabetically
      return fileList.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });

    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async getFileContent(filePath) {
    try {
      const safePath = this.getSafePath(filePath);
      const fullPath = path.join(this.rootPath, safePath);
      
      // Security check
      if (!fullPath.startsWith(this.rootPath)) {
        throw new Error('Access denied: Path outside workspace');
      }

      if (!await fs.pathExists(fullPath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      const stats = await fs.stat(fullPath);
      
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }

      // Check file size (limit to 10MB for safety)
      if (stats.size > 10 * 1024 * 1024) {
        throw new Error('File too large to read (max 10MB)');
      }

      const content = await fs.readFile(fullPath, 'utf8');
      return content;

    } catch (error) {
      console.error('Error reading file:', error);
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  async createItem(targetPath, type = 'file', content = '') {
    try {
      const safePath = this.getSafePath(targetPath);
      const fullPath = path.join(this.rootPath, safePath);
      
      // Security check
      if (!fullPath.startsWith(this.rootPath)) {
        throw new Error('Access denied: Path outside workspace');
      }

      // Check if item already exists
      if (await fs.pathExists(fullPath)) {
        throw new Error(`Item already exists: ${targetPath}`);
      }

      // Ensure parent directory exists
      await fs.ensureDir(path.dirname(fullPath));

      if (type === 'folder') {
        await fs.ensureDir(fullPath);
      } else {
        await fs.writeFile(fullPath, content, 'utf8');
      }

      return {
        path: targetPath,
        type,
        created: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error creating item:', error);
      throw new Error(`Failed to create ${type}: ${error.message}`);
    }
  }

  async deleteItem(targetPath) {
    try {
      const safePath = this.getSafePath(targetPath);
      const fullPath = path.join(this.rootPath, safePath);
      
      // Security check
      if (!fullPath.startsWith(this.rootPath)) {
        throw new Error('Access denied: Path outside workspace');
      }

      if (!await fs.pathExists(fullPath)) {
        throw new Error(`Item does not exist: ${targetPath}`);
      }

      await fs.remove(fullPath);

      return {
        path: targetPath,
        deleted: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error deleting item:', error);
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  // Helper methods
  getSafePath(inputPath) {
    // Normalize the path and remove any dangerous patterns
    let safePath = path.posix.normalize(inputPath || '/');
    
    // Remove leading slash for joining with root
    if (safePath.startsWith('/')) {
      safePath = safePath.substring(1);
    }
    
    // Prevent directory traversal
    if (safePath.includes('..')) {
      throw new Error('Invalid path: Directory traversal not allowed');
    }
    
    return safePath;
  }

  getPermissions(stats) {
    return {
      readable: true, // Simplified for now
      writable: true,
      executable: stats.isFile() ? !!(stats.mode & parseInt('111', 8)) : true
    };
  }
}

module.exports = new LocalFileSystemAdapter();
