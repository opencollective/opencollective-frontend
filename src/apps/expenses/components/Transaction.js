import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Flex } from 'grid-styled';
import { FormattedMessage } from 'react-intl';

import Avatar from '../../../components/Avatar';
import Container from '../../../components/Container';
import Link from '../../../components/Link';
import Moment from '../../../components/Moment';
import { P, Span } from '../../../components/Text';

import TransactionDetails from './TransactionDetails';
import AmountCurrency from './AmountCurrency';

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
      image: PropTypes.string,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
    }),
    usingVirtualCardFromCollective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
    }),
    subscription: PropTypes.shape({
      interval: PropTypes.oneOf(['month', 'year']),
    }),
    type: PropTypes.oneOf(['CREDIT', 'DEBIT']),
    isRefund: PropTypes.bool, // whether or not this transaction refers to a refund
  };

  state = { showDetails: false };

  render() {
    const {
      amount,
      netAmountInCollectiveCurrency,
      description,
      createdAt,
      currency,
      fromCollective,
      usingVirtualCardFromCollective,
      collective,
      type,
      paymentProcessorFeeInHostCurrency,
    } = this.props;

    const amountToDisplay = ['ORGANIZATION', 'USER'].includes(collective.type)
      ? netAmountInCollectiveCurrency
      : amount;

    return (
      <Flex my={4}>
        <Container alignSelf="flex-start">
          <Link
            route="collective"
            params={{ slug: fromCollective.slug }}
            title={fromCollective.name}
            passHref
          >
            <Avatar
              src={fromCollective.image}
              type={fromCollective.type}
              name={fromCollective.name}
              id={fromCollective.id}
              radius={40}
              className="noFrame"
            />
          </Link>
        </Container>
        <Container ml={3} width={1}>
          <Flex justifyContent="space-between" alignItems="baseline">
            <div>
              <P fontSize="1.4rem" color="#313233" display="inline">
                {description}
              </P>
              <Span fontSize="1.6rem">{type === 'CREDIT' && ' 🎉'}</Span>
            </div>
            <AmountCurrency amount={amountToDisplay} currency={currency} />
          </Flex>
          <Container fontSize="1.2rem" color="#AEB2B8">
            <a href={`/${fromCollective.slug}`} title={fromCollective.name}>
              {fromCollective.name}
            </a>
            {usingVirtualCardFromCollective && ' '}
            {usingVirtualCardFromCollective && (
              <FormattedMessage
                id="transaction.usingGiftCardFrom"
                defaultMessage="using a gift card from {collectiveLink}"
                values={{
                  collectiveLink: (
                    <Link
                      route="collective"
                      params={{ slug: usingVirtualCardFromCollective.slug }}
                    >
                      {usingVirtualCardFromCollective.name}
                    </Link>
                  ),
                }}
              />
            )}
            {' | '}
            <Moment relative={true} value={createdAt} />
            {paymentProcessorFeeInHostCurrency !== undefined && (
              <Fragment>
                {' | '}
                <a
                  onClick={() =>
                    this.setState({ viewDetails: !this.state.viewDetails })
                  }
                >
                  {this.state.viewDetails ? (
                    <FormattedMessage
                      id="transaction.closeDetails"
                      defaultMessage="Close Details"
                    />
                  ) : (
                    <FormattedMessage
                      id="transaction.viewDetails"
                      defaultMessage="View Details"
                    />
                  )}
                </a>
              </Fragment>
            )}
          </Container>
          {this.state.viewDetails && (
            <TransactionDetails {...this.props} mode="open" />
          )}
        </Container>
      </Flex>
    );
  }
}

export default Transaction;
