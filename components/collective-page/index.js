import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { isEmpty, throttle } from 'lodash';
import memoizeOne from 'memoize-one';

import { getFilteredSectionsForCollective } from '../../lib/collective-sections';

import CollectiveNavbar from '../collective-navbar';
import Container from '../Container';
import { Box } from '../Grid';

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
import SectionTopFinancialContributors from './sections/TopFinancialContributors';
import SectionTransactions from './sections/Transactions';
import SectionUpdates from './sections/Updates';
import { Sections } from './_constants';
import CategoryHeader from './CategoryHeader';
import SectionContainer from './SectionContainer';
import sectionsWithoutPaddingBottom from './SectionsWithoutPaddingBottom';

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
  };

  constructor(props) {
    super(props);
    this.sectionCategoriesRefs = {}; // This will store a map of category => ref
    this.sectionsContainerRef = React.createRef();
    this.state = { isFixed: false, selectedCategory: null };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.onScroll);
    this.onScroll(); // First tick in case scroll is restored when page loads
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll);
  }

  getSections = memoizeOne((collective, isAdmin, isHostAdmin) => {
    return getFilteredSectionsForCollective(collective, isAdmin, isHostAdmin);
  });

  getSectionsCategories = memoizeOne((collective, isAdmin, isHostAdmin) => {
    const sections = this.getSections(collective, isAdmin, isHostAdmin);
    return sections.filter(s => s.type === 'CATEGORY');
  });

  onScroll = throttle(() => {
    let { isFixed, selectedCategory } = this.state;
    // Fixes the Hero when a certain scroll threshold is reached
    if (this.sectionsContainerRef.current) {
      if (this.sectionsContainerRef.current.getBoundingClientRect().top <= 50) {
        isFixed = true;
      } else if (isFixed) {
        isFixed = false;
      }
    }

    // Get the currently category that is at the top of the screen.
    const distanceThreshold = 200;
    const breakpoint = window.scrollY + distanceThreshold;
    const categories = this.getSectionsCategories(this.props.collective, this.props.isAdmin, this.props.isHostAdmin);

    for (let i = categories.length - 1; i >= 0; i--) {
      const categoryName = categories[i].name;
      const categoryRef = this.sectionCategoriesRefs[categoryName];
      if (categoryRef && breakpoint >= categoryRef.offsetTop) {
        selectedCategory = categoryName;
        break;
      }
    }

    // Update the state only if necessary
    if (this.state.isFixed !== isFixed || this.state.selectedCategory !== selectedCategory) {
      this.setState({ isFixed, selectedCategory });
    } else if (!selectedCategory && categories?.length) {
      // Select first category by default
      this.setState({ isFixed, selectedCategory: categories[0].name });
    }
  }, 100);

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
          <SectionEvents collective={this.props.collective} events={this.props.events} isAdmin={this.props.isAdmin} />
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
            coreContributors={this.props.collective.parentCollective?.coreContributors || this.props.coreContributors}
            LoggedInUser={this.props.LoggedInUser}
          />
        );
      case Sections.CONNECTED_COLLECTIVES:
        return (
          <SectionConnectedCollectives
            collective={this.props.collective}
            connectedCollectives={this.props.connectedCollectives}
          />
        );
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

  render() {
    const { collective, host, isAdmin, isHostAdmin, onPrimaryColorChange } = this.props;
    const { isFixed, selectedCategory } = this.state;
    const sections = this.getSections(collective, isAdmin, isHostAdmin);

    return (
      <Container
        position="relative"
        css={collective.isArchived ? 'filter: grayscale(100%);' : undefined}
        data-cy="collective-page-main"
      >
        <Box mb={3}>
          <Hero collective={collective} host={host} isAdmin={isAdmin} onPrimaryColorChange={onPrimaryColorChange} />
        </Box>
        {/* <NavBarContainer mt={[0, -30]} ref={this.navbarRef}> */}
        <CollectiveNavbar
          collective={collective}
          sections={sections}
          isAdmin={isAdmin}
          selectedCategory={selectedCategory}
          onCollectiveClick={this.onCollectiveClick}
          isAnimated={true}
          showBackButton={false}
          isFullWidth
          useAnchorsForCategories
          withShadow={false}
          hideInfosOnDesktop={!isFixed}
        />
        {/* </NavBarContainer> */}

        <div ref={this.sectionsContainerRef}>
          {isEmpty(sections) ? (
            <SectionEmpty collective={this.props.collective} />
          ) : (
            sections.map((entry, entryIdx) =>
              entry.type === 'CATEGORY' ? (
                <Fragment key={`category-${entry.name}`}>
                  <CategoryHeader
                    id={`category-${entry.name}`}
                    ref={categoryRef => (this.sectionCategoriesRefs[entry.name] = categoryRef)}
                    collective={collective}
                    category={entry.name}
                    isAdmin={isAdmin}
                  />
                  {entry.sections.map((section, idx) => (
                    <SectionContainer
                      key={section.name}
                      id={`section-${section.name}`}
                      data-cy={`section-${section.name}`}
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
                  data-cy={`section-${entry.name}`}
                  withPaddingBottom={entryIdx === sections.length - 1 && !sectionsWithoutPaddingBottom[entry.name]}
                >
                  {this.renderSection(entry.name)}
                </SectionContainer>
              ) : null,
            )
          )}
        </div>
      </Container>
    );
  }
}

export default CollectivePage;
