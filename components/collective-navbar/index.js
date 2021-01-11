import React, { Fragment, useRef } from 'react';
import { PropTypes } from 'prop-types';
import { DotsVerticalRounded } from '@styled-icons/boxicons-regular/DotsVerticalRounded';
import { Planet } from '@styled-icons/boxicons-regular/Planet';
import { Receipt } from '@styled-icons/boxicons-regular/Receipt';
import { Settings } from '@styled-icons/feather/Settings';
import { Close } from '@styled-icons/material/Close';
import { Dashboard } from '@styled-icons/material/Dashboard';
import { Stack } from '@styled-icons/remix-line/Stack';
import themeGet from '@styled-system/theme-get';
import { get } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';
import { maxWidth } from 'styled-system';

import { getFilteredSectionsForCollective, hasNewNavbar, NAVBAR_CATEGORIES } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';
import useGlobalBlur from '../../lib/hooks/useGlobalBlur';
import i18nCollectivePageSection from '../../lib/i18n-collective-page-section';

import ApplyToHostBtn from '../ApplyToHostBtn';
import Avatar from '../Avatar';
import { AllSectionsNames, Dimensions } from '../collective-page/_constants';
import CollectiveCallsToAction from '../CollectiveCallsToAction';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledButton from '../StyledButton';
import StyledRoundButton from '../StyledRoundButton';
import { H1, Span } from '../Text';

import CollectiveNavbarActionsMenu, { getContributeRoute } from './ActionsMenu';
import { getNavBarMenu, NAVBAR_ACTION_TYPE } from './menu';
import NavBarCategoryDropdown from './NavBarCategoryDropdown';

// Nav v2 styled components
const MainContainerV2 = styled(Container)`
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

const InfosContainerV2 = styled(Container)`
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

const CollectiveNameV2 = styled(H1)`
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

// v1 components
/** Main container for the entire component */
const MainContainer = styled.div`
  background: white;
  ${props =>
    props.withShadow &&
    css`
      box-shadow: 0px 6px 10px -5px rgba(214, 214, 214, 0.5);
    `}

  /** Everything's inside cannot be larger than max section width */
  & > * {
    max-width: ${Dimensions.MAX_SECTION_WIDTH}px;
    margin: 0 auto;
  }
`;

/** A single menu link */
const MenuLink = styled.a`
  display: block;
  color: ${themeGet('colors.black.700')};
  font-size: 14px;
  line-height: 24px;
  text-decoration: none;
  white-space: nowrap;
  padding: 12px 16px 16px;

  letter-spacing: 0.6px;
  text-transform: uppercase;
  font-weight: 500;

  &:focus {
    color: ${themeGet('colors.primary.700')};
    text-decoration: none;
  }

  &:hover {
    color: ${themeGet('colors.primary.400')};
    text-decoration: none;
  }

  @media (max-width: 64em) {
    padding: 16px;
  }
`;

const MenuLinkContainer = styled.div`
  cursor: pointer;

  &::after {
    content: '';
    display: block;
    width: 0;
    height: 3px;
    background: ${themeGet('colors.primary.500')};
    transition: width 0.2s;
    float: right;
  }

  ${props =>
    props.isSelected &&
    css`
      color: #090a0a;
      font-weight: 500;
      ${MenuLink} {
        color: #090a0a;
      }
      @media (min-width: 64em) {
        &::after {
          width: 100%;
          float: left;
        }
      }
    `}

  ${props =>
    props.mobileOnly &&
    css`
      @media (min-width: 64em) {
        display: none;
      }
    `}

  @media (max-width: 64em) {
    border-top: 1px solid #e1e1e1;
    &::after {
      display: none;
    }
  }
`;

/** Displayed on mobile & tablet to toggle the menu */
const ExpandMenuIcon = styled(DotsVerticalRounded).attrs({ size: 28 })`
  cursor: pointer;
  margin-right: 4px;
  flex: 0 0 28px;
  color: #304cdc;

  @media (min-width: 64em) {
    display: none;
  }
