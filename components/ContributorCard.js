import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
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
  font-size: 10px;
  line-height: 13px;
  letter-spacing: -0.5px;
  color: #4e5052;
  text-align: center;
  word-break: break-word;
  font-style: italic;
`;

/** User-submitted public message */
const PublicMessage = styled.p`
  ${publicMessageStyle}
`;

const Description = styled.p`
  ${publicMessageStyle}
  text-transform: capitalize;
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

const ContributorTag = styled(StyledTag)`
  margin: 8px 0;
  padding: 5px;
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

/**
 * A single contributor card, exported as a PureComponent to improve performances.
 * Accept all the props from [StyledCard](/#/Atoms?id=styledcard).
 */
const ContributorCard = ({
  intl,
  width,
  height,
  contributor,
  currency,
  isLoggedUser,
  collectiveId,
  hideTotalAmountDonated,
  ...props
}) => {
  const { collectiveId: fromCollectiveId, publicMessage, description } = contributor;
  const truncatedPublicMessage = publicMessage && truncate(publicMessage, { length: 140 });
  const truncatedDescription = description && truncate(description, { length: 140 });
  const [showEditMessagePopup, setShowEditMessagePopup] = useState(false);
  const mainContainerRef = useRef();
  return (
    <MainContainer ref={mainContainerRef} width={width} height={height} {...props}>
      <CollectiveLogoContainer>
        <Box mt={-32}>
          <LinkContributor contributor={contributor}>
            <ContributorAvatar contributor={contributor} radius={64} />
          </LinkContributor>
        </Box>
      </CollectiveLogoContainer>
      <Flex flexDirection="column" alignItems="center" p={2} pt={1}>
        <LinkContributor contributor={contributor}>
          <P
            color="black.900"
            fontSize="14px"
            fontWeight="bold"
            textAlign="center"
            lineHeight="18px"
            title={contributor.name}
          >
            {truncate(contributor.name, { length: 16 })}
          </P>
        </LinkContributor>
        <ContributorTag>{formatMemberRole(intl, getMainContributorRole(contributor))}</ContributorTag>
        {contributor.totalAmountDonated > 0 && !hideTotalAmountDonated && (
          <React.Fragment>
            <P fontSize="10px" lineHeight="18px" color="black.700">
              <FormattedMessage id="ContributorCard.Total" defaultMessage="Total contributions" />
            </P>
            <P fontSize="12px" fontWeight="bold">
              <FormattedMoneyAmount amount={contributor.totalAmountDonated} currency={currency} precision={0} />
            </P>
          </React.Fragment>
        )}
        {!truncatedPublicMessage && truncatedDescription && (
          <Description title={description}>{truncatedDescription}</Description>
        )}
        {isLoggedUser && !showEditMessagePopup ? (
          <PublicMessageEditButton
            data-cy="ContributorCard_EditPublicMessageButton"
            onClick={() => {
              setShowEditMessagePopup(true);
            }}
          >
            {truncatedPublicMessage || (
              <FormattedMessage id="contribute.publicMessage" defaultMessage="Leave a public message (Optional)" />
            )}
          </PublicMessageEditButton>
        ) : (
          truncatedPublicMessage && <PublicMessage title={publicMessage}>{truncatedPublicMessage}</PublicMessage>
        )}
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

ContributorCard.propTypes = {
  /** The contributor to display */
  contributor: PropTypes.shape({
    id: PropTypes.string.isRequired,
    collectiveId: PropTypes.number.isRequired,
    name: PropTypes.string,
    description: PropTypes.string,
    collectiveSlug: PropTypes.string,
    isIncognito: PropTypes.bool,
    type: PropTypes.oneOf(['USER', 'COLLECTIVE', 'ORGANIZATION', 'FUND', 'CHAPTER', 'ANONYMOUS']),
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
  /** It is the logged user */
  isLoggedUser: PropTypes.bool,
  /** Collective id */
  collectiveId: PropTypes.number,
  /** True if you want to hide the total amount donated */
  hideTotalAmountDonated: PropTypes.bool,
};

ContributorCard.defaultProps = {
  width: 144,
  height: 272,
  currency: 'USD',
  hideTotalAmountDonated: false,
};

export default React.memo(injectIntl(ContributorCard));
