import { StyleSheet } from 'react-native';
import { FONTS } from './Fonts';

export const globalStyles = StyleSheet.create({
  // Text styles
  textRegular: {
    fontFamily: FONTS.regular,
  },
  textMedium: {
    fontFamily: FONTS.medium,
  },
  textSemiBold: {
    fontFamily: FONTS.semiBold,
  },
  textBold: {
    fontFamily: FONTS.bold,
  },
  textLight: {
    fontFamily: FONTS.light,
  },
  textThin: {
    fontFamily: FONTS.thin,
  },
  textExtraLight: {
    fontFamily: FONTS.extraLight,
  },
  textExtraBold: {
    fontFamily: FONTS.extraBold,
  },
  textBlack: {
    fontFamily: FONTS.black,
  },
  
  // Heading styles
  h1: {
    fontFamily: FONTS.bold,
    fontSize: 32,
  },
  h2: {
    fontFamily: FONTS.semiBold,
    fontSize: 24,
  },
  h3: {
    fontFamily: FONTS.medium,
    fontSize: 20,
  },
  h4: {
    fontFamily: FONTS.medium,
    fontSize: 18,
  },
  
  // Body text styles
  bodyLarge: {
    fontFamily: FONTS.regular,
    fontSize: 16,
  },
  bodyMedium: {
    fontFamily: FONTS.regular,
    fontSize: 14,
  },
  bodySmall: {
    fontFamily: FONTS.regular,
    fontSize: 12,
  },
  
  // Button text styles
  buttonText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
  },
  
  // Label styles
  label: {
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
}); 