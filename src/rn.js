import LensCore, { LensResult, LensError, Segment, BoundingBox } from './core.js';
import { imageDimensionsFromData } from 'image-dimensions';

export { LensResult, LensError, Segment, BoundingBox };

/**
 * React Native wrapper for LensCore
 * Provides methods for OCR in React Native environment without Node.js dependencies
 */
export default class LensRN extends LensCore {
    constructor(config = {}) {
        if (typeof config !== 'object') {
            console.warn('LensRN constructor expects an object, got', typeof config);
            config = {};
        }

        // Use global fetch from React Native environment
        const fetchFn = globalThis.fetch && globalThis.fetch.bind(globalThis);
        if (!fetchFn) {
            throw new Error('Global fetch is not available in this environment');
        }

        super(config, fetchFn);
    }

    /**
     * Scan image from remote URL
     * @param {string} url - Remote image URL
     * @returns {Promise<LensResult>} OCR result
     */
    async scanRemote(url) {
        return this.scanByURL(url);
    }

    /**
     * Scan image from base64 string
     * @param {string} base64String - Base64 encoded image data (without data URI prefix)
     * @param {string} mimeType - MIME type of the image (e.g., 'image/jpeg', 'image/png')
     * @param {number} width - Original image width in pixels
     * @param {number} height - Original image height in pixels
     * @returns {Promise<LensResult>} OCR result
     */
    async scanBase64(base64String, mimeType, width, height) {
        if (typeof base64String !== 'string') {
            throw new TypeError('base64String must be a string');
        }
        if (typeof mimeType !== 'string') {
            throw new TypeError('mimeType must be a string');
        }
        if (typeof width !== 'number' || typeof height !== 'number') {
            throw new TypeError('width and height must be numbers');
        }

        // Remove data URI prefix if present
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

        // Convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return this.scanByData(bytes, mimeType, [width, height]);
    }

    /**
     * Scan image from React Native file URI
     * This method expects you to read the file using react-native-fs or similar library
     * and pass the content as base64 or Uint8Array
     * 
     * @param {string} uri - File URI (file://, content://, etc.)
     * @param {Object} options - Options for file scanning
     * @param {string} options.base64 - Base64 encoded file content (read using react-native-fs)
     * @param {Uint8Array} options.bytes - Uint8Array file content (alternative to base64)
     * @param {string} [options.mimeType] - MIME type of the image (optional, will be detected)
     * @param {number} [options.width] - Original image width (optional, will be detected)
     * @param {number} [options.height] - Original image height (optional, will be detected)
     * @returns {Promise<LensResult>} OCR result
     */
    async scanFile(uri, options = {}) {
        if (typeof uri !== 'string') {
            throw new TypeError('uri must be a string');
        }
        if (typeof options !== 'object') {
            throw new TypeError('options must be an object');
        }

        let bytes;
        let mimeType = options.mimeType || 'image/jpeg';

        // Convert base64 to Uint8Array if base64 is provided
        if (options.base64) {
            const base64Data = options.base64.replace(/^data:image\/\w+;base64,/, '');
            const binaryString = atob(base64Data);
            bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
        } else if (options.bytes instanceof Uint8Array) {
            bytes = options.bytes;
        } else {
            throw new Error('Either options.base64 or options.bytes must be provided');
        }

        // Try to determine dimensions if not provided
        let width = options.width;
        let height = options.height;

        if (!width || !height) {
            try {
                const dimensions = imageDimensionsFromData(bytes);
                if (dimensions) {
                    width = dimensions.width;
                    height = dimensions.height;
                }
            } catch (error) {
                console.warn('Could not auto-detect image dimensions:', error);
            }
        }

        if (!width || !height) {
            throw new Error('Image dimensions (width, height) must be provided or detectable from image data');
        }

        return this.scanByData(bytes, mimeType, [width, height]);
    }
}
