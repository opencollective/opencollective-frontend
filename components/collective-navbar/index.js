import React, { Fragment, useRef } from 'react';
import { PropTypes } from 'prop-types';
import { DotsVerticalRounded } from '@styled-icons/boxicons-regular/DotsVerticalRounded';
import { Envelope } from '@styled-icons/boxicons-regular/Envelope';
import { Planet } from '@styled-icons/boxicons-regular/Planet';
import { Receipt } from '@styled-icons/boxicons-regular/Receipt';
import { MoneyCheckAlt } from '@styled-icons/fa-solid/MoneyCheckAlt';
import { AttachMoney } from '@styled-icons/material/AttachMoney';
import { Close } from '@styled-icons/material/Close';
import { Dashboard } from '@styled-icons/material/Dashboard';
import { Stack } from '@styled-icons/remix-line/Stack';
import themeGet from '@styled-system/theme-get';
import { get, pickBy, without } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';
import { maxWidth } from 'styled-system';

import { getFilteredSectionsForCollective, NAVBAR_CATEGORIES } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';
import useGlobalBlur from '../../lib/hooks/useGlobalBlur';

import AddFundsBtn from '../AddFundsBtn';
import AddPrepaidBudgetBtn from '../AddPrepaidBudgetBtn';
import ApplyToHostBtn from '../ApplyToHostBtn';
import Avatar from '../Avatar';
import { Dimensions } from '../collective-page/_constants';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledButton from '../StyledButton';
import { H1, Span } from '../Text';
import { useUser } from '../UserProvider';

import CollectiveNavbarActionsMenu, { getContributeRoute } from './ActionsMenu';
import { getNavBarMenu, NAVBAR_ACTION_TYPE } from './menu';
import NavBarCategoryDropdown from './NavBarCategoryDropdown';

const MainContainer = styled(Container)`
  background: white;
  display: flex;
  justify-content: flex-start;
  overflow-y: auto;
`;

const AvatarBox = styled(Box)`
  position: relative;

  &::before {
    content: '';
    height: 24px;
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    margin-top: auto;
    margin-bottom: auto;
    border-right: 2px solid rgba(214, 214, 214, 1);
  }
`;

const InfosContainer = styled(Container)`
  [data-hide='false'] {
    width: 1;
    opacity: 1;
    visibility: visible;
    transform: translateX(0);
    transition: opacity 0.075s ease-out, transform 0.1s ease-out, visibility 0.075s ease-out, width 0.1s ease-in-out;
  }

  [data-hide='true'] {
    width: 0;
    visibility: hidden;
    opacity: 0;
    transform: translateX(-20px);
  }
`;

const CollectiveName = styled(H1)`
  letter-spacing: -0.8px;

  a {
    ${maxWidth}
    display: block;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    min-width: 0;
    text-decoration: none;
  }

  a:not(:hover) {
    color: #313233;
  }
`;

const CategoriesContainer = styled(Container)`
  @media screen and (min-width: 40em) and (max-width: 64em) {
    border: 1px solid rgba(214, 214, 214, 0.3);
    border-radius: 0px 0px 0px 8px;
    box-shadow: 0px 6px 10px -5px rgba(214, 214, 214, 0.5);
    position: absolute;
    right: 0;
    top: 52px;
    width: 0;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.4s ease-out, visibility 0.4s ease-out, width 0.2s ease-out;

    ${props =>
      props.isExpanded &&
      css`
        width: 400px;
        visibility: visible;
        opacity: 1;
      `}
  }
`;

/** Displayed on mobile & tablet to toggle the menu */
const ExpandMenuIcon = styled(DotsVerticalRounded).attrs({ size: 28 })`
  cursor: pointer;
  margin-right: 4px;
  flex: 0 0 28px;
  color: ${themeGet('colors.primary.600')};

  &:hover {
    background: radial-gradient(transparent 14px, white 3px),
      linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)),
      linear-gradient(${themeGet('colors.primary.600')}, ${themeGet('colors.primary.600')});
  }

  &:active {
    background: radial-gradient(${themeGet('colors.primary.600')} 14px, white 3px);
    color: ${themeGet('colors.white.full')};
  }

  @media (min-width: 64em) {
    display: none;
  }
`;

