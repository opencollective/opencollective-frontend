import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Envelope } from '@styled-icons/boxicons-regular/Envelope';
import { Planet } from '@styled-icons/boxicons-regular/Planet';
import { Receipt } from '@styled-icons/boxicons-regular/Receipt';
import { MoneyCheckAlt } from '@styled-icons/fa-solid/MoneyCheckAlt';
import { ChevronDown } from '@styled-icons/feather/ChevronDown/ChevronDown';
import { AttachMoney } from '@styled-icons/material/AttachMoney';
import { Dashboard } from '@styled-icons/material/Dashboard';
import { Stack } from '@styled-icons/remix-line/Stack';
import { get, pickBy } from 'lodash';
import dynamic from 'next/dynamic';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';

import ApplyToHostBtn from '../ApplyToHostBtn';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { Dropdown, DropdownArrow, DropdownContent } from '../StyledDropdown';
import StyledHr from '../StyledHr';
import StyledLink from '../StyledLink';
import { Span } from '../Text';

import { NAVBAR_ACTION_TYPE } from './menu';

// Dynamic imports
const AddPrepaidBudgetModal = dynamic(() => import('../AddPrepaidBudgetModal'));
const AddFundsModal = dynamic(() => import('../host-dashboard/AddFundsModal'));

//  Styled components
const MenuItem = styled('li')`
  display: flex;
  align-items: center;

  &,
  a,
  button {
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

    &:focus {
      box-shadow: none;
      outline: none;
      text-decoration: underline;
    }

    &:disabled {
      color: #8c8c8c;
    }
  }

  svg {
    margin-right: 8px;
  }

  ${props =>
    props.isHiddenOnMobile &&
    css`
      @media screen and (min-width: 40em) {
        display: none;
      }
    `}
`;

const ActionsDropdown = styled(Dropdown)`
  @media screen and (min-width: 40em) and (max-width: 88em) {
    ${DropdownContent} {
      right: 50px;
    }
  }

  @media (max-width: 40em) {
    ${DropdownArrow} {
      display: none !important;
    }
    ${DropdownContent} {
      display: block;
      position: relative;
      box-shadow: none;
      border: none;
      padding-left: 14px;
    }
  }
`;

const StyledActionButton = styled(StyledButton)`
  @media (max-width: 40em) {
    cursor: none;
    pointer-events: none;
  }
`;

const StyledChevronDown = styled(ChevronDown)`
  @media (max-width: 40em) {
    display: none;
  }
`;

const ITEM_PADDING = '11px 14px';

export const getContributeRoute = collective => {
  let route = 'orderCollectiveNew';
  let params = { collectiveSlug: collective.slug, verb: 'donate' };
  if (collective.settings?.disableCustomContributions) {
    if (collective.tiers && collective.tiers.length > 0) {
      const tier = collective.tiers[0];
      route = 'orderCollectiveTierNew';
      params = {
        collectiveSlug: collective.slug,
        verb: 'contribute',
        tierSlug: tier.slug,
        tierId: tier.id,
      };
    } else {
      return null;
    }
  }
  return { route, params };
};

const checkEmptyActions = (callsToActions, hiddenAction, hasRequestGrant) => {
  // At the moment this one is not display as a main CTA
  if (hasRequestGrant) {
    return false;
  }

  const enabledCtas = Object.keys(pickBy(callsToActions, Boolean));
  if (enabledCtas.length > 1) {
    return false;
  } else if (enabledCtas.length === 1 && hiddenAction) {
    return enabledCtas[0] === hiddenAction;
  } else {
    return true;
  }
};

