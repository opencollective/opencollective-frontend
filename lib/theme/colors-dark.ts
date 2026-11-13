/**
 * Dark variant of the legacy (styled-components) colors, used by the dashboard when dark mode is enabled.
 * Mirrors the Tailwind dark palette defined in `public/static/styles/app.css`:
 * - `white` is the base surface and the `black` (neutral) scale is inverted.
 * - Light tints (50-300) become subtle tints of the surface, mid tones (400-600) are kept and dark shades (700-900)
 *   become their light counterparts.
 */
import type defaultColors from './colors';

const primary = {
  900: '#E5F3FF',
  800: '#C2E2FF',
  700: '#8FC7FF',
  600: '#1869F5',
  500: '#297EFF',
  400: '#5CA3FF',
  300: '#1E3B69',
  200: '#1A2C4A',
  100: '#162235',
  50: '#141C29',
};

const darkColors: typeof defaultColors = {
  white: {
    full: '#101215',
    transparent: {
      72: 'rgba(16, 18, 21, 0.72)',
      48: 'rgba(16, 18, 21, 0.48)',
    },
  },
  black: {
    900: '#E5ECF6',
    800: '#D1D8E2',
    700: '#BAC1CB',
    600: '#A5ABB5',
    500: '#899099',
    400: '#636972',
    300: '#3A4048',
    200: '#262C33',
    100: '#1A2027',
    50: '#141920',
    transparent: {
      90: 'rgba(229, 236, 246, 0.90)',
      80: 'rgba(229, 236, 246, 0.80)',
      40: 'rgba(229, 236, 246, 0.4)',
      20: 'rgba(229, 236, 246, 0.2)',
      8: 'rgba(229, 236, 246, 0.08)',
    },
  },
  primary,
  blue: primary,
  green: {
    900: '#E6FAEF',
    800: '#BEFADA',
    700: '#90F0BD',
    600: '#128145',
    500: '#0EA755',
    400: '#51E094',
    300: '#1D482F',
    200: '#1A3426',
    100: '#172620',
    50: '#141E1C',
  },
  yellow: {
    900: '#FFFFC2',
    800: '#FAFAAA',
    700: '#F5F576',
    600: '#CCCC18',
    500: '#E0E01B',
    400: '#EBEB2F',
    300: '#595C2A',
    200: '#3D4025',
    100: '#2B2D20',
    50: '#20231C',
  },
  red: {
    900: '#FFEBF0',
    800: '#FFC2D2',
    700: '#FA82A2',
    600: '#CC2955',
    500: '#DC416A',
    400: '#F55882',
    300: '#5B2835',
    200: '#40212A',
    100: '#2D1B22',
    50: '#22181D',
  },
  purple: {
    900: '#EDEBFF',
    800: '#D7D1FF',
    700: '#B8ADFF',
    600: '#5C48E0',
    500: '#6F5AFA',
    400: '#8C7AFF',
    300: '#312F68',
    200: '#252549',
    100: '#1C1E34',
    50: '#171928',
  },
};

export default darkColors;
