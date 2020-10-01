import { transparentize } from 'polished';

import { getButtonSizes, getButtonStyles } from './variants/button';
// Import defaults
import defaultBreakpoints from './breakpoints';
import defaultColors from './colors';
import defaultSpaces from './spaces';

export const generateTheme = ({ colors = defaultColors, space = defaultSpaces } = {}) => ({
  colors,
  space,
  breakpoints: defaultBreakpoints,
  buttons: getButtonStyles({ colors }),
  buttonSizes: getButtonSizes(),
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
      backgroundColor: colors.blue[50],
      borderColor: colors.blue[400],
      color: colors.black[800],
    },
    success: {
      backgroundColor: colors.green[100],
      borderColor: colors.green[500],
      color: colors.black[800],
    },
    warning: {
      backgroundColor: colors.yellow[50],
      borderColor: colors.yellow[500],
      color: colors.black[800],
    },
    error: {
      backgroundColor: colors.red[100],
      borderColor: colors.red[500],
      color: colors.black[800],
    },
  },
  sizes: {
    navbarHeight: 68,
  },
});

// Generate and export main theme
const theme = generateTheme();
export default theme;
