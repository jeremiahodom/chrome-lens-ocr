# Chrome Lens OCR - React Native SDK

React Native wrapper for Google Lens OCR functionality. This SDK allows you to perform OCR on images in React Native applications (iOS/Android) without requiring Node.js APIs, headless browsers, or Google account authentication.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Configuration](#configuration)
- [Important Notes](#important-notes)
- [Troubleshooting](#troubleshooting)

## Installation

```bash
npm install chrome-lens-ocr
```

### Required Dependencies

For React Native, you'll need to install these peer dependencies:

```bash
npm install react-native-fs
npm install image-dimensions
npm install set-cookie-parser
npm install google-protobuf
```

**Note:** You do NOT need to install `sharp`, `file-type`, or `undici` for React Native usage. These are Node.js-specific dependencies.

### Optional Dependencies

To get image dimensions from local files:

```bash
npm install react-native-image-size
# or
npm install @react-native-community/image-editor
```

## Quick Start

```javascript
import LensRN from 'chrome-lens-ocr/src/rn';

// Create instance
const lens = new LensRN();

// Scan image from URL
const result = await lens.scanRemote('https://example.com/image.jpg');
console.log('Detected text:', result.segments.map(s => s.text).join(' '));
```

## API Reference

### Class: LensRN

React Native wrapper extending `LensCore`. Provides three main methods for OCR:

#### Constructor

```javascript
const lens = new LensRN(options?: Object);
```

**Options** (all optional):
- `chromeVersion` (string): Chrome version to emulate. Default: `'124.0.6367.60'`
- `userAgent` (string): User agent string. Default: Chrome on Windows 10
- `headers` (object): Custom headers to include in requests
- `fetchOptions` (object): Additional options to pass to fetch
- `targetLanguage` (string): Target language for OCR. Default: `'en'`

#### Methods

##### `scanRemote(url: string): Promise<LensResult>`

Scan an image from a remote URL.

```javascript
const result = await lens.scanRemote('https://example.com/image.jpg');
```

##### `scanBase64(base64String: string, mimeType: string, width: number, height: number): Promise<LensResult>`

Scan an image from a base64 string.

```javascript
const result = await lens.scanBase64(
  base64Data,        // base64 string (with or without data URI prefix)
  'image/jpeg',      // MIME type
  1920,              // original width
  1080               // original height
);
```

##### `scanFile(uri: string, options: Object): Promise<LensResult>`

Scan an image from a React Native file URI.

```javascript
const result = await lens.scanFile(fileUri, {
  base64: base64Data,     // OR bytes: uint8Array
  mimeType: 'image/jpeg', // optional
  width: 1920,            // optional (auto-detected if not provided)
  height: 1080            // optional (auto-detected if not provided)
});
```

### Response: LensResult

```javascript
{
  language: string,        // Detected language (2-letter code, e.g., 'en')
  segments: Segment[]      // Array of text segments
}
```

### Segment

```javascript
{
  text: string,            // Extracted text
  boundingBox: BoundingBox // Position information
}
```

### BoundingBox

```javascript
{
  centerPerX: number,      // Center X (percentage of image width)
  centerPerY: number,      // Center Y (percentage of image height)
  perWidth: number,        // Width (percentage of image width)
  perHeight: number,       // Height (percentage of image height)
  pixelCoords: {
    x: number,             // Top-left X (pixels)
    y: number,             // Top-left Y (pixels)
    width: number,         // Width (pixels)
    height: number         // Height (pixels)
  }
}
```

## Usage Examples

### Example 1: Scan Remote Image

```javascript
import LensRN from 'chrome-lens-ocr/src/rn';

const lens = new LensRN();

async function scanRemoteImage() {
  try {
    const result = await lens.scanRemote('https://example.com/receipt.jpg');
    
    console.log('Language:', result.language);
    result.segments.forEach(segment => {
      console.log('Text:', segment.text);
      console.log('Position:', segment.boundingBox.pixelCoords);
    });
  } catch (error) {
    console.error('OCR failed:', error);
  }
}
```

### Example 2: Scan Base64 Image

```javascript
import LensRN from 'chrome-lens-ocr/src/rn';
import { launchImageLibrary } from 'react-native-image-picker';

const lens = new LensRN();

async function scanFromGallery() {
  // Pick image from gallery
  const result = await launchImageLibrary({
    mediaType: 'photo',
    includeBase64: true,
  });

  if (result.assets && result.assets[0]) {
    const asset = result.assets[0];
    
    // Perform OCR
    const ocrResult = await lens.scanBase64(
      asset.base64,
      asset.type || 'image/jpeg',
      asset.width,
      asset.height
    );

    console.log('Detected text:', ocrResult.segments.map(s => s.text).join('\n'));
  }
}
```

### Example 3: Scan Local File with react-native-fs

```javascript
import LensRN from 'chrome-lens-ocr/src/rn';
import RNFS from 'react-native-fs';
import Image from 'react-native-image-size';

const lens = new LensRN();

async function scanLocalFile(filePath) {
  try {
    // Read file as base64
    const base64Data = await RNFS.readFile(filePath, 'base64');
    
    // Get image dimensions
    const size = await Image.getSize(filePath);
    
    // Perform OCR
    const result = await lens.scanFile(filePath, {
      base64: base64Data,
      mimeType: 'image/jpeg',
      width: size.width,
      height: size.height
    });

    return result;
  } catch (error) {
    console.error('Failed to scan file:', error);
    throw error;
  }
}
```

### Example 4: Scan with Alternative - Using Uint8Array

```javascript
import LensRN from 'chrome-lens-ocr/src/rn';
import RNFS from 'react-native-fs';

const lens = new LensRN();

async function scanWithUint8Array(filePath) {
  // Read file as base64
  const base64Data = await RNFS.readFile(filePath, 'base64');
  
  // Convert base64 to Uint8Array manually
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Scan using bytes directly
  const result = await lens.scanFile(filePath, {
    bytes: bytes,
    mimeType: 'image/png',
    width: 1920,
    height: 1080
  });

  return result;
}
```

## Configuration

### Setting Custom Headers and Cookies

```javascript
import LensRN from 'chrome-lens-ocr/src/rn';

const lens = new LensRN({
  headers: {
    // Add custom cookie header
    'cookie': '__Secure-ENID=17.SE=-dizH-; NID=511=---bcDwC4fo0--lgfi0n2-'
    
    // Or use object format with expiration
    'cookie': {
      '__Secure-ENID': {
        name: '__Secure-ENID',
        value: '17.SE=-dizH-',
        expires: 1734025600000,  // Unix timestamp in milliseconds
      },
      'NID': {
        name: 'NID',
        value: '511=---bcDwC4fo0--lgfi0n2-',
        expires: 1734025600000,
      }
    }
  }
});
```

### Customizing User Agent and Chrome Version

```javascript
const lens = new LensRN({
  chromeVersion: '124.0.6367.60',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
});
```

**Note:** Some platforms may not allow full User-Agent override in fetch requests. If you encounter issues, consider using a backend proxy (see below).

### Using with Proxy/Backend

If you need to route requests through a proxy or backend server:

```javascript
const lens = new LensRN({
  fetchOptions: {
    // Custom fetch options
    // Note: React Native's fetch has limited proxy support
    // For production, consider implementing a backend proxy
  }
});
```

**Recommended Backend Proxy Approach:**

For production apps, it's recommended to create a simple backend proxy to:
1. Add required headers and cookies
2. Handle rate limiting
3. Avoid exposing API keys in client code
4. Circumvent potential User-Agent restrictions

Example proxy endpoint (Node.js):

```javascript
// backend/proxy.js
import Lens from 'chrome-lens-ocr';

const lens = new Lens({
  headers: {
    'cookie': process.env.GOOGLE_COOKIES
  }
});

app.post('/api/ocr', async (req, res) => {
  const { imageUrl } = req.body;
  try {
    const result = await lens.scanByURL(imageUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Then from React Native:

```javascript
async function scanViaBackend(imageUrl) {
  const response = await fetch('https://your-backend.com/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl })
  });
  return await response.json();
}
```

## Important Notes

### Google Lens Terms of Service

⚠️ **Important:** This library uses Google Lens API which is intended for Chrome browser use. By using this library, you should be aware:

1. This is an unofficial API usage and is not endorsed by Google
2. Google may rate-limit or block requests at any time
3. Use at your own risk and comply with Google's Terms of Service
4. For production applications, consider:
   - Implementing rate limiting
   - Using a backend proxy
   - Having fallback OCR solutions
   - Monitoring for API changes/blocks

### Privacy and Security

- Never hardcode sensitive cookies or API keys in your React Native app
- Store sensitive configuration on your backend
- Use environment variables for configuration
- Consider implementing your own backend proxy for production use

### Performance Considerations

- Large images may take longer to process
- Consider resizing images before OCR to improve performance
- The library doesn't automatically resize images in RN (unlike Node.js version)
- Recommended max dimension: 1200px

### Platform Differences

**React Native vs Node.js:**
- RN version uses global `fetch` (no undici dependency)
- No automatic image resizing with Sharp
- No `Buffer` support (use `Uint8Array` instead)
- No filesystem access (use react-native-fs)
- You must provide image dimensions

### Supported Image Formats

- `image/jpeg` (recommended)
- `image/png`
- `image/webp`
- `image/bmp`
- `image/tiff`
- `image/heic`

## Troubleshooting

### "Global fetch is not available"

Make sure you're running on React Native 0.60+ which includes fetch by default. For older versions, install a fetch polyfill:

```bash
npm install whatwg-fetch
```

```javascript
import 'whatwg-fetch';
```

### "Image dimensions must be provided"

The library couldn't auto-detect dimensions. Provide them manually:

```javascript
const result = await lens.scanFile(uri, {
  base64: base64Data,
  width: 1920,
  height: 1080
});
```

### "MIME type might not be supported"

Stick to common formats like `image/jpeg` or `image/png`. If needed, convert images:

```javascript
import ImageResizer from 'react-native-image-resizer';

const resized = await ImageResizer.createResizedImage(
  uri,
  1200,
  1200,
  'JPEG',
  80
);
// Now scan the resized image
```

### Rate Limiting / 429 Errors

Google may rate-limit requests. Solutions:
1. Implement exponential backoff
2. Use a backend proxy with rate limiting
3. Add delays between requests
4. Use your own Google cookies (see Configuration)

### Incorrect Bounding Boxes

Make sure you're providing the **original** image dimensions (before any resizing):

```javascript
// ❌ Wrong - using resized dimensions
const resized = await resize(image, 800, 600);
await lens.scanBase64(resized.base64, 'image/jpeg', 800, 600);

// ✅ Correct - using original dimensions
const original = { width: 3000, height: 2000 };
const resized = await resize(image, 800, 600);
await lens.scanBase64(resized.base64, 'image/jpeg', original.width, original.height);
```

## Complete Example App

```javascript
import React, { useState } from 'react';
import { View, Button, Text, Image, ScrollView } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LensRN from 'chrome-lens-ocr/src/rn';

const lens = new LensRN();

export default function OCRExample() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickAndScanImage = async () => {
    setLoading(true);
    try {
      const pickerResult = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: true,
      });

      if (pickerResult.assets && pickerResult.assets[0]) {
        const asset = pickerResult.assets[0];
        
        const ocrResult = await lens.scanBase64(
          asset.base64,
          asset.type || 'image/jpeg',
          asset.width,
          asset.height
        );

        setResult(ocrResult);
      }
    } catch (error) {
      console.error('OCR Error:', error);
      alert('OCR failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Button 
        title={loading ? "Processing..." : "Pick Image & Scan"} 
        onPress={pickAndScanImage}
        disabled={loading}
      />
      
      {result && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>
            Language: {result.language}
          </Text>
          <Text style={{ fontWeight: 'bold', marginTop: 10 }}>
            Detected Text:
          </Text>
          {result.segments.map((segment, index) => (
            <Text key={index} style={{ marginTop: 5 }}>
              • {segment.text}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
```

## License

ISC

## Support

For issues and questions:
- GitHub Issues: [chrome-lens-ocr/issues](https://github.com/dimdenGD/chrome-lens-ocr/issues)
- Original Package: [chrome-lens-ocr](https://github.com/dimdenGD/chrome-lens-ocr)