`;

const InfosContainer = styled(Container)`
  padding: 14px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition: opacity 0.075s ease-out, transform 0.1s ease-out, visibility 0.075s ease-out;

  @media (max-width: 64em) {
    padding: 10px 16px;
  }

  @media (min-width: 52em) {
    ${ExpandMenuIcon} {
      display: none;
    }
  }

  /** Hidden state */
  ${props =>
    props.isHidden &&
    css`
      visibility: hidden;
      opacity: 0;
      transform: translateY(-20px);
    `}
`;

const CloseMenuIcon = styled(Close).attrs({ size: 28 })`
  cursor: pointer;
  margin-right: 4px;
  flex: 0 0 28px;
  color: #304cdc;
  background: radial-gradient(rgba(72, 95, 211, 0.1) 14px, transparent 3px);

  @media (min-width: 64em) {
    display: none;
  }
`;

const CollectiveName = styled.h1`
  margin: 0 8px;
  padding: 8px 0;
  font-size: 20px;
  line-height: 24px;
  text-align: center;
  letter-spacing: -1px;
  font-weight: bold;
  max-width: 50%;

  a:not(:hover) {
    color: #313233;
  }

  @media (min-width: 64em) {
    text-align: center;
  }
`;

const isFeatureAvailable = (collective, feature) => {
  const status = get(collective.features, feature);
  return status === 'ACTIVE' || status === 'AVAILABLE';
};

const getDefaultCallsToActions = (collective, isAdmin, newNavbarFeatureFlag) => {
  if (!collective) {
    return {};
  }

  const isCollective = collective.type === CollectiveType.COLLECTIVE;
  const isEvent = collective.type === CollectiveType.EVENT;

  if (newNavbarFeatureFlag) {
    return {
      hasContact: isFeatureAvailable(collective, 'CONTACT_FORM'),
      hasApply: isFeatureAvailable(collective, 'RECEIVE_HOST_APPLICATIONS'),
      hasSubmitExpense: isFeatureAvailable(collective, 'RECEIVE_EXPENSES'),
      hasManageSubscriptions: isAdmin && get(collective.features, 'RECURRING_CONTRIBUTIONS') === 'ACTIVE',
      hasDashboard: isAdmin && isFeatureAvailable(collective, 'HOST_DASHBOARD'),
    };
  }

  return {
    hasContact: collective.canContact,
    hasApply: collective.canApply && !isAdmin,
    hasManageSubscriptions: isAdmin && !isCollective && !isEvent,
  };
};

/**
 * Returns the main call to action that should be displayed as a button outside of the action menu.
 * This code could be factorized with `ActionsMenu.js`, as we want to have the same icons/actions/labels
 * here and there.
 */
const getMainAction = (collective, isAdmin, callsToAction) => {
  if (!collective || !callsToAction) {
    return null;
  }

  // Order of the condition defines main call to action: first match gets displayed
  if (callsToAction.hasDashboard) {
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
  } else if (!isAdmin && callsToAction.hasContribute && getContributeRoute(collective)) {
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
  } else if (!isAdmin && callsToAction.hasApply) {
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
  } else if (callsToAction.hasSubmitExpense) {
    return {
      type: NAVBAR_ACTION_TYPE.SUBMIT_EXPENSE,
      component: (
        <Link route="create-expense" params={{ collectiveSlug: collective.slug }}>
          <MainActionBtn tabIndex="-1">
            <Receipt size="1em" />
            <Span ml={2}>
              <FormattedMessage id="ExpenseForm.Submit" defaultMessage="Submit expense" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.hasManageSubscriptions) {
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
  } else if (!isAdmin && callsToAction.hasContact) {
    return {
      type: NAVBAR_ACTION_TYPE.CONTACT,
      component: (
        <Link route="host.dashboard" params={{ hostCollectiveSlug: collective.slug }}>
          <MainActionBtn tabIndex="-1">
            <Dashboard size="20px" />
            <Span ml={2}>
              <FormattedMessage id="host.dashboard" defaultMessage="Dashboard" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else {
    return null;
  }
};

const MainActionBtn = styled(StyledButton).attrs({ buttonSize: 'tiny' })`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  padding: 5px 10px;
  text-transform: uppercase;
  background: rgba(72, 95, 211, 0.1);
  border-radius: 8px;
  border: none;
  color: #304cdc;

  &:hover {
    background: rgba(72, 95, 211, 0.12);
  }

  &:active {
    background: rgba(72, 95, 211, 0.2);
    color: #304cdc;
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
  showEdit,
  sections,
  selected,
  selectedCategory,
  LinkComponent,
  callsToAction,
  onCollectiveClick,
  onSectionClick,
  hideInfosOnDesktop,
  onlyInfos,
  isAnimated,
  showBackButton,
  withShadow,
  useAnchorsForCategories,
}) => {
  const router = useRouter();
  const newNavbarFeatureFlag = hasNewNavbar(get(router, 'query.navbarVersion'));
  const intl = useIntl();
  const [isExpanded, setExpanded] = React.useState(false);
  sections = sections || getFilteredSectionsForCollective(collective, isAdmin, null, newNavbarFeatureFlag);
  callsToAction = { ...getDefaultCallsToActions(collective, isAdmin, newNavbarFeatureFlag), ...callsToAction };
  const mainAction = getMainAction(collective, isAdmin, callsToAction);
  const navbarRef = useRef();

  useGlobalBlur(navbarRef, outside => {
    if (!outside && isExpanded) {
      setTimeout(() => {
        setExpanded(false);
      }, 200);
    }
  });

  return newNavbarFeatureFlag ? (
    // v2
    <MainContainerV2
      flexDirection={['column', 'row']}
      px={[0, Dimensions.PADDING_X[1]]}
      mx="auto"
      mt={onlyInfos ? 0 : '50px'}
      maxWidth={Dimensions.MAX_SECTION_WIDTH}
      boxShadow={withShadow ? ' 0px 6px 10px -5px rgba(214, 214, 214, 0.5)' : 'none'}
      maxHeight="100vh"
    >
      {/** Collective info */}
      <InfosContainerV2 isAnimated={isAnimated} mr={[0, 2]} display="flex" alignItems="center" px={[3, 0]} py={[2, 1]}>
        <Flex alignItems="center" data-hide={hideInfosOnDesktop}>
          {showBackButton && (
            <Box display={['none', 'block']} mr={2}>
              <StyledButton px={1} isBorderless onClick={() => window.history.back()}>
                &larr;
              </StyledButton>
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
            <CollectiveNameV2
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
            </CollectiveNameV2>
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
      </InfosContainerV2>
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

          {/* CTAs for v2 navbar & admin panel */}
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
    </MainContainerV2>
  ) : (
    // v1
    <MainContainer withShadow={withShadow}>
      {/** Collective infos */}
      <InfosContainer isHidden={hideInfosOnDesktop} isAnimated={isAnimated}>
        <Flex alignItems="center" flex="1 1 80%" css={{ minWidth: 0 /** For text-overflow */ }}>
          <LinkCollective collective={collective} onClick={onCollectiveClick}>
            <Container borderRadius="25%" mr={2}>
              <Avatar collective={collective} radius={40} />
            </Container>
          </LinkCollective>
          <CollectiveName>
            {isLoading ? (
              <LoadingPlaceholder height={22} minWidth={100} />
            ) : (
              <LinkCollective collective={collective} onClick={onCollectiveClick} />
            )}
          </CollectiveName>
          {isAdmin && showEdit && (
            <Link route="editCollective" params={{ slug: collective.slug }} title="Settings">
              <StyledRoundButton size={24} bg="#F0F2F5" color="#4B4E52">
                <Settings size={17} />
              </StyledRoundButton>
            </Link>
          )}
        </Flex>
        {!onlyInfos && <ExpandMenuIcon onClick={() => setExpanded(!isExpanded)} />}
      </InfosContainer>

      {/** Navbar items and buttons */}
      {!onlyInfos && (
        <Container
          position={['absolute', 'relative']}
          display="flex"
          justifyContent="space-between"
          px={[0, Dimensions.PADDING_X[1]]}
          width="100%"
          background="white"
        >
          {isLoading ? (
            <LoadingPlaceholder height={43} minWidth={150} mb={2} />
          ) : (
            <Container
              flex="2 1 600px"
              css={{ overflowX: 'auto' }}
              display={isExpanded ? 'flex' : ['none', null, 'flex']}
              data-cy="CollectivePage.NavBar"
              flexDirection={['column', null, 'row']}
              height="100%"
              borderBottom={['1px solid #e6e8eb', 'none']}
              backgroundColor="#fff"
              zIndex={1}
            >
              {sections.map(section => (
                <MenuLinkContainer
                  key={section}
                  isSelected={section === selected}
                  onClick={() => {
                    if (isExpanded) {
                      setExpanded(false);
                    }
                    if (onSectionClick) {
                      onSectionClick(section);
                    }
                  }}
                >
                  <MenuLink
                    as={LinkComponent}
                    collectivePath={collective.path || `/${collective.slug}`}
                    section={section}
                    label={i18nCollectivePageSection(intl, section)}
                  />
                </MenuLinkContainer>
              ))}
              {/* mobile CTAs */}
              {callsToAction.hasSubmitExpense && (
                <MenuLinkContainer mobileOnly>
                  <MenuLink as={Link} route="create-expense" params={{ collectiveSlug: collective.slug }}>
                    <FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" />
                  </MenuLink>
                </MenuLinkContainer>
              )}
              {callsToAction.hasContact && (
                <MenuLinkContainer mobileOnly>
                  <MenuLink as={Link} route="collective-contact" params={{ collectiveSlug: collective.slug }}>
                    <FormattedMessage id="Contact" defaultMessage="Contact" />
                  </MenuLink>
                </MenuLinkContainer>
              )}
              {callsToAction.hasDashboard && (
                <MenuLinkContainer mobileOnly>
                  <MenuLink as={Link} route="host.dashboard" params={{ hostCollectiveSlug: collective.slug }}>
                    <FormattedMessage id="host.dashboard" defaultMessage="Dashboard" />
                  </MenuLink>
                </MenuLinkContainer>
              )}
            </Container>
          )}
          <div>
            {!isLoading && (
              // non-mobile CTAs
              <CollectiveCallsToAction
                display={['none', null, 'flex']}
                collective={collective}
                callsToAction={callsToAction}
              />
            )}
          </div>
        </Container>
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
  /** Wether we want to display the "/edit" button */
  showEdit: PropTypes.bool,
  /** Called with the new section name when it changes */
  onSectionClick: PropTypes.func,
  /** An optionnal function to build links URLs. Useful to override behaviour in test/styleguide envs. */
  LinkComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  /** The list of sections to be displayed by the NavBar. If not provided, will show all the sections available to this collective type. */
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(['CATEGORY', 'SECTION']),
      name: PropTypes.string,
    }),
  ),
  /** Called when users click the collective logo or name */
  onCollectiveClick: PropTypes.func,
  /** Currently selected section */
  selected: PropTypes.oneOf(AllSectionsNames),
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

  // eslint-disable-next-line react/prop-types
  LinkComponent: function DefaultNavbarLink({ section, label, collectivePath, className }) {
    return (
      <Link route={`${collectivePath}#section-${section}`} className={className}>
        {label}
      </Link>
    );
  },
};

export default React.memo(CollectiveNavbar);
