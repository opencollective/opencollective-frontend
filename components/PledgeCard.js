import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Avatar from './Avatar';
import Container from './Container';
import FormattedMoneyAmount from './FormattedMoneyAmount';
import LinkCollective from './LinkCollective';
import { P, Span } from './Text';

const PledgeCard = ({ currency, fromCollective, interval, publicMessage, totalAmount }) => (
  <Container bg="white" borderRadius="8px" border="1px solid" borderColor="black.transparent.20" minHeight="100%">
    <Container display="flex" justifyContent="space-between" alignItems="center" pt={4}>
      <Container bg="black.200" height="1px" width={0.25} />

      <LinkCollective collective={fromCollective}>
        <Avatar collective={fromCollective} radius={[52, null, 65]} />
      </LinkCollective>

      <Container bg="black.200" height="1px" width={0.25} />
    </Container>

    <P textAlign="center" fontWeight="bold" mt={3} px={2}>
      <LinkCollective collective={fromCollective}>{fromCollective.name}</LinkCollective>
    </P>

    <P fontSize="10px" lineHeight="16px" textAlign="center" mt={2} px={2} pb={2}>
      <FormattedMessage id="PledgeCard.HasPledged" defaultMessage="Has pledged:" />
      <br />
      <Span fontSize="12px">
        <FormattedMoneyAmount
          amount={totalAmount}
          currency={currency}
          interval={interval}
          amountStyles={{ fontWeight: 'bold' }}
          precision={0}
        />
      </Span>
    </P>

    <P color="black.600" fontSize="10px" textAlign="center" mt={1} px={3} pb={4}>
      {publicMessage}
    </P>
  </Container>
);

PledgeCard.propTypes = {
  currency: PropTypes.string.isRequired,
  fromCollective: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    isIncognito: PropTypes.bool,
  }).isRequired,
  interval: PropTypes.string,
  publicMessage: PropTypes.string,
  totalAmount: PropTypes.number.isRequired,
};

export default PledgeCard;
