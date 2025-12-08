import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  Scene, Sphere, Box, Camera, Color,
  createDefaultScene, createSphere, createBox,
  MAX_SPHERES, MAX_BOXES 
} from '../types/scene';

interface SceneContextType {
  scene: Scene;
  selectObject: (id: string | null, type: 'sphere' | 'box' | null) => void;
  getSelectedObject: () => Sphere | Box | null;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  addSphere: () => void;
  updateSphere: (id: string, updates: Partial<Sphere>) => void;
  removeSphere: (id: string) => void;
  renameSphere: (id: string, name: string) => void;
  toggleSphereVisibility: (id: string) => void;
  addBox: () => void;
  updateBox: (id: string, updates: Partial<Box>) => void;
  removeBox: (id: string) => void;
  renameBox: (id: string, name: string) => void;
  toggleBoxVisibility: (id: string) => void;
  updateCamera: (updates: Partial<Camera>) => void;
  resetCamera: () => void;
  focusOnObject: (id: string, type: 'sphere' | 'box') => void;
  resetObjectPosition: (id: string, type: 'sphere' | 'box') => void;
  randomizeColor: (id: string, type: 'sphere' | 'box') => void;
  bringToFront: (id: string, type: 'sphere' | 'box') => void;
  sendToBack: (id: string, type: 'sphere' | 'box') => void;
  getObjectById: (id: string) => Sphere | Box | null;
  exportScene: () => string;
  importScene: (json: string) => boolean;
}

const SceneContext = createContext<SceneContextType | null>(null);

