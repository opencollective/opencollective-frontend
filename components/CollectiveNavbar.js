import React from 'react';
import { PropTypes } from 'prop-types';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { get } from 'lodash';

import { Mail } from 'styled-icons/feather/Mail';
import { Cog } from 'styled-icons/typicons/Cog';
import { FileText as ExpenseIcon } from 'styled-icons/feather/FileText';

import { CollectiveType } from '../lib/constants/collectives';
import Container from './Container';
import StyledButton from './StyledButton';
import { Span, H1 } from './Text';

import { Sections, AllSectionsNames, Dimensions } from './collective-page/_constants';
import LinkCollective from './LinkCollective';
import Avatar from './Avatar';
import Link from './Link';
import StyledRoundButton from './StyledRoundButton';

const MenuLinkContainer = styled.div`
  padding: 3px 16px 0px 16px;
  color: #71757a;
  display: flex;
  align-items: center;
  border-bottom: 3px solid rgb(0, 0, 0, 0);
  cursor: pointer;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.2px;
  text-decoration: none;
  white-space: nowrap;

  // Override global link styles
  a {
    color: #71757a;
  }

  &:focus,
  &:focus a {
    color: ${themeGet('colors.primary.700')};
    text-decoration: none;
  }

  &:hover {
    border-bottom: 3px solid ${themeGet('colors.primary.300')};
    a {
      color: ${themeGet('colors.primary.400')};
    }
  }

  ${props =>
    props.isSelected &&
    css`
      color: #090a0a;
      font-weight: 500;
      border-bottom: 3px solid ${themeGet('colors.primary.500')};

      a {
        color: #090a0a;
      }
    `}
`;

