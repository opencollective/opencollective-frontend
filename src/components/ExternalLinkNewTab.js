import React from 'react';

/**
 * A simple <a> link with target="_blank" rel="noopener noreferrer" set so
 * we don't forget to add them.
 */
const ExternalLinkNewTab = props => <a {...props} target="_blank" rel="noopener noreferrer" />;

export default ExternalLinkNewTab;
