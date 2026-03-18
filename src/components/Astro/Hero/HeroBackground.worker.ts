import type { Column } from "./HeroBackground.types";

const BREAKPOINT_2XL = 1536;

let canvas: OffscreenCanvas;
let context: OffscreenCanvasRenderingContext2D;
let canvasWidth: number;
let canvasHeight: number;
let columns: Column[] = [];
let totalPossibleColumns: number;
let contentLeft = 0;
let contentRight = 0;
let rootFontSize = 16;
let timeoutId: ReturnType<typeof setTimeout> | null = null;
let pausedByVisibility = false;
let pausedByIntersection = false;

function generateRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateColumnXCoord(): number {
  if (canvasWidth < BREAKPOINT_2XL || contentLeft === contentRight) {
    return generateRandomNumber(0, canvasWidth);
  }
  const contentWidth = contentRight - contentLeft;
  const taperWidth = contentWidth * 0.25;
  const taperLeft = contentLeft - taperWidth;
  const taperRight = contentRight + taperWidth;
  const leftTriArea = taperWidth * 0.5;
  const totalArea = contentWidth + taperWidth;
  const u = Math.random() * totalArea;
  if (u < leftTriArea) {
    return taperLeft + Math.sqrt(2 * taperWidth * u);
  } else if (u < leftTriArea + contentWidth) {
    return contentLeft + (u - leftTriArea);
  } else {
    const v = totalArea - u;
    return taperRight - Math.sqrt(2 * taperWidth * v);
  }
}

function generateColumn(pageLoad: boolean) {
  const columnLength = generateRandomNumber(20, 50);
  const columnChars: string[] = [];
  const alphaIncrement = 0.4 / columnLength;
  const gradient: string[] = [];
  for (let i = 1; i <= columnLength; i++) {
    columnChars.push(String.fromCharCode(generateRandomNumber(97, 122)));
    gradient.push(`rgba(255, 255, 255, ${alphaIncrement * i})`);
  }

  let currentChar = 0;
  let charsRemaining = columnLength;
  if (pageLoad) {
    const columnProgress = generateRandomNumber(0, columnLength);
    if (Math.random() < 0.5) {
      currentChar = columnProgress;
    } else {
      currentChar = columnLength;
      charsRemaining = columnProgress;
    }
  }

  const fontSize = generateRandomNumber(0.75 * rootFontSize, 1.25 * rootFontSize);
  columns.push({
    chars: columnChars,
    currentChar,
    charsRemaining,
    gradient,
    fontSize,
    fontString: `${fontSize}px "Matrix", sans-serif`,
    shadowBlur: fontSize * 0.75,
    xCoord: generateColumnXCoord(),
    yCoord: generateRandomNumber(-(canvasHeight * 0.25), canvasHeight),
    prevRender: 0,
    timeBetweenRenders: generateRandomNumber(200, 300),
  });
}

function renderColumn(column: Column) {
  const { chars, currentChar, charsRemaining, gradient, fontSize, fontString, shadowBlur, xCoord, yCoord } = column;
  const length = chars.length;
  const isFadingIn = charsRemaining === length;
  const fadeOutOffset = length - charsRemaining;
  const loopStart = isFadingIn ? 0 : fadeOutOffset;

  context.font = fontString;
  context.shadowBlur = shadowBlur;

  let lastColour = "";
  for (let i = loopStart; i !== currentChar; i++) {
    const char = chars[i];
    if (char == null) throw new Error(`Character at index ${i} is not defined`);

    const colour = (i === currentChar - 1 && isFadingIn)
      ? "#f9ab01"
      : (isFadingIn
        ? gradient[length - currentChar + i]!
        : gradient[i - fadeOutOffset]!);

    if (colour !== lastColour) {
      context.shadowColor = colour;
      context.fillStyle = colour;
      lastColour = colour;
    }
    context.fillText(char, xCoord, yCoord + fontSize * i);
  }
}

function refreshAllColumns() {
  columns = [];
  for (let i = 0; i < totalPossibleColumns; i++) {
    generateColumn(true);
  }
}

function animate() {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  const now = performance.now();

  for (let i = columns.length - 1; i >= 0; i--) {
    const column = columns[i]!;
    renderColumn(column);
    if (now - column.prevRender >= column.timeBetweenRenders) {
      column.prevRender = now;
      if (column.currentChar < column.chars.length) {
        column.currentChar++;
      } else if (column.charsRemaining > 0) {
        column.charsRemaining--;
      } else {
        columns.splice(i, 1);
      }
    }
  }

  if (columns.length < totalPossibleColumns) generateColumn(false);
  timeoutId = setTimeout(animate, 1000 / 60);
}

function startAnimation() {
  if (timeoutId === null && !pausedByVisibility && !pausedByIntersection) {
    timeoutId = setTimeout(animate, 1000 / 60);
  }
}

function stopAnimation() {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

self.onmessage = (e: MessageEvent) => {
  const { type } = e.data as { type: string };

  if (type === "init") {
    canvas = e.data.canvas as OffscreenCanvas;
    canvasWidth = e.data.width as number;
    canvasHeight = e.data.height as number;
    contentLeft = e.data.contentLeft as number;
    contentRight = e.data.contentRight as number;
    rootFontSize = e.data.rootFontSize as number;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Could not get canvas context");
    context = ctx as OffscreenCanvasRenderingContext2D;
    context.textAlign = "center";

    const matrixFont = new FontFace("Matrix", "url(/fonts/matrix.otf)");
    matrixFont.load().then((font) => {
      (self as unknown as { fonts: FontFaceSet }).fonts.add(font);
      totalPossibleColumns = Math.floor((canvasWidth / rootFontSize) * 1.5);
      refreshAllColumns();
      startAnimation();
    });

  } else if (type === "resize") {
    canvasWidth = e.data.width as number;
    canvasHeight = e.data.height as number;
    contentLeft = e.data.contentLeft as number;
    contentRight = e.data.contentRight as number;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
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
