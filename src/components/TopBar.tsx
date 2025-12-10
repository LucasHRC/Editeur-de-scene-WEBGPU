import { useState, useRef, useCallback } from 'react';
import { useScene } from '../hooks/useScene';
import './TopBar.css';

interface TopBarProps {
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  isPaused?: boolean;
  onTogglePause?: () => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
  onShowTutorial?: () => void;
}

export function TopBar({ canvasRef, isPaused, onTogglePause, onExport, onImport, onShowTutorial }: TopBarProps) {
  const { resetCamera } = useScene();
  const [isDark, setIsDark] = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  };

  const handleScreenshot = () => {
    if (!canvasRef?.current) return;
    const link = document.createElement('a');
    link.download = `scene-screenshot-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleImportClick = () => {
    setShowDropZone(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      onImport(file);
      setShowDropZone(false);
    }
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setShowDropZone(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json' && onImport) {
      onImport(file);
    } else if (file && onImport) {
      // Accepter aussi les fichiers sans type défini (certains systèmes)
      onImport(file);
    }
  }, [onImport]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleCloseDropZone = useCallback(() => {
    setShowDropZone(false);
    setIsDragging(false);
  }, []);

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">
            <img src="/site-logo.png" alt="Scene Editor" className="logo-image" />
          </div>
          <div className="topbar-status">
            <span className="status-dot status-ok" />
            <span>WebGPU Ready</span>
          </div>
        </div>

        <div className="topbar-center">
          {onTogglePause && (
            <button className="topbar-btn" onClick={onTogglePause} title={isPaused ? "Play" : "Pause"}>
              {isPaused ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>
          )}
        </div>

        <div className="topbar-right">
          {onExport && (
            <button className="topbar-btn" onClick={onExport} title="Export Scene">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
          )}

          {onImport && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <button className="topbar-btn" onClick={handleImportClick} title="Import Scene">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </>
          )}

          {canvasRef && (
            <button className="topbar-btn" onClick={handleScreenshot} title="Screenshot">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
          )}

          {onShowTutorial && (
            <button className="topbar-btn" onClick={onShowTutorial} title="Aide / Tutoriel">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
          )}

          <div className="topbar-divider" />

          <button className="topbar-btn" onClick={resetCamera} title="Reset Camera">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
          
          <button className="topbar-btn" onClick={toggleTheme} title="Toggle Theme">
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Zone de drop pour l'import */}
      {showDropZone && (
        <div
          className={`drop-zone-overlay ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleCloseDropZone}
        >
          <div
            ref={dropZoneRef}
            className="drop-zone"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drop-zone-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <h3 className="drop-zone-title">Importer une scène</h3>
            <p className="drop-zone-text">
              Glissez-déposez un fichier JSON ici
              <br />
              ou cliquez pour sélectionner un fichier
            </p>
            <button
              type="button"
              className="drop-zone-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Sélectionner un fichier
            </button>
            <button
              type="button"
              className="drop-zone-close"
              onClick={handleCloseDropZone}
              title="Fermer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
