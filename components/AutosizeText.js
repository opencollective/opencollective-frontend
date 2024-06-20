import React from 'react';
import PropTypes from 'prop-types';

import { Span } from './Text';

const getBaseFontSize = (value, minFontSizeInPx, maxFontSizeInPx, maxLength, lengthThreshold) => {
  if (!value || value.length < lengthThreshold) {
    return maxFontSizeInPx;
  } else if (value.length > maxLength) {
    return minFontSizeInPx;
  } else {
    const lengthRange = maxLength - lengthThreshold;
    const lengthReductionRatio = (value.length - lengthThreshold) / lengthRange;
    const sizeRange = maxFontSizeInPx - minFontSizeInPx;
    const sizeReduction = sizeRange * lengthReductionRatio;
    return Math.round(maxFontSizeInPx - sizeReduction);
  }
};

const formatResult = (result, valueFormatter) => {
  if (!valueFormatter) {
    return result;
  } else if (Array.isArray(result)) {
    return result.map(entry => (typeof entry === 'number' ? valueFormatter(entry) : entry));
  } else {
    return valueFormatter(result);
  }
};

const AutosizedSpan = ({ value, fontSize }) => {
  return <Span fontSize={`${fontSize}px`}>{value}</Span>;
};

AutosizedSpan.propTypes = {
  value: PropTypes.string,
  fontSize: PropTypes.number,
};

/**
 * A magic text component whose size adapts based on string length.
 * By default the `maxFontSizeInPx` will be used, until the breakpoint defined by `lengthThreshold`
 * is reached. At this point the size will decreaze linearly until `maxLength` is reached, the
 * value will then always be equal to `minFontSizeInPx`.
 *
 * Please note that this component always round the font size to whole numbers, font-sizes like
 * `12.5px` are not supported.
 */
const AutosizeText = ({
  children = AutosizedSpan,
  value,
  minFontSizeInPx,
  maxFontSizeInPx,
  maxLength,
  lengthThreshold,
  mobileRatio,
  valueFormatter,
}) => {
  const baseFontSize = getBaseFontSize(value, minFontSizeInPx, maxFontSizeInPx, maxLength, lengthThreshold);
  const result = mobileRatio ? [Math.round(baseFontSize * mobileRatio), null, baseFontSize] : baseFontSize;
  return children({
    value,
    fontSize: formatResult(result, valueFormatter),
  });
};

AutosizeText.propTypes = {
  /** The value to display */
  value: PropTypes.string,
  /** Minimum font size */
  minFontSizeInPx: PropTypes.number.isRequired,
  /** Maximum font size. Must be different from `minFontSizeInPx` */
  maxFontSizeInPx: PropTypes.number.isRequired,
  /** The maximum length of the string (`value`) */
  maxLength: PropTypes.number.isRequired,
  /** Length breakpoint where size will starts to be reduced */
  lengthThreshold: PropTypes.number.isRequired,
  /** A render func that gets passed the fontSize in px */
  children: PropTypes.func.isRequired,
  /** A function used to convert the value */
  valueFormatter: PropTypes.func,
  /** Reduction percentage on mobile */
  mobileRatio: PropTypes.number,
};

export default AutosizeText;
