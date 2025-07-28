const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const { marked } = require('marked');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Backend adapters
const backends = {
  local: require('./adapters/localFileSystem'),
  remote: require('./adapters/remoteFileSystem'),
  container: require('./adapters/containerFileSystem')
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    backends: Object.keys(backends)
  });
});

// List files endpoint
app.get('/api/files', async (req, res) => {
  try {
    const { path: requestPath = '/', backend = 'local' } = req.query;
    
    if (!backends[backend]) {
      return res.status(400).json({ 
        error: 'Invalid backend type',
        availableBackends: Object.keys(backends)
      });
    }

    const files = await backends[backend].listFiles(requestPath);
    res.json({ 
      files,
      path: requestPath,
      backend,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ 
      error: 'Failed to list files',
      message: error.message 
    });
  }
});

// Get file content endpoint
app.get('/api/files/content', async (req, res) => {
  try {
    const { path: filePath, backend = 'local' } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    if (!backends[backend]) {
      return res.status(400).json({ 
        error: 'Invalid backend type',
        availableBackends: Object.keys(backends)
      });
    }

    const content = await backends[backend].getFileContent(filePath);
    res.json({ 
      content,
      path: filePath,
      backend,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting file content:', error);
    res.status(500).json({ 
      error: 'Failed to get file content',
      message: error.message 
    });
  }
});

// Create file/folder endpoint
app.post('/api/files', async (req, res) => {
  try {
    const { path: targetPath, type = 'file', content = '', backend = 'local' } = req.body;
    
    if (!targetPath) {
      return res.status(400).json({ error: 'Path is required' });
    }

    if (!backends[backend]) {
      return res.status(400).json({ 
        error: 'Invalid backend type',
        availableBackends: Object.keys(backends)
      });
    }

    const result = await backends[backend].createItem(targetPath, type, content);
    res.json({ 
      success: true,
      result,
      backend,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating file/folder:', error);
    res.status(500).json({ 
      error: 'Failed to create file/folder',
      message: error.message 
    });
  }
});

// Delete file/folder endpoint
app.delete('/api/files', async (req, res) => {
  try {
    const { path: targetPath, backend = 'local' } = req.query;
    
    if (!targetPath) {
      return res.status(400).json({ error: 'Path is required' });
    }

    if (!backends[backend]) {
      return res.status(400).json({ 
        error: 'Invalid backend type',
        availableBackends: Object.keys(backends)
      });
    }

    const result = await backends[backend].deleteItem(targetPath);
    res.json({ 
      success: true,
      result,
      backend,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting file/folder:', error);
    res.status(500).json({ 
      error: 'Failed to delete file/folder',
      message: error.message 
    });
  }
});

// Markdown content endpoint (legacy support)
app.get('/api/content/:file', async (req, res) => {
  try {
    const { file } = req.params;
    const { backend = 'local' } = req.query;
    
    const contentDir = process.env.CONTENT_DIR || '/app/content';
    const filePath = path.join(contentDir, file);
    
    if (!backends[backend]) {
      return res.status(400).json({ 
        error: 'Invalid backend type',
        availableBackends: Object.keys(backends)
      });
    }

    const content = await backends[backend].getFileContent(filePath);
    const html = marked(content);
    
    res.json({ 
      html,
      path: filePath,
      backend,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing markdown:', error);
    res.status(404).json({ 
      error: 'File not found',
      message: error.message 
    });
  }
});

// Backend switch endpoint
app.post('/api/backend/switch', (req, res) => {
  const { backend } = req.body;
  
  if (!backend || !backends[backend]) {
    return res.status(400).json({ 
      error: 'Invalid backend type',
      availableBackends: Object.keys(backends)
    });
  }

  res.json({ 
    success: true,
    backend,
    message: `Switched to ${backend} backend`,
    timestamp: new Date().toISOString()
  });
});

// List available backends
app.get('/api/backends', (req, res) => {
  const backendInfo = Object.keys(backends).map(name => ({
    name,
    description: backends[name].description || `${name} file system adapter`,
    capabilities: backends[name].capabilities || ['read', 'write']
  }));
  
  res.json({ 
    backends: backendInfo,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path,
    message: 'The requested resource was not found'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Workshop POC Backend running on port ${PORT}`);
  console.log(`Available backends: ${Object.keys(backends).join(', ')}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
