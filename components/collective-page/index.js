import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { get, isEmpty, throttle } from 'lodash';
import memoizeOne from 'memoize-one';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { space } from 'styled-system';

import { getFilteredSectionsForCollective } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';

import CollectiveNavbar from '../collective-navbar';
import Container from '../Container';
import TemporaryNotification from '../TemporaryNotification';

import Hero from './hero/Hero';
import SectionAbout from './sections/About';
import SectionBudget from './sections/Budget';
import SectionConnectedCollectives from './sections/ConnectedCollectives';
import SectionContribute from './sections/Contribute';
import SectionContributions from './sections/Contributions';
import SectionContributors from './sections/Contributors';
import SectionConversations from './sections/Conversations';
import SectionEmpty from './sections/Empty';
import SectionEvents from './sections/Events';
import SectionGoals from './sections/Goals';
import SectionLocation from './sections/Location';
import SectionOurTeam from './sections/OurTeam';
import SectionProjects from './sections/Projects';
import SectionRecurringContributions from './sections/RecurringContributions';
import SectionParticipants from './sections/SponsorsAndParticipants';
import SectionTickets from './sections/Tickets';
import SectionTopFinancialContributors from './sections/TopFinancialContributors';
import SectionTransactions from './sections/Transactions';
import SectionUpdates from './sections/Updates';
import { Sections } from './_constants';
import CategoryHeader from './CategoryHeader';
import SectionContainer from './SectionContainer';
import sectionsWithoutPaddingBottom from './SectionsWithoutPaddingBottom';

const NavBarContainer = styled.div`
  ${space}
  position: sticky;
  top: 0;
  z-index: 999;
  background: white;
  box-shadow: 0px 6px 10px -5px rgba(214, 214, 214, 0.5);
`;

/**
 * This is the collective page main layout, holding different blocks together
 * and watching scroll to synchronise the view for children properly.
 *
 * See design: https://www.figma.com/file/e71tBo0Sr8J7R5n6iMkqI42d/09.-Collectives?node-id=2338%3A36062
 */
