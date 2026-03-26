/** A single processed document page within a multi-page scanning session. */
export interface ScanPage {
  id: string;
  orderIndex: number;
  imageData: ImageData;
  canvasRef: HTMLCanvasElement;
  name: string;
  brightness: number;
  contrast: number;
  rotation: 0 | 90 | 180 | 270;
  enhanced: boolean;
  createdAt: number;
}

/** Enhanced scan file with page count and file type metadata. */
export interface ScanFile {
  name: string;
  url: string;
  createdAt: string;
  pageCount: number;
  fileType: 'image/jpeg' | 'application/pdf';
}

/** Batch capture state machine phases. */
export type BatchPhase =
  | 'idle'
  | 'detecting'
  | 'dwelling'
  | 'capturing'
  | 'cooldown'
  | 'waiting_scene_change';

/** State for automatic batch capture mode. */
export interface BatchModeState {
  enabled: boolean;
  phase: BatchPhase;
  referenceFrame: ImageData | null;
  dwellTimer: number;
  sceneChanged: boolean;
  lastCaptureTime: number;
}

/** Maximum pages allowed in a single document tray. */
export const MAX_PAGES = 30;

/** Maximum file size for Cloud Files upload (5MB). */
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

/** Default batch mode dwell time in ms. */
export const BATCH_DWELL_MS = 1500;

/** Scene change threshold percentage (0-100). */
export const SCENE_CHANGE_THRESHOLD = 15;
