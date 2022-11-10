import { desaturate, lighten, opacify } from 'polished';
import { variant } from 'styled-system';

import { getTopToBottomGradient } from '../helpers';

// Types
export type ButtonSize = 'tiny' | 'small' | 'medium' | 'large' | 'xLarge';
export type ButtonStyle =
  | 'standard'
  | 'primary'
  | 'secondary'
  | 'warning'
  | 'warningSecondary'
  | 'danger'
  | 'dangerSecondary'
  | 'success'
  | 'successSecondary'
  | 'borderless'
  | 'purple'
  | 'purpleSecondary'
  | 'dark'
  | 'marketing'
  | 'marketingSecondary';

// Button size
export const buttonSize = variant({
  key: 'buttonSizes',
  prop: 'buttonSize',
});

export const getButtonSizes = (): Record<ButtonSize, Record<string, any>> => {
  return {
    xLarge: {
      fontSize: 17,
      lineHeight: '18px',
      paddingBottom: 22,
      paddingLeft: 48,
      paddingRight: 48,
      paddingTop: 22,
    },

    large: {
      fontSize: '16px',
      lineHeight: '17px',
      paddingBottom: 18,
      paddingLeft: 40,
      paddingRight: 40,
      paddingTop: 18,
    },

    medium: {
      fontSize: '14px',
      lineHeight: '17px',
      paddingBottom: 14,
      paddingLeft: 24,
      paddingRight: 24,
      paddingTop: 14,
    },

    small: {
      fontSize: '13px',
      lineHeight: '21px',
      paddingBottom: 11,
      paddingLeft: 20,
      paddingRight: 20,
      paddingTop: 11,
    },

    tiny: {
      fontSize: '12px',
      lineHeight: '12px',
      letterSpacing: 0,
      paddingBottom: 5,
      paddingLeft: 14,
      paddingRight: 14,
      paddingTop: 5,
    },
  };
};

// Button style

export const buttonStyle = variant({
  key: 'buttons',
  prop: 'buttonStyle',
});

/**
 * Generates a variant for a `buttonStyle`
 */
const generateButtonVariant = ({
  baseColor,
  baseGradientColor = baseColor,
  baseTextColor = '#FFFFFF',
  hoverColor,
  hoverGradientColor = hoverColor,
  activeColor,
  focusBorderColor = undefined,
  disabledColor,
  disabledTextColor = baseTextColor,
}) => {
  const variantStyles = {
    background: getTopToBottomGradient(baseColor, baseGradientColor),
    backgroundColor: baseColor, // Not all browsers support gradients, this is a fallback for them
    borderColor: baseColor,
    color: baseTextColor,

    '&:hover': {
      background: getTopToBottomGradient(hoverColor, hoverGradientColor),
      backgroundColor: hoverColor,
      borderColor: hoverColor,
      color: baseTextColor,
    },

    '&:focus': {
      borderColor: focusBorderColor,
    },

    '&:active': {
      background: activeColor,
      backgroundColor: activeColor,
      borderColor: activeColor,
    },

    '&:disabled': {
      background: disabledColor,
      backgroundColor: disabledColor,
      borderColor: disabledColor,
      color: disabledTextColor || baseTextColor,
    },
  };

  if (focusBorderColor) {
    variantStyles['&:focus'] = {
      borderColor: focusBorderColor,
    };
  }

  return variantStyles;
};

/**
 * Similar to generateButtonVariant, but to generate secondary buttons
 */
const generateSecondaryButtonVariant = ({
  baseColor,
  baseTextColor,
  activeTextColor = '#FFFFFF',
  hoverColor,
  activeColor,
  activeBackgroundColor = activeColor,
  focusColor = '#FFFFFF',
  disabledColor,
  disabledBorderColor = disabledColor,
}) => {
  return {
    background: '#FFFFFF',
    backgroundColor: '#FFFFFF', // Not all browsers support gradients, this is a fallback for them
    borderColor: baseColor,
    color: baseTextColor,

    '&:hover:not(:disabled):not(:active)': {
      background: hoverColor,
    },

    '&:focus': {
      background: focusColor,
    },

    '&:active': {
      background: activeBackgroundColor || activeColor,
      backgroundColor: activeBackgroundColor || activeColor,
      borderColor: activeColor,
      color: activeTextColor,
    },

    '&:disabled': {
      borderColor: disabledBorderColor,
      color: disabledColor,
    },
  };
};

/**
 * Generate buttons styles based on the colors defined in https://www.figma.com/file/1jyGC3MjtqI7uUsGf1447P/%5BDS%5D-01-Colors?node-id=1354%3A2
 */
