import React, { Fragment, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { DotsVerticalRounded } from '@styled-icons/boxicons-regular/DotsVerticalRounded';
import { Envelope } from '@styled-icons/boxicons-regular/Envelope';
import { Planet } from '@styled-icons/boxicons-regular/Planet';
import { Receipt } from '@styled-icons/boxicons-regular/Receipt';
import { MoneyCheckAlt } from '@styled-icons/fa-solid/MoneyCheckAlt';
import { AttachMoney } from '@styled-icons/material/AttachMoney';
import { Close } from '@styled-icons/material/Close';
import { Stack } from '@styled-icons/remix-line/Stack';
import { themeGet } from '@styled-system/theme-get';
import { get, pickBy, without } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { createGlobalStyle, css, ThemeProvider } from 'styled-components';
import { display } from 'styled-system';

import { expenseSubmissionAllowed, getContributeRoute, isIndividualAccount } from '../../lib/collective';
import { getFilteredSectionsForCollective, isSectionEnabled } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';
import { isSupportedExpenseType } from '../../lib/expenses';
import { gql } from '../../lib/graphql/helpers';
import { ExpenseType } from '../../lib/graphql/types/v2/graphql';
import useGlobalBlur from '../../lib/hooks/useGlobalBlur';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';
import { getCollectivePageRoute, getDashboardRoute } from '../../lib/url-helpers';
import theme from '@/lib/theme';

import ActionButton from '../ActionButton';
import AddFundsBtn from '../AddFundsBtn';
import ApplyToHostBtn from '../ApplyToHostBtn';
import Avatar from '../Avatar';
import { Dimensions, Sections } from '../collective-page/_constants';
import ContactCollectiveBtn from '../ContactCollectiveBtn';
import Container from '../Container';
import { FullscreenFlowLoadingPlaceholder } from '../FullscreenFlowLoadingPlaceholder';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { fadeIn } from '../StyledKeyframes';
import { Span } from '../Text';

import CollectiveNavbarActionsMenu from './ActionsMenu';
import { getNavBarMenu, NAVBAR_ACTION_TYPE } from './menu';
import NavBarCategoryDropdown, { NavBarCategory } from './NavBarCategoryDropdown';

// Lazy load the submit expense flow
const SubmitExpenseFlow = React.lazy(() =>
  import('../submit-expense/SubmitExpenseFlow').then(module => ({ default: module.SubmitExpenseFlow })),
);

const DisableGlobalScrollOnMobile = createGlobalStyle`
  @media (max-width: 64em) {
    body {
      overflow: hidden;
    }
    #footer {
      display: none;
    }
  }
`;

const NavBarContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 999;
  background: white;
  box-shadow: 0px 6px 10px -5px rgba(214, 214, 214, 0.5);
`;

// CSS hack to target only Safari
// Hotfix for https://github.com/opencollective/opencollective/issues/4403
// https://stackoverflow.com/questions/16348489/is-there-a-way-to-apply-styles-to-safari-only
const NavBarContainerGlobalStyle = createGlobalStyle`
  _::-webkit-full-page-media, _:future, :root ${NavBarContainer} {
    position: relative;
  }
`;

const NavbarContentContainer = styled(Container)`
  background: white;
  display: flex;
  justify-content: space-between;

  @media (min-width: 40em) {
    align-items: center;
  }

  @media (min-width: 64em) {
    justify-content: flex-start;
  }
`;

const StyledContainer = styled.div`
  display: flex;
  width: auto;
  flex-direction: column;
  overflow-y: auto;
  justify-content: flex-start;

  @media (min-width: 64em) {
    flex-direction: row;
    width: 100%;
    overflow-y: none;
    justify-content: center;
  }
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

const BackButtonAndAvatar = styled.div`
  display: flex;

  @media (min-width: 64em) {
    &[data-hide-on-desktop='false'] {
      width: 48px;
      opacity: 1;
      visibility: visible;
      margin-right: 8px;
      transition:
        opacity 0.1s ease-out,
        visibility 0.2s ease-out,
        margin 0.075s,
        width 0.075s ease-in-out;
    }

    &[data-hide-on-desktop='true'] {
      width: 0px;
      margin-right: 0px;
      visibility: hidden;
      opacity: 0;
      transition:
        opacity 0.1s ease-out,
        visibility 0.2s ease-out,
        margin 0.075s,
        width 0.075s ease-in-out;
    }
  }
`;

const InfosContainer = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
`;

const CollectiveName = styled(LinkCollective).attrs({
  fontSize: ['16px', '18px'],
  color: 'black.800',
})`
  ${display}
  letter-spacing: -0.8px;
  margin: 8px;
  min-width: 0;
  text-decoration: none;
  text-align: center;
  font-weight: 500;
  line-height: 24px;

  &,
  a {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  &:not(:hover) {
    color: #313233;
  }
`;

const CategoriesContainer = styled(Container)`
  background-color: #ffffff;
  max-height: calc(100vh - 70px);
  flex-shrink: 2;
  flex-grow: 1;
  overflow: auto;

  @media screen and (max-width: 40em) {
    max-height: none;
    flex-shrink: 0;
  }

  @media screen and (min-width: 40em) and (max-width: 64em) {
    border: 1px solid rgba(214, 214, 214, 0.3);
    border-radius: 0px 0px 0px 8px;
    box-shadow: 0px 6px 10px -5px rgba(214, 214, 214, 0.5);
    position: absolute;
    right: 0;
    top: 64px;
    width: 0;
    visibility: hidden;
    opacity: 0;
    transition:
      opacity 0.4s ease-out,
      visibility 0.4s ease-out,
      width 0.2s ease-out;

    ${props =>
      props.isExpanded &&
      css`
        width: 400px;
        visibility: visible;
        opacity: 1;
      `}
  }
`;

const accountPermissionsQuery = gql`
  query AccountPermissions($slug: String!) {
    account(slug: $slug) {
      id
      permissions {
        id
        addFunds {
          allowed
          reason
        }
      }
    }
  }
`;

const MobileCategoryContainer = styled(Container).attrs({ display: ['block', null, null, 'none'] })`
  animation: ${fadeIn} 0.2s;
  margin-left: 8px;
`;

/** Displayed on mobile & tablet to toggle the menu */
const ExpandMenuIcon = styled(DotsVerticalRounded).attrs({ size: 28 })`
  cursor: pointer;
  margin-right: 4px;
  flex: 0 0 28px;
  color: ${themeGet('colors.primary.600')};

  &:hover {
    background:
      radial-gradient(transparent 14px, white 3px), linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)),
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
    background:
      radial-gradient(transparent 14px, white 3px), linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)),
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

