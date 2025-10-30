/**
 * React Native Examples for chrome-lens-ocr
 * 
 * This file contains example code snippets for using chrome-lens-ocr in React Native
 * Copy and adapt these examples to your React Native project
 */

import LensRN from 'chrome-lens-ocr/src/rn';
import RNFS from 'react-native-fs';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import ImageSize from 'react-native-image-size';

// ============================================================================
// Example 1: Basic Remote Image Scanning
// ============================================================================

export async function example1_ScanRemoteImage() {
  const lens = new LensRN();
  
  try {
    const result = await lens.scanRemote('https://example.com/receipt.jpg');
    
    console.log('Detected language:', result.language);
    console.log('Number of segments:', result.segments.length);
    
    // Print all detected text
    const fullText = result.segments.map(s => s.text).join('\n');
    console.log('Full text:\n', fullText);
    
    // Print text with coordinates
    result.segments.forEach((segment, index) => {
      console.log(`Segment ${index}:`, segment.text);
      console.log('  Position:', segment.boundingBox.pixelCoords);
    });
    
    return result;
  } catch (error) {
    console.error('Failed to scan remote image:', error);
    throw error;
  }
}

// ============================================================================
// Example 2: Scan Image from Gallery (with react-native-image-picker)
// ============================================================================

export async function example2_ScanFromGallery() {
  const lens = new LensRN();
  
  try {
    // Launch image picker
    const pickerResult = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 1,
    });

    if (pickerResult.didCancel) {
      console.log('User cancelled image picker');
      return null;
    }

    if (pickerResult.errorCode) {
      throw new Error('ImagePicker Error: ' + pickerResult.errorMessage);
    }

    const asset = pickerResult.assets[0];
    
    // Perform OCR using base64
    const result = await lens.scanBase64(
      asset.base64,
      asset.type || 'image/jpeg',
      asset.width,
      asset.height
    );

    console.log('OCR Result:', result);
    return result;
    
  } catch (error) {
    console.error('Failed to scan from gallery:', error);
    throw error;
  }
}

// ============================================================================
// Example 3: Scan Image from Camera
// ============================================================================

export async function example3_ScanFromCamera() {
  const lens = new LensRN();
  
  try {
    // Launch camera
    const cameraResult = await launchCamera({
      mediaType: 'photo',
      includeBase64: true,
      cameraType: 'back',
      quality: 1,
    });

    if (cameraResult.didCancel) {
      console.log('User cancelled camera');
      return null;
    }

    const asset = cameraResult.assets[0];
    
    // Perform OCR
    const result = await lens.scanBase64(
      asset.base64,
      asset.type || 'image/jpeg',
      asset.width,
      asset.height
    );

    return result;
    
  } catch (error) {
    console.error('Failed to scan from camera:', error);
    throw error;
  }
}

// ============================================================================
// Example 4: Scan Local File with react-native-fs
// ============================================================================

export async function example4_ScanLocalFile(filePath) {
  const lens = new LensRN();
  
  try {
    // Read file as base64
    const base64Data = await RNFS.readFile(filePath, 'base64');
    
    // Get image dimensions
    const size = await ImageSize.getSize(filePath);
    
    // Perform OCR
    const result = await lens.scanFile(filePath, {
      base64: base64Data,
      mimeType: 'image/jpeg',
      width: size.width,
      height: size.height
    });

    console.log('Scanned file:', filePath);
    console.log('Result:', result);
    
    return result;
  } catch (error) {
    console.error('Failed to scan local file:', error);
    throw error;
  }
}

// ============================================================================
// Example 5: Scan with Custom Headers and Cookies
// ============================================================================

export async function example5_ScanWithCustomHeaders() {
  const lens = new LensRN({
    headers: {
      'cookie': {
        '__Secure-ENID': {
          name: '__Secure-ENID',
          value: 'your-value-here',
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        },
        'NID': {
          name: 'NID',
          value: 'your-nid-value',
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
        }
      }
    },
    targetLanguage: 'en',
    chromeVersion: '124.0.6367.60',
  });
  
  const result = await lens.scanRemote('https://example.com/image.jpg');
  return result;
}

// ============================================================================
// Example 6: Batch Processing Multiple Images
// ============================================================================