const CloseMenuIcon = styled(Close).attrs({ size: 28 })`
  cursor: pointer;
  margin-right: 4px;
  flex: 0 0 28px;
  color: ${themeGet('colors.primary.600')};

  &:hover {
    background: radial-gradient(transparent 14px, white 3px),
      linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)),
      linear-gradient(${themeGet('colors.primary.600')}, ${themeGet('colors.primary.600')});
  }

  &:active {
    background: radial-gradient(${themeGet('colors.primary.600')} 14px, white 3px);
    color: ${themeGet('colors.white.full')};
  }

  @media (min-width: 64em) {
    display: none;
  }
`;

const isFeatureAvailable = (collective, feature) => {
  const status = get(collective.features, feature);
  return status === 'ACTIVE' || status === 'AVAILABLE';
};

const getDefaultCallsToActions = (collective, isAdmin, isHostAdmin, isRoot) => {
  if (!collective) {
    return {};
  }

  const isFund = collective.type === CollectiveType.FUND;
  const isProject = collective.type === CollectiveType.PROJECT;

  return {
    hasContribute: (isFund || isProject) && collective.isActive,
    hasContact: isFeatureAvailable(collective, 'CONTACT_FORM'),
    hasApply: isFeatureAvailable(collective, 'RECEIVE_HOST_APPLICATIONS'),
    hasSubmitExpense: isFeatureAvailable(collective, 'RECEIVE_EXPENSES'),
    hasManageSubscriptions: isAdmin && get(collective.features, 'RECURRING_CONTRIBUTIONS') === 'ACTIVE',
    hasDashboard: isAdmin && isFeatureAvailable(collective, 'HOST_DASHBOARD'),
    hasRequestGrant: isFund || get(collective.settings, 'fundingRequest') === true,
    addPrepaidBudget: isRoot && collective.type === CollectiveType.ORGANIZATION,
    addFunds: isHostAdmin,
  };
};

/**
 * Returns the main CTA that should be displayed as a button outside of the action menu in this component.
 * Returns the second CTA that should be displayed as a button in ActionsMenu.js if only 2 CTAs.
 */
