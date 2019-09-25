import { variant } from 'styled-system';
import { transparentize } from 'polished';

// Import defaults
import defaultBreakpoints from './breakpoints';
import defaultColors from './colors';
import defaultSpaces from './spaces';
import { defaultFontSizes, defaultLineHeights } from './text-sizes';

function toPx(value) {
  return `${value}px`;
}

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
  buttons: {
    standard: {
      backgroundColor: 'white',
      borderColor: colors.black[300],
      color: colors.black[600],

      '&:hover': {
        borderColor: colors.primary[300],
        color: colors.primary[400],
      },

      '&:focus': {
        backgroundColor: 'white',
        borderColor: colors.primary[400],
      },

      '&:active': {
        backgroundColor: colors.primary[500],
        borderColor: colors.primary[500],
        color: 'white',
      },

      '&:disabled': {
        backgroundColor: colors.black[50],
        borderColor: colors.black[200],
        color: colors.black[300],
      },
    },

    primary: {
      backgroundColor: colors.primary[500],
      borderColor: colors.primary[500],
      color: 'white',

      '&:hover': {
        backgroundColor: colors.primary[700],
        borderColor: colors.primary[700],
        color: 'white',
      },

      '&:focus': {
        backgroundColor: colors.primary[500],
        borderColor: colors.primary[700],
      },

      '&:active': {
        backgroundColor: colors.primary[800],
        borderColor: colors.primary[800],
        color: 'white',
      },

      '&:disabled': {
        backgroundColor: colors.primary[50],
        color: colors.primary[200],
        borderColor: colors.primary[50],
      },
    },

    secondary: {
      backgroundColor: colors.white.full,
      borderColor: colors.primary[500],
      color: colors.primary[600],

      '&:hover': {
        backgroundColor: colors.black[50],
      },

      '&:focus': {
        borderColor: colors.primary[700],
      },

      '&:active': {
        backgroundColor: colors.primary[600],
        borderColor: colors.primary[600],
        color: 'white',
      },

      '&:disabled': {
        background: colors.white.full,
        color: colors.black[300],
        borderColor: colors.black[300],
      },
    },

    dark: {
      backgroundColor: colors.black[700],
      color: colors.white.full,
      borderColor: colors.black[700],

      '&:hover': {
        backgroundColor: colors.black[900],
      },

      '&:disabled': {
        backgroundColor: colors.black[200],
        borderColor: colors.black[200],
      },
    },
  },
  buttonSizes: {
    large: {
      fontSize: toPx(fontSizes.LeadParagraph),
      lineHeight: toPx(fontSizes.LeadParagraph + 2),
      paddingBottom: toPx(space[3]),
      paddingLeft: toPx(space[5]),
      paddingRight: toPx(space[5]),
      paddingTop: toPx(space[3]),
    },

    medium: {
      fontSize: toPx(fontSizes.Paragraph),
      lineHeight: toPx(fontSizes.Paragraph + 7),
      paddingBottom: toPx(space[2]),
      paddingLeft: toPx(space[3]),
      paddingRight: toPx(space[3]),
      paddingTop: toPx(space[2]),
    },

    small: {
      fontSize: toPx(fontSizes.Caption),
      lineHeight: toPx(fontSizes.Caption + 2),
      paddingBottom: toPx(space[1]),
      paddingLeft: toPx(space[2]),
      paddingRight: toPx(space[2]),
      paddingTop: toPx(space[1]),
    },
  },
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
      borderColor: colors.blue[500],
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

// Export variants
export const buttonStyle = variant({
  key: 'buttons',
  prop: 'buttonStyle',
});

export const buttonSize = variant({
  key: 'buttonSizes',
  prop: 'buttonSize',
});

export const messageType = variant({
  key: 'messageTypes',
  prop: 'type',
});

// Generate and export main theme
const theme = generateTheme();
export default theme;
