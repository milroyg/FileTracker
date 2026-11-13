import React, { useState, useEffect } from 'react';
import { StatusBar, StatusBarProps, Platform } from 'react-native';

interface FocusAwareStatusBarProps extends StatusBarProps {
  navigation: {
    addListener: (event: 'focus' | 'blur', callback: () => void) => () => void;
  };
}

/**
 * FocusAwareStatusBar
 * Automatically synchronizes the device Status Bar (style, background color, translucency)
 * with the active screen on both iOS and Android in Light and Dark mode.
 */
export function FocusAwareStatusBar({ navigation, ...props }: FocusAwareStatusBarProps) {
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    const applyStatusBar = () => {
      if (props.barStyle) {
        StatusBar.setBarStyle(props.barStyle, true);
      }
      if (Platform.OS === 'android' && props.backgroundColor) {
        StatusBar.setBackgroundColor(props.backgroundColor, true);
      }
    };

    // Apply immediately when screen mounts
    applyStatusBar();

    const unsubscribeFocus = navigation.addListener('focus', () => {
      setIsFocused(true);
      applyStatusBar();
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      setIsFocused(false);
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation, props.barStyle, props.backgroundColor]);

  return isFocused ? <StatusBar {...props} /> : null;
}

