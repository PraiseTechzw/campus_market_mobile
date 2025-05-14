import { Platform } from 'react-native';

export const FONTS = {
  regular: Platform.select({
    ios: 'Poppins-Regular',
    android: 'Poppins-Regular',
  }),
  medium: Platform.select({
    ios: 'Poppins-Medium',
    android: 'Poppins-Medium',
  }),
  semiBold: Platform.select({
    ios: 'Poppins-SemiBold',
    android: 'Poppins-SemiBold',
  }),
  bold: Platform.select({
    ios: 'Poppins-Bold',
    android: 'Poppins-Bold',
  }),
  light: Platform.select({
    ios: 'Poppins-Light',
    android: 'Poppins-Light',
  }),
  thin: Platform.select({
    ios: 'Poppins-Thin',
    android: 'Poppins-Thin',
  }),
  extraLight: Platform.select({
    ios: 'Poppins-ExtraLight',
    android: 'Poppins-ExtraLight',
  }),
  extraBold: Platform.select({
    ios: 'Poppins-ExtraBold',
    android: 'Poppins-ExtraBold',
  }),
  black: Platform.select({
    ios: 'Poppins-Black',
    android: 'Poppins-Black',
  }),
  italic: Platform.select({
    ios: 'Poppins-Italic',
    android: 'Poppins-Italic',
  }),
  mediumItalic: Platform.select({
    ios: 'Poppins-MediumItalic',
    android: 'Poppins-MediumItalic',
  }),
  semiBoldItalic: Platform.select({
    ios: 'Poppins-SemiBoldItalic',
    android: 'Poppins-SemiBoldItalic',
  }),
  boldItalic: Platform.select({
    ios: 'Poppins-BoldItalic',
    android: 'Poppins-BoldItalic',
  }),
  lightItalic: Platform.select({
    ios: 'Poppins-LightItalic',
    android: 'Poppins-LightItalic',
  }),
  thinItalic: Platform.select({
    ios: 'Poppins-ThinItalic',
    android: 'Poppins-ThinItalic',
  }),
  extraLightItalic: Platform.select({
    ios: 'Poppins-ExtraLightItalic',
    android: 'Poppins-ExtraLightItalic',
  }),
  extraBoldItalic: Platform.select({
    ios: 'Poppins-ExtraBoldItalic',
    android: 'Poppins-ExtraBoldItalic',
  }),
  blackItalic: Platform.select({
    ios: 'Poppins-BlackItalic',
    android: 'Poppins-BlackItalic',
  }),
}; 