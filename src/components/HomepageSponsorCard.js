import React from 'react';
import PropTypes from 'prop-types';

import { defaultImage } from '../constants/collectives';
import { imagePreview } from '../lib/utils';

import Container from './Container';
import Currency from './Currency';
import { Link } from '../server/pages';
import StyledLink from './StyledLink';
import { P } from './Text';

const SponsorCard = ({
  currency,
  image,
  name,
  slug,
  stats: { totalAmountSpent },
  type,
}) => (
  <Container
    bg="white.full"
    borderRadius="8px"
    border="1px solid"
    borderColor="black.transparent.20"
    minHeight="100%"
  >
    <Container
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      pt={3}
    >
      <Container bg="black.200" height="1px" width={0.25} />

      <Link route="collective" params={{ slug }} passHref>
        <a>
          <Container
            backgroundImage={`url(${imagePreview(image, defaultImage[type], {
              width: 76,
            })})`}
            backgroundSize="contain"
            backgroundRepeat="no-repeat"
            backgroundPosition="center center"
            borderRadius={12}
            border="2px solid white"
            height={[68, null, 76]}
            width={[68, null, 76]}
          />
        </a>
      </Link>

      <Container bg="black.200" height="1px" width={0.25} />
    </Container>

    <P textAlign="center" fontWeight="bold" mt={3} px={2}>
      <Link route="collective" params={{ slug }} passHref>
        <StyledLink color="black.800">{name}</StyledLink>
      </Link>
    </P>

    <P textAlign="center" mt={2} px={2} pb={3}>
      Total donated:{' '}
      <Currency
        fontWeight="bold"
        value={totalAmountSpent}
        currency={currency}
        precision={0}
        abbreviate
      />
    </P>
  </Container>
);

SponsorCard.propTypes = {
  currency: PropTypes.string.isRequired,
  image: PropTypes.string,
  name: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  stats: PropTypes.shape({
    totalAmountSpent: PropTypes.number.isRequired,
  }).isRequired,
  type: PropTypes.string.isRequired,
};

export default SponsorCard;