const getHasContribute = (collective, sections, isAdmin) => {
  return (
    [CollectiveType.FUND, CollectiveType.PROJECT].includes(collective.type) &&
    collective.isActive &&
    getContributeRoute(collective) &&
    isSectionEnabled(sections, Sections.CONTRIBUTE, isAdmin)
  );
};

const getDefaultCallsToActions = (collective, sections, isAdmin, LoggedInUser, isAllowedAddFunds, isHostAdmin) => {
  if (!collective) {
    return {};
  }

  const { features } = collective;
  return {
    hasContribute: getHasContribute(collective, sections, isAdmin),
    hasContact: !isAdmin && (isHostAdmin || isFeatureAvailable(collective, 'CONTACT_FORM')),
    hasApply: isFeatureAvailable(collective, 'RECEIVE_HOST_APPLICATIONS'),
    hasSubmitExpense:
      isFeatureAvailable(collective, 'RECEIVE_EXPENSES') && expenseSubmissionAllowed(collective, LoggedInUser),
    hasManageSubscriptions:
      isAdmin && get(features, 'RECURRING_CONTRIBUTIONS') === 'ACTIVE' && isIndividualAccount(collective),
    hasDashboard: isAdmin && isFeatureAvailable(collective, 'HOST_DASHBOARD'),
    hasRequestGrant:
      isFeatureAvailable(collective, 'RECEIVE_GRANTS') && expenseSubmissionAllowed(collective, LoggedInUser),
    addFunds: isAllowedAddFunds,
  };
};

