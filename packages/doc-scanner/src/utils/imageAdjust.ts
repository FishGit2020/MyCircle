/**
 * Apply brightness adjustment to ImageData.
 * @param imageData - source pixel data (modified in place)
 * @param value - brightness offset (-100 to +100)
 */
export function applyBrightness(imageData: ImageData, value: number): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] + value);       // R
    data[i + 1] = clamp(data[i + 1] + value); // G
    data[i + 2] = clamp(data[i + 2] + value); // B
  }
  return imageData;
}

/**
 * Apply contrast adjustment to ImageData.
 * Uses the standard contrast formula: (pixel - 128) * factor + 128
 * where factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
 * @param imageData - source pixel data (modified in place)
 * @param value - contrast level (-100 to +100)
 */
export function applyContrast(imageData: ImageData, value: number): ImageData {
  const factor = (259 * (value + 255)) / (255 * (259 - value));
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp((data[i] - 128) * factor + 128);
    data[i + 1] = clamp((data[i + 1] - 128) * factor + 128);
    data[i + 2] = clamp((data[i + 2] - 128) * factor + 128);
  }
  return imageData;
}

/**
 * Apply rotation to a canvas (0, 90, 180, 270 degrees clockwise).
 * Returns a new canvas with the rotated content.
 */
export function applyRotation(
  source: HTMLCanvasElement,
  degrees: 0 | 90 | 180 | 270
): HTMLCanvasElement {
  if (degrees === 0) return source;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const sw = source.width;
  const sh = source.height;

  if (degrees === 90 || degrees === 270) {
    canvas.width = sh;
    canvas.height = sw;
  } else {
    canvas.width = sw;
    canvas.height = sh;
  }

  ctx.save();
  if (degrees === 90) {
    ctx.translate(sh, 0);
  } else if (degrees === 180) {
    ctx.translate(sw, sh);
  } else if (degrees === 270) {
    ctx.translate(0, sw);
  }
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(source, 0, 0);
  ctx.restore();

  return canvas;
}

/**
 * Apply all adjustments (brightness, contrast, rotation) to an ImageData.
 * Returns a new canvas with the final result.
 */
export function applyAllAdjustments(
  imageData: ImageData,
  brightness: number,
  contrast: number,
  rotation: 0 | 90 | 180 | 270
): HTMLCanvasElement {
  // Clone the image data so we don't modify the original
  const clone = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  if (brightness !== 0) applyBrightness(clone, brightness);
  if (contrast !== 0) applyContrast(clone, contrast);

  // Put onto canvas for rotation
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = clone.width;
  tempCanvas.height = clone.height;
  tempCanvas.getContext('2d')!.putImageData(clone, 0, 0);

  return applyRotation(tempCanvas, rotation);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}
