import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { WifiOff, Wifi } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [isOffline, setIsOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const hasMountedRef = useRef(false);

  // Animation controller for sliding down from top
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    // Initial connectivity check
    NetInfo.fetch().then((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
      hasMountedRef.current = true;
    });

    // Real-time network listener
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;

      if (hasMountedRef.current) {
        if (!offline && isOffline) {
          // Just reconnected: show temporary "Back Online" banner
          setShowRestored(true);
          setTimeout(() => {
            setShowRestored(false);
          }, 2500);
        }
      }

      setIsOffline(offline);
      hasMountedRef.current = true;
    });

    return () => unsubscribe();
  }, [isOffline]);

  const isVisible = isOffline || showRestored;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, translateY]);

  const isRestored = !isOffline && showRestored;
  const bannerBg = isRestored ? colors.success : colors.error;
  const statusText = isRestored
    ? 'Back Online • Connected to internet'
    : 'No Internet Connection • Offline Mode';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bannerBg,
          paddingTop: Math.max(insets.top, 8) + 6,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <View style={styles.contentRow}>
        {isRestored ? (
          <Wifi size={16} color={colors.white} style={styles.icon} />
        ) : (
          <WifiOff size={16} color={colors.white} style={styles.icon} />
        )}
        <Text style={[styles.text, { color: colors.white }]}>{statusText}</Text>
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
