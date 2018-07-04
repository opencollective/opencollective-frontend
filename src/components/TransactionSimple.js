import moment from 'moment';
import React from 'react';
import PropTypes from 'prop-types';
import { FormattedNumber } from 'react-intl';

import Avatar from './Avatar';
import Container from './Container';
import { P, Span } from './Text';

const TransactionSimple = ({
  amount,
  createdAt,
  currency,
  fromCollective,
  collective,
  subscription,
  type,
}) => {

  return (
    <Container display="flex" alignItems="center">
      <a href={`/${fromCollective.slug}`} title={fromCollective.name}>
        <Avatar src={fromCollective.image} id={fromCollective.id} radius={40} className="noFrame" />
      </a>
      <Container ml={3}>
        <P fontSize="1.2rem" color="#9399A3" display="inline">
          <a href={`/${fromCollective.slug}`} title={fromCollective.name}>{fromCollective.name}</a>
          {type === 'DEBIT' ? ' submitted a ' : ' contributed '}
          <Span color="#2E3033">
            <FormattedNumber
              currency={currency}
              currencyDisplay="symbol"
              maximumFractionDigits={2}
              minimumFractionDigits={2}
              style="currency"
              value={Math.abs(amount) / 100}
            />
          </Span>
          {subscription && ` a ${subscription.interval} `}
          {type === 'DEBIT' && ' expense '}
          {' to '} <a href={`/${collective.slug}`} title={collective.name}>{collective.name}</a>.
        </P>
        <Container position="relative" top={4} left={4} display="inline-block">
          <P fontSize="1.6rem">{type === 'DEBIT' && ' 🎉'}</P>
        </Container>
        <P fontSize="1rem" color="#AEB2B8">{moment(createdAt).fromNow()}</P>
      </Container>
    </Container>
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
  collective: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
  }),
  subscription: PropTypes.shape({
    interval: PropTypes.oneOf(['month', 'year']),
  }),
  type: PropTypes.oneOf(['CREDIT', 'DEBIT']),
};

export default TransactionSimple;
