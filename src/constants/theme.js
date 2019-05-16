import { variant } from 'styled-system';
import { transparentize } from 'polished';

export const colors = {
  black: {
    900: '#090A0A',
    800: '#313233',
    700: '#4E5052',
    600: '#76777A',
    500: '#9D9FA3',
    400: '#C4C7CC',
    300: '#DCDEE0',
    200: '#E8E9EB',
    100: '#F2F3F5',
    50: '#F7F8FA',
    transparent: {
      90: 'rgba(19, 20, 20, 0.90)',
      80: 'rgba(19, 20, 20, 0.80)',
      40: 'rgba(19, 20, 20, 0.4)',
      20: 'rgba(19, 20, 20, 0.2)',
      8: 'rgba(19, 20, 20, 0.08)',
    },
  },
  green: {
    700: '#00A34C',
    500: '#00CC36',
    300: '#6CE0A2',
    100: '#E6FAEF',
  },
  primary: {
    800: '#0041A3',
    700: '#145ECC',
    500: '#3385FF',
    400: '#66A3FF',
    300: '#99C9FF',
    200: '#B8DEFF',
    100: '#EBF4FF',
    50: '#F0F8FF',
  },
  red: {
    700: '#CC1836',
    500: '#F53152',
    300: '#FF99AA',
    100: '#FFF2F4',
  },
  secondary: {
    700: '#9BC200',
    500: '#AFDB00',
    400: '#D3E58A',
    100: '#F2FAD2',
  },
  white: {
    full: '#FFFFFF',
    transparent: {
      72: 'rgba(255, 255, 255, 0.72)',
      48: 'rgba(255, 255, 255, 0.48)',
    },
  },
  yellow: {
    700: '#E0B700',
    500: '#F5CC00',
    300: '#FFEB85',
    100: '#FFFBE5',
  },
};

const fontSizes = {
  H1: 52,
  H2: 40,
  H3: 32,
  H4: 24,
  H5: 20,
  H6: 9,
  LeadParagraph: 16,
  Paragraph: 14,
  Caption: 12,
  Tiny: 10,
};

const lineHeights = {
  H1: '56px',
  H2: '44px',
  H3: '36px',
  H4: '32px',
  H5: '24px',
  H6: '14px',
  LeadParagraph: '24px',
  Paragraph: '20px',
  Caption: '18px',
  Tiny: '14px',
};

// using default space values from styled-system
const space = [0, 4, 8, 16, 32, 64, 128, 256, 512];

const theme = {
  colors,
  fontSizes,
  lineHeights,
  space,
  breakpoints: [
    '40em', //  640px - mobile
    '52em', //  832px - tablet
    '64em', // 1024px - desktop
    '88em', // 1408px - widescreen
  ],
  buttons: {
    standard: {
      backgroundColor: 'white',
      border: '1px solid',
      borderColor: colors.black[300],
      borderRadius: '100px',
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
        cursor: 'not-allowed',
      },
    },

    primary: {
      backgroundColor: colors.primary[500],
      border: '1px solid',
      borderColor: colors.primary[500],
      borderRadius: '100px',
      color: 'white',

      '&:hover': {
        backgroundColor: colors.primary[700],
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
        cursor: 'not-allowed',
      },
    },

    dark: {
      backgroundColor: colors.black[900],
      color: colors.white.full,
      border: '1px solid',
      borderColor: colors.black[900],
      borderRadius: '100px',
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
      backgroundColor: colors.primary[50],
      borderColor: colors.primary[500],
      color: colors.primary[700],
    },
    success: {
      backgroundColor: colors.green[100],
      borderColor: colors.green[500],
      color: colors.green[700],
    },
    warning: {
      backgroundColor: colors.yellow[100],
      borderColor: colors.yellow[700],
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
};

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

export default theme;

function toPx(value) {
  return `${value}px`;
}