/**
 * Returns the main CTA that should be displayed as a button outside of the action menu in this component.
 */
const getMainAction = (
  collective,
  callsToAction,
  LoggedInUser,
  isNewExpenseFlowEnabled = false,
  isNewGrantFlowEnabled = false,
  onOpenSubmitExpenseModalClick = () => {},
) => {
  if (!collective || !callsToAction) {
    return null;
  }

  // Order of the condition defines main call to action: first match gets displayed
  if (callsToAction.includes('hasContribute')) {
    return {
      type: NAVBAR_ACTION_TYPE.CONTRIBUTE,
      component: (
        <Link href={getContributeRoute(collective)}>
          <ActionButton tabIndex="-1">
            <Planet size="1em" />
            <Span ml={2}>
              <FormattedMessage id="menu.contributeMoney" defaultMessage="Contribute Money" />
            </Span>
          </ActionButton>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasApply')) {
    return {
      type: NAVBAR_ACTION_TYPE.APPLY,
      component: <ApplyToHostBtn hostSlug={collective.slug} buttonRenderer={props => <ActionButton {...props} />} />,
    };
  } else if (callsToAction.includes('hasRequestGrant')) {
    return {
      type: NAVBAR_ACTION_TYPE.REQUEST_GRANT,
      component: (
        <Link href={`${getCollectivePageRoute(collective)}/${isNewGrantFlowEnabled ? 'grants' : 'expenses'}/new`}>
          <ActionButton tabIndex="-1">
            <MoneyCheckAlt size="1em" />
            <Span ml={2}>
              <FormattedMessage id="ExpenseForm.Type.Request" defaultMessage="Request Grant" />
            </Span>
          </ActionButton>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasSubmitExpense')) {
    return {
      type: NAVBAR_ACTION_TYPE.SUBMIT_EXPENSE,
      component: isNewExpenseFlowEnabled ? (
        <ActionButton tabIndex="-1" onClick={onOpenSubmitExpenseModalClick}>
          <Receipt size="1em" />
          <Span ml={2}>
            <FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" />
          </Span>
        </ActionButton>
      ) : (
        <Link href={`${getCollectivePageRoute(collective)}/expenses/new`} data-cy="submit-expense-dropdown">
          <ActionButton tabIndex="-1">
            <Receipt size="1em" />
            <Span ml={2}>
              <FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" />
            </Span>
          </ActionButton>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasManageSubscriptions')) {
    return {
      type: NAVBAR_ACTION_TYPE.MANAGE_SUBSCRIPTIONS,
      component: (
        <Link href={getDashboardRoute(collective, 'outgoing-contributions')}>
          <ActionButton tabIndex="-1">
            <Stack size="1em" />
            <Span ml={2}>
              <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
            </Span>
          </ActionButton>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasContact')) {
    return {
      type: NAVBAR_ACTION_TYPE.CONTACT,
      component: (
        <ContactCollectiveBtn collective={collective} LoggedInUser={LoggedInUser}>
          {btnProps => (
            <ActionButton {...btnProps}>
              <Envelope size="1em" />
              <Span ml={2}>
                <FormattedMessage id="Contact" defaultMessage="Contact" />
              </Span>
            </ActionButton>
          )}
        </ContactCollectiveBtn>
      ),
    };
  } else if (callsToAction.includes(NAVBAR_ACTION_TYPE.ADD_FUNDS) && collective.host) {
    return {
      type: NAVBAR_ACTION_TYPE.ADD_FUNDS,
      component: (
        <AddFundsBtn collective={collective}>
          {btnProps => (
            <ActionButton {...btnProps}>
              <AttachMoney size="1em" />
              <Span>
                <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
              </Span>
            </ActionButton>
          )}
        </AddFundsBtn>
      ),
    };
  } else {
    return null;
  }
};

export const NAVBAR_HEIGHT = [56, 64];

/**
 * The NavBar that displays all the individual sections.
 */
const CollectiveNavbar = ({
  collective,
  isAdmin = undefined,
  isLoading = false,
  sections: sectionsFromParent = undefined,
  selectedCategory,
  callsToAction = {},
  onCollectiveClick = undefined,
  isInHero = false,
  onlyInfos = false,
  useAnchorsForCategories = false,
  showSelectedCategoryOnMobile = false,
  onSubmitExpenseModalOpenChange = undefined,
}) => {
  const router = useRouter();
  const intl = useIntl();
  const [isExpanded, setExpanded] = React.useState(false);
  const { LoggedInUser } = useLoggedInUser();
  isAdmin = isAdmin || LoggedInUser?.isAdminOfCollective(collective);
  const isHostAdmin = LoggedInUser?.isHostAdmin(collective);
  const { data, dataLoading } = useQuery(accountPermissionsQuery, {
    variables: { slug: collective?.slug },
    skip: !collective?.slug || !LoggedInUser,
  });

  const [isSubmitExpenseModalOpen, _setIsSubmitExpenseModalOpen] = React.useState(false);
  const setIsSubmitExpenseModalOpen = open => {
    _setIsSubmitExpenseModalOpen(open);
    onSubmitExpenseModalOpenChange?.(open);
  };

  const loading = isLoading || dataLoading;

  const isNewGrantFlowEnabled = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.NEW_EXPENSE_FLOW);

  const isNewExpenseFlowEnabled =
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.NEW_EXPENSE_FLOW) &&
    (!isSupportedExpenseType(collective, ExpenseType.GRANT) || isNewGrantFlowEnabled);

  const isAllowedAddFunds = Boolean(data?.account?.permissions?.addFunds?.allowed);
  const sections = React.useMemo(() => {
    return sectionsFromParent || getFilteredSectionsForCollective(collective, isAdmin, isHostAdmin);
  }, [sectionsFromParent, collective, isAdmin, isHostAdmin]);
  callsToAction = {
    ...getDefaultCallsToActions(collective, sections, isAdmin, LoggedInUser, isAllowedAddFunds, isHostAdmin),
    ...callsToAction,
  };
  const actionsArray = Object.keys(pickBy(callsToAction, Boolean));
  const mainAction = getMainAction(
    collective,
    actionsArray,
    LoggedInUser,
    isNewExpenseFlowEnabled,
    isNewGrantFlowEnabled,
    () => setIsSubmitExpenseModalOpen(true),
  );
  const secondAction =
    actionsArray.length === 2 &&
    getMainAction(
      collective,
      without(actionsArray, mainAction?.type),
      LoggedInUser,
      isNewExpenseFlowEnabled,
      isNewGrantFlowEnabled,
      () => setIsSubmitExpenseModalOpen(true),
    );
  const navbarRef = useRef(undefined);
  const mainContainerRef = useRef(undefined);

  /** This is to close the navbar dropdown menus (desktop)/slide-out menu (tablet)/non-collapsible menu (mobile)
   * when we click a category header to scroll down to (i.e. Connect) or sub-section page to open (i.e. Updates) */
  useGlobalBlur(navbarRef, outside => {
    if (!outside && isExpanded) {
      setTimeout(() => {
        setExpanded(false);
      }, 500);
    }
  });

  return (
    <Fragment>
      <NavBarContainerGlobalStyle />
      <NavBarContainer ref={mainContainerRef}>
        <NavbarContentContainer
          flexDirection={['column', 'row']}
          px={[0, 3, null, Dimensions.PADDING_X[1]]}
          mx="auto"
          maxWidth={Dimensions.MAX_SECTION_WIDTH}
          maxHeight="100vh"
          minHeight={NAVBAR_HEIGHT}
        >
          {/** Collective info */}
          <InfosContainer px={[3, 0]} py={[2, 1]}>
            <Flex alignItems="center" maxWidth={['90%', '100%']} flex="1 1">
              <BackButtonAndAvatar data-hide-on-desktop={isInHero}>
                <AvatarBox>
                  <LinkCollective collective={collective} onClick={onCollectiveClick}>
                    <Container borderRadius="25%" mr={2}>
                      <Avatar collective={collective} radius={40} />
                    </Container>
                  </LinkCollective>
                </AvatarBox>
              </BackButtonAndAvatar>

              <Container display={onlyInfos ? 'flex' : ['flex', null, null, 'none']} minWidth={0}>
                {loading ? (
                  <LoadingPlaceholder height={14} minWidth={100} />
                ) : isInHero ? (
                  <React.Fragment>
                    <CollectiveName collective={collective} display={['block', 'none']}>
                      <FormattedMessage
                        id="NavBar.ThisIsCollective"
                        defaultMessage="This is {collectiveName}'s page"
                        values={{ collectiveName: collective.name }}
                      />
                    </CollectiveName>
                    <CollectiveName collective={collective} display={['none', 'block']} />
                  </React.Fragment>
                ) : selectedCategory && showSelectedCategoryOnMobile ? (
                  <MobileCategoryContainer>
                    <NavBarCategory collective={collective} category={selectedCategory} />
                  </MobileCategoryContainer>
                ) : (
                  <CollectiveName collective={collective} onClick={onCollectiveClick} />
                )}
              </Container>
            </Flex>
            {!onlyInfos && (
              <Box display={['block', 'none']} flex="0 0 32px">
                {isExpanded ? (
                  <CloseMenuIcon onClick={() => setExpanded(!isExpanded)} />
                ) : (
                  <ExpandMenuIcon
                    onClick={() => {
                      mainContainerRef.current?.scrollIntoView(true);
                      setExpanded(true);
                    }}
                  />
                )}
              </Box>
            )}
          </InfosContainer>
          {/** Main navbar items */}

          {!onlyInfos && (
            <StyledContainer>
              {isExpanded && <DisableGlobalScrollOnMobile />}
              <CategoriesContainer
                ref={navbarRef}
                display={isExpanded ? 'flex' : ['none', 'flex']}
                flexDirection={['column', null, null, 'row']}
                justifyContent={['space-between', null, 'flex-start']}
                order={[0, 3, 0]}
                isExpanded={isExpanded}
              >
                {loading ? (
                  <LoadingPlaceholder height={34} minWidth={100} maxWidth={200} my={15} />
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
                    {secondAction?.component ? <Container ml={2}>{secondAction?.component}</Container> : null}
                  </Container>
                )}
                {!loading && (
                  <CollectiveNavbarActionsMenu
                    onOpenSubmitExpenseModalClick={() => setIsSubmitExpenseModalOpen(true)}
                    collective={collective}
                    callsToAction={callsToAction}
                    hiddenActionForNonMobile={mainAction?.type}
                    LoggedInUser={LoggedInUser}
                  />
                )}
                <Container display={['none', 'flex', null, null, 'none']} alignItems="center">
                  {isExpanded ? (
                    <CloseMenuIcon onClick={() => setExpanded(!isExpanded)} />
                  ) : (
                    <ExpandMenuIcon
                      onClick={() => {
                        mainContainerRef.current?.scrollIntoView(true);
                        setExpanded(!isExpanded);
                      }}
                    />
                  )}
                </Container>
              </Container>
            </StyledContainer>
          )}
        </NavbarContentContainer>
      </NavBarContainer>
      {isSubmitExpenseModalOpen && (
        <React.Suspense
          fallback={<FullscreenFlowLoadingPlaceholder handleOnClose={() => setIsSubmitExpenseModalOpen(false)} />}
        >
          {/* Reset the theme, to avoid collective's custom color to leak on StyledSelect */}
          <ThemeProvider theme={theme}>
            <SubmitExpenseFlow
              onClose={(isSubmitted, hasSelectedViewAll) => {
                setIsSubmitExpenseModalOpen(false);
                if (isSubmitted && hasSelectedViewAll) {
                  router.push(`/dashboard/${LoggedInUser.slug}/submitted-expenses`);
                }
              }}
              submitExpenseTo={collective?.slug}
            />
          </ThemeProvider>
        </React.Suspense>
      )}
    </Fragment>
  );
};

export default React.memo(CollectiveNavbar);
