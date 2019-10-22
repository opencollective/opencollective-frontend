import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { truncate } from 'lodash';
import { Box, Flex } from '@rebass/grid';
import styled from 'styled-components';

import formatMemberRole from '../lib/i18n-member-role';
import { H5, P } from './Text';
import FormattedMoneyAmount from './FormattedMoneyAmount';
import StyledCard from './StyledCard';
import { ContributorAvatar } from './Avatar';
import StyledTag from './StyledTag';
import LinkContributor from './LinkContributor';
import roles from '../lib/constants/roles';

/** Main card */
const MainContainer = styled(StyledCard)`
  a {
    display: block;
    text-decoration: none;
    &:hover {
      opacity: 0.9;
    }
  }
`;

/** A container to center the logo above an horizontal bar */
const CollectiveLogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 44px;
  border-top: 1px solid #e6e8eb;
`;

/** User-submitted public message */
const PublicMessage = styled.p`
  margin: 4px 0px;
  font-size: 10px;
  line-height: 13px;
  letter-spacing: -0.5px;
  color: #76777a;
  text-align: center;
  word-break: break-word;
  font-style: italic;
`;

/** Returns the main role for contributor */
const getMainContributorRole = contributor => {
  // Order of the if / else if makes the priority to decide which role we want to
  // show first. The priority order should be:
  // ADMIN > BACKER > FUNDRAISER > *
  // Everything that comes after follower is considered same priority so we just
  // take the first role in the list.
  if (contributor.isAdmin) {
    return roles.ADMIN;
  } else if (contributor.isCore) {
    return roles.MEMBER;
  } else if (contributor.isBacker && contributor.totalAmountDonated < 1) {
    return roles.CONTRIBUTOR;
  } else if (contributor.isBacker) {
    return roles.BACKER;
  } else if (contributor.isFundraiser) {
    return roles.FUNDRAISER;
  } else {
    return contributor.roles[0];
  }
};

/**
 * A single contributor card, exported as a PureComponent to improve performances.
 * Accept all the props from [StyledCard](/#/Atoms?id=styledcard).
 */
const ContributorCard = ({ intl, width, height, contributor, currency, ...props }) => {
  return (
    <MainContainer width={width} height={height} {...props}>
      <CollectiveLogoContainer>
        <Box mt={-32}>
          <LinkContributor contributor={contributor}>
            <ContributorAvatar contributor={contributor} radius={64} />
          </LinkContributor>
        </Box>
      </CollectiveLogoContainer>
      <Flex flexDirection="column" alignItems="center" p={2} pt={1}>
        <LinkContributor contributor={contributor}>
          <H5 fontSize="Paragraph" fontWeight="bold" textAlign="center" lineHeight="Caption" title={contributor.name}>
            {truncate(contributor.name, { length: 16 })}
          </H5>
        </LinkContributor>
        <StyledTag my={2} padding="5px" letterSpacing="0.05em" fontStyle="initial">
          {formatMemberRole(intl, getMainContributorRole(contributor))}
        </StyledTag>
        {contributor.totalAmountDonated > 0 && (
          <React.Fragment>
            <P fontSize="Tiny" lineHeight="Caption" color="black.500">
              <FormattedMessage id="ContributorCard.Total" defaultMessage="Total contributions" />
            </P>
            <P fontSize="Caption" fontWeight="bold">
              <FormattedMoneyAmount amount={contributor.totalAmountDonated} currency={currency} />
            </P>
          </React.Fragment>
        )}
        {contributor.publicMessage && (
          <PublicMessage title={contributor.publicMessage}>
            “{truncate(contributor.publicMessage, { length: 140 })}”
          </PublicMessage>
        )}
      </Flex>
    </MainContainer>
  );
};

ContributorCard.propTypes = {
  /** The contributor to display */
  contributor: PropTypes.shape({
    name: PropTypes.string,
    collectiveSlug: PropTypes.string,
    isIncognito: PropTypes.bool,
    type: PropTypes.oneOf(['USER', 'COLLECTIVE', 'ORGANIZATION', 'CHAPTER', 'ANONYMOUS']),
    totalAmountDonated: PropTypes.number,
    image: PropTypes.string,
    publicMessage: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string.isRequired),
    isAdmin: PropTypes.bool.isRequired,
    isBacker: PropTypes.bool.isRequired,
    isCore: PropTypes.bool.isRequired,
  }).isRequired,
  /** The currency used to show the contributions */
  currency: PropTypes.string,
  // Styling props
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** @ignore */
  intl: PropTypes.object,
};

ContributorCard.defaultProps = {
  width: 144,
  height: 272,
  currency: 'USD',
};

export default React.memo(injectIntl(ContributorCard));