export function SceneProvider({ children }: { children: ReactNode }) {
  const [scene, setScene] = useState<Scene>(createDefaultScene);

  const selectObject = useCallback((id: string | null, type: 'sphere' | 'box' | null) => {
    setScene(prev => ({ ...prev, selectedId: id, selectedType: type }));
  }, []);

  const deleteSelected = useCallback(() => {
    setScene(prev => {
      if (!prev.selectedId || !prev.selectedType) return prev;
      if (prev.selectedType === 'sphere') {
        return {
          ...prev,
          spheres: prev.spheres.filter(s => s.id !== prev.selectedId),
          selectedId: null,
          selectedType: null,
        };
      } else {
        return {
          ...prev,
          boxes: prev.boxes.filter(b => b.id !== prev.selectedId),
          selectedId: null,
          selectedType: null,
        };
      }
    });
  }, []);

  const duplicateSelected = useCallback(() => {
    setScene(prev => {
      if (!prev.selectedId || !prev.selectedType) return prev;
      
      if (prev.selectedType === 'sphere') {
        if (prev.spheres.length >= MAX_SPHERES) return prev;
        const original = prev.spheres.find(s => s.id === prev.selectedId);
        if (!original) return prev;
        const newSphere: Sphere = {
          ...original,
          id: `sphere-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `${original.name} (copy)`,
          position: { ...original.position, x: original.position.x + 0.5 },
        };
        return {
          ...prev,
          spheres: [...prev.spheres, newSphere],
          selectedId: newSphere.id,
        };
      } else {
        if (prev.boxes.length >= MAX_BOXES) return prev;
        const original = prev.boxes.find(b => b.id === prev.selectedId);
        if (!original) return prev;
        const newBox: Box = {
          ...original,
          id: `box-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `${original.name} (copy)`,
          position: { ...original.position, x: original.position.x + 0.5 },
        };
        return {
          ...prev,
          boxes: [...prev.boxes, newBox],
          selectedId: newBox.id,
        };
      }
    });
  }, []);

  const getSelectedObject = useCallback((): Sphere | Box | null => {
    if (!scene.selectedId || !scene.selectedType) return null;
    if (scene.selectedType === 'sphere') {
      return scene.spheres.find(s => s.id === scene.selectedId) || null;
    }
    return scene.boxes.find(b => b.id === scene.selectedId) || null;
  }, [scene]);

  const getObjectById = useCallback((id: string): Sphere | Box | null => {
    const sphere = scene.spheres.find(s => s.id === id);
    if (sphere) return sphere;
    return scene.boxes.find(b => b.id === id) || null;
  }, [scene]);

  const addSphere = useCallback(() => {
    setScene(prev => {
      if (prev.spheres.length >= MAX_SPHERES) return prev;
      const newSphere = createSphere(prev.spheres.length);
      return {
        ...prev,
        spheres: [...prev.spheres, newSphere],
        selectedId: newSphere.id,
        selectedType: 'sphere',
      };
    });
  }, []);

  const updateSphere = useCallback((id: string, updates: Partial<Sphere>) => {
    setScene(prev => ({
      ...prev,
      spheres: prev.spheres.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const removeSphere = useCallback((id: string) => {
    setScene(prev => {
      const newSpheres = prev.spheres.filter(s => s.id !== id);
      return {
        ...prev,
        spheres: newSpheres,
        selectedId: prev.selectedId === id ? null : prev.selectedId,
        selectedType: prev.selectedId === id ? null : prev.selectedType,
      };
    });
  }, []);

  const renameSphere = useCallback((id: string, name: string) => {
    setScene(prev => ({
      ...prev,
      spheres: prev.spheres.map(s => s.id === id ? { ...s, name } : s),
    }));
  }, []);

  const toggleSphereVisibility = useCallback((id: string) => {
    setScene(prev => ({
      ...prev,
      spheres: prev.spheres.map(s => s.id === id ? { ...s, visible: !s.visible } : s),
    }));
  }, []);

  const addBox = useCallback(() => {
    setScene(prev => {
      if (prev.boxes.length >= MAX_BOXES) return prev;
      const newBox = createBox(prev.boxes.length);
      return {
        ...prev,
        boxes: [...prev.boxes, newBox],
        selectedId: newBox.id,
        selectedType: 'box',
      };
    });
  }, []);

  const updateBox = useCallback((id: string, updates: Partial<Box>) => {
    setScene(prev => ({
      ...prev,
      boxes: prev.boxes.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
  }, []);

  const removeBox = useCallback((id: string) => {
    setScene(prev => {
      const newBoxes = prev.boxes.filter(b => b.id !== id);
      return {
        ...prev,
        boxes: newBoxes,
        selectedId: prev.selectedId === id ? null : prev.selectedId,
        selectedType: prev.selectedId === id ? null : prev.selectedType,
      };
    });
  }, []);

  const renameBox = useCallback((id: string, name: string) => {
    setScene(prev => ({
      ...prev,
      boxes: prev.boxes.map(b => b.id === id ? { ...b, name } : b),
    }));
  }, []);

  const toggleBoxVisibility = useCallback((id: string) => {
    setScene(prev => ({
      ...prev,
      boxes: prev.boxes.map(b => b.id === id ? { ...b, visible: !b.visible } : b),
    }));
  }, []);

  const updateCamera = useCallback((updates: Partial<Camera>) => {
    setScene(prev => ({
      ...prev,
      camera: { ...prev.camera, ...updates },
    }));
  }, []);

  const resetCamera = useCallback(() => {
    setScene(prev => ({
      ...prev,
      camera: {
        distance: 8,
        pitch: 0.4,
        yaw: 0,
        target: { x: 0, y: 0, z: 0 },
        fov: 60,
      },
    }));
  }, []);

  const focusOnObject = useCallback((id: string, type: 'sphere' | 'box') => {
    setScene(prev => {
      const obj = type === 'sphere' 
        ? prev.spheres.find(s => s.id === id)
        : prev.boxes.find(b => b.id === id);
      if (!obj) return prev;
      return {
        ...prev,
        camera: {
          ...prev.camera,
          target: { ...obj.position },
          distance: type === 'sphere' ? (obj as Sphere).radius * 5 : 4,
        },
      };
    });
  }, []);

  const resetObjectPosition = useCallback((id: string, type: 'sphere' | 'box') => {
    if (type === 'sphere') {
      setScene(prev => ({
        ...prev,
        spheres: prev.spheres.map(s => s.id === id ? { ...s, position: { x: 0, y: 0, z: 0 } } : s),
      }));
    } else {
      setScene(prev => ({
        ...prev,
        boxes: prev.boxes.map(b => b.id === id ? { ...b, position: { x: 0, y: 0, z: 0 } } : b),
      }));
    }
  }, []);

  const randomizeColor = useCallback((id: string, type: 'sphere' | 'box') => {
    const newColor: Color = {
      r: Math.random(),
      g: Math.random(),
      b: Math.random(),
    };
    if (type === 'sphere') {
      setScene(prev => ({
        ...prev,
        spheres: prev.spheres.map(s => s.id === id ? { ...s, color: newColor } : s),
      }));
    } else {
      setScene(prev => ({
        ...prev,
        boxes: prev.boxes.map(b => b.id === id ? { ...b, color: newColor } : b),
      }));
    }
  }, []);

  const bringToFront = useCallback((id: string, type: 'sphere' | 'box') => {
    if (type === 'sphere') {
      setScene(prev => {
        const idx = prev.spheres.findIndex(s => s.id === id);
        if (idx === -1 || idx === prev.spheres.length - 1) return prev;
        const newSpheres = [...prev.spheres];
        const [item] = newSpheres.splice(idx, 1);
        newSpheres.push(item);
        return { ...prev, spheres: newSpheres };
      });
    } else {
      setScene(prev => {
        const idx = prev.boxes.findIndex(b => b.id === id);
        if (idx === -1 || idx === prev.boxes.length - 1) return prev;
        const newBoxes = [...prev.boxes];
        const [item] = newBoxes.splice(idx, 1);
        newBoxes.push(item);
        return { ...prev, boxes: newBoxes };
      });
    }
  }, []);

  const sendToBack = useCallback((id: string, type: 'sphere' | 'box') => {
    if (type === 'sphere') {
      setScene(prev => {
        const idx = prev.spheres.findIndex(s => s.id === id);
        if (idx <= 0) return prev;
        const newSpheres = [...prev.spheres];
        const [item] = newSpheres.splice(idx, 1);
        newSpheres.unshift(item);
        return { ...prev, spheres: newSpheres };
      });
    } else {
      setScene(prev => {
        const idx = prev.boxes.findIndex(b => b.id === id);
        if (idx <= 0) return prev;
        const newBoxes = [...prev.boxes];
        const [item] = newBoxes.splice(idx, 1);
        newBoxes.unshift(item);
        return { ...prev, boxes: newBoxes };
      });
    }
  }, []);

  const exportScene = useCallback((): string => {
    const exportData = {
      version: '1.0',
      spheres: scene.spheres,
      boxes: scene.boxes,
      camera: scene.camera,
    };
    return JSON.stringify(exportData, null, 2);
  }, [scene]);

  const importScene = useCallback((json: string): boolean => {
    try {
      const data = JSON.parse(json);
      if (!data.spheres || !data.boxes) {
        console.error('Invalid scene format');
        return false;
      }
      setScene(prev => ({
        ...prev,
        spheres: data.spheres.slice(0, MAX_SPHERES),
        boxes: data.boxes.slice(0, MAX_BOXES),
        camera: data.camera || prev.camera,
        selectedId: null,
        selectedType: null,
      }));
      return true;
    } catch (e) {
      console.error('Failed to import scene:', e);
      return false;
    }
  }, []);

  return (
    <SceneContext.Provider value={{
      scene,
      selectObject,
      getSelectedObject,
      deleteSelected,
      duplicateSelected,
      addSphere,
      updateSphere,
      removeSphere,
      renameSphere,
      toggleSphereVisibility,
      addBox,
      updateBox,
      removeBox,
      renameBox,
      toggleBoxVisibility,
      updateCamera,
      resetCamera,
      focusOnObject,
      resetObjectPosition,
      randomizeColor,
      bringToFront,
      sendToBack,
      getObjectById,
      exportScene,
      importScene,
    }}>
      {children}
    </SceneContext.Provider>
  );
}

export function useScene() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within a SceneProvider');
  }
  return context;
}

