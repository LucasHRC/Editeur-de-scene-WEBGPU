import { useEffect, useRef, useState, useCallback } from 'react';
import { Scene } from '../types/scene';
import { initWebGPU, render, WebGPURenderer } from '../webgpu/renderer';

interface WebGPUState {
  isSupported: boolean;
  isReady: boolean;
  error: string | null;
  fps: number;
}

export function useWebGPU(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  scene: Scene,
  isPaused: boolean = false
) {
  const [state, setState] = useState<WebGPUState>({
    isSupported: true,
    isReady: false,
    error: null,
    fps: 0,
  });

  const rendererRef = useRef<WebGPURenderer | null>(null);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(performance.now());
  const pausedTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(performance.now());
  const mouseRef = useRef({ x: 0, y: 0, down: false });

  // Initialize WebGPU
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mounted = true;

    const init = async () => {
      try {
        const renderer = await initWebGPU(canvas);
        if (!mounted) return;

        if (!renderer) {
          setState(prev => ({ ...prev, isSupported: false, error: 'WebGPU not supported' }));
          return;
        }

        rendererRef.current = renderer;
        setState(prev => ({ ...prev, isReady: true }));
      } catch (err) {
        if (!mounted) return;
        setState(prev => ({ ...prev, error: String(err) }));
      }
    };

    init();

    return () => {
      mounted = false;
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [canvasRef]);

  // Render loop
  useEffect(() => {
    if (!state.isReady || !rendererRef.current) return;

    const renderLoop = () => {
      const renderer = rendererRef.current;
      if (!renderer) return;

      const currentTime = performance.now();
      
      // When paused, freeze the time
      let time: number;
      if (isPaused) {
        time = pausedTimeRef.current;
      } else {
        time = (currentTime - startTimeRef.current) / 1000;
        pausedTimeRef.current = time;
      }
      
      const deltaTime = (currentTime - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = currentTime;

      render(
        renderer,
        scene,
        time,
        deltaTime,
        mouseRef.current.x,
        mouseRef.current.y,
        mouseRef.current.down,
        frameCountRef.current
      );

      frameCountRef.current++;

      // Update FPS counter
      if (currentTime - lastFpsUpdateRef.current > 500) {
        const fps = Math.round(frameCountRef.current / ((currentTime - lastFpsUpdateRef.current) / 1000));
        setState(prev => ({ ...prev, fps }));
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = currentTime;
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isReady, scene, isPaused]);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    mouseRef.current.x = (e.clientX - rect.left) * dpr;
    mouseRef.current.y = (e.clientY - rect.top) * dpr;
  }, [canvasRef]);

  const handleMouseDown = useCallback(() => {
    mouseRef.current.down = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    mouseRef.current.down = false;
  }, []);

  return {
    ...state,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
  };
}
