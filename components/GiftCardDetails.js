import React from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import dayjs from 'dayjs';
import { get } from 'lodash';
import { FormattedDate, FormattedMessage, injectIntl } from 'react-intl';
import styled, { withTheme } from 'styled-components';

import { formatCurrency } from '../lib/currency-utils';

import GiftCard from './icons/GiftCard';
import { Button } from './ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/Collapsible';
import Avatar from './Avatar';
import Container from './Container';
import { Box, Flex } from './Grid';
import Link from './Link';
import { Span } from './Text';

const DetailsColumnHeader = styled.span`
  text-transform: uppercase;
  color: ${themeGet('colors.black.500')};
  font-weight: 300;
  white-space: nowrap;
`;

/** Render a text status to indicate if gift card is claimed, and by whom */
const GiftCardStatus = ({ isConfirmed, collective, data }) => {
  if (isConfirmed) {
    return (
      <FormattedMessage
        id="giftCards.claimedBy"
        defaultMessage="claimed by {user}"
        values={{
          user: <Link href={`/${collective.slug}`}>{collective.name}</Link>,
        }}
      />
    );
  } else if (get(data, 'email')) {
    return (
      <FormattedMessage
        id="giftCards.sentTo"
        defaultMessage="sent to {email}"
        values={{ email: <a href={`mailto:${data.email}`}>{data.email}</a> }}
      />
    );
  } else {
    return <FormattedMessage id="giftCards.notYetClaimed" defaultMessage="not yet claimed" />;
  }
};

GiftCardStatus.propTypes = {
  isConfirmed: PropTypes.bool,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    name: PropTypes.string,
  }),
  data: PropTypes.shape({
    email: PropTypes.string,
  }),
};

/**
 * Render GiftCard details like its status (claimed or not), who claimed it,
 * when was it created... It is not meant to be show to all users, but just to
 * the organizations that create the gift cards.
 */
class GiftCardDetails extends React.Component {
  static propTypes = {
    /** The gift card, which is actually a PaymentMethod */
    giftCard: PropTypes.object.isRequired,
    /** Collective slug */
    collectiveSlug: PropTypes.string.isRequired,
    /** @ignore Provided by styled-component withTheme(...) */
    theme: PropTypes.object,
    /** @ignore Provided by injectIntl */
    intl: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { expended: false };
  }

  toggleExpended() {
    this.setState(state => ({ expended: !state.expended }));
  }

  getStatusColor(isConfirmed, balance, isExpired) {
    const { colors } = this.props.theme;

    if (balance === 0 || isExpired) {
      return colors.black[200];
    }

    return isConfirmed ? colors.green[500] : colors.yellow[500];
  }

  renderDetails() {
    const { giftCard, collectiveSlug } = this.props;
    const redeemCode = giftCard.uuid.split('-')[0];
    const email = get(giftCard, 'data.email');

    return (
      <Flex mt="0.75em" fontSize="0.8em">
        {!giftCard.isConfirmed && (
          <Flex flexDirection="column" mr="2em">
            <DetailsColumnHeader>
              <FormattedMessage id="giftCards.redeemCode" defaultMessage="REDEEM CODE" />
            </DetailsColumnHeader>
            <Link href={{ pathname: `/${collectiveSlug}/redeem/${redeemCode}`, query: { email } }}>{redeemCode}</Link>
          </Flex>
        )}
        <Flex flexDirection="column" mr="2em">
          <DetailsColumnHeader>
            <FormattedMessage id="giftCards.emmited" defaultMessage="Emitted" />
          </DetailsColumnHeader>
          <FormattedDate value={giftCard.createdAt} />
        </Flex>
        <Flex flexDirection="column" mr="2em">
          <DetailsColumnHeader>
            <FormattedMessage id="giftCards.expiryDate" defaultMessage="EXPIRY DATE" />
          </DetailsColumnHeader>
          <span>{dayjs(giftCard.expiryDate).format('MM/YYYY')}</span>
        </Flex>
        <Flex flexDirection="column" mr="2em">
          <DetailsColumnHeader>
            <FormattedMessage id="giftCards.batch" defaultMessage="Batch name" />
          </DetailsColumnHeader>
          <span>
            {giftCard.batch || (
              <Span fontStyle="italic" color="black.500">
                <FormattedMessage id="giftCards.notBatched" defaultMessage="Not batched" />
              </Span>
            )}
          </span>
        </Flex>
        <Flex flexDirection="column" mr="2em">
          <DetailsColumnHeader>
            <FormattedMessage id="giftCards.description" defaultMessage="DESCRIPTION" />
          </DetailsColumnHeader>
          <span>{giftCard.description}</span>
        </Flex>
      </Flex>
    );
  }

  renderValue() {
    const { initialBalance, currency, monthlyLimitPerMember } = this.props.giftCard;
    const { locale } = this.props.intl;

    return monthlyLimitPerMember ? (
      <FormattedMessage
        id="giftCards.monthlyValue"
        defaultMessage="{value} monthly"
        values={{ value: formatCurrency(monthlyLimitPerMember, currency, { locale }) }}
      />
    ) : (
      formatCurrency(initialBalance, currency, { locale })
    );
  }

  render() {
    const { isConfirmed, collective, balance, currency, expiryDate, data } = this.props.giftCard;
    const isExpired = Boolean(expiryDate && new Date(expiryDate) < new Date());
    const { locale } = this.props.intl;

    return (
      <Flex data-cy="vc-details">
        {/* Avatar column */}
        <Box mr="20px">
          {isConfirmed ? (
            <Link href={`/${collective.slug}`} title={collective.name}>
              <Container>
                <GiftCard
                  alignSelf="center"
                  size="2.5em"
                  color={this.getStatusColor(isConfirmed, balance, isExpired)}
                />
                <Avatar collective={collective} radius={24} mt="-1em" ml="1em" css={{ position: 'absolute' }} />
              </Container>
            </Link>
          ) : (
            <GiftCard alignSelf="center" size="2.5em" color={this.getStatusColor(isConfirmed, balance, isExpired)} />
          )}
        </Box>
        {/* Infos + details column */}
        <Collapsible>
          <Flex flexDirection="column" p="0.1em">
            <Box>
              <strong>{this.renderValue()}</strong>{' '}
              <GiftCardStatus isConfirmed={isConfirmed} collective={collective} data={data} />
            </Box>
            <Box color={this.props.theme.colors.black[500]} fontSize="0.9em">
              <Flex alignItems="center">
                <FormattedMessage
                  id="giftCards.balance"
                  defaultMessage="Balance: {balance}"
                  values={{ balance: formatCurrency(balance, currency, { locale }) }}
                />
                {isExpired && (
                  <React.Fragment>
                    <Box mx={1}>|</Box>
                    <FormattedMessage id="GiftCard.Expired" defaultMessage="Expired" />
                  </React.Fragment>
                )}
                <Box mx={1}>|</Box>
                <CollapsibleTrigger asChild>
                  <Button variant="link" className="font-normal" size="xs">
                    {this.state.expended ? (
                      <FormattedMessage id="closeDetails" defaultMessage="Close Details" />
                    ) : (
                      <FormattedMessage id="viewDetails" defaultMessage="View Details" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </Flex>
            </Box>
            <CollapsibleContent className="mt-4 w-full">{this.renderDetails()}</CollapsibleContent>
          </Flex>
        </Collapsible>
      </Flex>
    );
  }
}

export default withTheme(injectIntl(GiftCardDetails));
