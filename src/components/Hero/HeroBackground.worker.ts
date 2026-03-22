// Matrix rain — WebGL implementation on OffscreenCanvas

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHARS = "abcdefghijklmnopqrstuvwxyz";
const ATLAS_FONT_SIZE = 48;
const ATLAS_SHADOW_BLUR = 14;
const ATLAS_CELL_W = 72;
const ATLAS_CELL_H = 72;
const ATLAS_BASELINE = 54;
const ATLAS_W = CHARS.length * ATLAS_CELL_W;

const MAX_QUADS = 10000;
// 6 vertices per quad, 6 floats per vertex: x y u v alpha isPrimary
const FLOATS_PER_QUAD = 6 * 6; // 36

// ---------------------------------------------------------------------------
// Column interface
// ---------------------------------------------------------------------------

interface Column {
  charIndices: Uint8Array;
  length: number;
  currentChar: number;
  charsRemaining: number;
  fontSize: number;
  xCoord: number;
  yCoord: number; // baseline of first character
  prevRender: number;
  timeBetweenRenders: number;
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let canvas: OffscreenCanvas;
let gl: WebGLRenderingContext;
let canvasWidth = 0;
let canvasHeight = 0;
let rootFontSize = 16;
let columns: Column[] = [];
let totalPossibleColumns = 0;
let frameId: number | null = null;
let pausedByVisibility = false;
let pausedByIntersection = false;

// WebGL objects
let program: WebGLProgram;
let positionLoc: number;
let texCoordLoc: number;
let alphaLoc: number;
let isPrimaryLoc: number;
let buffer: WebGLBuffer;

// CPU-side vertex data
const vertexData = new Float32Array(MAX_QUADS * FLOATS_PER_QUAD);

// ---------------------------------------------------------------------------
// rAF shim for workers
// ---------------------------------------------------------------------------

const scheduleFrame: (cb: FrameRequestCallback) => number =
  typeof requestAnimationFrame !== "undefined"
    ? requestAnimationFrame.bind(self)
    : (cb) =>
        setTimeout(() => cb(performance.now()), 1000 / 60) as unknown as number;

const cancelFrame: (id: number) => void =
  typeof cancelAnimationFrame !== "undefined"
    ? cancelAnimationFrame.bind(self)
    : clearTimeout;

// ---------------------------------------------------------------------------
// Random helpers
// ---------------------------------------------------------------------------

function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateColumnXCoord(): number {
  return generateRandomNumber(0, canvasWidth);
}

// ---------------------------------------------------------------------------
// Texture atlas
// ---------------------------------------------------------------------------

function buildAtlasTexture(): WebGLTexture {
  const atlasCanvas = new OffscreenCanvas(ATLAS_W, ATLAS_CELL_H);
  const ctx = atlasCanvas.getContext("2d")!;

  ctx.clearRect(0, 0, ATLAS_W, ATLAS_CELL_H);
  ctx.font = `${ATLAS_FONT_SIZE}px "Matrix", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.shadowColor = "white";
  ctx.shadowBlur = ATLAS_SHADOW_BLUR;

  for (let i = 0; i < CHARS.length; i++) {
    const cx = i * ATLAS_CELL_W + ATLAS_CELL_W / 2;
    ctx.fillText(CHARS[i]!, cx, ATLAS_BASELINE);
  }

  const tex = gl.createTexture();
  if (!tex) throw new Error("Could not create WebGL texture");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    atlasCanvas as unknown as ImageData,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

// ---------------------------------------------------------------------------
// Shader compilation
// ---------------------------------------------------------------------------

const VERT_SRC = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
attribute float a_alpha;
attribute float a_isPrimary;
varying vec2 v_texCoord;
varying float v_alpha;
varying float v_isPrimary;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
  v_alpha = a_alpha;
  v_isPrimary = a_isPrimary;
}
`;

const FRAG_SRC = `
precision mediump float;
uniform sampler2D u_texture;
varying vec2 v_texCoord;
varying float v_alpha;
varying float v_isPrimary;
void main() {
  float mask = texture2D(u_texture, v_texCoord).a;
  vec3 col = mix(vec3(1.0), vec3(0.976, 0.671, 0.004), v_isPrimary);
  gl_FragColor = vec4(col, mask * v_alpha);
}
`;

function compileShader(type: number, src: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Shader compile error: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

function initWebGL(): void {
  const vert = compileShader(gl.VERTEX_SHADER, VERT_SRC);
  const frag = compileShader(gl.FRAGMENT_SHADER, FRAG_SRC);

  const prog = gl.createProgram();
  if (!prog) throw new Error("Could not create WebGL program");
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`Program link error: ${gl.getProgramInfoLog(prog)}`);
  }
  program = prog;
  gl.useProgram(program);

  positionLoc = gl.getAttribLocation(program, "a_position");
  texCoordLoc = gl.getAttribLocation(program, "a_texCoord");
  alphaLoc = gl.getAttribLocation(program, "a_alpha");
  isPrimaryLoc = gl.getAttribLocation(program, "a_isPrimary");

  const buf = gl.createBuffer();
  if (!buf) throw new Error("Could not create WebGL buffer");
  buffer = buf;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexData.byteLength, gl.DYNAMIC_DRAW);

