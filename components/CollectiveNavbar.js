import React from 'react';
import { PropTypes } from 'prop-types';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { Settings } from '@styled-icons/feather/Settings';
import themeGet from '@styled-system/theme-get';
import { get } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import hasFeature, { FEATURES } from '../lib/allowed-features';
import { CollectiveType } from '../lib/constants/collectives';
import { canOrderTicketsFromEvent } from '../lib/events';
import i18nCollectivePageSection from '../lib/i18n-collective-page-section';

import { AllSectionsNames, Dimensions, Sections } from './collective-page/_constants';
import Avatar from './Avatar';
import CollectiveCallsToAction from './CollectiveCallsToAction';
import Container from './Container';
import { Flex } from './Grid';
import Link from './Link';
import LinkCollective from './LinkCollective';
import LoadingPlaceholder from './LoadingPlaceholder';
import StyledRoundButton from './StyledRoundButton';

/** Main container for the entire component */
const MainContainer = styled.div`
  background: white;
  box-shadow: 0px 6px 10px -5px rgba(214, 214, 214, 0.5);

  /** Everything's inside cannot be larger than max section width */
  & > * {
    max-width: ${Dimensions.MAX_SECTION_WIDTH}px;
    margin: 0 auto;
  }
`;

/** A single menu link */
const MenuLink = styled.a`
  display: block;
  color: #71757a;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.2px;
  text-decoration: none;
  white-space: nowrap;
  padding: 12px 16px 16px;

  &:focus {
    color: ${themeGet('colors.primary.700')};
    text-decoration: none;
  }

  &:hover {
    color: ${themeGet('colors.primary.400')};
    text-decoration: none;
  }

  @media (max-width: 52em) {
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
      @media (min-width: 52em) {
        &::after {
          width: 100%;
          float: left;
        }
      }
    `}

  ${props =>
    props.mobileOnly &&
    css`
      @media (min-width: 52em) {
        display: none;
      }
    `}

  @media (max-width: 52em) {
    border-top: 1px solid #e1e1e1;
    &::after {
      display: none;
    }
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

  @media (max-width: 52em) {
    padding: 10px 16px;
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

/** Displayed on mobile to toggle the menu */
const ExpandMenuIcon = styled(ChevronDown).attrs({ size: 28 })`
  cursor: pointer;
  padding-top: 4px;
  margin-rigth: 4px;
  flex: 0 0 28px;

  @media (min-width: 52em) {
    display: none;
  }

  &:hover {
    color: ${themeGet('colors.primary.300')};
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
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  min-width: 0;

  a:not(:hover) {
    color: #313233;
  }

  @media (min-width: 52em) {
    text-align: center;
  }
`;

// Define default sections based on collective type
const DEFAULT_SECTIONS = {
  [CollectiveType.ORGANIZATION]: [
    Sections.CONTRIBUTE,
    Sections.CONTRIBUTIONS,
    Sections.CONTRIBUTORS,
    Sections.UPDATES,
    Sections.CONVERSATIONS,
    Sections.TRANSACTIONS,
    Sections.BUDGET,
    Sections.RECURRING_CONTRIBUTIONS,
    Sections.ABOUT,
  ],
  [CollectiveType.USER]: [
    Sections.CONTRIBUTIONS,
    Sections.TRANSACTIONS,
    Sections.RECURRING_CONTRIBUTIONS,
    Sections.ABOUT,
  ],
  [CollectiveType.COLLECTIVE]: [
    Sections.GOALS,
    Sections.CONTRIBUTE,
    Sections.UPDATES,
    Sections.CONVERSATIONS,
    Sections.BUDGET,
    Sections.CONTRIBUTORS,
    Sections.RECURRING_CONTRIBUTIONS,
    Sections.ABOUT,
  ],
  [CollectiveType.EVENT]: [
    Sections.ABOUT,
    Sections.TICKETS,
    Sections.CONTRIBUTE,
    Sections.PARTICIPANTS,
    Sections.LOCATION,
    Sections.BUDGET,
  ],
};

/** Returns the default sections for collective */
export const getDefaultSectionsForCollectiveType = type => {
  return DEFAULT_SECTIONS[type] || [];
};

/** Returns the sections from collective's settings, fallbacks on default sections for type */
export const getSectionsForCollective = collective => {
  const collectiveSections = get(collective, 'settings.collectivePage.sections');
  if (!collectiveSections) {
    return getDefaultSectionsForCollectiveType(get(collective, 'type'));
  }

  // Convert legacy sections to the new format
  const sections = [];
  collectiveSections.forEach(sectionData => {
    if (typeof sectionData === 'string') {
      sections.push(sectionData);
    } else if (sectionData.isEnabled) {
      sections.push(sectionData.section);
    }
  });

  return sections;
};

/**
 * Get the sections for a collective.
 *
 * @param {object} `collective` the collective with following properties set:
 *    - `type`
 *    - `settings`
 *    - `isArchived`
 *    - `host`
 *    - `stats` {object} with following properties: `updates`, (`balance` or `transactions`)
 * @param {boolean} `isAdmin` wether the user is an admin of the collective
 */
export const getFilteredSectionsForCollective = (collective, isAdmin, isHostAdmin) => {
  const sections = getSectionsForCollective(collective);
  const toRemove = new Set();
  collective = collective || {};
  const isEvent = collective.type === CollectiveType.EVENT;

  // Can't contribute anymore if the collective is archived or has no host
  const hasContribute = collective.isActive;
  const hasOtherWaysToContribute =
    !isEvent && (collective.events?.length > 0 || collective.connectedCollectives?.length > 0);
  if (!hasContribute && !hasOtherWaysToContribute && !isAdmin) {
    toRemove.add(Sections.CONTRIBUTE);
  }

  // Disallow Organizations to see contribute if not already "active"
  if (!hasContribute && collective.type === CollectiveType.ORGANIZATION) {
    toRemove.add(Sections.CONTRIBUTE);
  }

  // Check opt-in features
  if (!hasFeature(collective, FEATURES.COLLECTIVE_GOALS)) {
    toRemove.add(Sections.GOALS);
  }

  if (!hasFeature(collective, FEATURES.CONVERSATIONS)) {
    toRemove.add(Sections.CONVERSATIONS);
  }

  // Some sections are hidden for non-admins (usually when there's no data)
  if (!isAdmin && !isHostAdmin) {
    const { updates, transactions, balance } = collective.stats || {};
    if (!updates) {
      toRemove.add(Sections.UPDATES);
    }
    if (!collective.balance && !balance && !(transactions && transactions.all)) {
      toRemove.add(Sections.BUDGET);
    }
    if (!collective.hasLongDescription && !collective.longDescription) {
      toRemove.add(Sections.ABOUT);
    }
  }

  if (collective.type === CollectiveType.ORGANIZATION) {
    if (!hasFeature(collective, FEATURES.UPDATES)) {
      toRemove.add(Sections.UPDATES);
    }
    if (!collective.isActive) {
      toRemove.add(Sections.BUDGET);
    } else {
      toRemove.add(Sections.TRANSACTIONS);
    }
  }

  // Funds MVP, to refactor
  if (collective.settings?.fund) {
    if (!isAdmin && !isHostAdmin) {
      toRemove.add(Sections.BUDGET);
    }
  }

  // Recurring contributions
  // don't display for TYPE=COLLECTIVE if no active contributions
  if (collective.type === CollectiveType.COLLECTIVE || collective.type === CollectiveType.ORGANIZATION) {
    if (!collective.ordersFromCollective?.some(collective => collective.isSubscriptionActive)) {
      toRemove.add(Sections.RECURRING_CONTRIBUTIONS);
    }
  }

  if (isEvent) {
    // Should not see tickets section if you can't order them
    if ((!hasContribute && !isAdmin) || (!canOrderTicketsFromEvent(collective) && !isAdmin)) {
      toRemove.add(Sections.TICKETS);
    }

    if (!collective.orders || collective.orders.length === 0) {
      toRemove.add(Sections.PARTICIPANTS);
    }

    if (!(collective.location && collective.location.name)) {
      toRemove.add(Sections.LOCATION);
    }
  }

  return sections.filter(section => !toRemove.has(section));
};

const getDefaultCallsToactions = (collective, isAdmin) => {
  if (!collective) {
    return {};
  }

  const isCollective = collective.type === CollectiveType.COLLECTIVE;
  const isEvent = collective.type === CollectiveType.EVENT;
  return {
    hasContact: collective.canContact,
    hasApply: collective.canApply && !isAdmin,
    hasManageSubscriptions: isAdmin && !isCollective && !isEvent,
  };
};

/**
 * The NavBar that displays all the invidual sections.
 */
const CollectiveNavbar = ({
  collective,
  isAdmin,
  isLoading,
  showEdit,
  sections,
  selected,
  LinkComponent,
  callsToAction,
  onCollectiveClick,
  onSectionClick,
  hideInfos,
  onlyInfos,
  isAnimated,
  intl,
}) => {
  const [isExpended, setExpended] = React.useState(false);
  sections = sections || getSectionsForCollective(collective, isAdmin);
  callsToAction = { ...getDefaultCallsToactions(collective, isAdmin), ...callsToAction };

  return (
    <MainContainer>
      {/** Collective infos */}
      <InfosContainer isHidden={hideInfos} isAnimated={isAnimated}>
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
        {!onlyInfos && <ExpandMenuIcon onClick={() => setExpended(!isExpended)} />}
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
              display={isExpended ? 'flex' : ['none', null, 'flex']}
              css={{ overflowX: 'auto' }}
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
                    if (isExpended) {
                      setExpended(false);
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
              {callsToAction.hasDashboard && collective.plan.hostDashboard && (
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
  sections: PropTypes.arrayOf(PropTypes.oneOf(AllSectionsNames)),
  /** Called when users click the collective logo or name */
  onCollectiveClick: PropTypes.func,
  /** Currently selected section */
  selected: PropTypes.oneOf(AllSectionsNames),
  /** If true, the collective infos (avatar + name) will be hidden with css `visibility` */
  hideInfos: PropTypes.bool,
  /** If true, the CTAs will be hidden on mobile */
  hideButtonsOnMobile: PropTypes.bool,
  /** If true, the Navbar items and buttons will be skipped  */
  onlyInfos: PropTypes.bool,
  /** If true, the collective infos will fadeInDown and fadeOutUp when transitioning */
  isAnimated: PropTypes.bool,
  /** Set this to true to make the component smaller in height */
  isSmall: PropTypes.bool,
  /** @ignore From injectIntl */
  intl: PropTypes.object,
};

CollectiveNavbar.defaultProps = {
  hideInfos: false,
  isAnimated: false,
  onlyInfos: false,
  callsToAction: {},
  // eslint-disable-next-line react/prop-types
  LinkComponent: function DefaultNavbarLink({ section, label, collectivePath, className }) {
    return (
      <Link route={`${collectivePath}#section-${section}`} className={className}>
        {label}
      </Link>
    );
  },
};

export default React.memo(injectIntl(CollectiveNavbar));
