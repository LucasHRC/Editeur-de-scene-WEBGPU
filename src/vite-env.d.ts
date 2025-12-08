/// <reference types="vite/client" />

declare module '*.wgsl?raw' {
  const content: string;
  export default content;
}

// WebGPU types
interface GPUQueue {
  writeBuffer(buffer: GPUBuffer, bufferOffset: number, data: ArrayBufferView): void;
  submit(commandBuffers: GPUCommandBuffer[]): void;
}

interface GPUDevice extends EventTarget {
  createBuffer(descriptor: { size: number; usage: number }): GPUBuffer;
  createShaderModule(descriptor: { code: string }): GPUShaderModule;
  createBindGroupLayout(descriptor: { entries: any[] }): GPUBindGroupLayout;
  createRenderPipeline(descriptor: any): GPURenderPipeline;
  createPipelineLayout(descriptor: { bindGroupLayouts: any[] }): GPUPipelineLayout;
  createBindGroup(descriptor: { layout: any; entries: any[] }): GPUBindGroup;
  createCommandEncoder(): GPUCommandEncoder;
  queue: GPUQueue;
}

interface GPUBuffer {
  destroy(): void;
}

interface GPUCanvasContext {
  configure(options: { device: GPUDevice; format: GPUTextureFormat }): void;
  getCurrentTexture(): GPUTexture;
  canvas: HTMLCanvasElement | OffscreenCanvas;
}

interface GPURenderPipeline {}
interface GPUBindGroup {}
interface GPUBindGroupLayout {}
interface GPUPipelineLayout {}
interface GPUShaderModule {
  getCompilationInfo(): Promise<{ messages: Array<{ type: string; message: string }> }>;
}
interface GPUCommandEncoder {
  beginRenderPass(descriptor: any): GPURenderPassEncoder;
  finish(): GPUCommandBuffer;
}
interface GPURenderPassEncoder {
  setPipeline(pipeline: GPURenderPipeline): void;
  setBindGroup(index: number, bindGroup: GPUBindGroup): void;
  draw(vertexCount: number): void;
  end(): void;
}
interface GPUCommandBuffer {}
interface GPUTexture {
  createView(): GPUTextureView;
}
interface GPUTextureView {}
type GPUTextureFormat = string;
type GPUBufferUsage = number;
type GPUShaderStage = number;

declare namespace GPUBufferUsage {
  const UNIFORM: number;
  const COPY_DST: number;
}

declare namespace GPUShaderStage {
  const VERTEX: number;
  const FRAGMENT: number;
}

interface Navigator {
  gpu?: {
    requestAdapter(): Promise<GPUAdapter | null>;
    getPreferredCanvasFormat(): GPUTextureFormat;
  };
}

interface GPUAdapter {
  requestDevice(): Promise<GPUDevice>;
}

