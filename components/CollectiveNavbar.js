import React from 'react';
import { PropTypes } from 'prop-types';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { get } from 'lodash';
import { Flex } from '@rebass/grid';

import { Cog } from 'styled-icons/typicons/Cog';
import { ChevronDown } from 'styled-icons/boxicons-regular/ChevronDown';

import { canOrderTicketsFromEvent } from '../lib/events';
import { CollectiveType } from '../lib/constants/collectives';
import Container from './Container';
import { Sections, AllSectionsNames, Dimensions } from './collective-page/_constants';
import LinkCollective from './LinkCollective';
import Avatar from './Avatar';
import Link from './Link';
import StyledRoundButton from './StyledRoundButton';
import CollectiveCallsToAction from './CollectiveCallsToAction';

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
  padding: 8px 16px 16px;

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

const i18nSection = defineMessages({
  [Sections.CONTRIBUTE]: {
    id: 'CollectivePage.NavBar.Contribute',
    defaultMessage: 'Contribute',
  },
  [Sections.CONVERSATIONS]: {
    id: 'CollectivePage.NavBar.Conversations',
    defaultMessage: 'Conversations',
  },
  [Sections.BUDGET]: {
    id: 'CollectivePage.NavBar.Budget',
    defaultMessage: 'Budget',
  },
  [Sections.CONTRIBUTORS]: {
    id: 'CollectivePage.NavBar.Contributors',
    defaultMessage: 'Contributors',
  },
  [Sections.ABOUT]: {
    id: 'CollectivePage.NavBar.About',
    defaultMessage: 'About',
  },
  [Sections.UPDATES]: {
    id: 'CollectivePage.NavBar.Updates',
    defaultMessage: 'Updates',
  },
  [Sections.CONTRIBUTIONS]: {
    id: 'CollectivePage.NavBar.Contributions',
    defaultMessage: 'Contributions',
  },
  [Sections.TRANSACTIONS]: {
    id: 'CollectivePage.NavBar.Transactions',
    defaultMessage: 'Transactions',
  },
  [Sections.GOALS]: {
    id: 'CollectivePage.NavBar.Goals',
    defaultMessage: 'Goals',
  },
  [Sections.TICKETS]: {
    id: 'CollectivePage.NavBar.Tickets',
    defaultMessage: 'Tickets',
  },
  [Sections.LOCATION]: {
    id: 'CollectivePage.NavBar.Location',
    defaultMessage: 'Location',
  },
  [Sections.PARTICIPANTS]: {
    id: 'CollectivePage.NavBar.Participants',
    defaultMessage: 'Participants',
  },
});

/**
 * Returns a list of all sections not accessible to this collective type.
 */
