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
  stats: {
    totalAmountSent,
  },
  type,
}) => (
  <Container bg="white" borderRadius="8px" border="1px solid rgba(18,19,20,0.2)" minHeight="100%">
    <Container display="flex" justifyContent="space-between" alignItems="center" pt={3}>
      <Container bg="#E8E9EB" height="1px" w={0.25} />

      <Link route={`/${slug}`} passHref><a>
        <Container
          backgroundImage={imagePreview(image || defaultImage[type])}
          backgroundSize="contain"
          backgroundRepeat="no-repeat"
          backgroundPosition="center center"
          borderRadius={12}
          border="2px solid white"
          height={[68, null, 76]}
          width={[68, null, 76]}
        />
      </a></Link>

      <Container bg="#E8E9EB" height="1px" w={0.25} />
    </Container>

    <P fontSize="1.4rem" textAlign="center" fontWeight="bold" mt={3} px={2}>
      <Link route={`/${slug}`} passHref><StyledLink color="#2E3033">{name}</StyledLink></Link>
    </P>

    <P fontSize="1.4rem" textAlign="center" mt={2} px={2} pb={3}>
      Total donated: <Currency fontWeight="bold" value={totalAmountSent} currency={currency} abbreviate />
    </P>
  </Container>
);

SponsorCard.propTypes = {
  currency: PropTypes.string.isRequired,
  image: PropTypes.string,
  name: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  stats: PropTypes.shape({
    totalAmountSent: PropTypes.number.isRequired,
  }).isRequired,
  type: PropTypes.string.isRequired,
};

export default SponsorCard;
