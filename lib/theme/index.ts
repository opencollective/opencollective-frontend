// A global namespace on StyledComponents's theme// import original module declarations
import 'styled-components';

import { transparentize } from 'polished';

import { getButtonSizes, getButtonStyles } from './variants/button.ts';
// Import defaults
import defaultBreakpoints from './breakpoints.ts';
import defaultColors from './colors.ts';
import defaultSpaces from './spaces.ts';

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
      backgroundColor: colors.green[50],
      borderColor: colors.green[500],
      color: colors.black[800],
    },
    warning: {
      backgroundColor: colors.yellow[50],
      borderColor: colors.yellow[500],
      color: colors.black[800],
    },
    error: {
      backgroundColor: colors.red[50],
      borderColor: colors.red[500],
      color: colors.black[800],
    },
  },
  sizes: {
    navbarHeight: 64,
  },
});

// Generate and export main theme
const theme = generateTheme();
export default theme;

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: typeof theme.colors;
    space: typeof theme.space;
    breakpoints: typeof theme.breakpoints;
    buttons: typeof theme.buttons;
    buttonSizes: typeof theme.buttonSizes;
    messageTypes: typeof theme.messageTypes;
    sizes: typeof theme.sizes;
  }
}
