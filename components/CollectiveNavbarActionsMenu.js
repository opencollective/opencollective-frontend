import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { CheckCircle } from '@styled-icons/boxicons-regular/CheckCircle';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { Dollar } from '@styled-icons/boxicons-regular/Dollar';
import { Envelope } from '@styled-icons/boxicons-regular/Envelope';
import { Receipt } from '@styled-icons/boxicons-regular/Receipt';
import { get, truncate, uniqBy } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../lib/constants/collectives';

import { applyToHostMutation } from './ApplyToHostBtnLoggedIn';
import Container from './Container';
import { Box } from './Grid';
import Link from './Link';
import Loading from './Loading';
import MenuPopover from './MenuPopover';
import StyledButton from './StyledButton';
import StyledLink from './StyledLink';
import StyledTooltip from './StyledTooltip';
import { P, Span } from './Text';
import { withUser } from './UserProvider';

//  Styled components

const MenuItem = styled('li')`
  display: flex;
  align-items: center;

  &,
  & > a {
    font-style: normal;
    font-weight: 500;
    font-size: 13px;
    line-height: 16px;
    letter-spacing: -0.4px;
    outline: none;

    &:not(:hover) {
      color: #313233;
    }
  }

  svg {
    margin-right: 8px;
  }
`;

const ITEM_PADDING = '11px 14px';

const getCollectivesNeedingAHost = user => {
  const memberships = uniqBy(
    user?.memberOf.filter(m => m.role === 'ADMIN'),
    m => m.collective.id,
  );
  const collectives = memberships
    .filter(m => m.collective.type === 'COLLECTIVE')
    .sort((a, b) => {
      return a.collective.slug.localeCompare(b.collective.slug);
    });
  const collectivesNeedingAHost = collectives
    .filter(c => c.collective.host === null)
    .sort((a, b) => {
      return a.collective.slug.localeCompare(b.collective.slug);
    });
  return collectivesNeedingAHost;
};

const CollectiveNavbarActionsMenu = ({
  collective,
  callsToAction: { hasSubmitExpense, hasContact, hasApply },
  LoggedInUser,
  loadingLoggedInUser,
  createNotification,
}) => {
  const hasRequestGrant =
    [CollectiveType.FUND].includes(collective.type) || collective.settings?.fundingRequest === true;
  const hasActions = hasSubmitExpense || hasContact || hasApply || hasRequestGrant;
  const hostedCollectivesLimit = get(collective, 'plan.hostedCollectivesLimit');
  const hostWithinLimit = hostedCollectivesLimit
    ? get(collective, 'plan.hostedCollectives') < hostedCollectivesLimit === true
    : true;
  const [applyToHostWithCollective, { error }] = useMutation(applyToHostMutation);

  if (loadingLoggedInUser) {
    return <Loading />;
  }
  const collectivesToApplyToHostWith = getCollectivesNeedingAHost(LoggedInUser);

  // Do not render the menu if there are no available CTAs
  if (!hasActions) {
    return null;
  }

  return (
    <Container>
      <Box px={1}>
        <MenuPopover
          place="bottom-end"
          content={() => (
            <Box as="ul" p={0} m={0} minWidth={184}>
              {hasSubmitExpense && (
                <MenuItem>
                  <StyledLink
                    as={Link}
                    route="create-expense"
                    params={{ collectiveSlug: collective.slug }}
                    p={ITEM_PADDING}
                  >
                    <Receipt size="20px" color="#304CDC" />
                    <FormattedMessage id="ExpenseForm.Submit" defaultMessage="Submit expense" />
                  </StyledLink>
                </MenuItem>
              )}
              {hasRequestGrant && (
                <MenuItem py={1}>
                  <Dollar size="20px" color="#304CDC" />
                  <P my={2} fontSize="13px" color="black.800">
                    <FormattedMessage id="ExpenseForm.Type.Request" defaultMessage="Request Grant" />
                  </P>
                </MenuItem>
              )}
              {hasContact && (
                <MenuItem py={1}>
                  <StyledLink
                    as={Link}
                    route="collective-contact"
                    params={{ collectiveSlug: collective.slug }}
                    p={ITEM_PADDING}
                  >
                    <Envelope size="20px" color="#304CDC" />
                    <FormattedMessage id="Contact" defaultMessage="Contact" />
                  </StyledLink>
                </MenuItem>
              )}
              {hasApply && (
                <React.Fragment>
                  {hostWithinLimit ? (
                    collectivesToApplyToHostWith.map(c => {
                      return (
                        <MenuItem
                          key={c.collective.name}
                          py={1}
                          onClick={async () => {
                            await applyToHostWithCollective({
                              variables: {
                                collective: {
                                  id: c.collective.id,
                                  HostCollectiveId: collective.id,
                                },
                              },
                            });
                            if (error) {
                              createNotification('error', c.collective.name);
                            } else {
                              createNotification('default', c.collective.name);
                            }
                          }}
                        >
                          <CheckCircle size="20px" color="#304CDC" />
                          <Span>
                            <FormattedMessage
                              id="host.apply.btn"
                              defaultMessage="Apply with {collective}"
                              values={{
                                collective: <strong>{truncate(c.collective.name, { length: 15 })}</strong>,
                              }}
                            />
                          </Span>
                        </MenuItem>
                      );
                    })
                  ) : (
                    <StyledTooltip
                      place="left"
                      content={
                        <FormattedMessage
                          id="host.hostLimit.warning"
                          defaultMessage="Host already reached the limit of hosted collectives for its plan. <a>Contact {collectiveName}</a> and let them know you want to apply."
                          values={{
                            collectiveName: collective.name,
                            // eslint-disable-next-line react/display-name
                            a: chunks => <Link route={`/${collective.slug}/contact`}>{chunks}</Link>,
                          }}
                        />
                      }
                    >
                      <MenuItem py={1}>
                        <CheckCircle size="20px" color="#304CDC" />
                        <Span>
                          <FormattedMessage id="Actions.ApplyToHost" defaultMessage="Apply to this host" />
                        </Span>
                      </MenuItem>
                    </StyledTooltip>
                  )}
                </React.Fragment>
              )}
            </Box>
          )}
        >
          <StyledButton
            isBorderless
            buttonSize="tiny"
            buttonStyle="secondary"
            my={2}
            fontSize="14px"
            fontWeight="500"
            textTransform="uppercase"
            color="blue.700"
          >
            <Span css={{ verticalAlign: 'middle' }}>
              <FormattedMessage id="CollectivePage.NavBar.ActionMenu.Actions" defaultMessage="Actions" />
            </Span>
            <ChevronDown size="24px" />
          </StyledButton>
        </MenuPopover>
      </Box>
    </Container>
  );
};

CollectiveNavbarActionsMenu.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string,
    settings: PropTypes.object,
  }),
  callsToAction: PropTypes.shape({
    /** Button to contact the collective */
    hasContact: PropTypes.bool,
    /** Submit new expense button */
    hasSubmitExpense: PropTypes.bool,
    /** Hosts "Apply" button */
    hasApply: PropTypes.bool,
  }).isRequired,
  LoggedInUser: PropTypes.object,
  loadingLoggedInUser: PropTypes.bool,
  createNotification: PropTypes.func,
};

CollectiveNavbarActionsMenu.defaultProps = {
  callsToAction: {},
  buttonsMinWidth: 100,
};

export default withUser(CollectiveNavbarActionsMenu);
