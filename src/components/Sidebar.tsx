import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useScene } from '../hooks/useScene';
import { MAX_SPHERES, MAX_BOXES, Sphere, Box } from '../types/scene';
import './Sidebar.css';

interface EditableNameProps {
  name: string;
  onRename: (newName: string) => void;
  triggerEdit?: boolean;
  onEditComplete?: () => void;
}

function EditableName({ name, onRename, triggerEdit, onEditComplete }: EditableNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (triggerEdit && !isEditing) {
      setEditValue(name);
      setIsEditing(true);
    }
  }, [triggerEdit, name, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(name);
    setIsEditing(true);
  };

  const handleBlur = () => {
    if (editValue.trim()) {
      onRename(editValue.trim());
    }
    setIsEditing(false);
    onEditComplete?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(name);
      setIsEditing(false);
      onEditComplete?.();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className="editable-name-input"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span className="list-item-name" onDoubleClick={handleDoubleClick}>
      {name}
    </span>
  );
}

interface ContextMenuState {
  x: number;
  y: number;
  objectId: string;
  objectType: 'sphere' | 'box';
}

interface ContextMenuProps {
  menu: ContextMenuState;
  object: Sphere | Box;
  onClose: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onFocus: () => void;
  onResetPosition: () => void;
  onRandomColor: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

function ContextMenu({ 
  menu, 
  object, 
  onClose, 
  onRename, 
  onDuplicate, 
  onToggleVisibility, 
  onDelete,
  onFocus,
  onResetPosition,
  onRandomColor,
  onBringToFront,
  onSendToBack,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust menu position to stay in viewport
  const menuStyle: React.CSSProperties = {
    top: menu.y,
    left: menu.x,
  };

  return (
    <div 
      ref={menuRef}
      className="context-menu"
      style={menuStyle}
    >
      <div className="context-menu-header">
        {'radius' in object ? '● ' : '■ '}{object.name}
      </div>
      
      <button className="context-menu-item" onClick={onRename}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
        Rename
      </button>
      
      <button className="context-menu-item" onClick={onDuplicate}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        Duplicate
        <span className="shortcut">D</span>
      </button>
      
      <div className="context-menu-divider" />
      
      <button className="context-menu-item" onClick={onFocus}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Focus Camera
        <span className="shortcut">F</span>
      </button>
      
      <button className="context-menu-item" onClick={onResetPosition}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        Reset Position
      </button>
      
      <button className="context-menu-item" onClick={onRandomColor}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="13.5" cy="6.5" r="2.5" />
          <circle cx="6.5" cy="17.5" r="2.5" />
          <circle cx="17.5" cy="17.5" r="2.5" />
          <path d="M13.5 9v2M6.5 15v-3l4-2.5M17.5 15v-3l-4-2.5" />
        </svg>
        Random Color
      </button>
      
      <div className="context-menu-divider" />
      
      <button className="context-menu-item" onClick={onToggleVisibility}>
        {object.visible ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            Hide Object
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Show Object
          </>
        )}
      </button>
      
      <div className="context-menu-divider" />
      
      <div className="context-menu-submenu">
        <span className="context-menu-label">Arrange</span>
        <div className="context-menu-row">
          <button className="context-menu-item small" onClick={onBringToFront} title="Bring to Front">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="17 11 12 6 7 11" />
              <polyline points="17 18 12 13 7 18" />
            </svg>
          </button>
          <button className="context-menu-item small" onClick={onSendToBack} title="Send to Back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="7 13 12 18 17 13" />
              <polyline points="7 6 12 11 17 6" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="context-menu-divider" />
      
      <button className="context-menu-item danger" onClick={onDelete}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        Delete
        <span className="shortcut">Del</span>
      </button>
    </div>
  );
}

export function Sidebar() {
  const { 
    scene, 
    addSphere, 
    addBox, 
    selectObject, 
    removeSphere, 
    removeBox,
    renameSphere,
    renameBox,
    toggleSphereVisibility,
    toggleBoxVisibility,
    duplicateSelected,
    focusOnObject,
    resetObjectPosition,
    randomizeColor,
    bringToFront,
    sendToBack,
  } = useScene();

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const canAddSphere = scene.spheres.length < MAX_SPHERES;
  const canAddBox = scene.boxes.length < MAX_BOXES;

  const handleContextMenu = useCallback((
    e: React.MouseEvent,
    objectId: string,
    objectType: 'sphere' | 'box'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    selectObject(objectId, objectType);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      objectId,
      objectType,
    });
  }, [selectObject]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const getContextObject = useCallback((): Sphere | Box | null => {
    if (!contextMenu) return null;
    if (contextMenu.objectType === 'sphere') {
      return scene.spheres.find(s => s.id === contextMenu.objectId) || null;
    }
    return scene.boxes.find(b => b.id === contextMenu.objectId) || null;
  }, [contextMenu, scene]);

  const handleContextRename = useCallback(() => {
    if (contextMenu) {
      setEditingId(contextMenu.objectId);
    }
    closeContextMenu();
  }, [contextMenu, closeContextMenu]);

  const handleContextDuplicate = useCallback(() => {
    if (contextMenu) {
      selectObject(contextMenu.objectId, contextMenu.objectType);
      setTimeout(() => duplicateSelected(), 0);
    }
    closeContextMenu();
  }, [contextMenu, selectObject, duplicateSelected, closeContextMenu]);

  const handleContextToggleVisibility = useCallback(() => {
    if (contextMenu) {
      if (contextMenu.objectType === 'sphere') {
        toggleSphereVisibility(contextMenu.objectId);
      } else {
        toggleBoxVisibility(contextMenu.objectId);
      }
    }
    closeContextMenu();
  }, [contextMenu, toggleSphereVisibility, toggleBoxVisibility, closeContextMenu]);

