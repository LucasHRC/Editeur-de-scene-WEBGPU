import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { useScene } from '../hooks/useScene';
import { useWebGPU } from '../hooks/useWebGPU';
import { Sphere, Box } from '../types/scene';
import './Viewport.css';

// Hitbox margin to make selection easier (adds to radius/size)
const HITBOX_MARGIN = 0.15;

// Simple raycast functions for click-to-select
function raySphereIntersect(
  rayOrigin: [number, number, number],
  rayDir: [number, number, number],
  sphere: Sphere
): number | null {
  const oc: [number, number, number] = [
    rayOrigin[0] - sphere.position.x,
    rayOrigin[1] - sphere.position.y,
    rayOrigin[2] - sphere.position.z,
  ];
  // Expand hitbox with margin for easier selection
  const effectiveRadius = sphere.radius + HITBOX_MARGIN;
  const a = rayDir[0] * rayDir[0] + rayDir[1] * rayDir[1] + rayDir[2] * rayDir[2];
  const b = 2 * (oc[0] * rayDir[0] + oc[1] * rayDir[1] + oc[2] * rayDir[2]);
  const c = oc[0] * oc[0] + oc[1] * oc[1] + oc[2] * oc[2] - effectiveRadius * effectiveRadius;
  const discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t > 0 ? t : null;
}

function rayBoxIntersect(
  rayOrigin: [number, number, number],
  rayDir: [number, number, number],
  box: Box
): number | null {
  // Expand hitbox with margin for easier selection
  const margin = HITBOX_MARGIN;
  const minB: [number, number, number] = [
    box.position.x - box.size.x - margin,
    box.position.y - box.size.y - margin,
    box.position.z - box.size.z - margin,
  ];
  const maxB: [number, number, number] = [
    box.position.x + box.size.x + margin,
    box.position.y + box.size.y + margin,
    box.position.z + box.size.z + margin,
  ];

  let tmin = -Infinity;
  let tmax = Infinity;

  for (let i = 0; i < 3; i++) {
    if (Math.abs(rayDir[i]) < 1e-8) {
      // Ray is parallel to slab. No hit if origin not within slab
      if (rayOrigin[i] < minB[i] || rayOrigin[i] > maxB[i]) {
        return null;
      }
    } else {
      const invD = 1.0 / rayDir[i];
      let t0 = (minB[i] - rayOrigin[i]) * invD;
      let t1 = (maxB[i] - rayOrigin[i]) * invD;
      if (t0 > t1) {
        const temp = t0;
        t0 = t1;
        t1 = temp;
      }
      tmin = Math.max(tmin, t0);
      tmax = Math.min(tmax, t1);
      if (tmin > tmax) {
        return null;
      }
    }
  }

  if (tmax < 0) return null;
  return tmin > 0 ? tmin : tmax;
}

type Vec3 = [number, number, number];

const GIZMO_SCALE = 1.0;
const GIZMO_AXIS_LEN = 0.8 * GIZMO_SCALE;
const GIZMO_AXIS_R = 0.05 * GIZMO_SCALE;
const GIZMO_CONE_H = 0.2 * GIZMO_SCALE;
const GIZMO_CONE_R = 0.08 * GIZMO_SCALE;
const GIZMO_HIT_MARGIN = 0.1;

