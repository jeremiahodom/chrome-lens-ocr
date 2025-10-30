# Chrome Lens OCR - React Native Migration Guide

## For Existing Users

If you're already using chrome-lens-ocr in Node.js, **nothing changes** for you. Continue using:

```javascript
import Lens from 'chrome-lens-ocr';
```

## For New React Native Users

### Quick Start

1. **Install the package**
```bash
npm install chrome-lens-ocr react-native-fs image-dimensions set-cookie-parser google-protobuf
```

2. **Import and use**
```javascript
import LensRN from 'chrome-lens-ocr/src/rn';

const lens = new LensRN();

// Scan from URL
const result = await lens.scanRemote('https://example.com/image.jpg');
console.log(result.segments.map(s => s.text).join('\n'));
```

### Complete Documentation

See [README-RN.md](README-RN.md) for:
- Complete API reference
- 10+ usage examples
- React component examples
- react-native-fs integration
- react-native-image-picker integration
- Troubleshooting guide

### Examples

See [examples-rn.js](examples-rn.js) for:
- Remote image scanning
- Gallery image scanning
- Camera image scanning
- Local file scanning
- Custom headers/cookies
- Batch processing
- Pattern extraction
- Error handling
- React components

## What's Different?

### React Native vs Node.js

| Feature | Node.js | React Native |
|---------|---------|--------------|
| Entry Point | `chrome-lens-ocr` | `chrome-lens-ocr/src/rn` |
| Main Class | `Lens` | `LensRN` |
| File Scanning | `scanByFile(path)` | `scanFile(uri, options)` |
| Buffer Scanning | `scanByBuffer(buffer)` | N/A (use scanBase64 or scanFile) |
| Image Processing | Automatic (Sharp) | Manual (you resize) |
| Dimensions | Auto-detected | Must provide or auto-detect |
| Fetch | undici | global fetch |

### Migration Example

**Node.js:**
```javascript
import Lens from 'chrome-lens-ocr';

const lens = new Lens();
const result = await lens.scanByFile('./image.jpg');
```

**React Native:**
```javascript
import LensRN from 'chrome-lens-ocr/src/rn';
import RNFS from 'react-native-fs';
import ImageSize from 'react-native-image-size';

const lens = new LensRN();

const filePath = 'file:///path/to/image.jpg';
const base64 = await RNFS.readFile(filePath, 'base64');
const size = await ImageSize.getSize(filePath);

const result = await lens.scanFile(filePath, {
  base64,
  width: size.width,
  height: size.height
});
```

## Common Use Cases

### 1. Scan Image from Gallery

```javascript
import { launchImageLibrary } from 'react-native-image-picker';
import LensRN from 'chrome-lens-ocr/src/rn';

const lens = new LensRN();

const pickAndScan = async () => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    includeBase64: true,
  });

  if (result.assets?.[0]) {
    const asset = result.assets[0];
    const ocrResult = await lens.scanBase64(
      asset.base64,
      asset.type || 'image/jpeg',
      asset.width,
      asset.height
    );
    return ocrResult;
  }
};
```

### 2. Scan Image from Camera

```javascript
import { launchCamera } from 'react-native-image-picker';
import LensRN from 'chrome-lens-ocr/src/rn';

const lens = new LensRN();

const takePhotoAndScan = async () => {
  const result = await launchCamera({
    mediaType: 'photo',
    includeBase64: true,
  });

  if (result.assets?.[0]) {
    const asset = result.assets[0];
    return await lens.scanBase64(
      asset.base64,
      asset.type || 'image/jpeg',
      asset.width,
      asset.height
    );
  }
};
```

### 3. Scan Remote Image

```javascript
import LensRN from 'chrome-lens-ocr/src/rn';

const lens = new LensRN();

const scanRemote = async (url) => {
  return await lens.scanRemote(url);
};
```

## Troubleshooting

### "Global fetch is not available"
- Ensure React Native 0.60+
- Or install a fetch polyfill

### "Image dimensions must be provided"
```javascript
// ✅ Provide dimensions manually
await lens.scanBase64(base64, 'image/jpeg', 1920, 1080);

// Or use a library to get them
import ImageSize from 'react-native-image-size';
const size = await ImageSize.getSize(uri);
```

### Rate Limiting
- Add delays between requests
- Use backend proxy
- Implement exponential backoff

### Incorrect Bounding Boxes
```javascript
// ✅ Always provide ORIGINAL dimensions
const originalWidth = 3000;
const originalHeight = 2000;

// Even if you resize the image, use original dimensions
await lens.scanBase64(resizedBase64, mime, originalWidth, originalHeight);
```

## Important Notes

### Google Lens ToS
⚠️ This uses an unofficial API. Use at your own risk. For production:
- Consider using a backend proxy
- Implement rate limiting
- Have fallback OCR solutions
- Monitor for API changes

### Best Practices

1. **Use Backend Proxy** for production apps
2. **Resize Images** before OCR (recommended max: 1200px)
3. **Store Cookies** on backend, not in app
4. **Handle Errors** gracefully
5. **Implement Rate Limiting**

## Need Help?

- Read [README-RN.md](README-RN.md) for complete documentation
- Check [examples-rn.js](examples-rn.js) for code examples
- Open an issue on GitHub

## License

ISC
