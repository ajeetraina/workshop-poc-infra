import React, { useState, useEffect } from 'react';
import { Monitor, ExternalLink } from 'lucide-react';
import './VSCodePanel.css';

const VSCodePanel = () => {
  const [isVSCodeLoaded, setIsVSCodeLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if VS Code is available
    const checkVSCode = async () => {
      try {
        const response = await fetch('http://localhost:8085/favicon.ico');
        if (response.ok) {
          setIsConnected(true);
        }
      } catch (error) {
        console.log('VS Code not ready yet, will try again...');
        setTimeout(checkVSCode, 3000);
      }
    };

    // Start checking after a brief delay
    const timer = setTimeout(checkVSCode, 1000);
    return () => clearTimeout(timer);
  }, []);

  const embedVSCode = () => {
    setIsVSCodeLoaded(true);
  };

  const VSCodeIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
      <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
    </svg>
  );

  return (
    <div className="vscode-panel">
      {/* Header */}
      <div className="vscode-header">
        <div className="vscode-title">
          <Monitor size={16} />
          Development Environment
        </div>
        <div className="vscode-status">
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <div className="status-text">
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
      </div>

      {/* Content */}
      {isVSCodeLoaded ? (
        <iframe
          className="vscode-iframe"
          src="http://localhost:8085"
          title="VS Code Server"
          onLoad={() => console.log('VS Code iframe loaded')}
          onError={() => console.log('Error loading VS Code iframe')}
        />
      ) : (
        <div className="vscode-placeholder">
          <VSCodeIcon />
          <h3>VS Code Environment</h3>
          <p>Your integrated development environment with terminal access</p>
          <p>Complete with file explorer, code editor, and Docker CLI</p>
          
          {isConnected ? (
            <div className="action-buttons">
              <button 
                onClick={embedVSCode} 
                className="access-button primary"
              >
                Load VS Code Here
              </button>
              <a 
                href="http://localhost:8085" 
                target="_blank" 
                rel="noopener noreferrer"
                className="access-button secondary"
              >
                <ExternalLink size={16} />
                Open in New Tab
              </a>
            </div>
          ) : (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p>Setting up your development environment...</p>
              <p className="loading-tip">This may take a few moments on first run</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VSCodePanel;
