// WebGPU Scene Editor - Ray Marching Shader

const MAX_DIST: f32 = 100.0;
const SURF_DIST: f32 = 0.001;
const MAX_STEPS: i32 = 128;
const MAX_SPHERES: i32 = 8;
const MAX_BOXES: i32 = 8;

const MAT_PLANE: f32 = 0.0;
const MAT_SPHERE_BASE: f32 = 1.0;
const MAT_BOX_BASE: f32 = 100.0;
const MAT_GIZMO_X: f32 = 200.0;
const MAT_GIZMO_Y: f32 = 201.0;
const MAT_GIZMO_Z: f32 = 202.0;

const SKY_COLOR: vec3<f32> = vec3<f32>(0.529, 0.808, 0.922);

struct Uniforms {
  resolution: vec2<f32>,
  time: f32,
  deltaTime: f32,
  mouse: vec4<f32>,
  frame: f32,
  _pad1: f32,
  _pad2: f32,
  _pad3: f32,
}

struct Sphere {
  pos: vec3<f32>,
  radius: f32,
  color: vec3<f32>,
  _pad: f32,
}

struct Box {
  pos: vec3<f32>,
  _pad1: f32,
  size: vec3<f32>,
  _pad2: f32,
  color: vec3<f32>,
  _pad3: f32,
}

struct SceneData {
  spheres: array<Sphere, 8>,
  boxes: array<Box, 8>,
  // params: x=numSpheres, y=numBoxes, z=fov, w=unused
  params: vec4<f32>,
  // camera: x=pitch, y=yaw, z=distance, w=targetY
  camera: vec4<f32>,
  // selection: x=type (-1=none, 0=sphere, 1=box), y=index, z/w=unused
  selection: vec4<f32>,
  // gizmo position (for selected object)
  gizmo_pos: vec4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<uniform> scene: SceneData;

// Vertex shader
@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  var pos = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}

// Fragment shader
@fragment
fn fs_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = (fragCoord.xy - uniforms.resolution * 0.5) / min(uniforms.resolution.x, uniforms.resolution.y);

  // Camera orbital
  let pitch = scene.camera.x;
  let yaw = scene.camera.y;
  let cam_dist = scene.camera.z;
  let target_y = scene.camera.w;

  let cam_target = vec3<f32>(0.0, target_y, 0.0);
  let cam_pos = vec3<f32>(
    sin(yaw) * cos(pitch) * cam_dist,
    sin(pitch) * cam_dist + target_y,
    cos(yaw) * cos(pitch) * cam_dist
  );

  // Camera matrix
  let cam_forward = normalize(cam_target - cam_pos);
  let cam_right = normalize(cross(cam_forward, vec3<f32>(0.0, 1.0, 0.0)));
  let cam_up = cross(cam_right, cam_forward);

  // Ray direction
  let fov_rad = radians(scene.params.z);
  let focal_length = 1.0 / tan(fov_rad * 0.5);
  let rd = normalize(cam_right * uv.x - cam_up * uv.y + cam_forward * focal_length);

  // Ray march
  let result = ray_march(cam_pos, rd);

  if result.x < MAX_DIST {
    let hit_pos = cam_pos + rd * result.x;
    let normal = get_normal(hit_pos);

    // Lighting
    let light_pos = vec3<f32>(3.0, 5.0, -2.0);
    let light_dir = normalize(light_pos - hit_pos);
    let diffuse = max(dot(normal, light_dir), 0.0);

    // Shadows
    let shadow_origin = hit_pos + normal * 0.02;
    let shadow_result = ray_march(shadow_origin, light_dir);
    let shadow = select(0.3, 1.0, shadow_result.x > length(light_pos - shadow_origin));

    // Material color
    var albedo = get_material_color(result.y, hit_pos);

    // Phong shading
    let ambient = 0.15;
    let view_dir = normalize(cam_pos - hit_pos);
    let reflect_dir = reflect(-light_dir, normal);
    let spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32.0) * 0.5;

    var phong = albedo * (ambient + diffuse * shadow * 0.85) + vec3<f32>(spec * shadow);

    // Selection highlight
    let sel_type = i32(scene.selection.x);
    let sel_idx = i32(scene.selection.y);
    var is_selected = false;
    
    if sel_type == 0 && result.y >= MAT_SPHERE_BASE && result.y < MAT_BOX_BASE {
      is_selected = (i32(result.y - MAT_SPHERE_BASE) == sel_idx);
    } else if sel_type == 1 && result.y >= MAT_BOX_BASE && result.y < MAT_GIZMO_X {
      is_selected = (i32(result.y - MAT_BOX_BASE) == sel_idx);
    }

    if is_selected {
      let pulse = 0.5 + 0.5 * sin(uniforms.time * 4.0);
      let rim = pow(1.0 - max(dot(view_dir, normal), 0.0), 2.0);
      let highlight_color = vec3<f32>(1.0, 0.85, 0.2);
      phong = phong + highlight_color * rim * pulse * 0.8;
    }

    // Gizmo colors (no shading)
    if result.y >= MAT_GIZMO_X {
      return vec4<f32>(albedo, 1.0);
    }

    // Fog
    let fog = exp(-result.x * 0.015);
    phong = mix(SKY_COLOR, phong, fog);

    return vec4<f32>(gamma_correct(phong), 1.0);
  }

  // Sky
  let sky = mix(SKY_COLOR * 0.8, SKY_COLOR, uv.y * 0.5 + 0.5);
  return vec4<f32>(gamma_correct(sky), 1.0);
}

