import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff, Wifi } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { isOnline } from '../../utils/network';
import { useOutbox } from '../../hooks/useOutbox';
import { AppText } from './AppText';

const HIDDEN_OFFSET = -120;
const RESTORED_BANNER_MS = 3000;

/**
 * Slides down while the device is offline, and briefly confirms when the
 * connection returns. Syncing itself is handled by useOutboxAutoSync.
 */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items } = useOutbox();
  const [isOffline, setIsOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const [translateY] = useState(() => new Animated.Value(HIDDEN_OFFSET));

  useEffect(() => {
    let wasOffline = false;
    let restoredTimer: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !isOnline(state);
      setIsOffline(offline);
      if (wasOffline && !offline) {
        setShowRestored(true);
        clearTimeout(restoredTimer);
        restoredTimer = setTimeout(() => setShowRestored(false), RESTORED_BANNER_MS);
      }
      wasOffline = offline;
    });

    return () => {
      unsubscribe();
      clearTimeout(restoredTimer);
    };
  }, []);

  const isVisible = isOffline || showRestored;

  useEffect(() => {
    const animation = isVisible
      ? Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 50,
        })
      : Animated.timing(translateY, {
          toValue: HIDDEN_OFFSET,
          duration: 250,
          useNativeDriver: true,
        });
    animation.start();
    return () => animation.stop();
  }, [isVisible, translateY]);

  const pendingCount = items.filter((item) => item.status === 'pending').length;
  const isRestored = !isOffline && showRestored;
  const statusText = isRestored
    ? pendingCount > 0
      ? `Back Online • Syncing ${pendingCount} saved action${pendingCount === 1 ? '' : 's'}`
      : 'Back Online • Connected to WRD server'
    : 'No Internet Connection • Offline Mode';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isRestored ? colors.success : colors.error,
          paddingTop: Math.max(insets.top, 8) + 6,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.contentRow}>
        {isRestored ? (
          <Wifi size={16} color={colors.white} style={styles.icon} />
        ) : (
          <WifiOff size={16} color={colors.white} style={styles.icon} />
        )}
        <AppText style={[styles.text, { color: colors.white }]}>{statusText}</AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    paddingBottom: 10,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    letterSpacing: 0.1,
  },
});
