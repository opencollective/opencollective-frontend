import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { CheckCircle } from '@styled-icons/boxicons-regular/CheckCircle';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { Envelope } from '@styled-icons/boxicons-regular/Envelope';
import { Planet } from '@styled-icons/boxicons-regular/Planet';
import { Receipt } from '@styled-icons/boxicons-regular/Receipt';
import { MoneyCheckAlt } from '@styled-icons/fa-solid/MoneyCheckAlt';
import { AttachMoney } from '@styled-icons/material/AttachMoney';
import { Dashboard } from '@styled-icons/material/Dashboard';
import { Stack } from '@styled-icons/remix-line/Stack';
import { get, some, truncate, uniqBy } from 'lodash';
import dynamic from 'next/dynamic';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';

import { applyToHostMutation } from '../ApplyToHostBtnLoggedIn';
import Container from '../Container';
import { Box } from '../Grid';
import Link from '../Link';
import Loading from '../Loading';
import StyledButton from '../StyledButton';
import { Dropdown, DropdownArrow, DropdownContent } from '../StyledDropdown';
import StyledLink from '../StyledLink';
import StyledTooltip from '../StyledTooltip';
import { Span } from '../Text';
import { withUser } from '../UserProvider';

// Dynamic imports
const AddFundsToOrganizationModal = dynamic(() => import('../AddFundsToOrganizationModal'));
const AddFundsModal = dynamic(() => import('../host-dashboard/AddFundsModal'));

//  Styled components

