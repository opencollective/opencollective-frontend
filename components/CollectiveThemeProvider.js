import React from 'react';
import PropTypes from 'prop-types';
import { clamp, get, throttle } from 'lodash';
import memoizeOne from 'memoize-one';
import { darken, getContrast, getLuminance, setLightness } from 'polished';
import { ThemeProvider } from 'styled-components';
import { isHexColor } from 'validator';

import defaultTheme, { generateTheme } from '../lib/theme';
import defaultColors from '../lib/theme/colors';

import DefaultPaletteStyle from './DefaultPaletteStyle';

/**
 * A special `ThemeProvider` that plugs the custom collective theme, defined by the color
 * from `collective.settings.collectivePage.primaryColor`.
 */
export default class CollectiveThemeProvider extends React.PureComponent {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    collective: PropTypes.shape({
      settings: PropTypes.shape({
        collectivePage: PropTypes.shape({
          primaryColor: PropTypes.string,
        }),
      }),
    }),
  };

  state = { newPrimaryColor: null };

  /**
   * Ensures that the contrast is at least 7/1, as recommended by the [W3c](https://webaim.org/articles/contrast)
   */
  adjustColorContrast = color => {
    const contrast = getContrast(color, '#fff');
    if (contrast >= 7) {
      return color;
    } else {
      const contrastDiff = (7 - contrast) / 21;
      return darken(contrastDiff, color);
    }
  };

  getPalette = memoizeOne(primaryColor => {
    if (!primaryColor) {
      return defaultColors.primary;
    } else if (!isHexColor(primaryColor)) {
      // eslint-disable-next-line no-console
      console.warn(`Invalid custom color: ${primaryColor}`);
      return defaultColors.primary;
    } else {
      const adjustedPrimary = this.adjustColorContrast(primaryColor);
      const luminance = getLuminance(adjustedPrimary);
      // Allow a deviation to up to 20% of the default luminance. Don't apply this to really
      // dark colors (luminance < 0.05)
      const luminanceAdjustment = luminance < 0.05 ? -0.1 : luminance / 5;
      const adjustLuminance = value => setLightness(clamp(value + luminanceAdjustment, 0, 0.97), adjustedPrimary);
      return {
        900: adjustLuminance(0.1),
        800: adjustLuminance(0.2),
        700: adjustLuminance(0.3),
        600: adjustLuminance(0.42),
        500: adjustLuminance(0.5),
        400: adjustLuminance(0.6),
        300: adjustLuminance(0.65),
        200: adjustLuminance(0.72),
        100: adjustLuminance(0.92),
        50: adjustLuminance(0.97),
        base: primaryColor,
      };
    }
  });

  getTheme = memoizeOne(primaryColor => {
    if (!primaryColor) {
      return defaultTheme;
    } else if (!isHexColor(primaryColor)) {
      // eslint-disable-next-line no-console
      console.warn(`Invalid custom color: ${primaryColor}`);
      return defaultTheme;
    } else {
      const primaryPalette = this.getPalette(primaryColor);

      return generateTheme({
        colors: {
          ...defaultTheme.colors,
          primary: primaryPalette,
        },
      });
    }
  });

  onPrimaryColorChange = throttle(newPrimaryColor => {
    this.setState({ newPrimaryColor });
  }, 2000);

  render() {
    const { collective, children } = this.props;
    const primaryColor = this.state.newPrimaryColor || get(collective, 'settings.collectivePage.primaryColor');
    const primaryPalette = this.getPalette(primaryColor);
    return (
      <ThemeProvider theme={this.getTheme(primaryColor)}>
        {typeof children === 'function' ? (
          children({ onPrimaryColorChange: this.onPrimaryColorChange })
        ) : (
          <React.Fragment>{children}</React.Fragment>
        )}
        <DefaultPaletteStyle palette={primaryPalette} />
      </ThemeProvider>
    );
  }
}