class CollectivePage extends Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    host: PropTypes.object,
    financialContributors: PropTypes.arrayOf(PropTypes.object),
    coreContributors: PropTypes.arrayOf(PropTypes.object),
    topOrganizations: PropTypes.arrayOf(PropTypes.object),
    topIndividuals: PropTypes.arrayOf(PropTypes.object),
    tiers: PropTypes.arrayOf(PropTypes.object),
    transactions: PropTypes.arrayOf(PropTypes.object),
    conversations: PropTypes.object,
    expenses: PropTypes.arrayOf(PropTypes.object),
    updates: PropTypes.arrayOf(PropTypes.object),
    events: PropTypes.arrayOf(PropTypes.object),
    projects: PropTypes.arrayOf(PropTypes.object),
    connectedCollectives: PropTypes.arrayOf(PropTypes.object),
    LoggedInUser: PropTypes.object,
    isAdmin: PropTypes.bool.isRequired,
    isHostAdmin: PropTypes.bool.isRequired,
    isRoot: PropTypes.bool.isRequired,
    onPrimaryColorChange: PropTypes.func.isRequired,
    stats: PropTypes.shape({
      balance: PropTypes.number.isRequired,
      yearlyBudget: PropTypes.number.isRequired,
      updates: PropTypes.number.isRequired,
      backers: PropTypes.object,
    }),
    status: PropTypes.oneOf(['collectiveCreated', 'collectiveArchived']),
    refetch: PropTypes.func,
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);
    // @deprecated This will be useless once new navbar will be the default
    this.sectionsRefs = {}; // This will store a map of sectionName => sectionRef
    this.sectionCategoriesRefs = {}; // This will store a map of category => ref
    this.navbarRef = React.createRef();
    this.state = {
      isFixed: false,
      selectedSection: null,
      selectedCategory: null,
      notification: false,
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.onScroll);
    this.onScroll(); // First tick in case scroll is restored when page loads
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll);
  }

  getSections = memoizeOne((collective, isAdmin, isHostAdmin) => {
    const hasNewCollectiveNavbar = get(this.props.router, 'query.version') === 'v2';
    return getFilteredSectionsForCollective(collective, isAdmin, isHostAdmin, hasNewCollectiveNavbar);
  });

  onScroll = throttle(() => {
    // Ref may be null when NextJS hot reloads the page
    if (!this.navbarRef.current) {
      return;
    }

    let { isFixed, selectedSection, selectedCategory } = this.state;

    // Fixes the Hero when a certain scroll threshold is reached
    if (this.navbarRef.current.getBoundingClientRect().top <= 0) {
      isFixed = true;
    } else if (isFixed) {
      isFixed = false;
    }

    // Get the currently section that is at the top of the screen.
    const distanceThreshold = 200;
    const breakpoint = window.scrollY + distanceThreshold;
    const sections = this.getSections(this.props.collective, this.props.isAdmin, this.props.isHostAdmin);

    if (
      get(this.props.router, 'query.version') === 'v2' &&
      get(this.props.collective, 'settings.collectivePage.useNewSections')
    ) {
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].type !== 'CATEGORY') {
          continue;
        }

        const categoryName = sections[i].name;
        const categoryRef = this.sectionCategoriesRefs[categoryName];
        if (categoryRef && breakpoint >= categoryRef.offsetTop) {
          selectedCategory = categoryName;
          break;
        }
      }
    } else {
      for (let i = sections.length - 1; i >= 0; i--) {
        const sectionName = sections[i];
        const sectionRef = this.sectionsRefs[sectionName];
        if (sectionRef && breakpoint >= sectionRef.offsetTop) {
          selectedSection = sectionName;
          break;
        }
      }
    }

    // Update the state only if necessary
    if (
      this.state.isFixed !== isFixed ||
      this.state.selectedSection !== selectedSection ||
      this.state.selectedCategory !== selectedCategory
    ) {
      this.setState({ isFixed, selectedSection, selectedCategory });
    }
  }, 100);

  onSectionClick = sectionName => {
    const scrollOffset = window.innerHeight < 640 ? 30 : 0;
    // Need to take into account the mobile menu
    window.scrollTo(0, this.sectionsRefs[sectionName].offsetTop + scrollOffset);
    // Changing hash directly tends to make the page jump to the section without respect for
    // the smooth scroll behaviour, so we try to use `history.pushState` if available
    if (window.history.pushState) {
      window.history.pushState(null, null, `#section-${sectionName}`);
    } else {
      window.location.hash = `#section-${sectionName}`;
    }
  };

  getCallsToAction = memoizeOne(
    (type, isHost, isAdmin, isRoot, isAuthenticated, canApply, canContact, isArchived, isActive, isFund) => {
      const isCollective = type === CollectiveType.COLLECTIVE;
      const isEvent = type === CollectiveType.EVENT;
      const isProject = type === CollectiveType.PROJECT;

      if (get(this.props.router.query.version) === 'v2') {
        // The "too many calls to action" issue doesn't stand anymore with the new navbar, so
        // we can let the CollectiveNavbar component in charge of most of the flags, to make sure
        // we display the same thing everywhere. The two flags below should be migrated and this
        // function removed once we switch the the new navbar as default
        return {
          hasContribute: (isFund || isProject) && isActive,
          addFunds: isRoot && type === CollectiveType.ORGANIZATION && !(isAdmin && isHost),
        };
      }

      return {
        hasContact: !isAdmin && canContact && (!isFund || isAuthenticated),
        hasContribute: (isFund || isProject) && isActive,
        hasSubmitExpense: (isCollective || isFund || isEvent || isProject || (isHost && isActive)) && !isArchived,
        // Don't display Apply if you're the admin (you can go to "Edit Collective" for that)
        hasApply: canApply && !isAdmin,
        hasDashboard: isHost && isAdmin && !isCollective,
        hasManageSubscriptions: isAdmin && !isCollective && !isFund && !isEvent && !isProject,
        // Don't display "Add Funds" if it's an Host and you're the Admin
        addFundsToOrganization: isRoot && type === CollectiveType.ORGANIZATION && !(isAdmin && isHost),
        // Add Funds for Self Hosted Collectives
        addFunds: isCollective && isHost && isAdmin,
      };
    },
  );

  onCollectiveClick = () => {
    window.scrollTo(0, 0);
  };

  renderSection(section) {
    switch (section) {
      case Sections.UPDATES:
        return (
          <SectionUpdates
            collective={this.props.collective}
            isAdmin={this.props.isAdmin}
            isLoggedIn={Boolean(this.props.LoggedInUser)}
          />
        );
      case Sections.CONVERSATIONS:
        return <SectionConversations collective={this.props.collective} conversations={this.props.conversations} />;

      case Sections.RECURRING_CONTRIBUTIONS:
        return (
          <SectionRecurringContributions slug={this.props.collective.slug} LoggedInUser={this.props.LoggedInUser} />
        );
      case Sections.TICKETS:
        return (
          <SectionTickets
            collective={this.props.collective}
            tiers={this.props.tiers}
            isAdmin={this.props.isAdmin}
            contributors={this.props.financialContributors}
          />
        );
      case Sections.LOCATION:
        return <SectionLocation collective={this.props.collective} />;

      // all other sections
      case Sections.CONTRIBUTE:
        return (
          <SectionContribute
            status={this.props.status}
            collective={this.props.collective}
            tiers={this.props.tiers}
            events={this.props.events}
            connectedCollectives={this.props.connectedCollectives}
            contributors={this.props.financialContributors}
            contributorsStats={this.props.stats.backers}
            isAdmin={this.props.isAdmin}
          />
        );
      case Sections.CONTRIBUTIONS:
        return <SectionContributions collective={this.props.collective} LoggedInUser={this.props.LoggedInUser} />;
      case Sections.EVENTS:
        return (
          <SectionEvents
            collective={this.props.collective}
            events={this.props.events}
            connectedCollectives={this.props.connectedCollectives}
            isAdmin={this.props.isAdmin}
          />
        );
      case Sections.PROJECTS:
        return (
          <SectionProjects
            collective={this.props.collective}
            projects={this.props.projects}
            isAdmin={this.props.isAdmin}
          />
        );
      case Sections.BUDGET:
        return (
          <SectionBudget
            collective={this.props.collective}
            transactions={this.props.transactions}
            expenses={this.props.expenses}
            stats={this.props.stats}
          />
        );
      case Sections.TRANSACTIONS:
        return (
          <SectionTransactions
            collective={this.props.collective}
            isAdmin={this.props.isAdmin}
            isRoot={this.props.isRoot}
          />
        );
      case Sections.CONTRIBUTORS:
        return (
          <SectionContributors
            collective={this.props.collective}
            financialContributors={this.props.financialContributors}
            coreContributors={this.props.coreContributors}
            stats={this.props.stats}
          />
        );
      case Sections.PARTICIPANTS:
        return (
          <SectionParticipants
            refetch={this.props.refetch}
            collective={this.props.collective}
            LoggedInUser={this.props.LoggedInUser}
          />
        );
      case Sections.ABOUT:
        return <SectionAbout collective={this.props.collective} canEdit={this.props.isAdmin} />;
      case Sections.GOALS:
        return <SectionGoals collective={this.props.collective} />;
      case Sections.OUR_TEAM:
        return (
          <SectionOurTeam
            collective={this.props.collective}
            coreContributors={this.props.coreContributors}
            LoggedInUser={this.props.LoggedInUser}
          />
        );
      case Sections.CONNECTED_COLLECTIVES:
        return <SectionConnectedCollectives connectedCollectives={this.props.connectedCollectives} />;
      case Sections.TOP_FINANCIAL_CONTRIBUTORS:
        return (
          <SectionTopFinancialContributors
            collective={this.props.collective}
            financialContributors={this.props.financialContributors}
          />
        );
      default:
        return null;
    }
  }

  createNotification = (type, message) => {
    this.setState({ notification: { type, message } });
    window.scrollTo(0, 0);
  };

  dismissNotification = () => {
    this.setState(state => ({
      ...state,
      notification: false,
    }));
  };

  render() {
    const { collective, host, isAdmin, isRoot, onPrimaryColorChange, LoggedInUser, router } = this.props;
    const newNavbarFeatureFlag = router?.query?.version === 'v2';
    const { type, isHost, canApply, canContact, isActive, settings } = collective;
    const { isFixed, selectedSection, selectedCategory, notification } = this.state;
    const sections = this.getSections(this.props.collective, this.props.isAdmin, this.props.isHostAdmin);
    const isFund = collective.type === CollectiveType.FUND || settings?.fund === true; // Funds MVP, to refactor
    const isAuthenticated = LoggedInUser ? true : false;
    const callsToAction = this.getCallsToAction(
      type,
      isHost,
      isAdmin,
      isRoot,
      isAuthenticated,
      canApply,
      canContact,
      collective.isArchived,
      isActive,
      isFund,
    );

    return (
      <Container
        position="relative"
        css={collective.isArchived ? 'filter: grayscale(100%);' : undefined}
        data-cy="collective-page-main"
      >
        {notification && (
          <TemporaryNotification onDismiss={this.dismissNotification} type={notification.type}>
            {notification.type === 'error' ? (
              <FormattedMessage
                id="ApplyToHost.error"
                defaultMessage="An error occurred while applying to {hostName} with {collectiveName}."
                values={{
                  hostName: collective.name,
                  collectiveName: notification.message,
                }}
              />
            ) : (
              <FormattedMessage
                id="ApplyToHost.success"
                defaultMessage="{collectiveName} has applied to be hosted by {hostName}."
                values={{
                  hostName: collective.name,
                  collectiveName: notification.message,
                }}
              />
            )}
          </TemporaryNotification>
        )}
        <Hero
          collective={collective}
          host={host}
          isAdmin={isAdmin}
          callsToAction={callsToAction}
          onPrimaryColorChange={onPrimaryColorChange}
        />
        <NavBarContainer mt={[0, -30]} ref={this.navbarRef}>
          <CollectiveNavbar
            collective={collective}
            sections={sections}
            isAdmin={isAdmin}
            selected={selectedSection || null}
            selectedCategory={selectedCategory}
            onCollectiveClick={this.onCollectiveClick}
            callsToAction={callsToAction}
            hideInfos={!isFixed}
            isAnimated={true}
            onSectionClick={this.onSectionClick}
            showBackButton={false}
            isFullWidth
            useAnchorsForCategories
            withShadow={false}
            LinkComponent={({ section, label, className }) => (
              <a
                data-cy={`section-${section}`}
                href={`#section-${section}`}
                className={className}
                onClick={e => e.preventDefault()}
              >
                {label}
              </a>
            )}
            createNotification={this.createNotification}
          />
        </NavBarContainer>

        {isEmpty(sections) ? (
          <SectionEmpty collective={this.props.collective} />
        ) : newNavbarFeatureFlag ? (
          sections.map((entry, entryIdx) =>
            entry.type === 'CATEGORY' ? (
              <Fragment key={`category-${entry.name}`}>
                <CategoryHeader
                  id={`category-${entry.name}`}
                  ref={categoryRef => (this.sectionCategoriesRefs[entry.name] = categoryRef)}
                  collective={collective}
                  category={entry.name}
                />
                {entry.sections.map((section, idx) => (
                  <SectionContainer
                    key={section.name}
                    ref={sectionRef => (this.sectionsRefs[section.name] = sectionRef)}
                    id={`section-${section.name}`}
                    withPaddingBottom={
                      idx === entry.sections.length - 1 &&
                      entryIdx === sections.length - 1 &&
                      !sectionsWithoutPaddingBottom[section.name]
                    }
                  >
                    {this.renderSection(section.name)}
                  </SectionContainer>
                ))}
              </Fragment>
            ) : entry.type === 'SECTION' ? (
              <SectionContainer
                key={`section-${entry.name}`}
                id={`section-${entry.name}`}
                withPaddingBottom={entryIdx === sections.length - 1 && !sectionsWithoutPaddingBottom[entry.name]}
              >
                {this.renderSection(entry.name)}
              </SectionContainer>
            ) : null,
          )
        ) : (
          sections.map((section, idx) => (
            <SectionContainer
              key={section}
              ref={sectionRef => (this.sectionsRefs[section] = sectionRef)}
              id={`section-${section}`}
              withPaddingBottom={idx === sections.length - 1 && !sectionsWithoutPaddingBottom[section]}
            >
              {this.renderSection(section)}
            </SectionContainer>
          ))
        )}
      </Container>
    );
  }
}

export default withRouter(CollectivePage);
