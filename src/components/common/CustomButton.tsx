import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
}

export function CustomButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  icon,
  numberOfLines = 1,
  adjustsFontSizeToFit = true,
  minimumFontScale = 0.75,
}: CustomButtonProps) {
  const { colors } = useTheme();
  const isInteractive = !loading && !disabled;

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.primaryLight;
      case 'outline':
        return 'transparent';
      case 'danger':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return colors.primary;
    return colors.white;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={isInteractive ? onPress : undefined}
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          shadowColor: colors.shadow,
        },
        variant === 'outline' && {
          borderWidth: 1.5,
          borderColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? colors.primary : colors.white}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            numberOfLines={numberOfLines}
            adjustsFontSizeToFit={adjustsFontSizeToFit}
            minimumFontScale={minimumFontScale}
            style={[
              styles.textBase,
              { color: getTextColor() },
              icon ? styles.textWithIcon : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  textBase: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
  },
  textWithIcon: {
    marginLeft: 8,
  },
});
