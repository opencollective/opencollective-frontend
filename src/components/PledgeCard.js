import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { imagePreview } from '../lib/utils';
import { defaultImage } from '../constants/collectives';

import Container from './Container';
import { P, Span } from './Text';
import { Link } from '../server/pages';
import StyledLink from './StyledLink';
import Currency from './Currency';

const PledgeCard = ({
  currency,
  fromCollective,
  interval,
  publicMessage,
  totalAmount,
}) => (
  <Container
    bg="white"
    borderRadius="8px"
    border="1px solid"
    borderColor="black.transparent.20"
    minHeight="100%"
  >
    <Container
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      pt={4}
    >
      <Container bg="black.200" height="1px" width={0.25} />

      <Link route="collective" params={{ slug: fromCollective.slug }} passHref>
        <a>
          <Container
            backgroundImage={`url(${imagePreview(
              fromCollective.image,
              defaultImage[fromCollective.type],
              {
                width: 65,
              },
            )})`}
            backgroundSize="contain"
            backgroundRepeat="no-repeat"
            backgroundPosition="center center"
            borderRadius={12}
            border="2px solid white"
            height={[52, null, 65]}
            width={[52, null, 65]}
          />
        </a>
      </Link>

      <Container bg="black.200" height="1px" width={0.25} />
    </Container>

    <P textAlign="center" fontWeight="bold" mt={3} px={2}>
      <Link route="collective" params={{ slug: fromCollective.slug }} passHref>
        <StyledLink color="black.800">{fromCollective.name}</StyledLink>
      </Link>
    </P>

    <P fontSize="Tiny" textAlign="center" mt={2} px={2} pb={2}>
      Has pledged:
      <br />
      <Span fontSize="Caption">
        <Currency
          fontWeight="bold"
          value={totalAmount}
          currency={currency}
          precision={0}
          abbreviate
        />

        {interval && (
          <FormattedMessage
            id="order.interval"
            values={{ interval }}
            defaultMessage=" / {interval, select, month {mo.} year {yr.}}"
          />
        )}
      </Span>
    </P>

    <P color="black.600" fontSize="Tiny" textAlign="center" mt={1} px={3} pb={4}>
      {publicMessage}
    </P>
  </Container>
);

PledgeCard.propTypes = {
  currency: PropTypes.string.isRequired,
  fromCollective: PropTypes.shape({
    image: PropTypes.string,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }).isRequired,
  interval: PropTypes.string,
  publicMessage: PropTypes.string,
  totalAmount: PropTypes.number.isRequired,
};

export default PledgeCard;