fn gamma_correct(color: vec3<f32>) -> vec3<f32> {
  return pow(color, vec3<f32>(1.0 / 2.2));
}

fn get_material_color(mat_id: f32, p: vec3<f32>) -> vec3<f32> {
  // Gizmo colors
  if mat_id == MAT_GIZMO_X { return vec3<f32>(1.0, 0.2, 0.2); }
  if mat_id == MAT_GIZMO_Y { return vec3<f32>(0.2, 1.0, 0.2); }
  if mat_id == MAT_GIZMO_Z { return vec3<f32>(0.2, 0.4, 1.0); }

  // Ground plane (checkerboard)
  if mat_id == MAT_PLANE {
    let checker = floor(p.x) + floor(p.z);
    let col1 = vec3<f32>(0.95, 0.95, 0.95);
    let col2 = vec3<f32>(0.3, 0.3, 0.3);
    return select(col2, col1, i32(checker) % 2 == 0);
  }

  // Boxes
  if mat_id >= MAT_BOX_BASE && mat_id < MAT_GIZMO_X {
    let idx = i32(mat_id - MAT_BOX_BASE);
    if idx >= 0 && idx < i32(scene.params.y) {
      return scene.boxes[idx].color;
    }
  }

  // Spheres
  if mat_id >= MAT_SPHERE_BASE && mat_id < MAT_BOX_BASE {
    let idx = i32(mat_id - MAT_SPHERE_BASE);
    if idx >= 0 && idx < i32(scene.params.x) {
      return scene.spheres[idx].color;
    }
  }

  return vec3<f32>(0.5, 0.5, 0.5);
}

// SDF Primitives
fn sd_sphere(p: vec3<f32>, r: f32) -> f32 {
  return length(p) - r;
}

