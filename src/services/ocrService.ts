import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { logger } from '../utils/logger';

export interface OcrResult {
  text: string;
  imageUri: string;
}

/**
 * Photographs a file's subject banner with a 16:4 crop (matching the legacy
 * UCrop flow) and runs on-device MLKit text recognition on it.
 * Returns null if the user cancels the camera.
 */
export async function captureAndExtractText(): Promise<OcrResult | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Camera permission is required to capture file subjects.');
  }

  const pickerResult = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [16, 4],
    quality: 0.9,
  });
  const rawUri = pickerResult.canceled ? undefined : pickerResult.assets[0]?.uri;
  if (!rawUri) return null;

  // Normalize size so recognition is fast and consistent across cameras.
  const context = ImageManipulator.ImageManipulator.manipulate(rawUri);
  context.resize({ width: 1200 });
  const rendered = await context.renderAsync();
  const manipulated = await rendered.saveAsync({
    compress: 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return { text: await recognizeText(manipulated.uri), imageUri: manipulated.uri };
}

/**
 * Loaded lazily: the MLKit native module only exists in dev/production
 * builds, so a client without it gets '' instead of crashing at import time.
 */
async function recognizeText(imageUri: string): Promise<string> {
  try {
    const mlkit = await import('@infinitered/react-native-mlkit-text-recognition');
    const result = await mlkit.recognizeText(imageUri);
    return result?.text?.trim() ?? '';
  } catch (error) {
    logger.warn('[OCR] MLKit text recognition unavailable in this build:', error);
    return '';
  }
}
