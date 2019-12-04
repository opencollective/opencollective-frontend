import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import copy from 'copy-to-clipboard';

// Styled-icons
import { Mail } from '@styled-icons/feather/Mail';
import { Twitter } from '@styled-icons/feather/Twitter';
import { Facebook } from '@styled-icons/feather/Facebook';
import { Linkedin } from '@styled-icons/feather/Linkedin';
import { Clipboard } from '@styled-icons/feather/Clipboard';

// Open Collective Frontend imports
import { facebooKShareURL, tweetURL, linkedInShareURL, mailToURL } from '../../lib/url_helpers';
import StyledTooltip from '../StyledTooltip';
import ExternalLink from '../ExternalLink';
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
      <ExternalLink title="Facebook" href={facebooKShareURL({ u: pageUrl })} openInNewTab>
        <StyledRoundButton size={40}>
          <Facebook size={14} />
        </StyledRoundButton>
      </ExternalLink>
      <ExternalLink title="Twitter" href={tweetURL({ url: pageUrl, text: twitterShareMsg })} openInNewTab>
        <StyledRoundButton size={40}>
          <Twitter size={14} />
        </StyledRoundButton>
      </ExternalLink>
      <ExternalLink title="Linkedin" href={linkedInShareURL({ url: pageUrl, title: defaultShareTitle })} openInNewTab>
        <StyledRoundButton size={40}>
          <Linkedin size={14} />
        </StyledRoundButton>
      </ExternalLink>
      <ExternalLink title="Mail" href={mailToURL('', { subject: defaultShareTitle })} openInNewTab>
        <StyledRoundButton size={40}>
          <Mail size={14} />
        </StyledRoundButton>
      </ExternalLink>
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
