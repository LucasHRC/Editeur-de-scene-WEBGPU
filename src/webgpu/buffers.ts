import { Scene, MAX_SPHERES, MAX_BOXES } from '../types/scene';

// Buffer sizes (aligned to 16 bytes)
// Sphere: 32 bytes (pos.xyz + radius + color.rgb + pad)
// Box: 48 bytes (pos.xyz + pad + size.xyz + pad + color.rgb + pad)
// params: 16 bytes (numSpheres, numBoxes, fov, pad)
// camera: 16 bytes (pitch, yaw, distance, pad)
// camera_target: 16 bytes (x, y, z, pad)
// selection: 16 bytes (type, index, pad, pad)
// gizmo_pos: 16 bytes (x, y, z, pad)
// Total: 8*32 + 8*48 + 16 + 16 + 16 + 16 + 16 = 256 + 384 + 80 = 720 bytes

export const SCENE_BUFFER_SIZE = 720;
export const UNIFORM_BUFFER_SIZE = 48; // resolution, time, deltaTime, mouse, frame, padding

export function createSceneBuffer(device: GPUDevice): GPUBuffer {
  return device.createBuffer({
    size: SCENE_BUFFER_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
}

export function createUniformBuffer(device: GPUDevice): GPUBuffer {
  return device.createBuffer({
    size: UNIFORM_BUFFER_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
}

export function writeSceneBuffer(device: GPUDevice, buffer: GPUBuffer, scene: Scene) {
  const data = new Float32Array(SCENE_BUFFER_SIZE / 4);
  let offset = 0;

  // Write spheres (8 max, each 32 bytes = 8 floats)
  for (let i = 0; i < MAX_SPHERES; i++) {
    const s = scene.spheres[i];
    if (s && s.visible) {
      data[offset++] = s.position.x;
      data[offset++] = s.position.y;
      data[offset++] = s.position.z;
      data[offset++] = s.radius;
      data[offset++] = s.color.r;
      data[offset++] = s.color.g;
      data[offset++] = s.color.b;
      data[offset++] = 0; // padding
    } else {
      data[offset++] = 0;
      data[offset++] = -100; // hide below ground
      data[offset++] = 0;
      data[offset++] = 0;
      data[offset++] = 0;
      data[offset++] = 0;
      data[offset++] = 0;
      data[offset++] = 0;
    }
  }

  // Write boxes (8 max, each 48 bytes = 12 floats)
  for (let i = 0; i < MAX_BOXES; i++) {
    const b = scene.boxes[i];
    if (b && b.visible) {
      data[offset++] = b.position.x;
      data[offset++] = b.position.y;
      data[offset++] = b.position.z;
      data[offset++] = 0; // pad1
      data[offset++] = b.size.x;
      data[offset++] = b.size.y;
      data[offset++] = b.size.z;
      data[offset++] = 0; // pad2
      data[offset++] = b.color.r;
      data[offset++] = b.color.g;
      data[offset++] = b.color.b;
      data[offset++] = 0; // pad3
    } else {
      for (let j = 0; j < 12; j++) {
        data[offset++] = j === 1 ? -100 : 0;
      }
    }
  }

  // Write params: numSpheres, numBoxes, fov, pad
  const visibleSpheres = scene.spheres.filter(s => s.visible).length;
  const visibleBoxes = scene.boxes.filter(b => b.visible).length;
  data[offset++] = visibleSpheres;
  data[offset++] = visibleBoxes;
  data[offset++] = scene.camera.fov;
  data[offset++] = 0;

  // Write camera: pitch, yaw, distance, pad
  data[offset++] = scene.camera.pitch;
  data[offset++] = scene.camera.yaw;
  data[offset++] = scene.camera.distance;
  data[offset++] = 0; // pad

  // Write camera_target: x, y, z, pad
  data[offset++] = scene.camera.target.x;
  data[offset++] = scene.camera.target.y;
  data[offset++] = scene.camera.target.z;
  data[offset++] = 0; // pad

  // Write selection: type, index, pad, pad
  let selType = -1;
  let selIndex = -1;
  if (scene.selectedId && scene.selectedType) {
    selType = scene.selectedType === 'sphere' ? 0 : 1;
    if (scene.selectedType === 'sphere') {
      selIndex = scene.spheres.findIndex(s => s.id === scene.selectedId);
    } else {
      selIndex = scene.boxes.findIndex(b => b.id === scene.selectedId);
    }
  }
  data[offset++] = selType;
  data[offset++] = selIndex;
  data[offset++] = 0;
  data[offset++] = 0;

  // Write gizmo_pos (selected object position)
  let gizmoX = 0, gizmoY = 0, gizmoZ = 0;
  if (selType === 0 && selIndex >= 0) {
    const s = scene.spheres[selIndex];
    gizmoX = s.position.x;
    gizmoY = s.position.y;
    gizmoZ = s.position.z;
  } else if (selType === 1 && selIndex >= 0) {
    const b = scene.boxes[selIndex];
    gizmoX = b.position.x;
    gizmoY = b.position.y;
    gizmoZ = b.position.z;
  }
  data[offset++] = gizmoX;
  data[offset++] = gizmoY;
  data[offset++] = gizmoZ;
  data[offset++] = 0;

  device.queue.writeBuffer(buffer, 0, data);
}

export function writeUniformBuffer(
  device: GPUDevice,
  buffer: GPUBuffer,
  width: number,
  height: number,
  time: number,
  deltaTime: number,
  mouseX: number,
  mouseY: number,
  mouseDown: boolean,
  frame: number
) {
  const data = new Float32Array([
    width, height,           // resolution
    time, deltaTime,         // time, deltaTime
    mouseX, mouseY,          // mouse position
    mouseDown ? 1 : 0, 0,    // mouse state, pad
    frame, 0, 0, 0,          // frame, padding
  ]);
  device.queue.writeBuffer(buffer, 0, data);
}