  const handleContextDelete = useCallback(() => {
    if (contextMenu) {
      if (contextMenu.objectType === 'sphere') {
        removeSphere(contextMenu.objectId);
      } else {
        removeBox(contextMenu.objectId);
      }
    }
    closeContextMenu();
  }, [contextMenu, removeSphere, removeBox, closeContextMenu]);

  const handleContextFocus = useCallback(() => {
    if (contextMenu) {
      focusOnObject(contextMenu.objectId, contextMenu.objectType);
    }
    closeContextMenu();
  }, [contextMenu, focusOnObject, closeContextMenu]);

  const handleContextResetPosition = useCallback(() => {
    if (contextMenu) {
      resetObjectPosition(contextMenu.objectId, contextMenu.objectType);
    }
    closeContextMenu();
  }, [contextMenu, resetObjectPosition, closeContextMenu]);

  const handleContextRandomColor = useCallback(() => {
    if (contextMenu) {
      randomizeColor(contextMenu.objectId, contextMenu.objectType);
    }
    closeContextMenu();
  }, [contextMenu, randomizeColor, closeContextMenu]);

  const handleContextBringToFront = useCallback(() => {
    if (contextMenu) {
      bringToFront(contextMenu.objectId, contextMenu.objectType);
    }
    closeContextMenu();
  }, [contextMenu, bringToFront, closeContextMenu]);

  const handleContextSendToBack = useCallback(() => {
    if (contextMenu) {
      sendToBack(contextMenu.objectId, contextMenu.objectType);
    }
    closeContextMenu();
  }, [contextMenu, sendToBack, closeContextMenu]);

  const contextObject = getContextObject();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Scene Objects</h2>
        <span className="object-count">{scene.spheres.length + scene.boxes.length}</span>
      </div>

      <div className="sidebar-actions">
        <button 
          className="btn btn-add" 
          onClick={addSphere}
          disabled={!canAddSphere}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          Sphere
        </button>
        <button 
          className="btn btn-add" 
          onClick={addBox}
          disabled={!canAddBox}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          Box
        </button>
      </div>

      <div className="sidebar-list">
        {scene.spheres.length > 0 && (
          <div className="list-section">
            <div className="list-section-header">Spheres</div>
            {scene.spheres.map((sphere) => (
              <div
                key={sphere.id}
                className={`list-item ${scene.selectedId === sphere.id ? 'selected' : ''} ${!sphere.visible ? 'hidden-object' : ''}`}
                onClick={() => selectObject(sphere.id, 'sphere')}
                onContextMenu={(e) => handleContextMenu(e, sphere.id, 'sphere')}
              >
                <div className="list-item-icon sphere-icon">
                  <div 
                    className="color-dot" 
                    style={{ background: `rgb(${sphere.color.r * 255}, ${sphere.color.g * 255}, ${sphere.color.b * 255})` }}
                  />
                </div>
                <EditableName 
                  name={sphere.name} 
                  onRename={(name) => renameSphere(sphere.id, name)}
                  triggerEdit={editingId === sphere.id}
                  onEditComplete={() => setEditingId(null)}
                />
                <button 
                  className={`list-item-visibility ${!sphere.visible ? 'is-hidden' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleSphereVisibility(sphere.id); }}
                  title={sphere.visible ? 'Hide' : 'Show'}
                >
                  {sphere.visible ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
                <button 
                  className="list-item-delete"
                  onClick={(e) => { e.stopPropagation(); removeSphere(sphere.id); }}
                  title="Delete"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {scene.boxes.length > 0 && (
          <div className="list-section">
            <div className="list-section-header">Boxes</div>
            {scene.boxes.map((box) => (
              <div
                key={box.id}
                className={`list-item ${scene.selectedId === box.id ? 'selected' : ''} ${!box.visible ? 'hidden-object' : ''}`}
                onClick={() => selectObject(box.id, 'box')}
                onContextMenu={(e) => handleContextMenu(e, box.id, 'box')}
              >
                <div className="list-item-icon box-icon">
                  <div 
                    className="color-dot square" 
                    style={{ background: `rgb(${box.color.r * 255}, ${box.color.g * 255}, ${box.color.b * 255})` }}
                  />
                </div>
                <EditableName 
                  name={box.name} 
                  onRename={(name) => renameBox(box.id, name)}
                  triggerEdit={editingId === box.id}
                  onEditComplete={() => setEditingId(null)}
                />
                <button 
                  className={`list-item-visibility ${!box.visible ? 'is-hidden' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleBoxVisibility(box.id); }}
                  title={box.visible ? 'Hide' : 'Show'}
                >
                  {box.visible ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
                <button 
                  className="list-item-delete"
                  onClick={(e) => { e.stopPropagation(); removeBox(box.id); }}
                  title="Delete"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {scene.spheres.length === 0 && scene.boxes.length === 0 && (
          <div className="empty-state">
            <p>No objects in scene</p>
            <p className="hint">Click + to add objects</p>
          </div>
        )}
      </div>

      {contextMenu && contextObject && (
        <ContextMenu
          menu={contextMenu}
          object={contextObject}
          onClose={closeContextMenu}
          onRename={handleContextRename}
          onDuplicate={handleContextDuplicate}
          onToggleVisibility={handleContextToggleVisibility}
          onDelete={handleContextDelete}
          onFocus={handleContextFocus}
          onResetPosition={handleContextResetPosition}
          onRandomColor={handleContextRandomColor}
          onBringToFront={handleContextBringToFront}
          onSendToBack={handleContextSendToBack}
        />
      )}
    </aside>
  );
}