const CollectiveNavbarActionsMenu = ({ collective, callsToAction, hiddenActionForNonMobile }) => {
  const hasRequestGrant =
    [CollectiveType.FUND].includes(collective.type) || collective.settings?.fundingRequest === true;
  const isEmpty = checkEmptyActions(callsToAction, hiddenActionForNonMobile, hasRequestGrant);
  const hostedCollectivesLimit = get(collective, 'plan.hostedCollectivesLimit');
  const hostWithinLimit = hostedCollectivesLimit
    ? get(collective, 'plan.hostedCollectives') < hostedCollectivesLimit === true
    : true;
  const [hasAddFundsModal, showAddFundsModal] = React.useState(false);
  const [hasAddPrepaidBudgetModal, showAddPrepaidBudgetModal] = React.useState(false);
  const contributeRoute = getContributeRoute(collective);

  // Do not render the menu if there are no available CTAs
  if (isEmpty) {
    return null;
  }

  return (
    <Container display="flex" alignItems="center" order={[-1, 0]} borderTop={['1px solid #e1e1e1', 'none']}>
      <Box px={1}>
        <ActionsDropdown trigger="click">
          {({ triggerProps, dropdownProps }) => (
            <React.Fragment>
              <Flex alignItems="center">
                <Box display={['block', 'none']} width={'32px'} ml={2}>
                  <StyledHr borderStyle="solid" borderColor="#304CDC" />
                </Box>
                <StyledActionButton
                  type="button"
                  isBorderless
                  buttonSize="tiny"
                  buttonStyle="secondary"
                  my={2}
                  fontSize="14px"
                  fontWeight="500"
                  textTransform="uppercase"
                  color="#304CDC"
                  letterSpacing="60%"
                  whiteSpace="nowrap"
                  data-cy="collective-navbar-actions-btn"
                  {...triggerProps}
                >
                  <Span css={{ verticalAlign: 'middle', marginRight: '4px' }}>
                    <FormattedMessage id="CollectivePage.NavBar.ActionMenu.Actions" defaultMessage="Actions" />
                  </Span>
                  <StyledChevronDown size="14px" />
                </StyledActionButton>
              </Flex>
              <div {...dropdownProps}>
                <DropdownArrow />
                <DropdownContent>
                  <Box as="ul" p={0} m={0} minWidth={184}>
                    {callsToAction.hasDashboard && (
                      <MenuItem isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.DASHBOARD}>
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
                      <MenuItem isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.SUBMIT_EXPENSE}>
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
                          <FormattedMessage id="ExpenseForm.Type.Request" defaultMessage="Request Grant" />
                        </StyledLink>
                      </MenuItem>
                    )}
                    {callsToAction.hasManageSubscriptions && (
                      <MenuItem isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.MANAGE_SUBSCRIPTIONS}>
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
                    {callsToAction.hasContribute && contributeRoute && (
                      <MenuItem py={1} isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.CONTRIBUTE}>
                        <StyledLink as={Link} {...contributeRoute} p={ITEM_PADDING}>
                          <Planet size="20px" color="#304CDC" />
                          <FormattedMessage id="menu.contributeMoney" defaultMessage="Contribute Money" />
                        </StyledLink>
                      </MenuItem>
                    )}
                    {callsToAction.addFunds && (
                      <Fragment>
                        <MenuItem py={1} isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.ADD_FUNDS}>
                          <StyledButton p={ITEM_PADDING} onClick={() => showAddFundsModal(true)} isBorderless>
                            <AttachMoney size="20px" color="#304CDC" />
                            <Span>
                              <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
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
                    {callsToAction.addPrepaidBudget && (
                      <Fragment>
                        <MenuItem
                          py={1}
                          isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.ADD_PREPAID_BUDGET}
                        >
                          <StyledButton p={ITEM_PADDING} onClick={() => showAddPrepaidBudgetModal(true)} isBorderless>
                            <AttachMoney size="20px" color="#304CDC" />
                            <Span>
                              <FormattedMessage id="menu.addPrepaidBudget" defaultMessage="Add Prepaid Budget" />
                            </Span>
                          </StyledButton>
                        </MenuItem>
                        <AddPrepaidBudgetModal
                          collective={collective}
                          show={hasAddPrepaidBudgetModal}
                          setShow={showAddPrepaidBudgetModal}
                          onClose={() => showAddPrepaidBudgetModal(null)}
                        />
                      </Fragment>
                    )}
                    {callsToAction.hasContact && (
                      <MenuItem py={1} isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.CONTACT}>
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
                        <MenuItem py={1} isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.APPLY}>
                          <ApplyToHostBtn
                            hostSlug={collective.slug}
                            hostWithinLimit={hostWithinLimit}
                            buttonProps={{ isBorderless: true, p: ITEM_PADDING }}
                          />
                        </MenuItem>
                      </React.Fragment>
                    )}
                  </Box>
                </DropdownContent>
              </div>
            </React.Fragment>
          )}
        </ActionsDropdown>
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
    /** Add prepaid budget to an organization */
    addPrepaidBudget: PropTypes.bool,
  }).isRequired,
  hiddenActionForNonMobile: PropTypes.oneOf(Object.values(NAVBAR_ACTION_TYPE)),
};

CollectiveNavbarActionsMenu.defaultProps = {
  callsToAction: {},
  buttonsMinWidth: 100,
};

export default CollectiveNavbarActionsMenu;
