import { transparentize } from 'polished';

// Import defaults
import defaultBreakpoints from './breakpoints';
import defaultColors from './colors';
import defaultSpaces from './spaces';
import { defaultFontSizes, defaultLineHeights } from './text-sizes';
import { getButtonSizes, getButtonStyles } from './variants/button';

export const generateTheme = ({
  colors = defaultColors,
  fontSizes = defaultFontSizes,
  lineHeights = defaultLineHeights,
  space = defaultSpaces,
} = {}) => ({
  colors,
  fontSizes,
  lineHeights,
  space,
  breakpoints: defaultBreakpoints,
  buttons: getButtonStyles({ colors }),
  buttonSizes: getButtonSizes({ fontSizes, space }),
  messageTypes: {
    white: {
      backgroundColor: colors.white.full,
      borderColor: colors.black[200],
    },
    dark: {
      backgroundColor: transparentize(0.2, colors.black[900]),
      borderColor: colors.black[900],
      color: colors.white.full,
    },
    info: {
      backgroundColor: colors.blue[100],
      borderColor: colors.blue[400],
      color: colors.blue[500],
    },
    success: {
      backgroundColor: colors.green[100],
      borderColor: colors.green[500],
      color: colors.green[700],
    },
    warning: {
      backgroundColor: colors.yellow[100],
      borderColor: colors.yellow[500],
      color: colors.yellow[700],
    },
    error: {
      backgroundColor: colors.red[100],
      borderColor: colors.red[500],
      color: colors.red[700],
    },
  },
  sizes: {
    navbarHeight: 68,
  },
});

// Generate and export main theme
const theme = generateTheme();
export default theme;
