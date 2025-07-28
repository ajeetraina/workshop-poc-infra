import React from 'react';
import { FolderOpen, FolderClosed } from 'lucide-react';
import './TutorialPanel.css';

const TutorialPanel = ({ 
  tutorialData, 
  activeSection, 
  completedSteps, 
  progress, 
  onSectionChange, 
  onStepComplete,
  onToggleFileExplorer,
  showFileExplorer 
}) => {
  const activeData = tutorialData.find(section => section.id === activeSection);

  const handleCopyCommand = async (command) => {
    try {
      await navigator.clipboard.writeText(command);
      // You could add a toast notification here
      console.log('Command copied:', command);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = command;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="tutorial-panel">
      {/* Header */}
      <div className="tutorial-header">
        <div className="header-content">
          <div className="title-section">
            <h1>Docker Workshop Lab Tutorial</h1>
            <p className="subtitle">Interactive hands-on Docker learning experience</p>
          </div>
          <button 
            className="file-explorer-toggle"
            onClick={onToggleFileExplorer}
            title={showFileExplorer ? "Hide File Explorer" : "Show File Explorer"}
          >
            {showFileExplorer ? <FolderOpen size={20} /> : <FolderClosed size={20} />}
          </button>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Navigation */}
      <div className="tutorial-nav">
        <div className="nav-tabs">
          {tutorialData.map(section => (
            <button
              key={section.id}
              className={`nav-tab ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => onSectionChange(section.id)}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="tutorial-content">
        {activeData && (
          <div className="section active fade-in">
            <h2>🚀 {activeData.title}</h2>
            <p>{activeData.description}</p>

            <div className="steps-container">
              {activeData.steps.map(step => (
                <div 
                  key={step.id}
                  className={`step ${completedSteps.has(step.id) ? 'completed' : ''}`}
                  onClick={() => onStepComplete(step.id)}
                >
                  <div className="step-header">
                    <div className="step-number">{step.number}</div>
                    <div className="step-title">{step.title}</div>
                  </div>
                  <p className="step-description">{step.description}</p>
                  
                  {step.commands && step.commands.length > 0 && (
                    <div className="commands-section">
                      {step.commands.map((command, index) => (
                        <div 
                          key={index}
                          className={`code-block ${command.startsWith('#') ? 'comment' : ''}`}
                          onClick={() => !command.startsWith('#') && handleCopyCommand(command)}
                        >
                          <code>{command}</code>
                          {!command.startsWith('#') && (
                            <button 
                              className="copy-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyCommand(command);
                              }}
                            >
                              📋 Copy
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {step.notes && step.notes.length > 0 && (
                    <div className="notes-section">
                      {step.notes.map((note, index) => (
                        <div key={index} className="info-box">
                          {note}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorialPanel;
