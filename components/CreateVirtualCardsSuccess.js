import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from '@styled-icons/feather/CheckCircle';
import { Clipboard } from '@styled-icons/feather/Clipboard';
import { Printer } from '@styled-icons/feather/Printer';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { giftCardsDownloadUrl } from '../lib/url_helpers';

import FileDownloader from './FileDownloader';
import { Box, Flex } from './Grid';
import StyledButton from './StyledButton';
import StyledInput from './StyledInput';
import { P } from './Text';

const RedeemLinksTextarea = styled(StyledInput).attrs({ as: 'textarea' })`
  width: 95%;
  max-width: 450px;
  min-height: 175px;
  padding: 8px;
  border-radius: 8px;
  resize: vertical;
  overflow-wrap: normal;
`;

/**
 * Displays created gift cards, with an option to print them.
 */
export default class CreateVirtualCardsSuccess extends React.Component {
  static propTypes = {
    cards: PropTypes.arrayOf(
      PropTypes.shape({
        uuid: PropTypes.string.isRequired,
        currency: PropTypes.string.isRequired,
        initialBalance: PropTypes.number.isRequired,
        expiryDate: PropTypes.string,
      }),
    ).isRequired,
    deliverType: PropTypes.oneOf(['manual', 'email']).isRequired,
    collectiveSlug: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
    this.redeemLinkTextareaRef = React.createRef();
  }

  getRedeemLinkFromVC = vc => {
    const code = vc.uuid.split('-')[0];
    return `${process.env.WEBSITE_URL}/${this.props.collectiveSlug}/redeem/${code}`;
  };

  copyLinksToClipboard = () => {
    try {
      this.redeemLinkTextareaRef.current.select();
      document.execCommand('copy');
    } catch (e) {
      // TODO: this should be reported to the user
      console.error('Cannot copy to clipboard', e);
    }
  };

  buildFetchParams = () => {
    return {};
  };

  renderManualSuccess() {
    const filename = `${this.props.collectiveSlug}-giftcards-${Date.now()}.pdf`;
    const downloadUrl = giftCardsDownloadUrl(filename);

    return (
      <React.Fragment>
        <Box mb={3}>
          <FormattedMessage
            id="virtualCards.create.successCreate"
            defaultMessage="Your {count, plural, one {gift card has} other {{count} gift cards have}} been created."
            values={{ count: this.props.cards.length }}
          />
        </Box>

        <Flex width={1} flexDirection="column" alignItems="center">
          <Flex my={3} flexWrap="wrap" justifyContent="center">
            <StyledButton
              m={2}
              minWidth={270}
              buttonSize="large"
              buttonStyle="primary"
              onClick={this.copyLinksToClipboard}
            >
              <Clipboard size="1em" />
              &nbsp;
              <FormattedMessage id="CreateVirtualCardsSuccess.RedeemLinks" defaultMessage="Copy links" />
            </StyledButton>
            {this.props.cards.length < 300 && (
              <FileDownloader
                url={downloadUrl}
                filename={filename}
                buildFetchParams={() => ({
                  method: 'POST',
                  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                  body: JSON.stringify({ cards: this.props.cards }),
                })}
              >
                {({ loading, downloadFile }) => (
                  <StyledButton minWidth={270} m={2} buttonSize="large" loading={loading} onClick={downloadFile}>
                    <Printer size="1em" />
                    &nbsp;
                    <FormattedMessage id="CreateVirtualCardsSuccess.Download" defaultMessage="Download cards" />
                  </StyledButton>
                )}
              </FileDownloader>
            )}
          </Flex>
          <RedeemLinksTextarea
            ref={this.redeemLinkTextareaRef}
            className="result-redeem-links"
            readOnly
            value={this.props.cards.map(this.getRedeemLinkFromVC).join('\n')}
          />
        </Flex>
      </React.Fragment>
    );
  }

  renderEmailSuccess() {
    return (
      <FormattedMessage
        id="virtualCards.create.successSent"
        defaultMessage="Your {count, plural, one {gift card has} other {{count} gift cards have}} been sent!"
        values={{ count: this.props.cards.length }}
      />
    );
  }

  render() {
    const { deliverType } = this.props;

    return (
      <Flex flexDirection="column" alignItems="center">
        <P color="green.700">
          <CheckCircle size="3em" />
        </P>
        {deliverType === 'email' ? this.renderEmailSuccess() : this.renderManualSuccess()}
      </Flex>
    );
  }
}
