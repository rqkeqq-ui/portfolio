// One shared WebGL context paints the animated backgrounds of every project card. Each frame it renders the
// visible cards at a low resolution (the effects are soft, so the browser's upscaling is invisible) and copies
// the result into each card's own 2D canvas. Hidden cards and background tabs cost nothing.
const VERTEX = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';

const HEADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res;
uniform float u_time;
uniform float u_seed;
uniform float u_energy;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.03 + 11.7; a *= 0.5; }
  return v;
}
vec3 effect(vec2 uv, float aspect, float t);
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  float t = u_time + u_seed * 7.0;
  vec3 col = effect(uv, aspect, t);
  col *= 1.0 + 0.1 * u_energy;
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, 1.18);
  vec2 v = uv - 0.5;
  col *= 1.0 - 0.22 * dot(v, v) * 2.0;
  col += (hash(gl_FragCoord.xy + fract(u_time) * 91.0) - 0.5) * 0.035;
  gl_FragColor = vec4(col, 1.0);
}
`;

// Every effect mixes the same three palette colours, so any project can use any look.
export const EFFECTS = {
  silk: `vec3 effect(vec2 uv, float aspect, float t) {
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * 2.4;
    float s = t * 0.3;
    for (int i = 1; i < 6; i++) {
      float fi = float(i);
      p.x += 0.42 / fi * sin(fi * 1.6 * p.y + s * 1.3 + u_seed);
      p.y += 0.34 / fi * cos(fi * 1.25 * p.x - s + u_seed * 2.0);
    }
    float v = 0.5 + 0.5 * sin(p.x + p.y);
    float w = 0.5 + 0.5 * cos(p.x * 1.3 - p.y * 0.7 + s);
    vec3 col = mix(mix(u_c1, u_c2, v), u_c3, w * w * 0.75);
    return col + pow(v, 8.0) * 0.18;
  }`,
  lava: `vec3 effect(vec2 uv, float aspect, float t) {
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    float s = t * 0.34, field = 0.0;
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      vec2 c = vec2(sin(s * (0.5 + fi * 0.13) + fi * 1.9) * 0.42 * aspect, cos(s * (0.37 + fi * 0.11) + fi * 2.3) * 0.46);
      vec2 d = p - c;
      field += (0.018 + 0.006 * fi) / dot(d, d);
    }
    float warp = fbm(p * 2.2 + s * 0.4);
    vec3 base = mix(u_c1, mix(u_c1, u_c2, 0.45), smoothstep(0.0, 1.0, uv.y + warp * 0.3));
    float blob = smoothstep(0.8, 1.5, field + warp * 0.35);
    float rim = smoothstep(0.55, 0.9, field) - blob;
    vec3 col = mix(base, mix(u_c2, u_c3, smoothstep(1.2, 3.2, field)), blob);
    return col + u_c3 * rim * 0.35;
  }`,
  marble: `vec3 effect(vec2 uv, float aspect, float t) {
    vec2 p = uv * vec2(aspect, 1.0) * 2.6;
    float s = t * 0.12;
    vec2 q = vec2(fbm(p + s), fbm(p + vec2(5.2, 1.3) - s));
    vec2 r = vec2(fbm(p + 3.6 * q + vec2(1.7, 9.2) + s * 1.4), fbm(p + 3.6 * q + vec2(8.3, 2.8) - s));
    float f = fbm(p + 3.8 * r);
    vec3 col = mix(u_c1, u_c2, clamp(f * f * 2.6, 0.0, 1.0));
    col = mix(col, u_c3, clamp(length(q) * 0.9 - 0.25, 0.0, 1.0) * 0.7);
    return col + smoothstep(0.62, 0.9, f) * 0.12;
  }`,
  // Layered swell: bands roll in from the top, each deeper one darker, with bright crests.
  waves: `vec3 effect(vec2 uv, float aspect, float t) {
    float s = t * 0.55;
    float x = uv.x * aspect;
    vec3 col = mix(u_c2 * 0.9, u_c1 * 1.6, 1.0 - uv.y);
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      float y = 0.9 - fi * 0.13 + 0.06 * sin(x * (2.0 + fi * 0.4) + s * (0.6 + fi * 0.1) + fi * 1.7) + 0.025 * sin(x * 6.5 - s * 1.4 + fi);
      float depth = fi / 6.0;
      vec3 fill = mix(u_c2 * 1.05, u_c1 * 1.15, depth);
      col = mix(col, fill, 1.0 - smoothstep(y - 0.004, y + 0.004, uv.y));
      vec3 crest = mix(u_c2 * 1.8 + 0.08, u_c3, step(0.5, mod(fi, 2.0)));
      col += crest * smoothstep(0.014, 0.0, abs(uv.y - y)) * (0.75 - depth * 0.35);
    }
    return col;
  }`,
  contour: `vec3 effect(vec2 uv, float aspect, float t) {
    vec2 p = uv * vec2(aspect, 1.0) * 1.7;
    float h = fbm(p + vec2(t * 0.06, -t * 0.045)) + 0.35 * fbm(p * 2.0 - t * 0.05);
    float lines = abs(fract(h * 11.0) - 0.5);
    float line = smoothstep(0.075, 0.02, lines);
    float major = smoothstep(0.03, 0.008, abs(fract(h * 11.0 / 5.0) - 0.5));
    vec3 col = mix(u_c1, u_c2, smoothstep(0.25, 0.95, h));
    col = mix(col, u_c2 * 1.35, line * 0.55);
    col = mix(col, u_c3, major * 0.9);
    return col + u_c3 * smoothstep(0.78, 0.98, h) * 0.25;
  }`,
  ink: `vec3 effect(vec2 uv, float aspect, float t) {
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * 2.0;
    float s = t * 0.14;
    vec2 w = vec2(fbm(p * 1.4 + s), fbm(p * 1.4 - s + 4.0));
    float f = fbm(p * 1.8 + w * 2.2 + vec2(0.0, -s * 2.0));
    vec3 col = mix(u_c1, u_c2, smoothstep(0.35, 0.78, f));
    col = mix(col, u_c3, smoothstep(0.62, 0.92, f));
    return col + smoothstep(0.88, 1.0, f) * 0.15;
  }`,
  // Molten crust: drifting Voronoi plates with glowing, pulsing seams.
  magma: `vec3 effect(vec2 uv, float aspect, float t) {
    vec2 p = uv * vec2(aspect, 1.0) * 3.4 + vec2(0.0, -t * 0.16);
    p += 0.4 * vec2(fbm(p * 0.7 + t * 0.2), fbm(p * 0.7 - t * 0.17 + 3.0));
    vec2 i = floor(p), f = fract(p);
    float f1 = 8.0, f2 = 8.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(i + g), hash(i + g + 17.3));
        o = 0.5 + 0.42 * sin(t * 0.9 + 6.2831 * o);
        float d = length(g + o - f);
        if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
      }
    }
    float glow = exp(-(f2 - f1) * 8.0);
    float heat = fbm(p * 0.5 + vec2(t * 0.25, -t * 0.35));
    float pulse = 0.6 + 0.4 * sin(t * 1.8 + heat * 7.0);
    vec3 crust = u_c1 * (1.0 + f1 * 0.9) + u_c2 * 0.06 * heat;
    vec3 col = mix(crust, mix(u_c2, u_c3, glow * pulse), smoothstep(0.05, 0.9, glow * (0.55 + heat)));
    return col + u_c3 * pow(glow, 7.0) * 0.7 * pulse;
  }`,
  // Sunlight through water: two warped grids whose crossings brighten into a caustic net.
  caustics: `vec3 effect(vec2 uv, float aspect, float t) {
    vec2 p = uv * vec2(aspect, 1.0) * 4.2;
    float s = t * 0.55, light = 0.0;
    for (int k = 0; k < 2; k++) {
      float fk = float(k);
      vec2 q = p * (1.0 + fk * 0.6) + fk * 3.7;
      for (int n = 1; n < 5; n++) {
        float fn = float(n);
        q += 0.55 / fn * vec2(sin(q.y * 1.4 + s * (0.7 + 0.25 * fn) + fk), cos(q.x * 1.3 - s * (0.6 + 0.2 * fn)));
      }
      float net = 1.0 - min(abs(sin(q.x)), abs(sin(q.y)));
      light += pow(net, 7.0 + fk * 3.0) * (0.9 - fk * 0.35);
    }
    vec3 water = mix(u_c1, u_c2, 0.25 + 0.55 * uv.y + 0.12 * sin(p.x * 0.6 + s));
    return water + mix(u_c2 * 1.5, u_c3, 0.55) * clamp(light, 0.0, 1.5) * 0.8;
  }`,
  // Stage lights: swinging spotlight beams from below, a little haze and floating bokeh.
  beams: `vec3 effect(vec2 uv, float aspect, float t) {
    vec2 p = (uv - vec2(0.5, -0.1)) * vec2(aspect, 1.0);
    float s = t * 0.6;
    float haze = fbm(uv * vec2(aspect, 1.0) * 3.0 + vec2(s * 0.15, -s * 0.1));
    vec3 col = u_c1 * (1.0 + uv.y * 0.8) + mix(u_c3, u_c2, uv.x) * haze * 0.1;
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      vec2 d = p - vec2((fi - 1.5) * 0.34 * aspect, 0.0);
      float aim = 0.6 * sin(s * (0.55 + fi * 0.15) + fi * 1.9);
      float beam = exp(-pow((atan(d.x, d.y) - aim) * 5.0, 2.0));
      float fall = smoothstep(1.5, 0.05, length(d));
      vec3 c = mix(u_c2, u_c3, mod(fi, 2.0));
      col += c * beam * fall * (0.45 + 0.55 * haze);
    }
    vec2 q = uv * vec2(aspect, 1.0);
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      vec2 b = vec2(fract(hash(vec2(fi, 1.0)) + s * 0.025 * (1.0 + fi * 0.3)) * aspect, 0.15 + 0.75 * hash(vec2(fi, 5.0)) + 0.04 * sin(s * 0.7 + fi));
      float r = 0.035 + 0.04 * hash(vec2(fi, 9.0));
      float twinkle = 0.55 + 0.45 * sin(s * 1.6 + fi * 2.1);
      col += mix(u_c2, u_c3, hash(vec2(fi, 7.0))) * smoothstep(r, r * 0.55, length(q - b)) * 0.28 * twinkle;
    }
    return col;
  }`,
  mesh: `vec3 effect(vec2 uv, float aspect, float t) {
    vec2 p = uv * vec2(aspect, 1.0);
    float s = t * 0.3;
    vec2 a = vec2(aspect * (0.3 + 0.22 * sin(s * 0.9)), 0.32 + 0.2 * cos(s * 0.7));
    vec2 b = vec2(aspect * (0.72 + 0.18 * cos(s * 0.8 + 1.0)), 0.7 + 0.18 * sin(s * 0.6));
    vec2 c = vec2(aspect * (0.5 + 0.3 * sin(s * 0.5 + 2.0)), 0.5 + 0.3 * cos(s * 0.45 + 3.0));
    float n = fbm(p * 2.5 + s * 0.3) * 0.25;
    vec3 col = u_c1;
    col = mix(col, u_c2, smoothstep(0.75, 0.0, length(p - a) + n));
    col = mix(col, u_c3, smoothstep(0.7, 0.0, length(p - b) + n));
    col = mix(col, mix(u_c2, u_c3, 0.5) * 1.1, smoothstep(0.5, 0.0, length(p - c) + n) * 0.6);
    return col;
  }`
};

const hexToRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

class ShaderField {
  constructor() {
    this.items = new Set();
    this.programs = new Map();
    this.canvas = document.createElement('canvas');
    this.gl = this.canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    this.start = performance.now();
    this.last = 0;
    this.frame = this.frame.bind(this);
    this.observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const item = [...this.items].find(candidate => candidate.target === entry.target);
        if (item) { item.visible = entry.isIntersecting; item.last = 0; }
      }
      this.wake();
    }, { rootMargin: '120px' });
    document.addEventListener('visibilitychange', () => this.wake());
    if (!this.gl) return;
    const gl = this.gl;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    this.canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); this.lost = true; });
  }

  get supported() { return Boolean(this.gl) && !this.lost; }

  program(effect) {
    if (this.programs.has(effect)) return this.programs.get(effect);
    const gl = this.gl;
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, HEADER + (EFFECTS[effect] || EFFECTS.silk)));
    gl.linkProgram(program);
    const uniforms = Object.fromEntries(['u_res', 'u_time', 'u_seed', 'u_energy', 'u_c1', 'u_c2', 'u_c3'].map(name => [name, gl.getUniformLocation(program, name)]));
    const entry = { program, uniforms, position: gl.getAttribLocation(program, 'p') };
    this.programs.set(effect, entry);
    return entry;
  }

  // target: the card's <canvas>; returns a handle whose energy (0..1) brightens and speeds up the effect.
  add(target, { effect, palette, seed = 0 }) {
    for (const stale of this.items) {
      if (!stale.target.isConnected) { this.items.delete(stale); this.observer.unobserve(stale.target); }
    }
    const item = { target, effect, palette: palette.map(hexToRgb), seed, slot: this.items.size, visible: false, energy: 0, goal: 0, phase: 0, last: 0, ctx: target.getContext('2d', { alpha: false }) };
    this.items.add(item);
    this.observer.observe(target);
    return {
      setEnergy: value => { item.goal = value; this.wake(); },
      remove: () => { this.items.delete(item); this.observer.unobserve(target); }
    };
  }

  wake() {
    if (!this.running && this.supported) { this.running = true; requestAnimationFrame(this.frame); }
  }

  frame(now) {
    const visible = [...this.items].filter(item => item.visible && item.target.isConnected);
    if (!visible.length || document.hidden) { this.running = false; return; }
    const still = reducedMotion.matches;
    if (now - this.last >= 33 || still) {
      this.last = now;
      this.tick = (this.tick || 0) + 1;
      for (const item of visible) {
        // Cards that are not playing repaint every other tick: copying out of WebGL is the costly part on phones.
        const idle = item.goal === 0 && item.energy < 0.02;
        if (idle && !still && (this.tick + item.slot) % 2) continue;
        // Phase is integrated, not time × speed: changing the speed then only bends the curve
        // instead of jumping the whole animation forward (that jump read as flicker on phones).
        const dt = Math.min(0.1, (now - (item.last || now)) / 1000);
        item.last = now;
        item.energy += (item.goal - item.energy) * 0.08;
        item.phase += still ? 0 : dt * (1.0 + 0.8 * item.energy);
        this.draw(item, still ? 12 : item.phase);
      }
    }
    const settling = visible.some(item => Math.abs(item.goal - item.energy) > 0.01);
    if (still && !settling) { this.running = false; return; }
    requestAnimationFrame(this.frame);
  }

  draw(item, time) {
    const gl = this.gl;
    const rect = item.target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    // ~0.45 device pixels per CSS pixel, capped: soft gradients do not need more.
    const scale = Math.min(0.45 * (window.devicePixelRatio || 1), 0.7);
    const width = Math.max(32, Math.min(520, Math.round(rect.width * scale)));
    const height = Math.max(32, Math.min(520, Math.round(rect.height * scale)));
    if (item.target.width !== width || item.target.height !== height) { item.target.width = width; item.target.height = height; }
    if (this.canvas.width < width || this.canvas.height < height) {
      this.canvas.width = Math.max(this.canvas.width, width);
      this.canvas.height = Math.max(this.canvas.height, height);
    }
    const { program, uniforms, position } = this.program(item.effect);
    gl.useProgram(program);
    gl.viewport(0, 0, width, height);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(uniforms.u_res, width, height);
    gl.uniform1f(uniforms.u_time, time);
    gl.uniform1f(uniforms.u_seed, item.seed);
    gl.uniform1f(uniforms.u_energy, item.energy);
    gl.uniform3fv(uniforms.u_c1, item.palette[0]);
    gl.uniform3fv(uniforms.u_c2, item.palette[1]);
    gl.uniform3fv(uniforms.u_c3, item.palette[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    item.ctx.drawImage(this.canvas, 0, this.canvas.height - height, width, height, 0, 0, width, height);
  }
}

let field;
export function shaderField() {
  field ??= new ShaderField();
  return field;
}
