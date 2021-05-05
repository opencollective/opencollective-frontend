import React from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { formatDate } from '../lib/utils';

import Avatar from './Avatar';
import Container from './Container';
import { Box, Flex } from './Grid';
import Link from './Link';
import StyledCard from './StyledCard';
import { H5, Span } from './Text';
import UserCompany from './UserCompany';

const MainContainer = styled(StyledCard)`
  width: 144px;

  a {
    display: block;
    text-decoration: none;
    &:hover {
      opacity: 0.8;
    }
  }
`;

const CollectiveLogoContainer = styled(Flex)`
  border-top: 1px solid ${themeGet('colors.black.200')};
  justify-content: center;
`;

const TruncatedText = styled(Container)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
`;

/**
 * Display a member.
 * Accept all the props from [StyledCard](/#/Atoms?id=styledcard).
 */
const MemberCard = ({ role, since, collective, ...cardProps }) => (
  <MainContainer {...cardProps}>
    <CollectiveLogoContainer mt={52} mb={2}>
      <Box mt={-32}>
        <Link href={`/${collective.slug}`}>
          <Avatar collective={collective} radius={64} />
        </Link>
      </Box>
    </CollectiveLogoContainer>
    <Flex flexDirection="column" alignItems="center" p={2}>
      <Link href={`/${collective.slug}`}>
        <H5 textAlign="center" fontSize="14px" fontWeight="bold" lineHeight="18px">
          {collective.name}
        </H5>
      </Link>
      <TruncatedText minHeight={15} fontSize="10px" textAlign="center" color="black.500">
        <UserCompany company={collective.company} />
      </TruncatedText>
      <Span textAlign="center" fontSize="12px" color="black.600" mt={2} mb={2}>
        <FormattedMessage
          id="membership.description"
          defaultMessage="{role, select, ADMIN {Admin} MEMBER {Core Contributor} BACKER {Contributor}} since {date}"
          values={{ role, date: formatDate(since) }}
        />
      </Span>
    </Flex>
  </MainContainer>
);

MemberCard.propTypes = {
  /** Role */
  role: PropTypes.oneOf(['ADMIN', 'MEMBER', 'BACKER']),
  /** Member since date */
  since: PropTypes.string.isRequired,
  /** Member's collective */
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    name: PropTypes.string,
    image: PropTypes.string,
    company: PropTypes.string,
  }).isRequired,
};

export default MemberCard;
