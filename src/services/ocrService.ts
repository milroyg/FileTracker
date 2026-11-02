import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export interface OcrResult {
  text: string;
  imageUri: string;
}

/**
 * Captures a file subject banner using the camera,
 * provides a 16:4 aspect ratio crop (matching legacy UCrop),
 * and performs OCR text extraction.
 */
export async function captureAndExtractText(): Promise<OcrResult | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Camera permission is required to capture file subjects.');
  }

  // 1. Launch Camera with 16:4 aspect ratio crop
  const pickerResult = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [16, 4], // Replaces legacy Android UCrop 16:4 aspect ratio
    quality: 0.9,
  });

  if (pickerResult.canceled || !pickerResult.assets[0]?.uri) {
    return null;
  }

  const rawUri = pickerResult.assets[0].uri;

  // 2. Preprocess & normalize image size for OCR
  const manipulated = await ImageManipulator.manipulateAsync(
    rawUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
  );

  // 3. Attempt MLKit Text Recognition if native module is present
  let recognizedText = '';
  try {
    // Dynamic import to prevent crash in Expo Go / web if native module is not linked
    const MLKitTextRecognition = require('@react-native-ml-kit/text-recognition').default;
    if (MLKitTextRecognition?.recognize) {
      const result = await MLKitTextRecognition.recognize(manipulated.uri);
      recognizedText = result.text?.trim() || '';
    }
  } catch (err) {
    console.warn('MLKit native module not found or failed, falling back to manual entry:', err);
  }

  return {
    text: recognizedText,
    imageUri: manipulated.uri,
  };
}

