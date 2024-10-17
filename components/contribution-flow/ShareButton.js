import React from 'react';
import { Share2 as ShareIcon } from '@styled-icons/feather/Share2';
import { FormattedMessage } from 'react-intl';

import useClipboard from '../../lib/hooks/useClipboard';

import StyledButton from '../StyledButton';
import { Span } from '../Text';

const ShareButton = () => {
  const { isCopied, copy } = useClipboard();
  return (
    <StyledButton buttonSize="tiny" onClick={() => copy(window.location.href)}>
      <ShareIcon size={12} />
      <Span ml={1}>
        {isCopied ? (
          <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />
        ) : (
          <FormattedMessage defaultMessage="Share link" id="GQNYob" />
        )}
      </Span>
    </StyledButton>
  );
};

export default ShareButton;
