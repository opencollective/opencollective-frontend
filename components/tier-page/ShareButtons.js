import React from 'react';
import PropTypes from 'prop-types';
import { Clipboard } from '@styled-icons/feather/Clipboard';
import { Facebook } from '@styled-icons/feather/Facebook';
import { Linkedin } from '@styled-icons/feather/Linkedin';
// Styled-icons
import { Mail } from '@styled-icons/feather/Mail';
import { Twitter } from '@styled-icons/feather/Twitter';
import copy from 'copy-to-clipboard';
import { defineMessages, injectIntl } from 'react-intl';

// Doohi Collective Frontend imports
import { facebookShareURL, linkedInShareURL, mailToURL, tweetURL } from '../../lib/url-helpers';

import Container from '../Container';
import { Flex } from '../Grid';
import StyledLink from '../StyledLink';
import StyledRoundButton from '../StyledRoundButton';
import StyledTooltip from '../StyledTooltip';

const messages = defineMessages({
  shareTitle: {
    id: 'TierPage.Share.title',
    defaultMessage: 'Help {collective} reach their goal!',
  },
  copy: {
    id: 'Clipboard.Copy',
    defaultMessage: 'Copy to clipboard',
  },
  copied: {
    id: 'Clipboard.Copied',
    defaultMessage: 'Copied!',
  },
});

let updateCopyBtnTimeout = null;

/**
 * Buttons to share the tier page.
 */
const ShareButtons = ({ pageUrl, intl, collective: { name, twitterHandle } }) => {
  const [copied, setCopied] = React.useState(false);
  const copyMsg = copied ? intl.formatMessage(messages.copied) : intl.formatMessage(messages.copy);
  const defaultShareTitle = intl.formatMessage(messages.shareTitle, { collective: name });
  const twitterShareMsg = intl.formatMessage(messages.shareTitle, {
    collective: twitterHandle ? `@${twitterHandle}` : name,
  });

  return (
    <Flex>
      <StyledLink title="Facebook" href={facebookShareURL({ u: pageUrl })} openInNewTab>
        <StyledRoundButton size={40} mr="12px">
          <Facebook size={14} />
        </StyledRoundButton>
      </StyledLink>
      <StyledLink title="Twitter" href={tweetURL({ url: pageUrl, text: twitterShareMsg })} openInNewTab>
        <StyledRoundButton size={40} mr="12px">
          <Twitter size={14} />
        </StyledRoundButton>
      </StyledLink>
      <StyledLink title="Linkedin" href={linkedInShareURL({ url: pageUrl, title: defaultShareTitle })} openInNewTab>
        <StyledRoundButton size={40} mr="12px">
          <Linkedin size={14} />
        </StyledRoundButton>
      </StyledLink>
      <StyledLink title="Mail" href={mailToURL('', { subject: defaultShareTitle })} openInNewTab>
        <StyledRoundButton size={40} mr="12px">
          <Mail size={14} />
        </StyledRoundButton>
      </StyledLink>
      <StyledTooltip
        delayHide={0}
        content={() => (
          <Container minWidth={125} textAlign="center">
            {copyMsg}
          </Container>
        )}
      >
        <StyledRoundButton
          size={40}
          onClick={() => {
            copy(pageUrl);
            setCopied(true);
            if (updateCopyBtnTimeout) {
              clearTimeout(updateCopyBtnTimeout);
            }
            updateCopyBtnTimeout = setTimeout(() => {
              setCopied(false);
              updateCopyBtnTimeout = null;
            }, 3000);
          }}
        >
          <Clipboard size={15} />
        </StyledRoundButton>
      </StyledTooltip>
    </Flex>
  );
};

ShareButtons.propTypes = {
  pageUrl: PropTypes.string.isRequired,
  collective: PropTypes.shape({
    name: PropTypes.string.isRequired,
    twitterHandle: PropTypes.string,
  }).isRequired,
  intl: PropTypes.object.isRequired,
};

export default injectIntl(ShareButtons);
