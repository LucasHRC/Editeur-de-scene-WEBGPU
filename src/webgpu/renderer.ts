import { Scene } from '../types/scene';
import { 
  createSceneBuffer, 
  createUniformBuffer, 
  writeSceneBuffer, 
  writeUniformBuffer,
} from './buffers';
import shaderCode from './shaders/scene.wgsl?raw';

export interface WebGPURenderer {
  device: GPUDevice;
  context: GPUCanvasContext;
  pipeline: GPURenderPipeline;
  bindGroup: GPUBindGroup;
  uniformBuffer: GPUBuffer;
  sceneBuffer: GPUBuffer;
  destroy: () => void;
}

export async function initWebGPU(canvas: HTMLCanvasElement): Promise<WebGPURenderer | null> {
  if (!navigator.gpu) {
    console.error('WebGPU not supported');
    return null;
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error('No GPU adapter found');
    return null;
  }

  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu') as GPUCanvasContext | null;
  if (!context) {
    console.error('Could not get WebGPU context');
    return null;
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format });

  // Create buffers
  const uniformBuffer = createUniformBuffer(device);
  const sceneBuffer = createSceneBuffer(device);

  // Create shader module
  const shaderModule = device.createShaderModule({ code: shaderCode });

  // Check for compilation errors
  const info = await shaderModule.getCompilationInfo();
  const errors = info.messages.filter((m: { type: string }) => m.type === 'error');
  if (errors.length > 0) {
    console.error('Shader compilation errors:', errors);
    return null;
  }

  // Create bind group layout
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
    ],
  });

  // Create pipeline
  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [{ format }],
    },
    primitive: {
      topology: 'triangle-list',
    },
  });

  // Create bind group
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: { buffer: sceneBuffer } },
    ],
  });

  return {
    device,
    context,
    pipeline,
    bindGroup,
    uniformBuffer,
    sceneBuffer,
    destroy: () => {
      uniformBuffer.destroy();
      sceneBuffer.destroy();
    },
  };
}

export function render(
  renderer: WebGPURenderer,
  scene: Scene,
  time: number,
  deltaTime: number,
  mouseX: number,
  mouseY: number,
  mouseDown: boolean,
  frame: number
) {
  const { device, context, pipeline, bindGroup, uniformBuffer, sceneBuffer } = renderer;

  // Get canvas size
  const canvas = context.canvas as HTMLCanvasElement;
  const width = canvas.width;
  const height = canvas.height;

  // Update buffers
  writeUniformBuffer(device, uniformBuffer, width, height, time, deltaTime, mouseX, mouseY, mouseDown, frame);
  writeSceneBuffer(device, sceneBuffer, scene);

  // Create command encoder
  const encoder = device.createCommandEncoder();

  // Begin render pass
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
      storeOp: 'store',
    }],
  });

  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.draw(3);
  pass.end();

  // Submit commands
  device.queue.submit([encoder.finish()]);
}