export const getButtonStyles = ({ colors }): Record<ButtonStyle, Record<string, any>> => {
  return {
    // Base
    standard: {
      backgroundColor: 'white',
      borderColor: colors.black[300],
      color: colors.black[800],

      '&:hover,&:focus': {
        backgroundColor: colors.black[50],
        borderColor: colors.black[50],
      },

      '&:active': {
        background: colors.black[900],
        backgroundColor: colors.black[900],
        borderColor: colors.black[900],
        color: 'white',
      },

      '&:disabled': {
        backgroundColor: 'white',
        borderColor: colors.black[200],
        color: colors.black[300],
      },
    },

    primary: generateButtonVariant({
      baseColor: colors.primary[600],
      baseGradientColor: lighten(0.025, colors.primary[700]),
      hoverColor: colors.primary[500],
      hoverGradientColor: colors.primary[600],
      activeColor: colors.primary[800],
      disabledColor: colors.primary[100],
    }),

    secondary: generateSecondaryButtonVariant({
      baseColor: colors.primary[500],
      baseTextColor: colors.primary[600],
      hoverColor: colors.primary[50],
      activeColor: colors.primary[700],
      disabledColor: desaturate(0.4, colors.primary[200]),
    }),

    // Warning (yellow)

    warning: generateButtonVariant({
      baseTextColor: colors.black[800],
      disabledTextColor: colors.black[400],
      baseColor: colors.yellow[500],
      baseGradientColor: colors.yellow[400],
      hoverColor: colors.yellow[400],
      hoverGradientColor: colors.yellow[300],
      activeColor: colors.yellow[600],
      disabledColor: desaturate(0.2, colors.yellow[200]),
    }),

    warningSecondary: generateSecondaryButtonVariant({
      baseColor: colors.yellow[600],
      baseTextColor: colors.black[800],
      activeTextColor: colors.black[800],
      hoverColor: colors.yellow[50],
      focusColor: colors.yellow[50],
      activeColor: colors.yellow[500],
      disabledColor: desaturate(0.4, colors.yellow[200]),
    }),

    // Danger (red)

    danger: generateButtonVariant({
      baseColor: colors.red[500],
      baseGradientColor: colors.red[600],
      hoverColor: colors.red[400],
      hoverGradientColor: colors.red[500],
      activeColor: colors.red[700],
      disabledColor: colors.red[100],
    }),

    dangerSecondary: generateSecondaryButtonVariant({
      baseColor: colors.red[400],
      baseTextColor: colors.red[600],
      hoverColor: colors.red[50],
      focusColor: colors.red[50],
      activeColor: colors.red[600],
      disabledColor: desaturate(0.4, colors.red[200]),
    }),

    // Success (green)

    success: generateButtonVariant({
      baseColor: colors.green[500],
      baseGradientColor: colors.green[600],
      hoverColor: colors.green[400],
      hoverGradientColor: colors.green[500],
      activeColor: colors.green[700],
      disabledColor: desaturate(0.1, colors.green[200]),
    }),

    successSecondary: generateSecondaryButtonVariant({
      baseColor: colors.green[400],
      baseTextColor: colors.green[700],
      hoverColor: colors.green[50],
      focusColor: colors.green[50],
      activeColor: colors.green[600],
      disabledColor: desaturate(0.4, colors.green[200]),
    }),

    // Dark

    dark: generateButtonVariant({
      baseColor: colors.black[800],
      baseGradientColor: colors.black[900],
      hoverColor: colors.black[700],
      hoverGradientColor: colors.black[800],
      activeColor: colors.black[900],
      focusBorderColor: '#FFFFFF',
      disabledColor: colors.black[100],
    }),

    // Purple
    purple: generateButtonVariant({
      baseColor: colors.purple[600],
      baseGradientColor: lighten(0.025, colors.purple[700]),
      hoverColor: colors.purple[500],
      hoverGradientColor: colors.purple[600],
      activeColor: colors.purple[800],
      disabledColor: colors.purple[100],
    }),

    purpleSecondary: generateSecondaryButtonVariant({
      baseColor: colors.purple[500],
      baseTextColor: colors.purple[600],
      hoverColor: colors.purple[50],
      activeColor: colors.purple[700],
      disabledColor: desaturate(0.4, colors.purple[200]),
    }),

    // Borderless (link)

    borderless: generateSecondaryButtonVariant({
      baseColor: 'transparent',
      baseTextColor: colors.black[700],
      hoverColor: colors.black[50],
      activeColor: colors.black[900],
      disabledColor: desaturate(0.4, colors.black[200]),
      disabledBorderColor: 'transparent',
    }),

    // Marketing

    marketing: generateButtonVariant({
      baseColor: colors.primary[900],
      baseTextColor: opacify(0.9, colors.white.full),
      hoverColor: colors.primary[800],
      activeColor: colors.primary[900],
      disabledColor: colors.primary[100],
    }),

    marketingSecondary: generateSecondaryButtonVariant({
      baseColor: '#C3C6CB',
      baseTextColor: opacify(0.9, colors.black[900]),
      hoverColor: '#F9FAFB',
      activeColor: opacify(0.9, colors.black[900]),
      activeBackgroundColor: '#FFFFFF',
      activeTextColor: opacify(0.9, colors.black[900]),
      disabledColor: '#4D4F51',
    }),
  };
};
