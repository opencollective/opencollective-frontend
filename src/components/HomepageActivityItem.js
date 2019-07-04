import moment from 'moment';
import React from 'react';
import PropTypes from 'prop-types';
import { FormattedNumber } from 'react-intl';

import Avatar from './Avatar';
import Container from './Container';
import { P, Span } from './Text';
import LinkCollective from './LinkCollective';

const HomepageActivityItem = ({ amount, createdAt, currency, fromCollective, collective, subscription, type }) => {
  const formattedCreatedAt = new Date(createdAt).toISOString();
  return (
    <Container display="flex" alignItems="center">
      <LinkCollective collective={fromCollective} title={fromCollective.name}>
        <Avatar collective={fromCollective} id={fromCollective.id} radius={40} className="noFrame" />
      </LinkCollective>
      <Container ml={3}>
        <P fontSize="1.2rem" color="#9399A3" display="inline">
          <LinkCollective collective={fromCollective} title={fromCollective.name}>
            {fromCollective.name}
          </LinkCollective>
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
          {' to '}{' '}
          <LinkCollective collective={collective} title={collective.name}>
            {collective.name}
          </LinkCollective>
          .
        </P>
        <Container position="relative" top={4} left={4} display="inline-block">
          <P fontSize="1.6rem">{type === 'DEBIT' && ' 🎉'}</P>
        </Container>
        <P fontSize="1rem" color="#AEB2B8">
          {moment(formattedCreatedAt).fromNow()}
        </P>
      </Container>
    </Container>
  );
};

HomepageActivityItem.propTypes = {
  amount: PropTypes.number.isRequired,
  createdAt: PropTypes.string.isRequired,
  currency: PropTypes.string.isRequired,
  fromCollective: PropTypes.shape({
    id: PropTypes.number,
    image: PropTypes.string,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
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

export default HomepageActivityItem;
