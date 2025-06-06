import React, { useRef, useState } from 'react';
import { truncate } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import roles from '../lib/constants/roles';
import formatMemberRole from '../lib/i18n/member-role';

import { ContributorAvatar } from './Avatar';
import EditPublicMessagePopup from './EditPublicMessagePopup';
import FormattedMoneyAmount from './FormattedMoneyAmount';
import { Box, Flex } from './Grid';
import LinkContributor from './LinkContributor';
import StyledCard from './StyledCard';
import StyledTag from './StyledTag';
import { P } from './Text';

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

const publicMessageStyle = css`
  margin: 4px 0px;
  font-size: 12px;
  line-height: 16px;
  color: #4e5052;
  text-align: center;
  word-break: break-word;
`;

/** User-submitted public message */
const PublicMessage = styled.q`
  display: block;
  ${publicMessageStyle}
`;

/** User-submitted public message edit button */
const PublicMessageEditButton = styled.button`
  ${publicMessageStyle}
  appearance: none;
  border: none;
  cursor: pointer;
  outline: 0;
  background: transparent;
`;

/** Returns the main role for contributor */
const getMainContributorRole = contributor => {
  // Order of the if / else if makes the priority to decide which role we want to
  // show first. The priority order should be:
  // ADMIN > BACKER > *
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
  } else {
    return contributor.roles[0];
  }
};

const ContributorTag = styled(StyledTag)`
  margin-bottom: 8px;
  padding: 5px;
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  font-size: 12px;
`;

/**
 * A single contributor card, exported as a PureComponent to improve performances.
 * Accept all the props from [StyledCard](/#/Atoms?id=styledcard).
 */
const ContributorCard = ({
  intl,
  width = 144,
  height = 272,
  contributor,
  currency = 'USD',
  isLoggedUser,
  collectiveId,
  hideTotalAmountDonated = false,
  ...props
}) => {
  const { collectiveId: fromCollectiveId, publicMessage, description } = contributor;
  const truncatedPublicMessage = publicMessage && truncate(publicMessage, { length: 50 });
  const truncatedDescription = description && truncate(description, { length: 30 });
  const [showEditMessagePopup, setShowEditMessagePopup] = useState(false);
  const mainContainerRef = useRef(undefined);
  return (
    <MainContainer width={width} height={height} {...props} ref={mainContainerRef}>
      <CollectiveLogoContainer>
        <Box mt={-32}>
          <LinkContributor contributor={contributor}>
            <ContributorAvatar contributor={contributor} radius={64} />
          </LinkContributor>
        </Box>
      </CollectiveLogoContainer>
      <Flex flexDirection="column" alignItems="center" p={2} pt={2}>
        <LinkContributor contributor={contributor}>
          <P
            color="black.900"
            fontSize="14px"
            fontWeight="500"
            textAlign="center"
            lineHeight="18px"
            title={contributor.name}
          >
            {truncate(contributor.name, { length: 16 })}
          </P>
        </LinkContributor>
        <Box mt={2}>
          {contributor.isAdmin || contributor.isCore ? (
            <ContributorTag>{formatMemberRole(intl, getMainContributorRole(contributor))}</ContributorTag>
          ) : truncatedDescription ? (
            <P fontSize="12px" fontWeight="700" title={description} mb={1} textAlign="center">
              {truncatedDescription}
            </P>
          ) : null}
          {contributor.totalAmountDonated > 0 && !hideTotalAmountDonated && (
            <P fontSize="12px" fontWeight="700" textAlign="center">
              <FormattedMoneyAmount amount={contributor.totalAmountDonated} currency={currency} precision={0} />
            </P>
          )}
        </Box>
        <Box mt={1}>
          {isLoggedUser && !showEditMessagePopup ? (
            <PublicMessageEditButton
              data-cy="ContributorCard_EditPublicMessageButton"
              onClick={() => {
                setShowEditMessagePopup(true);
              }}
            >
              {truncatedPublicMessage || (
                <FormattedMessage id="contribute.publicMessage" defaultMessage="Leave a public message (optional)" />
              )}
            </PublicMessageEditButton>
          ) : (
            truncatedPublicMessage && <PublicMessage title={publicMessage}>{truncatedPublicMessage}</PublicMessage>
          )}
        </Box>
      </Flex>
      {showEditMessagePopup && (
        <EditPublicMessagePopup
          cardRef={mainContainerRef}
          message={publicMessage}
          onClose={() => setShowEditMessagePopup(false)}
          intl={intl}
          fromCollectiveId={fromCollectiveId}
          collectiveId={collectiveId}
        />
      )}
    </MainContainer>
  );
};

export default React.memo(injectIntl(ContributorCard));
