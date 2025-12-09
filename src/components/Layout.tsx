import { useEffect, useState, useRef, useCallback } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { Viewport, ViewportHandle } from './Viewport';
import { Inspector } from './Inspector';
import { Tutorial } from './Tutorial';
import { useScene } from '../hooks/useScene';
import './Layout.css';

export function Layout() {
  const { scene, selectObject, deleteSelected, duplicateSelected, exportScene, importScene, focusOnObject } = useScene();
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isInspectorVisible, setIsInspectorVisible] = useState(true);
  const viewportRef = useRef<ViewportHandle>(null);

  // Check if tutorial should be shown on first load
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorial-completed');
    if (!tutorialCompleted) {
      // Small delay to let the UI render first
      setTimeout(() => {
        setShowTutorial(true);
      }, 500);
    }
  }, []);

  // Ouvrir automatiquement l'Inspector quand un objet est sélectionné
  useEffect(() => {
    if (scene.selectedId && scene.selectedType && !isInspectorVisible) {
      setIsInspectorVisible(true);
    }
  }, [scene.selectedId, scene.selectedType, isInspectorVisible]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          deleteSelected();
          break;
        case 'Escape':
          selectObject(null, null);
          break;
        case 'd':
        case 'D':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            duplicateSelected();
          }
          break;
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey && scene.selectedId && scene.selectedType) {
            e.preventDefault();
            focusOnObject(scene.selectedId, scene.selectedType);
          }
          break;
        case ' ':
          e.preventDefault();
          setIsPaused(p => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, duplicateSelected, selectObject, scene.selectedId, scene.selectedType, focusOnObject]);

  const handleExport = useCallback(() => {
    const json = exportScene();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `scene-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [exportScene]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target?.result as string;
      if (json) {
        const success = importScene(json);
        if (!success) {
          alert('Failed to import scene. Invalid format.');
        }
      }
    };
    reader.readAsText(file);
  }, [importScene]);

  const handleTogglePause = useCallback(() => {
    setIsPaused(p => !p);
  }, []);

  const handleShowTutorial = useCallback(() => {
    setShowTutorial(true);
  }, []);

  const handleCloseTutorial = useCallback(() => {
    setShowTutorial(false);
  }, []);

  const handleToggleInspector = useCallback(() => {
    setIsInspectorVisible(prev => !prev);
  }, []);

  return (
    <div className="layout">
      <TopBar 
        canvasRef={{ current: viewportRef.current?.getCanvas() ?? null }}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onExport={handleExport}
        onImport={handleImport}
        onShowTutorial={handleShowTutorial}
      />
      <div className="layout-main">
        <Sidebar />
        <main className="layout-viewport">
          <Viewport ref={viewportRef} isPaused={isPaused} />
        </main>
        <Inspector 
          isVisible={isInspectorVisible} 
          onToggle={handleToggleInspector}
        />
      </div>
      {showTutorial && (
        <Tutorial
          onClose={handleCloseTutorial}
          onSkip={handleCloseTutorial}
        />
      )}
    </div>
  );
}

