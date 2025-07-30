import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock fetch globally
global.fetch = vi.fn();

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders the main application', () => {
    render(<App />);
    
    expect(screen.getByText('Docker Workshop Lab Tutorial')).toBeInTheDocument();
    expect(screen.getByText('Interactive hands-on Docker learning experience')).toBeInTheDocument();
  });

  it('displays tutorial navigation tabs', () => {
    render(<App />);
    
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Containers')).toBeInTheDocument();
    expect(screen.getByText('Images & Builds')).toBeInTheDocument();
    expect(screen.getByText('Multi-Container')).toBeInTheDocument();
  });

  it('can switch between tutorial sections', () => {
    render(<App />);
    
    const containersTab = screen.getByText('Containers');
    fireEvent.click(containersTab);
    
    expect(containersTab).toHaveClass('active');
  });

  it('can complete tutorial steps', () => {
    render(<App />);
    
    const firstStep = screen.getByText('Verify Your Environment');
    fireEvent.click(firstStep.closest('.step'));
    
    expect(firstStep.closest('.step')).toHaveClass('completed');
  });

  it('shows progress bar updates', () => {
    render(<App />);
    
    const progressBar = screen.getByClassName('progress-fill');
    const initialWidth = progressBar.style.width;
    
    // Complete a step
    const firstStep = screen.getByText('Verify Your Environment');
    fireEvent.click(firstStep.closest('.step'));
    
    // Progress should have increased
    const newWidth = progressBar.style.width;
    expect(newWidth).not.toBe(initialWidth);
  });

  it('can toggle file explorer', async () => {
    render(<App />);
    
    const fileExplorerToggle = screen.getByTitle(/file explorer/i);
    fireEvent.click(fileExplorerToggle);
    
    await waitFor(() => {
      expect(screen.getByText('File Explorer')).toBeInTheDocument();
    });
  });
});

describe('Tutorial Data Integration', () => {
  it('loads tutorial sections correctly', () => {
    render(<App />);
    
    // Check that all tutorial sections are available
    const expectedSections = [
      'Getting Started',
      'Containers', 
      'Images & Builds',
      'Multi-Container',
      'Agentic Compose',
      'Advanced'
    ];
    
    expectedSections.forEach(section => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });
  });

  it('displays step content correctly', () => {
    render(<App />);
    
    // Check first step details
    expect(screen.getByText('Verify Your Environment')).toBeInTheDocument();
    expect(screen.getByText(/make sure Docker is properly installed/)).toBeInTheDocument();
  });
});

describe('Command Copying Functionality', () => {
  it('attempts to copy commands when code blocks are clicked', async () => {
    // Mock navigator.clipboard
    const mockWriteText = vi.fn().mockResolvedValue();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    render(<App />);
    
    const codeBlock = screen.getByText('docker --version');
    fireEvent.click(codeBlock);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('docker --version');
    });
  });

  it('handles clipboard API failures gracefully', async () => {
    // Mock clipboard API to fail
    const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard failed'));
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    render(<App />);
    
    const codeBlock = screen.getByText('docker --version');
    fireEvent.click(codeBlock);

    // Should not throw an error
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });
  });
});