export async function example6_BatchScan(imageUrls) {
  const lens = new LensRN();
  const results = [];
  
  for (const url of imageUrls) {
    try {
      console.log(`Scanning ${url}...`);
      const result = await lens.scanRemote(url);
      results.push({
        url,
        success: true,
        result
      });
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to scan ${url}:`, error);
      results.push({
        url,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// ============================================================================
// Example 7: Extract Specific Text Patterns (e.g., Phone Numbers)
// ============================================================================

export async function example7_ExtractPhoneNumbers(imageUrl) {
  const lens = new LensRN();
  
  try {
    const result = await lens.scanRemote(imageUrl);
    
    // Extract phone numbers using regex
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phoneNumbers = [];
    
    result.segments.forEach(segment => {
      const matches = segment.text.match(phoneRegex);
      if (matches) {
        phoneNumbers.push(...matches);
      }
    });
    
    console.log('Found phone numbers:', phoneNumbers);
    return phoneNumbers;
  } catch (error) {
    console.error('Failed to extract phone numbers:', error);
    throw error;
  }
}

// ============================================================================
// Example 8: Error Handling and Retry Logic
// ============================================================================

export async function example8_ScanWithRetry(imageUrl, maxRetries = 3) {
  const lens = new LensRN();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}`);
      const result = await lens.scanRemote(imageUrl);
      return result;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ============================================================================
// Example 9: React Component with OCR
// ============================================================================

import React, { useState } from 'react';
import { View, Button, Text, ScrollView, ActivityIndicator } from 'react-native';

export function OCRComponent() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lens = new LensRN();

  const scanImage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const pickerResult = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: true,
      });

      if (!pickerResult.didCancel && pickerResult.assets[0]) {
        const asset = pickerResult.assets[0];
        
        const ocrResult = await lens.scanBase64(
          asset.base64,
          asset.type || 'image/jpeg',
          asset.width,
          asset.height
        );

        setResult(ocrResult);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Button 
        title={loading ? "Processing..." : "Pick Image & Scan"} 
        onPress={scanImage}
        disabled={loading}
      />
      
      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}
      
      {error && (
        <Text style={{ color: 'red', marginTop: 20 }}>
          Error: {error}
        </Text>
      )}
      
      {result && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
            Language: {result.language}
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 10 }}>
            Detected Text ({result.segments.length} segments):
          </Text>
          {result.segments.map((segment, index) => (
            <View key={index} style={{ marginTop: 10 }}>
              <Text>• {segment.text}</Text>
              <Text style={{ fontSize: 10, color: '#666' }}>
                Position: ({segment.boundingBox.pixelCoords.x}, {segment.boundingBox.pixelCoords.y})
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ============================================================================
// Example 10: Using with Different Image Sources
// ============================================================================

export async function example10_MultipleSources() {
  const lens = new LensRN();
  
  // Source 1: Remote URL
  const remoteResult = await lens.scanRemote('https://example.com/image.jpg');
  console.log('Remote scan:', remoteResult);
  
  // Source 2: Base64 string
  const base64Data = 'your-base64-data-here';
  const base64Result = await lens.scanBase64(base64Data, 'image/jpeg', 1920, 1080);
  console.log('Base64 scan:', base64Result);
  
  // Source 3: Local file
  const filePath = RNFS.DocumentDirectoryPath + '/image.jpg';
  const fileBase64 = await RNFS.readFile(filePath, 'base64');
  const size = await ImageSize.getSize(filePath);
  const fileResult = await lens.scanFile(filePath, {
    base64: fileBase64,
    width: size.width,
    height: size.height
  });
  console.log('File scan:', fileResult);
  
  return {
    remote: remoteResult,
    base64: base64Result,
    file: fileResult
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert base64 to Uint8Array (alternative approach)
 */
export function base64ToUint8Array(base64) {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Format OCR result as plain text
 */
export function formatResultAsText(result) {
  return result.segments.map(s => s.text).join('\n');
}

/**
 * Get bounding boxes for all text
 */
export function getAllBoundingBoxes(result) {
  return result.segments.map((segment, index) => ({
    index,
    text: segment.text,
    coords: segment.boundingBox.pixelCoords
  }));
}
