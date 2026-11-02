import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';

export interface AppTextProps extends TextProps {
  variant?: 'header' | 'title' | 'body' | 'bodyMedium' | 'bold' | 'caption' | 'badge';
  color?: string;
}

/**
 * Standard compulsory Text component for the WRD File Tracker application.
 * Guarantees that the official Inter font family is applied strictly across
 * all iOS and Android devices, preventing any user custom device font from overriding it.
 */
export function AppText({
  style,
  variant = 'body',
  color,
  children,
  ...rest
}: AppTextProps) {
  const { colors, typography } = useTheme();

  const variantStyle = {
    header: typography.headerTitle,
    title: typography.sectionTitle,
    body: typography.body,
    bodyMedium: typography.bodyMedium,
    bold: typography.bodyBold,
    caption: typography.caption,
    badge: typography.badge,
  }[variant];

  return (
    <Text
      style={[
        styles.defaultFont,
        variantStyle,
        { color: color || colors.text },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  defaultFont: {
    fontFamily: fontFamilies.regular,
  },
});

