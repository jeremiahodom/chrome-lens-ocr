import { LensCore, LensResult, LensError, Segment, BoundingBox, LensOptions } from './types';

export { LensResult, LensError, Segment, BoundingBox };

/**
 * Options for scanning a file in React Native
 */
export interface ScanFileOptions {
  /**
   * Base64 encoded file content (read using react-native-fs)
   */
  base64?: string;
  
  /**
   * Uint8Array file content (alternative to base64)
   */
  bytes?: Uint8Array;
  
  /**
   * MIME type of the image (e.g., 'image/jpeg', 'image/png')
   * Optional - will default to 'image/jpeg' if not provided
   */
  mimeType?: string;
  
  /**
   * Original image width in pixels
   * Optional - will be auto-detected if not provided
   */
  width?: number;
  
  /**
   * Original image height in pixels
   * Optional - will be auto-detected if not provided
   */
  height?: number;
}

/**
 * React Native wrapper for LensCore
 * Provides methods for OCR in React Native environment without Node.js dependencies
 */
export default class LensRN extends LensCore {
  /**
   * Creates a new instance of LensRN
   * @param config - Optional configuration object
   */
  constructor(config?: Partial<LensOptions>);

  /**
   * Scan image from remote URL
   * @param url - Remote image URL
   * @returns Promise resolving to OCR result
   */
  scanRemote(url: string): Promise<LensResult>;

  /**
   * Scan image from base64 string
   * @param base64String - Base64 encoded image data (without data URI prefix)
   * @param mimeType - MIME type of the image (e.g., 'image/jpeg', 'image/png')
   * @param width - Original image width in pixels
   * @param height - Original image height in pixels
   * @returns Promise resolving to OCR result
   */
  scanBase64(base64String: string, mimeType: string, width: number, height: number): Promise<LensResult>;

  /**
   * Scan image from React Native file URI
   * This method expects you to read the file using react-native-fs or similar library
   * and pass the content as base64 or Uint8Array
   * 
   * @param uri - File URI (file://, content://, etc.)
   * @param options - Options for file scanning
   * @returns Promise resolving to OCR result
   * 
   * @example
   * ```typescript
   * import RNFS from 'react-native-fs';
   * import LensRN from 'chrome-lens-ocr/src/rn';
   * 
   * const lens = new LensRN();
   * const fileUri = 'file:///path/to/image.jpg';
   * 
   * // Read file as base64
   * const base64 = await RNFS.readFile(fileUri, 'base64');
   * 
   * // Scan the file
   * const result = await lens.scanFile(fileUri, {
   *   base64: base64,
   *   mimeType: 'image/jpeg',
   *   width: 1920,
   *   height: 1080
   * });
   * ```
   */
  scanFile(uri: string, options: ScanFileOptions): Promise<LensResult>;
}