const getCollectiveTypeBlacklistedSections = collectiveType => {
  switch (collectiveType) {
    case CollectiveType.USER:
      return [
        Sections.CONTRIBUTORS,
        Sections.CONTRIBUTE,
        Sections.UPDATES,
        Sections.BUDGET,
        Sections.TICKETS,
        Sections.LOCATION,
        Sections.PARTICIPANTS,
      ];
    case CollectiveType.ORGANIZATION:
      return [
        Sections.CONTRIBUTE,
        Sections.UPDATES,
        Sections.BUDGET,
        Sections.TICKETS,
        Sections.LOCATION,
        Sections.PARTICIPANTS,
      ];
    case CollectiveType.COLLECTIVE:
      return [
        Sections.CONTRIBUTIONS,
        Sections.TRANSACTIONS,
        Sections.TICKETS,
        Sections.LOCATION,
        Sections.PARTICIPANTS,
      ];
    case CollectiveType.EVENT:
      return [Sections.CONTRIBUTIONS, Sections.TRANSACTIONS, Sections.CONTRIBUTORS];
    default:
      return [];
  }
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
export const getSectionsForCollective = (collective, isAdmin) => {
  const sections = get(collective, 'settings.collectivePage.sections', AllSectionsNames);
  const showGoals = get(collective, 'settings.collectivePage.showGoals', false);
  const toRemove = new Set(getCollectiveTypeBlacklistedSections(collective.type));

  // Can't contribute anymore if the collective is archived or has no host
  if (collective.isArchived || !collective.host) {
    toRemove.add(Sections.CONTRIBUTE);
  }

  // Goals are opt-in
  if (!showGoals) {
    toRemove.add(Sections.GOALS);
  }

  // Some sections are hidden for non-admins (usually when there's no data)
  if (!isAdmin) {
    const { updates, transactions, balance } = collective.stats || {};
    if (!updates) {
      toRemove.add(Sections.UPDATES);
    }
    if (!balance && !(transactions && transactions.all)) {
      toRemove.add(Sections.BUDGET);
    }
    if (!collective.hasLongDescription && !collective.longDescription) {
      toRemove.add(Sections.ABOUT);
    }
  }

  if (collective.type === CollectiveType.EVENT) {
    // Should not see tickets section if you can't order them
    if (!canOrderTicketsFromEvent(collective)) {
      toRemove.add(Sections.TICKETS);
    }

    if (!collective.orders || collective.orders.length === 0) {
      toRemove.add(Sections.PARTICIPANTS);
    }

    if (!(collective.location && collective.location.name)) {
      toRemove.add(Sections.LOCATION);
    }

    // Put about section first for events
    sections.sort((a, b) => {
      if (a === Sections.ABOUT) {
        return -1;
      } else if (b === Sections.ABOUT) {
        return 1;
      } else {
        return 0;
      }
    });
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
    hasSubmitExpense: isCollective || isEvent,
    hasApply: collective.canApply,
    hasManageSubscriptions: isAdmin && !isCollective && !isEvent,
  };
};

/**
 * The NavBar that displays all the invidual sections.
 */
const CollectiveNavbar = ({
  collective,
  isAdmin,
  showEdit,
  sections,
  selected,
  LinkComponent,
  callsToAction,
  onCollectiveClick,
  onSectionClick,
  hideInfos,
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
            <LinkCollective collective={collective} onClick={onCollectiveClick} />
          </CollectiveName>
          {isAdmin && showEdit && (
            <Link route="editCollective" params={{ slug: collective.slug }} title="Settings">
              <StyledRoundButton size={24} bg="#F0F2F5" color="#4B4E52">
                <Cog size={17} />
              </StyledRoundButton>
            </Link>
          )}
        </Flex>
        <ExpandMenuIcon onClick={() => setExpended(!isExpended)} />
      </InfosContainer>

      {/** Navbar items and buttons */}
      <Container
        position={['absolute', 'relative']}
        display="flex"
        justifyContent="space-between"
        px={[0, Dimensions.PADDING_X[1]]}
        width="100%"
        background="white"
      >
        <Container
          flex="2 1 600px"
          display={isExpended ? 'flex' : ['none', null, 'flex']}
          css={{ overflowX: 'auto' }}
          data-cy="CollectivePage.NavBar"
          flexDirection={['column', null, 'row']}
          height="100%"
          borderBottom={['1px solid #e6e8eb', 'none']}
        >
          {sections.map(section => (
            <MenuLinkContainer
              key={section}
              isSelected={section === selected}
              onClick={() => {
                if (isExpended) setExpended(false);
                if (onSectionClick) onSectionClick(section);
              }}
            >
              <MenuLink
                as={LinkComponent}
                collectivePath={collective.path || `/${collective.slug}`}
                section={section}
                label={i18nSection[section] ? intl.formatMessage(i18nSection[section]) : section}
              />
            </MenuLinkContainer>
          ))}
          {callsToAction.hasSubmitExpense && (
            <MenuLinkContainer mobileOnly>
              <MenuLink as={Link} route="createExpense" params={{ collectiveSlug: collective.slug }}>
                <FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" />
              </MenuLink>
            </MenuLinkContainer>
          )}
          {callsToAction.hasContact && (
            <MenuLinkContainer mobileOnly>
              <MenuLink href={`mailto:hello@${collective.slug}.opencollective.com`}>
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
        <div>
          <CollectiveCallsToAction
            display={['none', null, 'flex']}
            collective={collective}
            callsToAction={callsToAction}
          />
        </div>
      </Container>
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
  }).isRequired,
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
  /** Wether we want to display the "/edit" button */
  showEdit: PropTypes.bool,
  /** Called with the new section name when it changes */
  onSectionClick: PropTypes.func,
  /** An optionnal function to build links URLs. Usefull to override behaviour in test/styleguide envs. */
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
  /** If true, the collective infos will fadeInDown and fadeOutUp when transitionning */
  isAnimated: PropTypes.bool,
  /** Set this to true to make the component smaller in height */
  isSmall: PropTypes.bool,
  /** @ignore From injectIntl */
  intl: PropTypes.object,
};

CollectiveNavbar.defaultProps = {
  hideInfos: false,
  isAnimated: false,
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
