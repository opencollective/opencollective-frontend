/**
 * Implement the colors from https://www.figma.com/file/1jyGC3MjtqI7uUsGf1447P/DS-03-%2F-Colors?node-id=1146%3A643
 */

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
  /** Info - right now the colors are the same as primary */
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

export default defaultColors;
