import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { get } from 'lodash';
import moment from 'moment';
import styled, { withTheme } from 'styled-components';

import { CardGiftcard as GiftCardIcon } from 'styled-icons/material/CardGiftcard.cjs';

import Link from './Link';
import Avatar from './Avatar';
import { formatCurrency } from '../lib/utils';
import Moment from './Moment';

const DetailsColumnHeader = styled.span`
  text-transform: uppercase;
  color: ${props => props.theme.colors.black[500]};
  font-weight: 300;
  white-space: nowrap;
`;

/** Render a text status to indicate if virtual card is claimed, and by whom */
const VirtualCardStatus = ({ isConfirmed, collective, data }) => {
  if (isConfirmed) {
    return (
      <FormattedMessage
        id="virtualCards.claimedBy"
        defaultMessage="claimed by {user}"
        values={{
          user: (
            <Link route="collective" params={{ slug: collective.slug }}>
              {collective.name}
            </Link>
          ),
        }}
      />
    );
  } else if (get(data, 'email')) {
    return (
      <FormattedMessage
        id="virtualCards.sentTo"
        defaultMessage="sent to {email}"
        values={{ email: <a href={`mailto:${data.email}`}>{data.email}</a> }}
      />
    );
  } else {
    return <FormattedMessage id="virtualCards.notYetClaimed" defaultMessage="not yet claimed" />;
  }
};

/**
 * Render a VirtualCard details like its status (claimed or not), who claimed it,
 * when was it created... It is not meant to be show to all users, but just to
 * the organizations that create the virtual cards.
 */
class VirtualCardDetails extends React.Component {
  static propTypes = {
    /** The virtual card, which is actually a PaymentMethod */
    virtualCard: PropTypes.object.isRequired,
    /** Provided by styled-component withTheme(...) */
    theme: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { expended: false };
  }

  toggleExpended() {
    this.setState(state => ({ expended: !state.expended }));
  }

  getStatusColor(isConfirmed, balance) {
    const { colors } = this.props.theme;
    return balance === 0 ? colors.yellow[500] : isConfirmed ? colors.green[500] : colors.black[200];
  }

  renderDetails() {
    const redeemCode = this.props.virtualCard.uuid.split('-')[0];
    return (
      <Flex mt="0.75em" fontSize="0.8em">
        <Flex flexDirection="column" mr="1.5em">
          <DetailsColumnHeader>
            <FormattedMessage id="virtualCards.redeemCode" defaultMessage="Redeem code" />
          </DetailsColumnHeader>
          <Link route="redeem" params={{ code: redeemCode }}>
            {redeemCode}
          </Link>
        </Flex>
        <Flex flexDirection="column" mr="1.5em">
          <DetailsColumnHeader>
            <FormattedMessage id="virtualCards.expiryDate" defaultMessage="Expiry date" />
          </DetailsColumnHeader>
          <span>{moment(this.props.virtualCard.expiryDate).format('MM/Y')}</span>
        </Flex>
        <Flex flexDirection="column" mr="1.5em">
          <DetailsColumnHeader>
            <FormattedMessage id="virtualCards.customMessage" defaultMessage="Custom message" />
          </DetailsColumnHeader>
          <span>{this.props.virtualCard.description}</span>
        </Flex>
      </Flex>
    );
  }

  render() {
    const { isConfirmed, collective, initialBalance, balance, currency, createdAt, data } = this.props.virtualCard;

    return (
      <Flex>
        {/* Avatar column */}
        <Box mr="20px">
          {isConfirmed ? (
            <Link route="collective" params={{ slug: collective.slug }} title={collective.name} passHref>
              <GiftCardIcon alignSelf="center" size="2.5em" color={this.getStatusColor(isConfirmed, balance)} />
              <Avatar
                radius={24}
                mt="-1em"
                ml="1em"
                css={{ position: 'absolute' }}
                src={collective.image}
                type={collective.type}
                name={collective.name}
              />
            </Link>
          ) : (
            <GiftCardIcon alignSelf="center" size="2.5em" color={this.getStatusColor(isConfirmed, balance)} />
          )}
        </Box>
        {/* Infos + details column */}
        <Flex flexDirection="column" p="0.1em">
          <Box>
            <strong>{formatCurrency(initialBalance, currency)}</strong>{' '}
            <VirtualCardStatus isConfirmed={isConfirmed} collective={collective} data={data} />
          </Box>
          <Box color={this.props.theme.colors.black[500]} fontSize="0.9em">
            <Flex>
              <FormattedMessage
                id="virtualCards.balance"
                defaultMessage="Balance: {balance}"
                values={{ balance: formatCurrency(balance, currency) }}
              />
              <Box mx={1}>|</Box>
              <FormattedMessage
                id="virtualCards.emmitedSince"
                defaultMessage="Emmited {since}"
                values={{ since: <Moment relative value={createdAt} /> }}
              />
              <Box mx={1}>|</Box>
              <a onClick={() => this.toggleExpended()}>
                {this.state.expended ? (
                  <FormattedMessage id="virtualCards.closeDetails" defaultMessage="Close Details" />
                ) : (
                  <FormattedMessage id="virtualCards.viewDetails" defaultMessage="View Details" />
                )}
              </a>
            </Flex>
          </Box>
          {this.state.expended && this.renderDetails()}
        </Flex>
      </Flex>
    );
  }
}

export default withTheme(VirtualCardDetails);