const MenuItem = styled('li')`
  display: flex;
  align-items: center;

  &,
  & > a,
  & > button {
    width: 100%;
    text-align: left;
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
  callsToAction,
  LoggedInUser,
  loadingLoggedInUser,
  createNotification,
}) => {
  const hasRequestGrant =
    [CollectiveType.FUND].includes(collective.type) || collective.settings?.fundingRequest === true;
  const hasActions = hasRequestGrant || some(callsToAction);
  const hostedCollectivesLimit = get(collective, 'plan.hostedCollectivesLimit');
  const hostWithinLimit = hostedCollectivesLimit
    ? get(collective, 'plan.hostedCollectives') < hostedCollectivesLimit === true
    : true;
  const [applyToHostWithCollective, { error }] = useMutation(applyToHostMutation);
  const [hasAddFundsModal, showAddFundsModal] = React.useState(false);
  const [hasAddFundsToOrganizationModal, showAddFundsToOrganizationModal] = React.useState(false);

  let contributeRoute = 'orderCollectiveNew';
  let contributeRouteParams = { collectiveSlug: collective.slug, verb: 'donate' };
  if (collective.settings?.disableCustomContributions) {
    if (collective.tiers && collective.tiers.length > 0) {
      const tier = collective.tiers[0];
      contributeRoute = 'orderCollectiveTierNew';
      contributeRouteParams = {
        collectiveSlug: collective.slug,
        verb: 'contribute',
        tierSlug: tier.slug,
        tierId: tier.id,
      };
    } else {
      callsToAction.hasContribute = false;
    }
  }

  if (loadingLoggedInUser) {
    return <Loading />;
  }
  const collectivesToApplyToHostWith = getCollectivesNeedingAHost(LoggedInUser);

  // Do not render the menu if there are no available CTAs
  if (!hasActions) {
    return null;
  }

  return (
    <Container display="flex" alignItems="center" order={[-1, 0]}>
      <Box px={1}>
        <Dropdown trigger="click">
          <StyledButton
            isBorderless
            buttonSize="tiny"
            buttonStyle="secondary"
            my={2}
            fontSize="14px"
            fontWeight="500"
            textTransform="uppercase"
            color="blue.700"
            letterSpacing="60%"
            tabIndex="-1"
          >
            <Span css={{ verticalAlign: 'middle' }}>
              <FormattedMessage id="CollectivePage.NavBar.ActionMenu.Actions" defaultMessage="Actions" />
            </Span>
            <ChevronDown size="24px" />
          </StyledButton>
          <DropdownArrow />
          <DropdownContent>
            <Box as="ul" p={0} m={0} minWidth={184}>
              {callsToAction.hasDashboard && (
                <MenuItem>
                  <StyledLink
                    as={Link}
                    route="host.dashboard"
                    params={{ hostCollectiveSlug: collective.slug }}
                    p={ITEM_PADDING}
                  >
                    <Dashboard size="20px" color="#304CDC" />
                    <FormattedMessage id="host.dashboard" defaultMessage="Dashboard" />
                  </StyledLink>
                </MenuItem>
              )}
              {callsToAction.hasSubmitExpense && (
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
                  <StyledLink
                    as={Link}
                    route="create-expense"
                    params={{ collectiveSlug: collective.slug }}
                    p={ITEM_PADDING}
                  >
                    <MoneyCheckAlt size="20px" color="#304CDC" />
                  </StyledLink>
                </MenuItem>
              )}
              {callsToAction.hasManageSubscriptions && (
                <MenuItem>
                  <StyledLink
                    as={Link}
                    route="recurring-contributions"
                    params={{ slug: collective.slug }}
                    p={ITEM_PADDING}
                  >
                    <Stack size="20px" color="#304CDC" />
                    <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
                  </StyledLink>
                </MenuItem>
              )}
              {callsToAction.hasContribute && (
                <MenuItem py={1}>
                  <StyledLink as={Link} route={contributeRoute} params={contributeRouteParams} p={ITEM_PADDING}>
                    <Planet size="20px" color="#304CDC" />
                    <FormattedMessage id="menu.contributeMoney" defaultMessage="Contribute Money" />
                  </StyledLink>
                </MenuItem>
              )}
              {callsToAction.addFunds && (
                <Fragment>
                  <MenuItem py={1}>
                    <StyledButton p={ITEM_PADDING} onClick={() => showAddFundsModal(true)} isBorderless>
                      <AttachMoney size="20px" color="#304CDC" />
                      <Span>
                        <FormattedMessage id="menu.addFunds" defaultMessage="Add funds" />
                      </Span>
                    </StyledButton>
                  </MenuItem>
                  <AddFundsModal
                    collective={collective}
                    host={collective}
                    show={hasAddFundsModal}
                    setShow={showAddFundsModal}
                    onClose={() => showAddFundsModal(null)}
                  />
                </Fragment>
              )}
              {callsToAction.addFundsToOrganization && (
                <Fragment>
                  <MenuItem py={1}>
                    <StyledButton p={ITEM_PADDING} onClick={() => showAddFundsToOrganizationModal(true)} isBorderless>
                      <AttachMoney size="20px" color="#304CDC" />
                      <Span>
                        <FormattedMessage id="menu.addFunds" defaultMessage="Add funds" />
                      </Span>
                    </StyledButton>
                  </MenuItem>
                  <AddFundsToOrganizationModal
                    collective={collective}
                    show={hasAddFundsToOrganizationModal}
                    setShow={showAddFundsToOrganizationModal}
                    onClose={() => showAddFundsToOrganizationModal(null)}
                  />
                </Fragment>
              )}
              {callsToAction.hasContact && (
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
              {callsToAction.hasApply && (
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
                                  id: c.collective.legacyId || c.collective.id,
                                  HostCollectiveId: collective.legacyId || collective.id,
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
                          <StyledButton p={ITEM_PADDING} isBorderless>
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
                          </StyledButton>
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
          </DropdownContent>
        </Dropdown>
      </Box>
    </Container>
  );
};

CollectiveNavbarActionsMenu.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    legacyId: PropTypes.number,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string,
    settings: PropTypes.object,
    tiers: PropTypes.array,
  }),
  callsToAction: PropTypes.shape({
    /** Button to contact the collective */
    hasContact: PropTypes.bool,
    /** Submit new expense button */
    hasSubmitExpense: PropTypes.bool,
    /** Host's "Apply" button */
    hasApply: PropTypes.bool,
    /** Host's dashboard */
    hasDashboard: PropTypes.bool,
    /** Manage recurring contributions */
    hasManageSubscriptions: PropTypes.bool,
    /** Request a grant from a fund */
    hasRequestGrant: PropTypes.bool,
    /** Contribute financially to a collective */
    hasContribute: PropTypes.bool,
    /** Add funds to a collective */
    addFunds: PropTypes.bool,
    /** Add funds to an organization */
    addFundsToOrganization: PropTypes.bool,
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
