import React, { useState, useEffect } from 'react';
import Split from 'react-split';
import TutorialPanel from './components/TutorialPanel';
import VSCodePanel from './components/VSCodePanel';
import FileExplorer from './components/FileExplorer';
import { tutorialData } from './data/tutorialData';
import './App.css';

function App() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [currentFiles, setCurrentFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  
  // Calculate progress
  const totalSteps = tutorialData.reduce((total, section) => total + section.steps.length, 0);
  const progress = (completedSteps.size / totalSteps) * 100;

  const handleStepComplete = (stepId) => {
    setCompletedSteps(prev => new Set(prev).add(stepId));
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
  };

  const toggleFileExplorer = () => {
    setShowFileExplorer(!showFileExplorer);
  };

  const handleFileSelect = (file) => {
    console.log('Selected file:', file);
    // Here you could load file content in a code editor or preview
  };

  const handlePathChange = (newPath) => {
    setCurrentPath(newPath);
  };

  return (
    <div className="app">
      <Split
        sizes={showFileExplorer ? [25, 50, 25] : [50, 50]}
        minSize={showFileExplorer ? [200, 400, 200] : [300, 300]}
        gutterSize={4}
        className="split"
        direction="horizontal"
      >
        {showFileExplorer && (
          <FileExplorer
            onFileSelect={handleFileSelect}
            onPathChange={handlePathChange}
            currentPath={currentPath}
            onClose={() => setShowFileExplorer(false)}
          />
        )}
        
        <TutorialPanel
          tutorialData={tutorialData}
          activeSection={activeSection}
          completedSteps={completedSteps}
          progress={progress}
          onSectionChange={handleSectionChange}
          onStepComplete={handleStepComplete}
          onToggleFileExplorer={toggleFileExplorer}
          showFileExplorer={showFileExplorer}
        />
        
        <VSCodePanel />
      </Split>
    </div>
  );
}

export default App;
