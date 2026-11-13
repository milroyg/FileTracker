import React, { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import SpInAppUpdates, {
  IAUInstallStatus,
  IAUUpdateKind,
  type StatusUpdateEvent,
} from 'sp-react-native-in-app-updates';
import { CustomDialog } from './CustomDialog';
import { logger } from '../../utils/logger';

/**
 * Mounted once near the app root (see App.tsx). Checks the store for a newer
 * published build and prompts the user to get it:
 *
 * - Android: Play Core's native "Update available" flow (FLEXIBLE), which
 *   downloads in the background; once it's downloaded, our own restart prompt
 *   lets the user apply it when they're ready instead of mid-scan.
 * - iOS: no Play Core equivalent, so the library falls back to its App Store
 *   lookup and shows its own native alert.
 *
 * Builds with no matching store listing (dev clients, internal APKs) make the
 * check fail, which is swallowed — it must never block the app from opening.
 */
export function AppUpdateGate() {
  const [showRestartPrompt, setShowRestartPrompt] = useState(false);
  const inAppUpdates = useMemo(() => new SpInAppUpdates(__DEV__), []);

  useEffect(() => {
    const onStatusUpdate = (event: StatusUpdateEvent) => {
      if (event.status === IAUInstallStatus.DOWNLOADED) setShowRestartPrompt(true);
    };

    if (Platform.OS === 'android') {
      inAppUpdates.addStatusUpdateListener(onStatusUpdate);
    }

    inAppUpdates
      .checkNeedsUpdate()
      .then((result) => {
        if (!result.shouldUpdate) return;
        if (Platform.OS === 'android') {
          return inAppUpdates.startUpdate({ updateType: IAUUpdateKind.FLEXIBLE });
        }
        return inAppUpdates.startUpdate({
          title: 'Update Available',
          message:
            'A new version of WRD File Tracker is available. Update now for the latest features and fixes.',
          buttonUpgradeText: 'Update Now',
          buttonCancelText: 'Later',
        });
      })
      .catch((error) => logger.debug('[AppUpdateGate] Update check skipped:', error));

    return () => {
      if (Platform.OS === 'android') {
        inAppUpdates.removeStatusUpdateListener(onStatusUpdate);
      }
    };
  }, [inAppUpdates]);

  return (
    <CustomDialog
      visible={showRestartPrompt}
      type="info"
      title="Update Ready"
      message="The update has finished downloading. Restart now to finish installing it."
      buttons={[
        { text: 'Later', style: 'cancel', onPress: () => setShowRestartPrompt(false) },
        {
          text: 'Restart',
          onPress: () => {
            setShowRestartPrompt(false);
            inAppUpdates.installUpdate();
          },
        },
      ]}
      onClose={() => setShowRestartPrompt(false)}
    />
  );
}
