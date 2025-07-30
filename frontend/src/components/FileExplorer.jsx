import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Home, 
  RefreshCw,
  X,
  Search
} from 'lucide-react';
import './FileExplorer.css';

const FileExplorer = ({ onFileSelect, onPathChange, currentPath, onClose }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['/']));
  const [searchTerm, setSearchTerm] = useState('');
  const [backendType, setBackendType] = useState('local'); // 'local' or 'remote'

  // Fetch files from backend
  const fetchFiles = async (path = currentPath) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}&backend=${backendType}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setFiles(data.files || []);
      onPathChange(path);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files. Make sure the backend is running.');
      // Fallback to mock data for development
      setFiles(getMockFiles(path));
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development/fallback
  const getMockFiles = (path) => {
    const mockStructure = {
      '/': [
        { name: 'docker-compose.yml', type: 'file', path: '/docker-compose.yml' },
        { name: 'Dockerfile', type: 'file', path: '/Dockerfile' },
        { name: 'src', type: 'folder', path: '/src' },
        { name: 'docs', type: 'folder', path: '/docs' },
        { name: 'README.md', type: 'file', path: '/README.md' },
      ],
      '/src': [
        { name: 'main.js', type: 'file', path: '/src/main.js' },
        { name: 'components', type: 'folder', path: '/src/components' },
        { name: 'utils', type: 'folder', path: '/src/utils' },
      ],
      '/docs': [
        { name: 'getting-started.md', type: 'file', path: '/docs/getting-started.md' },
        { name: 'api.md', type: 'file', path: '/docs/api.md' },
      ],
      '/src/components': [
        { name: 'App.jsx', type: 'file', path: '/src/components/App.jsx' },
        { name: 'Header.jsx', type: 'file', path: '/src/components/Header.jsx' },
      ]
    };
    
    return mockStructure[path] || [];
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPath, backendType]);

  const handleItemClick = (item) => {
    if (item.type === 'folder') {
      const newPath = item.path;
      if (expandedFolders.has(newPath)) {
        setExpandedFolders(prev => {
          const next = new Set(prev);
          next.delete(newPath);
          return next;
        });
      } else {
        setExpandedFolders(prev => new Set(prev).add(newPath));
        fetchFiles(newPath);
      }
    } else {
      onFileSelect(item);
    }
  };

  const navigateToPath = (path) => {
    fetchFiles(path);
  };

  const goToParent = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    navigateToPath(parentPath);
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (item) => {
    if (item.type === 'folder') {
      return expandedFolders.has(item.path) ? 
        <FolderOpen size={16} className="folder-icon open" /> : 
        <Folder size={16} className="folder-icon" />;
    }
    return <File size={16} className="file-icon" />;
  };

  const getChevronIcon = (item) => {
    if (item.type === 'folder') {
      return expandedFolders.has(item.path) ? 
        <ChevronDown size={14} /> : 
        <ChevronRight size={14} />;
    }
    return null;
  };

  return (
    <div className="file-explorer">
      {/* Header */}
      <div className="file-explorer-header">
        <div className="header-left">
          <h3>File Explorer</h3>
          <select 
            value={backendType}
            onChange={(e) => setBackendType(e.target.value)}
            className="backend-selector"
          >
            <option value="local">Local</option>
            <option value="remote">Remote</option>
          </select>
        </div>
        <button onClick={onClose} className="close-button">
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <div className="file-explorer-nav">
        <div className="path-breadcrumb">
          <button onClick={() => navigateToPath('/')} className="path-button">
            <Home size={14} />
          </button>
          {currentPath !== '/' && (
            <>
              <span className="path-separator">/</span>
              <span className="current-path">{currentPath.split('/').pop()}</span>
            </>
          )}
        </div>
        <div className="nav-actions">
          {currentPath !== '/' && (
            <button onClick={goToParent} className="nav-button" title="Go to parent">
              ↑
            </button>
          )}
          <button onClick={() => fetchFiles()} className="nav-button" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* File List */}
      <div className="file-list">
        {loading && (
          <div className="loading-state">
            <RefreshCw size={16} className="spinning" />
            <span>Loading...</span>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={() => fetchFiles()} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredFiles.length === 0 && (
          <div className="empty-state">
            <p>No files found</p>
          </div>
        )}

        {!loading && !error && filteredFiles.map((item, index) => (
          <div
            key={`${item.path}-${index}`}
            className={`file-item ${item.type}`}
            onClick={() => handleItemClick(item)}
          >
            <div className="file-item-content">
              {getChevronIcon(item)}
              {getFileIcon(item)}
              <span className="file-name">{item.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;
