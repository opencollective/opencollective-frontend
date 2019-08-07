import { variant } from 'styled-system';
import { transparentize } from 'polished';

const ocBrandColors = {
  900: '#0C2D66',
  800: '#1041A3',
  700: '#1153D6',
  600: '#1869F5',
  500: '#297EFF',
  400: '#5CA3FF',
  300: '#8FC7FF',
  200: '#C2E2FF',
  100: '#E6F3FF',
  50: '#F5FAFF',
};

const defaultColors = {
  /** White */
  white: {
    full: '#FFFFFF',
    transparent: {
      72: 'rgba(255, 255, 255, 0.72)',
      48: 'rgba(255, 255, 255, 0.48)',
    },
  },
  /** Black, neutral */
  black: {
    900: '#141414',
    800: '#313233',
    700: '#4E5052',
    600: '#76777A',
    500: '#9D9FA3',
    400: '#C4C7CC',
    300: '#DCDEE0',
    200: '#E8E9EB',
    100: '#F0F1F2',
    50: '#F7F8FA',
    transparent: {
      90: 'rgba(19, 20, 20, 0.90)',
      80: 'rgba(19, 20, 20, 0.80)',
      40: 'rgba(19, 20, 20, 0.4)',
      20: 'rgba(19, 20, 20, 0.2)',
      8: 'rgba(19, 20, 20, 0.08)',
    },
  },
  /** Primary */
  primary: ocBrandColors,
  /** Info - right now the colors are the same than prumary */
  blue: ocBrandColors,
  /** Success, Approve */
  green: {
    900: '#005728',
    800: '#007A39',
    700: '#009E4A',
    600: '#16B861',
    500: '#18CC6C',
    400: '#36E085',
    300: '#83EBB4',
    200: '#BEFADA',
    100: '#D6FFE9',
    50: '#F0FFF7',
  },
  /** Warning, Alert */
  yellow: {
    900: '#703C00',
    800: '#945400',
    700: '#B86E00',
    600: '#DB8B00',
    500: '#FFAA00',
    400: '#FFC94D',
    300: '#FFEB85',
    200: '#FFF5C2',
    100: '#FFFAE0',
  },
  /** Danger, Error */
  red: {
    900: '#5C071E',
    800: '#850B2B',
    700: '#B80F3C',
    600: '#D60940',
    500: '#F51D57',
    400: '#FF4778',
    300: '#FF85A5',
    200: '#FFC2D2',
    100: '#FFEBF0',
    50: '#FFF7F9',
  },
};

const defaultFontSizes = {
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

const defaultLineHeights = {
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
const defaultSpace = [0, 4, 8, 16, 32, 64, 128, 256, 512];

export const generateTheme = ({
  colors = defaultColors,
  fontSizes = defaultFontSizes,
  lineHeights = defaultLineHeights,
  space = defaultSpace,
} = {}) => ({
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
      backgroundColor: colors.blue[50],
      borderColor: colors.blue[500],
      color: colors.blue[700],
    },
    success: {
      backgroundColor: colors.green[100],
      borderColor: colors.green[500],
      color: colors.green[700],
    },
    warning: {
      backgroundColor: colors.yellow[100],
      borderColor: colors.yellow[500],
      color: colors.yellow[500],
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

const theme = generateTheme();

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
