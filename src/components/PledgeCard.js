import React from 'react';
import PropTypes from 'prop-types';

import { imagePreview } from '../lib/utils';
import { defaultImage, defaultBackgroundImage } from '../constants/collectives';

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
    border="1px solid rgba(18,19,20,0.2)"
    minHeight="100%"
  >
    <Container
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      pt={4}
    >
      <Container bg="#E8E9EB" height="1px" width={0.25} />

      <Link route="collective" params={{ slug: fromCollective.slug }} passHref>
        <a>
          <Container
            bg="#2877ED"
            backgroundImage={`url(${imagePreview(fromCollective.image, defaultImage[fromCollective.type], {
              width: 65,
            })})`}
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

      <Container bg="#E8E9EB" height="1px" width={0.25} />
    </Container>

    <P fontSize="1.4rem" textAlign="center" fontWeight="bold" mt={3} px={2}>
      <Link route="collective" params={{ slug: fromCollective.slug }} passHref>
        <StyledLink color="#2E3033">{fromCollective.name}</StyledLink>
      </Link>
    </P>

    <P fontSize="1rem" textAlign="center" mt={2} px={2} pb={2}>
      Has pledged:

      <br />

      <Span fontSize="1.2rem">
        <Currency
          fontWeight="bold"
          value={totalAmount}
          currency={currency}
          precision={0}
          abbreviate
        />

        {interval ? ` / ${interval}` : null}
      </Span>
    </P>

    <P color="#76777A" fontSize="1rem" textAlign="center" mt={1} px={3} pb={4}>
      {publicMessage}
    </P>
  </Container>
);

PledgeCard.propTypes = {
  currency: PropTypes.string.isRequired,
  fromCollective: PropTypes.shape({
    image: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }).isRequired,
  interval: PropTypes.string,
  publicMessage: PropTypes.string,
  totalAmount: PropTypes.number.isRequired,
};

export default PledgeCard;
