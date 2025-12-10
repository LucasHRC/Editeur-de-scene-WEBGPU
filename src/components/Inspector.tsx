import { useState, useEffect } from 'react';
import { useScene } from '../hooks/useScene';
import { Sphere, Box, Vec3, Color } from '../types/scene';
import './Inspector.css';

type Tab = 'object' | 'scene' | 'shortcuts' | 'code';

interface InspectorProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function Inspector({ isVisible, onToggle }: InspectorProps) {
  const { scene, updateSphere, updateBox, updateCamera, getSelectedObject, deleteSelected, duplicateSelected, exportScene, importScene } = useScene();
  const [activeTab, setActiveTab] = useState<Tab>('object');
  const [codeValue, setCodeValue] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  const selectedObject = getSelectedObject();

  const rgbToHex = (c: Color) => {
    const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
    return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
  };

  const hexToRgb = (hex: string): Color => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
      : { r: 1, g: 1, b: 1 };
  };

  const updatePosition = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedObject) return;
    const newPos = { ...selectedObject.position, [axis]: value };
    if (scene.selectedType === 'sphere') {
      updateSphere(selectedObject.id, { position: newPos });
    } else {
      updateBox(selectedObject.id, { position: newPos });
    }
  };

  const updateSize = (value: number | Vec3) => {
    if (!selectedObject) return;
    if (scene.selectedType === 'sphere') {
      updateSphere(selectedObject.id, { radius: value as number });
    } else {
      const size = typeof value === 'number' ? { x: value, y: value, z: value } : value;
      updateBox(selectedObject.id, { size });
    }
  };

  const updateColor = (hex: string) => {
    if (!selectedObject) return;
    const color = hexToRgb(hex);
    if (scene.selectedType === 'sphere') {
      updateSphere(selectedObject.id, { color });
    } else {
      updateBox(selectedObject.id, { color });
    }
  };

  // Charger le code quand on change d'onglet ou que la scène change
  useEffect(() => {
    if (activeTab === 'code') {
      const json = exportScene();
      setCodeValue(json);
      setCodeError(null);
    }
  }, [activeTab, exportScene, scene]);

  const handleApplyCode = () => {
    try {
      setCodeError(null);
      const success = importScene(codeValue);
      if (!success) {
        setCodeError('Format JSON invalide. Vérifiez la structure de votre scène.');
      }
    } catch {
      setCodeError('Erreur lors de l\'application du code. Vérifiez que le JSON est valide.');
    }
  };

  // Bouton toggle quand l'inspector est masqué
  if (!isVisible) {
    return (
      <button
        className="inspector-toggle-button"
        onClick={onToggle}
        title="Afficher l'inspecteur"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
    );
  }

  return (
    <aside className="inspector">
      <button
        className="inspector-close-button"
        onClick={onToggle}
        title="Masquer l'inspecteur"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      <div className="inspector-tabs">
        <button 
          className={`tab ${activeTab === 'object' ? 'active' : ''}`}
          onClick={() => setActiveTab('object')}
        >
          Object
        </button>
        <button 
          className={`tab ${activeTab === 'scene' ? 'active' : ''}`}
          onClick={() => setActiveTab('scene')}
        >
          Scene
        </button>
        <button 
          className={`tab ${activeTab === 'shortcuts' ? 'active' : ''}`}
          onClick={() => setActiveTab('shortcuts')}
        >
          ⌨️
        </button>
        <button 
          className={`tab ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          Code
        </button>
      </div>

      <div className="inspector-content">
        {activeTab === 'object' && (
          <>
            {selectedObject ? (
              <div className="inspector-section">
                <h3 className="section-title">
                  {scene.selectedType === 'sphere' ? '● ' : '■ '}
                  {selectedObject.name}
                </h3>

                <div className="control-group">
                  <label className="control-label">Position</label>
                  <div className="vec3-control">
                    <div className="slider-row">
                      <span className="axis-label x">X</span>
                      <input 
                        type="range" 
                        min="-5" max="5" step="0.1"
                        value={selectedObject.position.x}
                        onChange={(e) => updatePosition('x', parseFloat(e.target.value))}
                      />
                      <span className="value">{selectedObject.position.x.toFixed(1)}</span>
                    </div>
                    <div className="slider-row">
                      <span className="axis-label y">Y</span>
                      <input 
                        type="range" 
                        min="-2" max="5" step="0.1"
                        value={selectedObject.position.y}
                        onChange={(e) => updatePosition('y', parseFloat(e.target.value))}
                      />
                      <span className="value">{selectedObject.position.y.toFixed(1)}</span>
                    </div>
                    <div className="slider-row">
                      <span className="axis-label z">Z</span>
                      <input 
                        type="range" 
                        min="-5" max="5" step="0.1"
                        value={selectedObject.position.z}
                        onChange={(e) => updatePosition('z', parseFloat(e.target.value))}
                      />
                      <span className="value">{selectedObject.position.z.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    {scene.selectedType === 'sphere' ? 'Radius' : 'Size'}
                  </label>
                  <div className="slider-row">
                    <input 
                      type="range" 
                      min="0.1" 
                      max={scene.selectedType === 'sphere' ? '2' : '1.5'} 
                      step="0.05"
                      value={scene.selectedType === 'sphere' 
                        ? (selectedObject as Sphere).radius 
                        : (selectedObject as Box).size.x}
                      onChange={(e) => updateSize(parseFloat(e.target.value))}
                    />
                    <span className="value">
                      {(scene.selectedType === 'sphere' 
                        ? (selectedObject as Sphere).radius 
                        : (selectedObject as Box).size.x).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">Color</label>
                  <div className="color-row">
                    <input 
                      type="color"
                      value={rgbToHex(selectedObject.color)}
                      onChange={(e) => updateColor(e.target.value)}
                    />
                    <span className="color-hex">{rgbToHex(selectedObject.color)}</span>
                  </div>
                </div>

                <div className="control-group actions">
                  <button className="action-btn duplicate" onClick={duplicateSelected}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Duplicate
                    <span className="shortcut">D</span>
                  </button>
                  <button className="action-btn delete" onClick={deleteSelected}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete
                    <span className="shortcut">⌫</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <p>No object selected</p>
                <p className="hint">Click an object in the sidebar or viewport</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'scene' && (
          <div className="inspector-section">
            <h3 className="section-title">Camera</h3>

            <div className="control-group">
              <label className="control-label">FOV</label>
              <div className="slider-row">
                <input 
                  type="range" 
                  min="30" max="120" step="1"
                  value={scene.camera.fov}
                  onChange={(e) => updateCamera({ fov: parseFloat(e.target.value) })}
                />
                <span className="value">{scene.camera.fov}°</span>
              </div>
            </div>

            <div className="control-group">
              <label className="control-label">Distance</label>
              <div className="slider-row">
                <input 
                  type="range" 
                  min="2.5" max="20" step="0.1"
                  value={scene.camera.distance}
                  onChange={(e) => updateCamera({ distance: parseFloat(e.target.value) })}
                />
                <span className="value">{scene.camera.distance.toFixed(1)}</span>
              </div>
            </div>

            <div className="control-group">
              <label className="control-label">Pitch</label>
              <div className="slider-row">
                <input 
                  type="range" 
                  min="0.1" max="1.5" step="0.01"
                  value={scene.camera.pitch}
                  onChange={(e) => updateCamera({ pitch: parseFloat(e.target.value) })}
                />
                <span className="value">{(scene.camera.pitch * 57.3).toFixed(0)}°</span>
              </div>
            </div>

            <div className="control-group">
              <label className="control-label">Yaw</label>
              <div className="slider-row">
                <input 
                  type="range" 
                  min="-3.14" max="3.14" step="0.01"
                  value={scene.camera.yaw}
                  onChange={(e) => updateCamera({ yaw: parseFloat(e.target.value) })}
                />
                <span className="value">{(scene.camera.yaw * 57.3).toFixed(0)}°</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shortcuts' && (
          <div className="inspector-section">
            <h3 className="section-title">Keyboard Shortcuts</h3>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-key">Delete / ⌫</span>
                <span className="shortcut-desc">Delete selected object</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Escape</span>
                <span className="shortcut-desc">Deselect object</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">D</span>
                <span className="shortcut-desc">Duplicate selected object</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">F</span>
                <span className="shortcut-desc">Focus camera on object</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Space</span>
                <span className="shortcut-desc">Pause/Resume animation</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Shift + Drag</span>
                <span className="shortcut-desc">Precision gizmo movement</span>
              </div>
            </div>

            <h3 className="section-title" style={{ marginTop: '24px' }}>Mouse Controls</h3>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-key">Click</span>
                <span className="shortcut-desc">Select object in viewport</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Right-click</span>
                <span className="shortcut-desc">Context menu (reset, focus)</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Drag</span>
                <span className="shortcut-desc">Rotate camera around object</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Scroll</span>
                <span className="shortcut-desc">Zoom in/out</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Drag gizmo</span>
                <span className="shortcut-desc">Move object on X/Y/Z axis</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="code-editor-container">
            <textarea
              className="code-editor"
              value={codeValue}
              onChange={(e) => setCodeValue(e.target.value)}
              spellCheck="false"
            />
            {codeError && <div className="code-error">{codeError}</div>}
            <button className="code-apply-button" onClick={handleApplyCode}>
              Appliquer les modifications
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