const getMainAction = (collective, callsToAction) => {
  if (!collective || !callsToAction) {
    return null;
  }

  // Order of the condition defines main call to action: first match gets displayed
  if (callsToAction.includes('hasDashboard')) {
    return {
      type: NAVBAR_ACTION_TYPE.DASHBOARD,
      component: (
        <Link route="host.dashboard" params={{ hostCollectiveSlug: collective.slug }}>
          <MainActionBtn tabIndex="-1">
            <Dashboard size="1em" />
            <Span ml={2}>
              <FormattedMessage id="host.dashboard" defaultMessage="Dashboard" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasContribute') && getContributeRoute(collective)) {
    return {
      type: NAVBAR_ACTION_TYPE.CONTRIBUTE,
      component: (
        <Link {...getContributeRoute(collective)}>
          <MainActionBtn tabIndex="-1">
            <Planet size="1em" />
            <Span ml={2}>
              <FormattedMessage id="menu.contributeMoney" defaultMessage="Contribute Money" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasApply')) {
    const plan = collective.plan || {};
    return {
      type: NAVBAR_ACTION_TYPE.APPLY,
      component: (
        <ApplyToHostBtn
          hostSlug={collective.slug}
          buttonRenderer={props => <MainActionBtn {...props} />}
          hostWithinLimit={!plan.hostedCollectivesLimit || plan.hostedCollectives < plan.hostedCollectivesLimit}
        />
      ),
    };
  } else if (callsToAction.includes('hasSubmitExpense')) {
    return {
      type: NAVBAR_ACTION_TYPE.SUBMIT_EXPENSE,
      component: (
        <Link route="create-expense" params={{ collectiveSlug: collective.slug }}>
          <MainActionBtn tabIndex="-1">
            <Receipt size="1em" />
            <Span ml={2}>
              <FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasManageSubscriptions')) {
    return {
      type: NAVBAR_ACTION_TYPE.MANAGE_SUBSCRIPTIONS,
      component: (
        <Link route="recurring-contributions" params={{ slug: collective.slug }}>
          <MainActionBtn tabIndex="-1">
            <Stack size="1em" />
            <Span ml={2}>
              <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasContact')) {
    return {
      type: NAVBAR_ACTION_TYPE.CONTACT,
      component: (
        <Link route="collective-contact" params={{ collectiveSlug: collective.slug }}>
          <MainActionBtn tabIndex="-1">
            <Envelope size="1em" />
            <Span ml={2}>
              <FormattedMessage id="Contact" defaultMessage="Contact" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasRequestGrant')) {
    return {
      type: NAVBAR_ACTION_TYPE.REQUEST_GRANT,
      component: (
        <Link route="create-expense" params={{ collectiveSlug: collective.slug }}>
          <MainActionBtn tabIndex="-1">
            <MoneyCheckAlt size="1em" />
            <Span ml={2}>
              <FormattedMessage id="ExpenseForm.Type.Request" defaultMessage="Request Grant" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.includes(NAVBAR_ACTION_TYPE.ADD_FUNDS) && collective.host) {
    return {
      type: NAVBAR_ACTION_TYPE.ADD_FUNDS,
      component: (
        <AddFundsBtn collective={collective} host={collective.host}>
          {btnProps => (
            <MainActionBtn {...btnProps}>
              <AttachMoney size="1em" />
              <Span>
                <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
              </Span>
            </MainActionBtn>
          )}
        </AddFundsBtn>
      ),
    };
  } else if (callsToAction.includes(NAVBAR_ACTION_TYPE.ADD_PREPAID_BUDGET)) {
    return {
      type: NAVBAR_ACTION_TYPE.ADD_PREPAID_BUDGET,
      component: (
        <AddPrepaidBudgetBtn collective={collective}>
          {btnProps => (
            <MainActionBtn {...btnProps}>
              <AttachMoney size="1em" />
              <Span>
                <FormattedMessage id="menu.addPrepaidBudget" defaultMessage="Add Prepaid Budget" />
              </Span>
            </MainActionBtn>
          )}
        </AddPrepaidBudgetBtn>
      ),
    };
  } else {
    return null;
  }
};

export const MainActionBtn = styled(StyledButton).attrs({ buttonSize: 'tiny' })`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  padding: 5px 10px;
  text-transform: uppercase;
  background: linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)),
    linear-gradient(${themeGet('colors.primary.600')}, ${themeGet('colors.primary.600')});
  border-radius: 8px;
  border: 2px solid white;
  color: ${themeGet('colors.primary.600')};

  &:focus {
    border: 2px solid #050505;
  }

  &:hover {
    background: linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)),
      linear-gradient(${themeGet('colors.primary.600')}, ${themeGet('colors.primary.600')});
    border: 2px solid white;
  }

  &:active {
    background: ${themeGet('colors.primary.600')};
    color: ${themeGet('colors.white.full')};
    border: 2px solid white;
  }

  span {
    vertical-align: middle;
  }
`;

/**
 * The NavBar that displays all the individual sections.
 */
const CollectiveNavbar = ({
  collective,
  isAdmin,
  isLoading,
  sections,
  selectedCategory,
  callsToAction,
  onCollectiveClick,
  hideInfosOnDesktop,
  onlyInfos,
  isAnimated,
  showBackButton,
  withShadow,
  useAnchorsForCategories,
}) => {
  const intl = useIntl();
  const [isExpanded, setExpanded] = React.useState(false);
  const { LoggedInUser } = useUser();
  isAdmin = isAdmin || LoggedInUser?.canEditCollective(collective);
  const isHostAdmin = LoggedInUser?.isHostAdmin(collective);
  sections = sections || getFilteredSectionsForCollective(collective, isAdmin, isHostAdmin);
  const isRoot = LoggedInUser?.isRoot;
  callsToAction = { ...getDefaultCallsToActions(collective, isAdmin, isHostAdmin, isRoot), ...callsToAction };
  const actionsArray = Object.keys(pickBy(callsToAction, Boolean));
  const mainAction = getMainAction(collective, actionsArray);
  const secondAction = getMainAction(collective, without(actionsArray, mainAction?.type));
  const navbarRef = useRef();

  useGlobalBlur(navbarRef, outside => {
    if (!outside && isExpanded) {
      setTimeout(() => {
        setExpanded(false);
      }, 200);
    }
  });

  return (
    <MainContainer
      flexDirection={['column', 'row']}
      px={[0, Dimensions.PADDING_X[1]]}
      mx="auto"
      mt={onlyInfos ? 0 : '50px'}
      maxWidth={Dimensions.MAX_SECTION_WIDTH}
      boxShadow={withShadow ? ' 0px 6px 10px -5px rgba(214, 214, 214, 0.5)' : 'none'}
      maxHeight="100vh"
    >
      {/** Collective info */}
      <InfosContainer isAnimated={isAnimated} mr={[0, 2]} display="flex" alignItems="center" px={[3, 0]} py={[2, 1]}>
        <Flex alignItems="center" data-hide={hideInfosOnDesktop}>
          {showBackButton && (
            <Box display={['none', 'block']} mr={2}>
              {collective && (
                <Link route="collective" params={{ slug: collective.slug }}>
                  <StyledButton px={1} isBorderless>
                    &larr;
                  </StyledButton>
                </Link>
              )}
            </Box>
          )}
          <AvatarBox>
            <LinkCollective collective={collective} onClick={onCollectiveClick}>
              <Container borderRadius="25%" mr={2}>
                <Avatar collective={collective} radius={40} />
              </Container>
            </LinkCollective>
          </AvatarBox>
          <Box display={['block', null, null, onlyInfos ? 'block' : 'none']}>
            <CollectiveName
              mx={2}
              py={2}
              fontSize={['16px', '20px']}
              lineHeight={['24px', '28px']}
              textAlign="center"
              fontWeight="500"
              color="black.800"
              maxWidth={[200, 280, 500]}
            >
              {isLoading ? (
                <LoadingPlaceholder height={14} minWidth={100} />
              ) : (
                <LinkCollective collective={collective} onClick={onCollectiveClick} />
              )}
            </CollectiveName>
          </Box>
        </Flex>
        {!onlyInfos && (
          <Box display={['block', 'none']} marginLeft="auto">
            {isExpanded ? (
              <CloseMenuIcon onClick={() => setExpanded(!isExpanded)} />
            ) : (
              <ExpandMenuIcon onClick={() => setExpanded(!isExpanded)} />
            )}
          </Box>
        )}
      </InfosContainer>
      {/** Main navbar items */}

      {!onlyInfos && (
        <Fragment>
          <CategoriesContainer
            ref={navbarRef}
            backgroundColor="#fff"
            display={isExpanded ? 'flex' : ['none', 'flex']}
            flexDirection={['column', null, null, 'row']}
            flexShrink={2}
            flexGrow={1}
            justifyContent={['space-between', null, 'flex-start']}
            order={[0, 3, 0]}
            overflowX="auto"
            isExpanded={isExpanded}
          >
            {isLoading ? (
              <LoadingPlaceholder height={43} minWidth={150} mb={2} />
            ) : (
              getNavBarMenu(intl, collective, sections).map(({ category, links }) => (
                <NavBarCategoryDropdown
                  key={category}
                  collective={collective}
                  category={category}
                  links={links}
                  isSelected={selectedCategory === category}
                  useAnchor={useAnchorsForCategories}
                />
              ))
            )}
          </CategoriesContainer>

          {/* CTAs */}
          <Container
            display={isExpanded ? 'flex' : ['none', 'flex']}
            flexDirection={['column', 'row']}
            flexBasis="fit-content"
            marginLeft={[0, 'auto']}
            backgroundColor="#fff"
            zIndex={1}
          >
            {mainAction && (
              <Container display={['none', 'flex']} alignItems="center">
                {mainAction.component}
              </Container>
            )}
            {!isLoading && (
              <CollectiveNavbarActionsMenu
                collective={collective}
                callsToAction={callsToAction}
                hiddenActionForNonMobile={mainAction?.type}
                secondAction={secondAction}
              />
            )}
            {!onlyInfos && (
              <Container display={['none', 'flex', null, null, 'none']} alignItems="center">
                {isExpanded ? (
                  <CloseMenuIcon onClick={() => setExpanded(!isExpanded)} />
                ) : (
                  <ExpandMenuIcon onClick={() => setExpanded(!isExpanded)} />
                )}
              </Container>
            )}
          </Container>
        </Fragment>
      )}
    </MainContainer>
  );
};

CollectiveNavbar.propTypes = {
  /** Collective to show info about */
  collective: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    path: PropTypes.string,
    isArchived: PropTypes.bool,
    canContact: PropTypes.bool,
    canApply: PropTypes.bool,
    host: PropTypes.object,
    plan: PropTypes.object,
    parentCollective: PropTypes.object,
  }),
  /** Defines the calls to action displayed next to the NavBar items. Match PropTypes of `CollectiveCallsToAction` */
  callsToAction: PropTypes.shape({
    hasContact: PropTypes.bool,
    hasSubmitExpense: PropTypes.bool,
    hasApply: PropTypes.bool,
    hasDashboard: PropTypes.bool,
    hasManageSubscriptions: PropTypes.bool,
  }),
  /** Used to check what sections can be used */
  isAdmin: PropTypes.bool,
  /** Will show loading state */
  isLoading: PropTypes.bool,
  /** The list of sections to be displayed by the NavBar. If not provided, will show all the sections available to this collective type. */
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(['CATEGORY', 'SECTION']),
      name: PropTypes.string,
    }),
  ),
  /** Called when users click the collective logo or name */
  onCollectiveClick: PropTypes.func,
  /** Currently selected category */
  selectedCategory: PropTypes.oneOf(Object.values(NAVBAR_CATEGORIES)),
  /** If true, the collective infos (avatar + name) will be hidden with css `visibility` */
  hideInfosOnDesktop: PropTypes.bool,
  /** If true, the CTAs will be hidden on mobile */
  hideButtonsOnMobile: PropTypes.bool,
  /** If true, the Navbar items and buttons will be skipped  */
  onlyInfos: PropTypes.bool,
  /** If true, the collective infos will fadeInDown and fadeOutUp when transitioning */
  isAnimated: PropTypes.bool,
  /** Set this to true to make the component smaller in height */
  isSmall: PropTypes.bool,
  showBackButton: PropTypes.bool,
  withShadow: PropTypes.bool,
  /** To use on the collective page. Sets links to anchors rather than full URLs for faster navigation */
  useAnchorsForCategories: PropTypes.bool,
};

CollectiveNavbar.defaultProps = {
  hideInfosOnDesktop: false,
  isAnimated: false,
  onlyInfos: false,
  callsToAction: {},
  showBackButton: true,
  withShadow: true,
};

export default React.memo(CollectiveNavbar);
