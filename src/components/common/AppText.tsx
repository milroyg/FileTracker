import React, { createContext, useContext } from 'react';
import { Text, type TextProps } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies, typography } from '../../theme/typography';

export type AppTextVariant = keyof typeof typography;

export interface AppTextProps extends TextProps {
  /** Optional preset from theme/typography; omit to style purely via `style`. */
  variant?: AppTextVariant;
  color?: string;
}

/** True inside another AppText, where font and colour should be inherited. */
const NestedTextContext = createContext(false);

/**
 * The app's only Text component (enforced by eslint.config.js). A top-level
 * AppText applies the Inter font and the theme's text colour so a device font
 * setting can never override them; a nested AppText inherits both from its
 * parent, exactly like nested RN <Text>. `style` always wins.
 */
export function AppText({ style, variant, color, children, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const isNested = useContext(NestedTextContext);

  const base = isNested
    ? color
      ? { color }
      : null
    : { fontFamily: fontFamilies.regular, color: color ?? colors.text };

  return (
    <NestedTextContext.Provider value>
      <Text style={[base, variant ? typography[variant] : null, style]} {...rest}>
        {children}
      </Text>
    </NestedTextContext.Provider>
  );
}