const InfosContainer = styled(Container)`
  display: flex;
  align-items: center;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition: opacity 0.075s ease-out, transform 0.1s ease-out, visibility 0.075s ease-out;

  /** Hidden state */
  ${props =>
    props.isHidden &&
    css`
      visibility: hidden;
      opacity: 0;
      transform: translateY(-20px);
    `}
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
  [Sections.COLLECTIVES]: {
    id: 'CollectivePage.NavBar.Collectives',
    defaultMessage: 'Collectives',
  },
  [Sections.TRANSACTIONS]: {
    id: 'CollectivePage.NavBar.Transactions',
    defaultMessage: 'Transactions',
  },
});

/**
 * Returns a list of all sections not accessible to this collective type.
 */
const getCollectiveTypeBlacklistedSections = collectiveType => {
  switch (collectiveType) {
    case CollectiveType.USER:
      return [Sections.CONTRIBUTORS, Sections.CONTRIBUTE, Sections.UPDATES, Sections.BUDGET];
    case CollectiveType.ORGANIZATION:
      return [Sections.CONTRIBUTE, Sections.UPDATES, Sections.BUDGET];
    case CollectiveType.COLLECTIVE:
      return [Sections.COLLECTIVES, Sections.TRANSACTIONS];
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
  const toRemove = new Set(getCollectiveTypeBlacklistedSections(collective.type));

  // Can't contribute anymore if the collective is archived or has no host
  if (collective.isArchived || !collective.host) {
    toRemove.add(Sections.CONTRIBUTE);
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
    if (!collective.longDescription) {
      toRemove.add(Sections.ABOUT);
    }
  }

  return sections.filter(section => !toRemove.has(section));
};

/**
 * The NavBar that displays all the invidual sections.
 */
const CollectiveNavbar = ({
  collective,
  isAdmin,
  showEdit,
  hasSubmitExpenseBtn,
  sections,
  selected,
  LinkComponent,
  onCollectiveClick,
  onSectionClick,
  hideInfos,
  hideButtonsOnMobile,
  isAnimated,
  isSmall,
  intl,
}) => {
  const navbarItemsHeight = isSmall ? [50, null, 65] : [60, null, 75];
  const infoPt = isSmall ? ['8px', 16, 18] : [16, 22, 24];
  sections = sections || getSectionsForCollective(collective, isAdmin);

  return (
    <Container borderBottom="1px solid #E6E8EB" background="white">
      <Container margin="0 auto" maxWidth={Dimensions.MAX_SECTION_WIDTH}>
        {/** Collective infos */}
        <InfosContainer isHidden={hideInfos} isAnimated={isAnimated} px={Dimensions.PADDING_X} pt={infoPt}>
          <LinkCollective collective={collective} onClick={onCollectiveClick} isNewVersion>
            <Container background="rgba(245, 245, 245, 0.5)" borderRadius="25%" mr={2}>
              <Avatar collective={collective} radius={40} />
            </Container>
          </LinkCollective>
          <LinkCollective collective={collective} onClick={onCollectiveClick} isNewVersion>
            <H1 mx={2} py={2} color="black.800" fontSize={'H5'} lineHeight={'H5'} textAlign={['center', 'left']}>
              {collective.name || collective.slug}
            </H1>
          </LinkCollective>
          {isAdmin && showEdit && (
            <Link route="editCollective" params={{ slug: collective.slug }} title="Settings">
              <StyledRoundButton size={24} bg="#F0F2F5" color="#4B4E52">
                <Cog size={17} />
              </StyledRoundButton>
            </Link>
          )}
        </InfosContainer>

        {/** Navbar items and buttons */}
        <Container display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap-reverse">
          <Container
            flex="2 1 600px"
            display="flex"
            css={{ overflowX: 'auto' }}
            px={Dimensions.PADDING_X}
            data-cy="CollectivePage.NavBar"
            height={navbarItemsHeight}
          >
            {sections.map(section => (
              <MenuLinkContainer
                key={section}
                isSelected={section === selected}
                onClick={onSectionClick ? () => onSectionClick(section) : undefined}
              >
                <LinkComponent
                  collectivePath={collective.path}
                  section={section}
                  label={i18nSection[section] ? intl.formatMessage(i18nSection[section]) : section}
                />
              </MenuLinkContainer>
            ))}
          </Container>
          <Container
            flex="1"
            display={hideButtonsOnMobile ? ['none', null, 'flex'] : 'flex'}
            minHeight={navbarItemsHeight}
            alignItems="center"
            whiteSpace="nowrap"
            justifyContent="center"
          >
            <a href={`mailto:hello@${collective.slug}.opencollective.com`}>
              <StyledButton mx={2}>
                <Span mr="5px">
                  <Mail size="1.1em" style={{ verticalAlign: 'sub' }} />
                </Span>
                <FormattedMessage id="Contact" defaultMessage="Contact" />
              </StyledButton>
            </a>
            {hasSubmitExpenseBtn && (
              <Link route="createExpense" params={{ collectiveSlug: collective.slug }}>
                <StyledButton mx={2}>
                  <Span mr="5px">
                    <ExpenseIcon size="1.5em" />
                  </Span>
                  <FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" />
                </StyledButton>
              </Link>
            )}
          </Container>
        </Container>
      </Container>
    </Container>
  );
};

CollectiveNavbar.propTypes = {
  /** Collective to show info about */
  collective: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    isArchived: PropTypes.bool,
    host: PropTypes.object,
  }).isRequired,
  /** Used to check what sections can be used */
  isAdmin: PropTypes.bool,
  /** Wether we want to display the "/edit" button */
  showEdit: PropTypes.bool,
  /** Called with the new section name when it changes */
  onSectionClick: PropTypes.func,
  /** An optionnal function to build links URLs. Usefull to override behaviour in test/styleguide envs. */
  LinkComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  /** The list of sections to be displayed by the NavBar. If not provided, will show all the sections available to this collective type. */
  sections: PropTypes.arrayOf(PropTypes.oneOf(AllSectionsNames)).isRequired,
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
  /** If true, a `Submit expense` button will be displayed among the calls to action */
  hasSubmitExpenseBtn: PropTypes.bool,
  /** @ignore From injectIntl */
  intl: PropTypes.object,
};

CollectiveNavbar.defaultProps = {
  hideInfos: false,
  isAnimated: false,
  // eslint-disable-next-line react/prop-types
  LinkComponent: function DefaultNavbarLink({ section, label, collectivePath }) {
    return <Link route={`${collectivePath}/v2#section-${section}`}>{label}</Link>;
  },
};

export default React.memo(injectIntl(CollectiveNavbar));
