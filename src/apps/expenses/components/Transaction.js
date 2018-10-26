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
    canEditCollective: PropTypes.bool, // LoggedInUser.canEditCollective(collective) || LoggedInUser.isRoot()
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
      description,
      createdAt,
      currency,
      fromCollective,
      collective,
      type,
      paymentProcessorFeeInHostCurrency,
    } = this.props;

    return (
      <Flex my={4}>
        <Container alignSelf="flex-start">
          <a href={`/${fromCollective.slug}`} title={fromCollective.name}>
            <Avatar
              src={fromCollective.image}
              id={fromCollective.id}
              radius={40}
              className="noFrame"
            />
          </a>
        </Container>
        <Container ml={3} width={1}>
          <Flex justifyContent="space-between" alignItems="baseline">
            <div>
              <P fontSize="1.4rem" color="#313233" display="inline">
                {description}
                {type === 'DEBIT' && ' expense '}
                {collective && (
                  <Fragment>
                    {' to '}{' '}
                    <Link route={`/${collective.slug}`} title={collective.name}>
                      {collective.name}
                    </Link>
                    .
                  </Fragment>
                )}
              </P>
              <Span fontSize="1.6rem">{type === 'CREDIT' && ' 🎉'}</Span>
            </div>
            <AmountCurrency amount={amount} currency={currency} />
          </Flex>
          <Container fontSize="1.2rem" color="#AEB2B8">
            <a href={`/${fromCollective.slug}`} title={fromCollective.name}>
              {fromCollective.name}
            </a>
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
