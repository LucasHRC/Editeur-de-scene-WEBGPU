export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface Sphere {
  id: string;
  name: string;
  position: Vec3;
  radius: number;
  color: Color;
  visible: boolean;
}

export interface Box {
  id: string;
  name: string;
  position: Vec3;
  size: Vec3;
  color: Color;
  visible: boolean;
}

export interface Camera {
  distance: number;
  pitch: number;
  yaw: number;
  target: Vec3;
  fov: number;
}

export interface Scene {
  spheres: Sphere[];
  boxes: Box[];
  camera: Camera;
  selectedId: string | null;
  selectedType: 'sphere' | 'box' | null;
}

export type SceneObject = Sphere | Box;

export const MAX_SPHERES = 8;
export const MAX_BOXES = 8;

// Helper functions
export function createSphere(index: number): Sphere {
  const colors: Color[] = [
    { r: 0.984, g: 0.286, b: 0.204 },
    { r: 0.722, g: 0.733, b: 0.149 },
    { r: 0.514, g: 0.647, b: 0.596 },
    { r: 0.996, g: 0.498, b: 0.098 },
    { r: 0.827, g: 0.525, b: 0.608 },
    { r: 0.556, g: 0.752, b: 0.486 },
    { r: 0.458, g: 0.439, b: 0.702 },
    { r: 0.922, g: 0.859, b: 0.698 },
  ];
  return {
    id: `sphere-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `Sphere ${index + 1}`,
    position: { x: (Math.random() - 0.5) * 4, y: 0.5 + Math.random(), z: (Math.random() - 0.5) * 4 },
    radius: 0.4 + Math.random() * 0.4,
    color: colors[index % colors.length],
    visible: true,
  };
}

export function createBox(index: number): Box {
  const colors: Color[] = [
    { r: 0.514, g: 0.647, b: 0.596 },
    { r: 0.996, g: 0.498, b: 0.098 },
    { r: 0.722, g: 0.733, b: 0.149 },
    { r: 0.984, g: 0.286, b: 0.204 },
    { r: 0.556, g: 0.752, b: 0.486 },
    { r: 0.827, g: 0.525, b: 0.608 },
    { r: 0.458, g: 0.439, b: 0.702 },
    { r: 0.922, g: 0.859, b: 0.698 },
  ];
  const size = 0.3 + Math.random() * 0.4;
  return {
    id: `box-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `Box ${index + 1}`,
    position: { x: (Math.random() - 0.5) * 4, y: 0.5 + Math.random(), z: (Math.random() - 0.5) * 4 },
    size: { x: size, y: size, z: size },
    color: colors[index % colors.length],
    visible: true,
  };
}

export function createDefaultScene(): Scene {
  return {
    spheres: [
      {
        id: 'sphere-default-1',
        name: 'Sphere 1',
        position: { x: 0, y: 0.5, z: 0 },
        radius: 0.8,
        color: { r: 0.984, g: 0.286, b: 0.204 },
        visible: true,
      },
    ],
    boxes: [
      {
        id: 'box-default-1',
        name: 'Box 1',
        position: { x: 2, y: 0.5, z: 0 },
        size: { x: 0.5, y: 0.5, z: 0.5 },
        color: { r: 0.514, g: 0.647, b: 0.596 },
        visible: true,
      },
    ],
    camera: {
      distance: 8,
      pitch: 0.4,
      yaw: 0,
      target: { x: 0, y: 0, z: 0 },
      fov: 60,
    },
    selectedId: null,
    selectedType: null,
  };
}