function dot(a: Vec3, b: Vec3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function length(a: Vec3) {
  return Math.sqrt(dot(a, a));
}

function normalize(a: Vec3): Vec3 {
  const len = length(a);
  if (len < 1e-6) return [0, 0, 0];
  return [a[0] / len, a[1] / len, a[2] / len];
}

function rayAabbIntersect(rayOrigin: Vec3, rayDir: Vec3, minB: Vec3, maxB: Vec3): number | null {
  let tmin = -Infinity;
  let tmax = Infinity;

  for (let i = 0; i < 3; i++) {
    if (Math.abs(rayDir[i]) < 1e-8) {
      if (rayOrigin[i] < minB[i] || rayOrigin[i] > maxB[i]) {
        return null;
      }
    } else {
      const invD = 1.0 / rayDir[i];
      let t0 = (minB[i] - rayOrigin[i]) * invD;
      let t1 = (maxB[i] - rayOrigin[i]) * invD;
      if (t0 > t1) {
        const tmp = t0;
        t0 = t1;
        t1 = tmp;
      }
      tmin = Math.max(tmin, t0);
      tmax = Math.min(tmax, t1);
      if (tmin > tmax) return null;
    }
  }

  if (tmax < 0) return null;
  return tmin > 0 ? tmin : tmax;
}

function raycastGizmoAxis(
  rayOrigin: Vec3,
  rayDir: Vec3,
  gizmoPos: Vec3,
  axis: 'x' | 'y' | 'z'
): number | null {
  const len = GIZMO_AXIS_LEN + GIZMO_CONE_H + GIZMO_HIT_MARGIN;
  const r = Math.max(GIZMO_AXIS_R, GIZMO_CONE_R) + GIZMO_HIT_MARGIN;

  if (axis === 'x') {
    const minB: Vec3 = add(gizmoPos, [0, -r, -r]);
    const maxB: Vec3 = add(gizmoPos, [len, r, r]);
    return rayAabbIntersect(rayOrigin, rayDir, minB, maxB);
  }
  if (axis === 'y') {
    const minB: Vec3 = add(gizmoPos, [-r, 0, -r]);
    const maxB: Vec3 = add(gizmoPos, [r, len, r]);
    return rayAabbIntersect(rayOrigin, rayDir, minB, maxB);
  }

  const minB: Vec3 = add(gizmoPos, [-r, -r, 0]);
  const maxB: Vec3 = add(gizmoPos, [r, r, len]);
  return rayAabbIntersect(rayOrigin, rayDir, minB, maxB);
}

function raycastGizmo(
  rayOrigin: Vec3,
  rayDir: Vec3,
  gizmoPos: Vec3
): { axis: 'x' | 'y' | 'z'; t: number } | null {
  const hits: Array<{ axis: 'x' | 'y' | 'z'; t: number }> = [];
  const tx = raycastGizmoAxis(rayOrigin, rayDir, gizmoPos, 'x');
  if (tx !== null) hits.push({ axis: 'x', t: tx });
  const ty = raycastGizmoAxis(rayOrigin, rayDir, gizmoPos, 'y');
  if (ty !== null) hits.push({ axis: 'y', t: ty });
  const tz = raycastGizmoAxis(rayOrigin, rayDir, gizmoPos, 'z');
  if (tz !== null) hits.push({ axis: 'z', t: tz });

  if (hits.length === 0) return null;
  hits.sort((a, b) => a.t - b.t);
  return hits[0];
}

function getCameraBasis(camera: {
  pitch: number;
  yaw: number;
  distance: number;
  target: { x: number; y: number; z: number };
}) {
  const { pitch, yaw, distance, target } = camera;
  // Position caméra relative au target complet (x, y, z)
  const camPos: Vec3 = [
    Math.sin(yaw) * Math.cos(pitch) * distance + target.x,
    Math.sin(pitch) * distance + target.y,
    Math.cos(yaw) * Math.cos(pitch) * distance + target.z,
  ];
  const camTarget: Vec3 = [target.x, target.y, target.z];
  const forward = normalize(sub(camTarget, camPos));
  const worldUp: Vec3 = [0, 1, 0];
  const right = normalize([
    forward[1] * worldUp[2] - forward[2] * worldUp[1],
    forward[2] * worldUp[0] - forward[0] * worldUp[2],
    forward[0] * worldUp[1] - forward[1] * worldUp[0],
  ]);
  const up = normalize([
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ]);
  return { camPos, forward, right, up };
}

function projectMouseToAxis(
  mouseDelta: [number, number],
  axis: 'x' | 'y' | 'z',
  camera: { pitch: number; yaw: number; distance: number; target: { x: number; y: number; z: number } }
): number {
  const { right, up } = getCameraBasis(camera);
  const sensitivity = Math.max(0.002 * camera.distance, 0.001);
  const worldDelta = add(scale(right, mouseDelta[0] * sensitivity), scale(up, -mouseDelta[1] * sensitivity));
  const axisVec: Vec3 =
    axis === 'x' ? [1, 0, 0] :
    axis === 'y' ? [0, 1, 0] :
    [0, 0, 1];
  return dot(worldDelta, axisVec);
}
export interface ViewportHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

interface ViewportProps {
  isPaused?: boolean;
}

// Helper to compute ray from screen position - MATCHED TO SHADER
function computeRay(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  camera: { pitch: number; yaw: number; distance: number; target: { x: number; y: number; z: number }; fov: number }
): { origin: [number, number, number]; dir: [number, number, number] } | null {
  const rect = canvas.getBoundingClientRect();
  
  // Match shader's UV calculation exactly:
  // let uv = (fragCoord.xy - uniforms.resolution * 0.5) / min(uniforms.resolution.x, uniforms.resolution.y);
  const pixelX = (clientX - rect.left) * window.devicePixelRatio;
  const pixelY = (clientY - rect.top) * window.devicePixelRatio;
  const resX = rect.width * window.devicePixelRatio;
  const resY = rect.height * window.devicePixelRatio;
  const minRes = Math.min(resX, resY);
  
  const uvX = (pixelX - resX * 0.5) / minRes;
  const uvY = (pixelY - resY * 0.5) / minRes;

  const { pitch, yaw, distance, target, fov } = camera;
  
  // Camera position relative au target complet (x, y, z)
  const camPos: [number, number, number] = [
    Math.sin(yaw) * Math.cos(pitch) * distance + target.x,
    Math.sin(pitch) * distance + target.y,
    Math.cos(yaw) * Math.cos(pitch) * distance + target.z,
  ];

  // Camera target complet
  const camTarget: [number, number, number] = [target.x, target.y, target.z];

  // Camera forward direction (pointing at target)
  const forward: [number, number, number] = [
    camTarget[0] - camPos[0],
    camTarget[1] - camPos[1],
    camTarget[2] - camPos[2],
  ];
  const lenF = Math.sqrt(forward[0] ** 2 + forward[1] ** 2 + forward[2] ** 2);
  forward[0] /= lenF; forward[1] /= lenF; forward[2] /= lenF;

  // World up vector
  const worldUp: [number, number, number] = [0, 1, 0];
  
  // Camera right vector: cross(forward, worldUp)
  const right: [number, number, number] = [
    forward[1] * worldUp[2] - forward[2] * worldUp[1],
    forward[2] * worldUp[0] - forward[0] * worldUp[2],
    forward[0] * worldUp[1] - forward[1] * worldUp[0],
  ];
  const lenR = Math.sqrt(right[0] ** 2 + right[1] ** 2 + right[2] ** 2);
  if (lenR > 0.0001) {
    right[0] /= lenR; right[1] /= lenR; right[2] /= lenR;
  }

  // Camera up vector: cross(right, forward)
  const camUp: [number, number, number] = [
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ];

  // Focal length - match shader: 1.0 / tan(fov_rad * 0.5)
  const fovRad = (fov * Math.PI) / 180;
  const focalLength = 1.0 / Math.tan(fovRad * 0.5);

  // Ray direction - match shader exactly:
  // rd = normalize(cam_right * uv.x - cam_up * uv.y + cam_forward * focal_length)
  const rayDir: [number, number, number] = [
    right[0] * uvX - camUp[0] * uvY + forward[0] * focalLength,
    right[1] * uvX - camUp[1] * uvY + forward[1] * focalLength,
    right[2] * uvX - camUp[2] * uvY + forward[2] * focalLength,
  ];
  const lenD = Math.sqrt(rayDir[0] ** 2 + rayDir[1] ** 2 + rayDir[2] ** 2);
  rayDir[0] /= lenD; rayDir[1] /= lenD; rayDir[2] /= lenD;

  return { origin: camPos, dir: rayDir };
}

export const Viewport = forwardRef<ViewportHandle, ViewportProps>(({ isPaused }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scene, updateCamera, selectObject, updateSphere, updateBox, resetObjectPosition, focusOnObject } = useScene();
  const { fps, isReady, error, handleMouseMove, handleMouseDown, handleMouseUp } = useWebGPU(canvasRef, scene, isPaused);

  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringObject, setIsHoveringObject] = useState(false);
  const [hoveredObjectName, setHoveredObjectName] = useState<string | null>(null);
  const [hoveredGizmoAxis, setHoveredGizmoAxis] = useState<'x' | 'y' | 'z' | null>(null);
  const [gizmoDragAxis, setGizmoDragAxis] = useState<'x' | 'y' | 'z' | null>(null);
  const [gizmoDragStart, setGizmoDragStart] = useState<{
    mouse: [number, number];
    objectPos: Vec3;
    objId: string;
    objType: 'sphere' | 'box';
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; objId: string; objType: 'sphere' | 'box' } | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));

  const getSelectedObject = useCallback((): { id: string; type: 'sphere' | 'box'; position: Vec3 } | null => {
    if (!scene.selectedId || !scene.selectedType) return null;
    if (scene.selectedType === 'sphere') {
      const s = scene.spheres.find(sp => sp.id === scene.selectedId);
      if (!s) return null;
      return { id: s.id, type: 'sphere', position: [s.position.x, s.position.y, s.position.z] };
    }
    const b = scene.boxes.find(bx => bx.id === scene.selectedId);
    if (!b) return null;
    return { id: b.id, type: 'box', position: [b.position.x, b.position.y, b.position.z] };
  }, [scene]);

  // Resize canvas to fit container
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resize();
    window.addEventListener('resize', resize);
    
    const observer = new ResizeObserver(resize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
    };
  }, []);

  // Raycast helper to find object under cursor
  const raycastScene = useCallback((clientX: number, clientY: number): { id: string; type: 'sphere' | 'box'; name: string } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ray = computeRay(clientX, clientY, canvas, scene.camera);
    if (!ray) return null;

    let closestT = Infinity;
    let closestObj: { id: string; type: 'sphere' | 'box'; name: string } | null = null;

    for (const sphere of scene.spheres) {
      if (!sphere.visible) continue;
      const t = raySphereIntersect(ray.origin, ray.dir, sphere);
      if (t !== null && t < closestT) {
        closestT = t;
        closestObj = { id: sphere.id, type: 'sphere', name: sphere.name };
      }
    }

    for (const box of scene.boxes) {
      if (!box.visible) continue;
      const t = rayBoxIntersect(ray.origin, ray.dir, box);
      if (t !== null && t < closestT) {
        closestT = t;
        closestObj = { id: box.id, type: 'box', name: box.name };
      }
    }

    return closestObj;
  }, [scene]);

  // Click to select object
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (gizmoDragAxis) return;
    // Check if this was a drag or a click
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) return; // Was a drag, not a click

    const hit = raycastScene(e.clientX, e.clientY);
    selectObject(hit?.id ?? null, hit?.type ?? null);
  }, [raycastScene, selectObject]);

  // Camera orbit controls
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setContextMenu(null);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    const canvas = canvasRef.current;
    const selected = getSelectedObject();
    if (canvas && selected) {
      const ray = computeRay(e.clientX, e.clientY, canvas, scene.camera);
      if (ray) {
        const gizmoHit = raycastGizmo(ray.origin as Vec3, ray.dir as Vec3, selected.position);
        if (gizmoHit) {
          setGizmoDragAxis(gizmoHit.axis);
          setGizmoDragStart({
            mouse: [e.clientX, e.clientY],
            objectPos: selected.position,
            objId: selected.id,
            objType: selected.type,
          });
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          return;
        }
      }
    }

    setIsDragging(true);
    setHoveredGizmoAxis(null);
    handleMouseDown();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [getSelectedObject, handleMouseDown, scene.camera]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Drag gizmo: priorité absolue
    if (gizmoDragAxis && gizmoDragStart) {
      const delta: [number, number] = [
        e.clientX - gizmoDragStart.mouse[0],
        e.clientY - gizmoDragStart.mouse[1],
      ];
      // Mode précision avec Shift (sensibilité réduite x0.25)
      const precision = e.shiftKey ? 0.25 : 1;
      const move = projectMouseToAxis(delta, gizmoDragAxis, scene.camera) * precision;
      const axisVec: Vec3 =
        gizmoDragAxis === 'x' ? [1, 0, 0] :
        gizmoDragAxis === 'y' ? [0, 1, 0] :
        [0, 0, 1];
      const newPos = add(gizmoDragStart.objectPos, scale(axisVec, move));

      if (gizmoDragStart.objType === 'sphere') {
        updateSphere(gizmoDragStart.objId, { position: { x: newPos[0], y: newPos[1], z: newPos[2] } });
      } else {
        updateBox(gizmoDragStart.objId, { position: { x: newPos[0], y: newPos[1], z: newPos[2] } });
      }
      setHoveredGizmoAxis(gizmoDragAxis);
      return;
    }

    handleMouseMove(e as unknown as React.MouseEvent<HTMLCanvasElement>);

    // Hover gizmo + objets seulement si pas de drag caméra
    if (!isDragging) {
      const canvas = canvasRef.current;
      const selected = getSelectedObject();
      if (canvas && selected) {
        const ray = computeRay(e.clientX, e.clientY, canvas, scene.camera);
        if (ray) {
          const gizmoHit = raycastGizmo(ray.origin as Vec3, ray.dir as Vec3, selected.position);
          setHoveredGizmoAxis(gizmoHit?.axis ?? null);
          if (gizmoHit) {
            setIsHoveringObject(false);
            setHoveredObjectName(null);
            return;
          }
        }
      }

      const hit = raycastScene(e.clientX, e.clientY);
      setIsHoveringObject(hit !== null);
      setHoveredObjectName(hit?.name ?? null);
      setHoveredGizmoAxis(null);
      return;
    }

    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.005;
    updateCamera({
      yaw: scene.camera.yaw - dx * sensitivity,
      pitch: Math.max(0.1, Math.min(1.5, scene.camera.pitch + dy * sensitivity)),
    });
  }, [gizmoDragAxis, gizmoDragStart, getSelectedObject, handleMouseMove, isDragging, raycastScene, scene.camera, updateBox, updateCamera, updateSphere]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    setGizmoDragAxis(null);
    setGizmoDragStart(null);
    setHoveredGizmoAxis(null);
    handleMouseUp();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [handleMouseUp]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const hit = raycastScene(e.clientX, e.clientY);
    if (!hit) {
      setContextMenu(null);
      return;
    }
    selectObject(hit.id, hit.type);
    // Positionner le menu près du clic avec offset 8px et clamp dans le viewport
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    if (!rect) return;
    
    const menuWidth = 180;
    const menuHeight = 120;
    const offset = 8;
    
    let menuX = e.clientX - rect.left + offset;
    let menuY = e.clientY - rect.top + offset;
    
    // Clamp pour rester dans le viewport
    if (menuX + menuWidth > rect.width) {
      menuX = e.clientX - rect.left - menuWidth - offset;
    }
    if (menuY + menuHeight > rect.height) {
      menuY = e.clientY - rect.top - menuHeight - offset;
    }
    menuX = Math.max(8, menuX);
    menuY = Math.max(8, menuY);
    
    setContextMenu({ x: menuX, y: menuY, objId: hit.id, objType: hit.type });
  }, [raycastScene, selectObject]);

  // Fermer le menu contextuel sur Escape ou clic hors menu
  useEffect(() => {
    if (!contextMenu) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.viewport-context-menu')) {
        setContextMenu(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    // Distance minimum 2.5 pour éviter de traverser l'objet
    const newDistance = Math.max(2.5, Math.min(20, scene.camera.distance + e.deltaY * zoomSpeed * scene.camera.distance));
    updateCamera({ distance: newDistance });
  }, [scene.camera.distance, updateCamera]);

  let cursorStyle = 'grab';
  const axisForCursor = gizmoDragAxis || hoveredGizmoAxis;
  if (axisForCursor === 'x') cursorStyle = 'ew-resize';
  else if (axisForCursor === 'y') cursorStyle = 'ns-resize';
  else if (axisForCursor === 'z') cursorStyle = 'nesw-resize';
  else if (isDragging) cursorStyle = 'grabbing';
  else if (isHoveringObject) cursorStyle = 'pointer';

  return (
    <div ref={containerRef} className="viewport">
      <canvas
        ref={canvasRef}
        className="viewport-canvas"
        style={{ cursor: cursorStyle }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      />
      
      <div className="viewport-overlay top-left">
        <div className="fps-counter">FPS: {fps}</div>
        {isPaused && <div className="paused-indicator">PAUSED</div>}
      </div>

      {!isReady && !error && (
        <div className="viewport-loading">
          <div className="loading-spinner" />
          <span>Initializing WebGPU...</span>
        </div>
      )}

      {error && (
        <div className="viewport-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="viewport-overlay bottom-left">
        <div className="scene-info">
          {scene.spheres.length} spheres, {scene.boxes.length} boxes
        </div>
      </div>

      <div className="viewport-overlay bottom-right">
        <div className="controls-hint">
          Click to select • Drag to rotate • Scroll to zoom
        </div>
      </div>

      {hoveredGizmoAxis && (
        <div className={`viewport-overlay gizmo-hint gizmo-${hoveredGizmoAxis}`}>
          Déplacer sur l’axe {hoveredGizmoAxis.toUpperCase()}
        </div>
      )}

      {contextMenu && (
        <div className="viewport-context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button
            onClick={() => {
              resetObjectPosition(contextMenu.objId, contextMenu.objType);
              setContextMenu(null);
            }}
          >
            Remettre à l'origine
          </button>
          <button
            onClick={() => {
              focusOnObject(contextMenu.objId, contextMenu.objType);
              setContextMenu(null);
            }}
          >
            Focus caméra
          </button>
          <button
            onClick={() => {
              selectObject(null, null);
              setContextMenu(null);
            }}
          >
            Désélectionner
          </button>
        </div>
      )}

      {hoveredObjectName && !isDragging && (
        <div className="viewport-overlay hover-hint">
          <div className="hover-object-name">{hoveredObjectName}</div>
        </div>
      )}
    </div>
  );
});

Viewport.displayName = 'Viewport';
