import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';

import Avatar from '../Avatar';
import Container from '../Container';
import LinkCollective from '../LinkCollective';
import Moment from '../Moment';
import { P, Span } from '../Text';
import TransactionDetails from './TransactionDetails';
import AmountCurrency from './AmountCurrency';
import DefinedTerm, { Terms } from '../DefinedTerm';

class Transaction extends React.Component {
  static propTypes = {
    id: PropTypes.number.isRequired,
    amount: PropTypes.number.isRequired,
    canDownloadInvoice: PropTypes.bool, // LoggedInUser.canEditCollective(collective) || LoggedInUser.isRoot()
    canRefund: PropTypes.bool, // LoggedInUser.isRoot()
    createdAt: PropTypes.string.isRequired,
    description: PropTypes.string,
    currency: PropTypes.string.isRequired,
    attachment: PropTypes.string,
    uuid: PropTypes.string,
    netAmountInCollectiveCurrency: PropTypes.number,
    platformFeeInHostCurrency: PropTypes.number,
    taxAmount: PropTypes.number,
    paymentProcessorFeeInHostCurrency: PropTypes.number,
    hostCurrency: PropTypes.string,
    hostCurrencyFxRate: PropTypes.number,
    paymentMethod: PropTypes.shape({
      service: PropTypes.string.isRequired,
    }),
    host: PropTypes.shape({
      hostFeePercent: PropTypes.number,
      slug: PropTypes.string.isRequired,
    }),
    fromCollective: PropTypes.shape({
      id: PropTypes.number,
      type: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string,
    }),
    usingVirtualCardFromCollective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string,
    }),
    subscription: PropTypes.shape({
      interval: PropTypes.oneOf(['month', 'year']),
    }),
    type: PropTypes.oneOf(['CREDIT', 'DEBIT']),
    isRefund: PropTypes.bool, // whether or not this transaction refers to a refund
    /** Choose between date (eg. 2018/12/09) or interval (eg. two months ago) */
    dateDisplayType: PropTypes.oneOf(['date', 'interval']),
  };

  static defaultProps = {
    dateDisplayType: 'interval',
  };

  state = { showDetails: false };

  /**
   * Render a link to the collective that made the transaction and show the
   * gift card emitter if any has been used
   */
  renderPaymentOrigin() {
    const { usingVirtualCardFromCollective, fromCollective, type } = this.props;

    // If not using a VirtualCard, fromCollective will always represent the
    // collective that made the payment.
    if (!usingVirtualCardFromCollective) {
      return <LinkCollective collective={fromCollective}>{fromCollective.name}</LinkCollective>;
    }

    // If using a VirtualCard and this is the debit transaction, `fromCollective`
    // will point to the collective who received the money while `collective`
    // will represent the collective (usually a user) who made the donation.
    const isDebit = type === 'DEBIT';
    const originCollective = isDebit ? this.props.collective : fromCollective;

    return (
      <span>
        <LinkCollective collective={originCollective}>{originCollective.name}</LinkCollective>{' '}
        <FormattedMessage
          id="transaction.usingGiftCardFrom"
          defaultMessage="using a {giftCard} from {collective}"
          values={{
            giftCard: <DefinedTerm term={Terms.GIFT_CARD} textTransform="lowercase" />,
            collectiveLink: (
              <LinkCollective collective={usingVirtualCardFromCollective}>
                {usingVirtualCardFromCollective.name}
              </LinkCollective>
            ),
          }}
        />
      </span>
    );
  }

  render() {
    const {
      amount,
      netAmountInCollectiveCurrency,
      description,
      createdAt,
      currency,
      fromCollective,
      collective,
      type,
      paymentProcessorFeeInHostCurrency,
      dateDisplayType,
    } = this.props;

    if (!fromCollective) {
      console.error('No FromCollective for transaction', this.props);
      return <div />;
    }

    const amountToDisplay = ['ORGANIZATION', 'USER'].includes(collective.type) ? netAmountInCollectiveCurrency : amount;
    let precision = 0;

    // Check if the remainder is not 0, this check is important in order to know the amount that needs precision
    // i.e display $10.21 as $10.21 instead of $10
    if ((amountToDisplay / 100) % 1 !== 0) {
      precision = 2;
    }

    return (
      <Flex my={4}>
        <Container alignSelf="flex-start">
          <LinkCollective collective={fromCollective} title={fromCollective.name} passHref>
            <Avatar collective={fromCollective} id={fromCollective.id} radius={40} className="noFrame" />
          </LinkCollective>
        </Container>
        <Container ml={3} width={1}>
          <Flex justifyContent="space-between" alignItems="baseline">
            <div>
              <P fontSize="1.4rem" color="#313233" display="inline">
                {description}
              </P>
              <Span fontSize="1.6rem">{type === 'CREDIT' && ' 🎉'}</Span>
            </div>
            <AmountCurrency amount={amountToDisplay} currency={currency} precision={precision} />
          </Flex>
          <Container fontSize="1.2rem" color="#AEB2B8">
            {this.renderPaymentOrigin()}
            {' | '}
            <Moment relative={dateDisplayType === 'interval'} value={createdAt} />
            {paymentProcessorFeeInHostCurrency !== undefined && (
              <Fragment>
                {' | '}
                <a onClick={() => this.setState({ viewDetails: !this.state.viewDetails })}>
                  {this.state.viewDetails ? (
                    <FormattedMessage id="transaction.closeDetails" defaultMessage="Close Details" />
                  ) : (
                    <FormattedMessage id="transaction.viewDetails" defaultMessage="View Details" />
                  )}
                </a>
              </Fragment>
            )}
          </Container>
          {this.state.viewDetails && <TransactionDetails {...this.props} mode="open" />}
        </Container>
      </Flex>
    );
  }
}

export default Transaction;