  const stride = 6 * 4; // 6 floats × 4 bytes
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(texCoordLoc);
  gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, stride, 8);
  gl.enableVertexAttribArray(alphaLoc);
  gl.vertexAttribPointer(alphaLoc, 1, gl.FLOAT, false, stride, 16);
  gl.enableVertexAttribArray(isPrimaryLoc);
  gl.vertexAttribPointer(isPrimaryLoc, 1, gl.FLOAT, false, stride, 20);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  gl.clearColor(0, 0, 0, 1.0);
}

// ---------------------------------------------------------------------------
// Column generation
// ---------------------------------------------------------------------------

function generateColumn(pageLoad: boolean): void {
  const length = generateRandomNumber(20, 50);
  const charIndices = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    charIndices[i] = generateRandomNumber(0, 25);
  }

  let currentChar = 0;
  let charsRemaining = length;
  if (pageLoad) {
    const progress = generateRandomNumber(0, length);
    if (Math.random() < 0.5) {
      currentChar = progress;
    } else {
      currentChar = length;
      charsRemaining = progress;
    }
  }

  const fontSize = generateRandomNumber(
    Math.round(0.75 * rootFontSize),
    Math.round(1.25 * rootFontSize),
  );

  columns.push({
    charIndices,
    length,
    currentChar,
    charsRemaining,
    fontSize,
    xCoord: generateColumnXCoord(),
    yCoord: generateRandomNumber(-(canvasHeight * 0.25), canvasHeight),
    prevRender: 0,
    timeBetweenRenders: generateRandomNumber(350, 550),
  });
}

function refreshAllColumns(): void {
  columns = [];
  for (let i = 0; i < totalPossibleColumns; i++) {
    generateColumn(true);
  }
}

// ---------------------------------------------------------------------------
// Canvas-to-clip-space helpers
// ---------------------------------------------------------------------------

function clipX(cx: number): number {
  return (cx / canvasWidth) * 2.0 - 1.0;
}

function clipY(cy: number): number {
  return 1.0 - (cy / canvasHeight) * 2.0;
}

// ---------------------------------------------------------------------------
// Write a quad into vertexData, return next offset
// ---------------------------------------------------------------------------

function writeQuad(
  offset: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
  u1: number,
  v1: number,
  u2: number,
  v2: number,
  alpha: number,
  isPrimary: number,
): number {
  const x1 = clipX(left);
  const y1 = clipY(top);
  const x2 = clipX(right);
  const y2 = clipY(bottom);

  // Triangle 1: top-left, top-right, bottom-left
  // Top-left
  vertexData[offset++] = x1;
  vertexData[offset++] = y1;
  vertexData[offset++] = u1;
  vertexData[offset++] = v1;
  vertexData[offset++] = alpha;
  vertexData[offset++] = isPrimary;
  // Top-right
  vertexData[offset++] = x2;
  vertexData[offset++] = y1;
  vertexData[offset++] = u2;
  vertexData[offset++] = v1;
  vertexData[offset++] = alpha;
  vertexData[offset++] = isPrimary;
  // Bottom-left
  vertexData[offset++] = x1;
  vertexData[offset++] = y2;
  vertexData[offset++] = u1;
  vertexData[offset++] = v2;
  vertexData[offset++] = alpha;
  vertexData[offset++] = isPrimary;

  // Triangle 2: top-right, bottom-right, bottom-left
  // Top-right
  vertexData[offset++] = x2;
  vertexData[offset++] = y1;
  vertexData[offset++] = u2;
  vertexData[offset++] = v1;
  vertexData[offset++] = alpha;
  vertexData[offset++] = isPrimary;
  // Bottom-right
  vertexData[offset++] = x2;
  vertexData[offset++] = y2;
  vertexData[offset++] = u2;
  vertexData[offset++] = v2;
  vertexData[offset++] = alpha;
  vertexData[offset++] = isPrimary;
  // Bottom-left
  vertexData[offset++] = x1;
  vertexData[offset++] = y2;
  vertexData[offset++] = u1;
  vertexData[offset++] = v2;
  vertexData[offset++] = alpha;
  vertexData[offset++] = isPrimary;

  return offset;
}

