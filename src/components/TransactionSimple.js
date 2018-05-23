import moment from 'moment';
import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedNumber, injectIntl } from 'react-intl';

import withIntl from '../lib/withIntl';

import Avatar from './Avatar';

const TransactionSimple = ({
  amount,
  createdAt,
  currency,
  fromCollective,
  host,
  subscription,
  type,
}) => {

  return (
    <div className="flex">
      <style jsx>{`
        .flex { display: flex; }
        .ml3 { margin-left: 1rem; }
        .m0 { margin: 0; }
      `}</style>
      <a href={`/${fromCollective.slug}`} title={fromCollective.name}>
        <Avatar src={fromCollective.image} id={fromCollective.id} radius={40} className="noFrame" />
      </a>
      <div className="ml3">
        <p className="m0">
          <a href={`/${fromCollective.slug}`} title={fromCollective.name}>{fromCollective.name}</a>
          {type === 'DEBIT' ? ' submitted a ' : ' contributed '}
          <FormattedNumber
            currency={currency}
            currencyDisplay="symbol"
            maximumFractionDigits={2}
            minimumFractionDigits={2}
            style="currency"
            value={Math.abs(amount) / 100}
          />
          {subscription && ` a ${subscription.interval} `}
          {type === 'DEBIT' && ' expense '}
          to <a href={`/${host.slug}`} title={host.name}>{host.name}</a>.
        </p>
        <small>{moment(createdAt).fromNow()}</small>
      </div>
    </div>
  );
};

TransactionSimple.propTypes = {
  amount: PropTypes.number.isRequired,
  createdAt: PropTypes.string.isRequired,
  currency: PropTypes.string.isRequired,
  fromCollective: PropTypes.shape({
    id: PropTypes.number,
    image: PropTypes.string,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
  }),
  host: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
  }),
  subscription: PropTypes.shape({
    interval: PropTypes.oneOf(['month', 'year']),
  }),
  type: PropTypes.oneOf(['CREDIT', 'DEBIT']),
};

export default TransactionSimple;
