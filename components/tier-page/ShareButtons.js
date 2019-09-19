import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import copy from 'copy-to-clipboard';

// Styled-icons
import { Mail } from 'styled-icons/feather/Mail';
import { Twitter } from 'styled-icons/feather/Twitter';
import { Facebook } from 'styled-icons/feather/Facebook';
import { Linkedin } from 'styled-icons/feather/Linkedin';
import { ContentCopy } from 'styled-icons/material/ContentCopy';

// Open Collective Frontend imports
import { facebooKShareURL, tweetURL, linkedInShareURL, mailToURL } from '../../lib/url_helpers';
import StyledTooltip from '../StyledTooltip';
import ExternalLinkNewTab from '../ExternalLinkNewTab';
import StyledRoundButton from '../StyledRoundButton';
import Container from '../Container';

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
    <Flex justifyContent="space-between">
      <ExternalLinkNewTab title="Facebook" href={facebooKShareURL({ u: pageUrl })}>
        <StyledRoundButton size={40}>
          <Facebook size={14} />
        </StyledRoundButton>
      </ExternalLinkNewTab>
      <ExternalLinkNewTab title="Twitter" href={tweetURL({ url: pageUrl, text: twitterShareMsg })}>
        <StyledRoundButton size={40}>
          <Twitter size={14} />
        </StyledRoundButton>
      </ExternalLinkNewTab>
      <ExternalLinkNewTab title="Linkedin" href={linkedInShareURL({ url: pageUrl, title: defaultShareTitle })}>
        <StyledRoundButton size={40}>
          <Linkedin size={14} />
        </StyledRoundButton>
      </ExternalLinkNewTab>
      <ExternalLinkNewTab title="Mail" href={mailToURL('', { subject: defaultShareTitle })}>
        <StyledRoundButton size={40}>
          <Mail size={14} />
        </StyledRoundButton>
      </ExternalLinkNewTab>
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
          <ContentCopy size={14} />
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
