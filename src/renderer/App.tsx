import React, { useEffect, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import { theme } from './theme';
import { GlobalStyles } from './GlobalStyles';
import ControlBar from './components/ControlBar';
import SelectionWindow from './components/SelectionWindow';
import RecordingToolbar from './components/RecordingToolbar';

type ViewMode = 'control-bar' | 'selection' | 'recording-toolbar';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('control-bar');
  const [selectionMode, setSelectionMode] = useState<'area' | 'window' | 'display'>('area');

  useEffect(() => {
    // Determine which view to show based on URL hash
    const hash = window.location.hash;

    if (hash.startsWith('#selection/')) {
      const mode = hash.split('/')[1] as 'area' | 'window' | 'display';
      setSelectionMode(mode);
      setViewMode('selection');
    } else if (hash === '#recording-toolbar') {
      setViewMode('recording-toolbar');
    } else {
      setViewMode('control-bar');
    }

    // Listen for hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash;
      if (newHash.startsWith('#selection/')) {
        const mode = newHash.split('/')[1] as 'area' | 'window' | 'display';
        setSelectionMode(mode);
        setViewMode('selection');
      } else if (newHash === '#recording-toolbar') {
        setViewMode('recording-toolbar');
      } else {
        setViewMode('control-bar');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      {viewMode === 'control-bar' && <ControlBar />}
      {viewMode === 'selection' && <SelectionWindow mode={selectionMode} />}
      {viewMode === 'recording-toolbar' && <RecordingToolbar />}
    </ThemeProvider>
  );
};

export default App;
