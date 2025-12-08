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
  
  // Camera position - match shader exactly:
  // cam_pos = vec3(sin(yaw) * cos(pitch) * cam_dist, sin(pitch) * cam_dist + target_y, cos(yaw) * cos(pitch) * cam_dist)
  const camPos: [number, number, number] = [
    Math.sin(yaw) * Math.cos(pitch) * distance,
    Math.sin(pitch) * distance + target.y,
    Math.cos(yaw) * Math.cos(pitch) * distance,
  ];

  // Camera target - shader uses (0, target_y, 0)
  const camTarget: [number, number, number] = [0, target.y, 0];

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
  const { scene, updateCamera, selectObject } = useScene();
  const { fps, isReady, error, handleMouseMove, handleMouseDown, handleMouseUp } = useWebGPU(canvasRef, scene, isPaused);

  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringObject, setIsHoveringObject] = useState(false);
  const [hoveredObjectName, setHoveredObjectName] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));

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
    // Check if this was a drag or a click
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) return; // Was a drag, not a click

    const hit = raycastScene(e.clientX, e.clientY);
    selectObject(hit?.id ?? null, hit?.type ?? null);
  }, [raycastScene, selectObject]);

  // Camera orbit controls
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    handleMouseDown();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [handleMouseDown]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    handleMouseMove(e as unknown as React.MouseEvent<HTMLCanvasElement>);

    // Check hover only when not dragging (throttled via native event rate)
    if (!isDragging) {
      const hit = raycastScene(e.clientX, e.clientY);
      setIsHoveringObject(hit !== null);
      setHoveredObjectName(hit?.name ?? null);
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
  }, [isDragging, scene.camera, updateCamera, handleMouseMove, raycastScene]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    handleMouseUp();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [handleMouseUp]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const newDistance = Math.max(2, Math.min(20, scene.camera.distance + e.deltaY * zoomSpeed * scene.camera.distance));
    updateCamera({ distance: newDistance });
  }, [scene.camera.distance, updateCamera]);

  const cursorStyle = isDragging ? 'grabbing' : (isHoveringObject ? 'pointer' : 'grab');

  return (
    <div ref={containerRef} className="viewport">
      <canvas
        ref={canvasRef}
        className="viewport-canvas"
        style={{ cursor: cursorStyle }}
        onClick={handleClick}
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

      {hoveredObjectName && !isDragging && (
        <div className="viewport-overlay hover-hint">
          <div className="hover-object-name">{hoveredObjectName}</div>
        </div>
      )}
    </div>
  );
});

Viewport.displayName = 'Viewport';
