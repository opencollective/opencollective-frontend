import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { defaultImage } from '../../lib/constants/collectives';
import { firstSentence, imagePreview } from '../../lib/utils';

import Container from '../Container';
import Currency from '../Currency';
import { Link } from '../../server/pages';
import StyledLink from '../StyledLink';
import { P } from '../Text';

const SponsorCard = ({ currency, image, name, description, slug, totalDonations, type }) => (
  <Container bg="white.full" borderRadius="8px" border="1px solid" borderColor="black.transparent.20" minHeight="100%">
    <Container display="flex" justifyContent="space-between" alignItems="center" pt={3}>
      <Container bg="black.200" height="1px" width={0.25} />

      <Link route="collective" params={{ slug }} passHref>
        <a title={`${name}\n${firstSentence(description, 80)}`}>
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

    <Container height={90} overflow="hidden">
      <P textAlign="center" mt={2} px={2} pb={3} color="black.800" fontSize="1.2rem" lineHeight="1.5">
        <Link route="collective" params={{ slug }} passHref>
          <StyledLink color="black.800" fontWeight="bold" fontSize="1.4rem">
            {name}
          </StyledLink>
        </Link>
        <br />
        {firstSentence(description, 70)}
      </P>
    </Container>
    <P textAlign="center" px={2} pb={3} fontSize={['1.3rem', '1.3rem', '1.4rem']}>
      <FormattedMessage
        id="ContributedAmount"
        defaultMessage="Contributed {amount}"
        values={{
          amount: <Currency fontWeight="bold" value={totalDonations} currency={currency} precision={0} abbreviate />,
        }}
      />
    </P>
  </Container>
);

SponsorCard.propTypes = {
  currency: PropTypes.string.isRequired,
  image: PropTypes.string,
  description: PropTypes.string,
  name: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  totalDonations: PropTypes.number.isRequired,
  type: PropTypes.string,
};

SponsorCard.defaultProps = {
  type: 'ORGANIZATION',
};

export default SponsorCard;