// ---------------------------------------------------------------------------
// Animation loop
// ---------------------------------------------------------------------------

function animate(now: number): void {
  gl.clear(gl.COLOR_BUFFER_BIT);

  let quadCount = 0;
  let offset = 0;

  for (let ci = columns.length - 1; ci >= 0; ci--) {
    const col = columns[ci]!;
    const {
      charIndices,
      length,
      currentChar,
      charsRemaining,
      fontSize,
      xCoord,
      yCoord,
    } = col;

    const isFadingIn = charsRemaining === length;
    const fadeOutOffset = length - charsRemaining;
    const loopStart = isFadingIn ? 0 : fadeOutOffset;

    const alphaStep = 0.4 / length;
    const scale = fontSize / ATLAS_FONT_SIZE;
    const spriteW = ATLAS_CELL_W * scale;
    const spriteH = ATLAS_CELL_H * scale;
    const spriteLeft = xCoord - spriteW / 2;

    for (let i = loopStart; i < currentChar; i++) {
      if (quadCount >= MAX_QUADS) break;

      const charIdx = charIndices[i] ?? 0;

      let alpha: number;
      if (isFadingIn) {
        alpha = alphaStep * (length - currentChar + i + 1);
      } else {
        alpha = alphaStep * (i - fadeOutOffset + 1);
      }
      alpha = Math.max(0, Math.min(1, alpha));

      const isPrimary = isFadingIn && i === currentChar - 1 ? 1.0 : 0.0;

      const baselineY = yCoord + fontSize * i;
      const spriteTop = baselineY - ATLAS_BASELINE * scale;
      const spriteBottom = spriteTop + spriteH;

      const u1 = (charIdx * ATLAS_CELL_W) / ATLAS_W;
      const u2 = ((charIdx + 1) * ATLAS_CELL_W) / ATLAS_W;
      const v1 = 0;
      const v2 = 1;

      offset = writeQuad(
        offset,
        spriteLeft,
        spriteTop,
        spriteLeft + spriteW,
        spriteBottom,
        u1,
        v1,
        u2,
        v2,
        alpha,
        isPrimary,
      );
      quadCount++;
    }

    // Advance column state
    if (now - col.prevRender >= col.timeBetweenRenders) {
      col.prevRender = now;
      if (col.currentChar < length) {
        col.currentChar++;
      } else if (col.charsRemaining > 0) {
        col.charsRemaining--;
      } else {
        columns.splice(ci, 1);
      }
    }
  }

  if (columns.length < totalPossibleColumns) generateColumn(false);

  if (quadCount > 0) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexData.subarray(0, offset));
    gl.drawArrays(gl.TRIANGLES, 0, quadCount * 6);
  }

  frameId = scheduleFrame(animate);
}

function startAnimation(): void {
  if (frameId === null && !pausedByVisibility && !pausedByIntersection) {
    frameId = scheduleFrame(animate);
  }
}

function stopAnimation(): void {
  if (frameId !== null) {
    cancelFrame(frameId);
    frameId = null;
  }
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

self.onmessage = (e: MessageEvent) => {
  const { type } = e.data as { type: string };

  if (type === "init") {
    canvas = e.data.canvas as OffscreenCanvas;
    canvasWidth = e.data.width as number;
    canvasHeight = e.data.height as number;
    rootFontSize = e.data.rootFontSize as number;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
    }) as WebGLRenderingContext | null;
    if (!ctx) throw new Error("Could not get WebGL context");
    gl = ctx;

    initWebGL();
    gl.viewport(0, 0, canvasWidth, canvasHeight);

    const matrixFont = new FontFace("Matrix", "url(/fonts/matrix.otf)");
    matrixFont.load().then((font) => {
      (self as unknown as { fonts: FontFaceSet }).fonts.add(font);
      buildAtlasTexture();
      totalPossibleColumns = Math.floor((canvasWidth / rootFontSize) * 1.5);
      refreshAllColumns();
      startAnimation();
    });
  } else if (type === "resize") {
    canvasWidth = e.data.width as number;
    canvasHeight = e.data.height as number;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    gl.viewport(0, 0, canvasWidth, canvasHeight);
    totalPossibleColumns = Math.floor((canvasWidth / rootFontSize) * 1.5);
    refreshAllColumns();
  } else if (type === "visibilityPause") {
    pausedByVisibility = true;
    stopAnimation();
  } else if (type === "visibilityResume") {
    pausedByVisibility = false;
    startAnimation();
  } else if (type === "intersectionPause") {
    pausedByIntersection = true;
    stopAnimation();
  } else if (type === "intersectionResume") {
    pausedByIntersection = false;
    startAnimation();
  }
};
