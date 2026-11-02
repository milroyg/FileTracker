import { TextStyle, StyleSheet } from 'react-native';

export const fontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
};

export const typography = StyleSheet.create({
  headerTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyBold: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  button: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
  },
  badge: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
  },
});
