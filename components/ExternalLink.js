import React from 'react';
import PropTypes from 'prop-types';

/**
 * A simple `<a>` link with `target="_blank"` and `rel="noopener noreferrer"` set when
 * `openInNewTab` is true so we don't forget to add them.
 */
const ExternalLink = ({ openInNewTab, ...props }) => {
  if (openInNewTab) {
    return <a {...props} target="_blank" rel="noopener noreferrer" />;
  }
  return <a {...props} />;
};

ExternalLink.propTypes = {
  openInNewTab: PropTypes.bool,
};

export default ExternalLink;