fn sd_box(p: vec3<f32>, b: vec3<f32>) -> f32 {
  let q = abs(p) - b;
  return length(max(q, vec3<f32>(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
}

fn sd_plane(p: vec3<f32>, n: vec3<f32>, h: f32) -> f32 {
  return dot(p, n) + h;
}

fn sd_cylinder(p: vec3<f32>, h: f32, r: f32) -> f32 {
  let d = abs(vec2<f32>(length(p.xz), p.y)) - vec2<f32>(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, vec2<f32>(0.0)));
}

fn sd_cone(p: vec3<f32>, h: f32, r: f32) -> f32 {
  let q = vec2<f32>(length(p.xz), p.y);
  let k1 = vec2<f32>(0.0, h);
  let k2 = vec2<f32>(-r, 2.0 * h);
  let ca = vec2<f32>(q.x - min(q.x, select(r, 0.0, q.y < 0.0)), abs(q.y) - h);
  let cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0.0, 1.0);
  let s = select(1.0, -1.0, cb.x < 0.0 && ca.y < 0.0);
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}

// Scene SDF
fn get_dist(p: vec3<f32>) -> vec2<f32> {
  var res = vec2<f32>(MAX_DIST, -1.0);

  // Ground plane
  let plane_dist = sd_plane(p, vec3<f32>(0.0, 1.0, 0.0), 1.0);
  if plane_dist < res.x {
    res = vec2<f32>(plane_dist, MAT_PLANE);
  }

  // Spheres
  let num_spheres = i32(scene.params.x);
  for (var i = 0; i < num_spheres; i++) {
    let s = scene.spheres[i];
    let d = sd_sphere(p - s.pos, s.radius);
    if d < res.x {
      res = vec2<f32>(d, MAT_SPHERE_BASE + f32(i));
    }
  }

  // Boxes
  let num_boxes = i32(scene.params.y);
  for (var i = 0; i < num_boxes; i++) {
    let b = scene.boxes[i];
    let d = sd_box(p - b.pos, b.size);
    if d < res.x {
      res = vec2<f32>(d, MAT_BOX_BASE + f32(i));
    }
  }

  // Gizmo (if object selected)
  if scene.selection.x >= 0.0 {
    let gizmo_center = scene.gizmo_pos.xyz;
    let gizmo_scale = 0.8;
    let axis_len = 0.6 * gizmo_scale;
    let axis_r = 0.03 * gizmo_scale;
    let cone_h = 0.15 * gizmo_scale;
    let cone_r = 0.06 * gizmo_scale;

    // X axis (red)
    let px = p - gizmo_center;
    let dx_cyl = sd_cylinder(px.zyx - vec3<f32>(0.0, axis_len * 0.5, 0.0), axis_len * 0.5, axis_r);
    let dx_cone = sd_cone(px.zyx - vec3<f32>(0.0, axis_len, 0.0), cone_h, cone_r);
    let dx = min(dx_cyl, dx_cone);
    if dx < res.x { res = vec2<f32>(dx, MAT_GIZMO_X); }

    // Y axis (green)
    let dy_cyl = sd_cylinder(px - vec3<f32>(0.0, axis_len * 0.5, 0.0), axis_len * 0.5, axis_r);
    let dy_cone = sd_cone(px - vec3<f32>(0.0, axis_len, 0.0), cone_h, cone_r);
    let dy = min(dy_cyl, dy_cone);
    if dy < res.x { res = vec2<f32>(dy, MAT_GIZMO_Y); }

    // Z axis (blue)
    let pz = px.xzy;
    let dz_cyl = sd_cylinder(pz - vec3<f32>(0.0, axis_len * 0.5, 0.0), axis_len * 0.5, axis_r);
    let dz_cone = sd_cone(pz - vec3<f32>(0.0, axis_len, 0.0), cone_h, cone_r);
    let dz = min(dz_cyl, dz_cone);
    if dz < res.x { res = vec2<f32>(dz, MAT_GIZMO_Z); }
  }

  return res;
}

// Ray marching
fn ray_march(ro: vec3<f32>, rd: vec3<f32>) -> vec2<f32> {
  var d = 0.0;
  var mat_id = -1.0;

  for (var i = 0; i < MAX_STEPS; i++) {
    let p = ro + rd * d;
    let dist_mat = get_dist(p);
    d += dist_mat.x;
    mat_id = dist_mat.y;

    if dist_mat.x < SURF_DIST || d > MAX_DIST {
      break;
    }
  }

  return vec2<f32>(d, mat_id);
}

// Normal calculation
fn get_normal(p: vec3<f32>) -> vec3<f32> {
  let e = vec2<f32>(0.001, 0.0);
  let n = vec3<f32>(
    get_dist(p + e.xyy).x - get_dist(p - e.xyy).x,
    get_dist(p + e.yxy).x - get_dist(p - e.yxy).x,
    get_dist(p + e.yyx).x - get_dist(p - e.yyx).x
  );
  return normalize(n);
}
