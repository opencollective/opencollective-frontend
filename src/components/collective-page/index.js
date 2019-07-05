import React, { Component } from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { get, isEmpty } from 'lodash';
import memoizeOne from 'memoize-one';

// OC Frontend imports
import theme from '../../constants/theme';
import { debounceScroll } from '../../lib/ui-utils';
import Container from '../Container';

// Collective page imports
import { AllSectionsNames, Sections, Dimensions } from './_constants';
import Hero from './Hero';
import SectionAbout from './SectionAbout';
import SectionBudget from './SectionBudget';
import SectionContribute from './SectionContribute';
import SectionContributors from './SectionContributors';
import SectionUpdates from './SectionUpdates';

/** A mutation used by child components to update the collective */
const EditCollectiveMutation = gql`
  mutation EditCollective($id: Int!, $longDescription: String) {
    editCollective(collective: { id: $id, longDescription: $longDescription }) {
      id
      longDescription
    }
  }
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
    contributors: PropTypes.arrayOf(PropTypes.object),
    topOrganizations: PropTypes.arrayOf(PropTypes.object),
    topIndividuals: PropTypes.arrayOf(PropTypes.object),
    tiers: PropTypes.arrayOf(PropTypes.object),
    transactions: PropTypes.arrayOf(PropTypes.object),
    expenses: PropTypes.arrayOf(PropTypes.object),
    updates: PropTypes.arrayOf(PropTypes.object),
    events: PropTypes.arrayOf(PropTypes.object),
    LoggedInUser: PropTypes.object,
    stats: PropTypes.shape({
      balance: PropTypes.number.isRequired,
      yearlyBudget: PropTypes.number.isRequired,
    }),
  };

  constructor(props) {
    super(props);
    this.sectionsRefs = {}; // This will store a map of sectionName => sectionRef
    this.state = {
      isFixed: false,
      selectedSection: AllSectionsNames[0],
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.onScroll);
    this.onScroll(); // First tick in case scroll is restored when page loads
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll);
  }

  getSections = memoizeOne((props, isAdmin) => {
    const { collective, host, stats, updates, transactions, expenses } = props;
    const sections = get(collective, 'settings.collective-page.sections', AllSectionsNames);
    const sectionsToRemove = new Set([]);

    // Can't contribute anymore if the collective is archived or has no host
    if (collective.isArchived || !host) {
      sectionsToRemove.add(Sections.CONTRIBUTE);
    }

    // Some sections are hidden for non-admins (usually when there's no data)
    if (!isAdmin) {
      if (isEmpty(updates)) {
        sectionsToRemove.add(Sections.UPDATES);
      }
      if (isEmpty(transactions) && isEmpty(expenses) && stats.balance === 0) {
        sectionsToRemove.add(Sections.BUDGET);
      }
      if (!collective.longDescription) {
        sectionsToRemove.add(Sections.ABOUT);
      }
    }

    return sections.filter(section => !sectionsToRemove.has(section));
  });

  onScroll = debounceScroll(() => {
    // Fixes the Hero when a certain scroll threshold is reached
    if (window.scrollY >= theme.sizes.navbarHeight + Dimensions.HERO_FIXED_HEIGHT) {
      if (!this.state.isFixed) {
        this.setState({ isFixed: true });
      }
    } else if (this.state.isFixed) {
      this.setState({ isFixed: false });
    }

    const distanceThreshold = 200;
    const currentViewBottom = window.scrollY + window.innerHeight;
    const sections = Object.keys(this.sectionsRefs);
    for (let i = sections.length - 1; i >= 0; i--) {
      const sectionName = sections[i];
      const sectionRef = this.sectionsRefs[sectionName];
      if (sectionRef && currentViewBottom - distanceThreshold > sectionRef.offsetTop) {
        if (this.state.selectedSection !== sectionName) {
          this.setState({ selectedSection: sectionName });
        }
        break;
      }
    }
  });

  onSectionClick = sectionName => {
    window.location.hash = `section-${sectionName}`;
    const sectionTop = this.sectionsRefs[sectionName].offsetTop;
    window.scrollTo(0, sectionTop - Dimensions.HERO_FIXED_HEIGHT);
  };

  onCollectiveClick = () => {
    window.scrollTo(0, 0);
  };

  renderSection(section, canEdit) {
    switch (section) {
      case Sections.ABOUT:
        return (
          <SectionAbout collective={this.props.collective} canEdit={canEdit} editMutation={EditCollectiveMutation} />
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
      case Sections.CONTRIBUTE:
        return (
          <SectionContribute
            collective={this.props.collective}
            tiers={this.props.tiers}
            events={this.props.events}
            contributors={this.props.contributors}
          />
        );
      case Sections.CONTRIBUTORS:
        return (
          <SectionContributors collectiveName={this.props.collective.name} contributors={this.props.contributors} />
        );
      case Sections.UPDATES:
        return (
          <SectionUpdates
            collective={this.props.collective}
            canSeeDrafts={canEdit}
            isLoggedIn={Boolean(this.props.LoggedInUser)}
          />
        );
      default:
        return null;
    }
  }

  render() {
    const { collective, host, LoggedInUser } = this.props;
    const { isFixed, selectedSection } = this.state;
    const canEdit = Boolean(LoggedInUser && LoggedInUser.canEditCollective(collective));
    const sections = this.getSections(this.props, canEdit);

    return (
      <Container borderTop="1px solid #E6E8EB" css={collective.isArchived ? 'filter: grayscale(100%);' : undefined}>
        <Container height={Dimensions.HERO_PLACEHOLDER_HEIGHT}>
          <Hero
            collective={collective}
            host={host}
            sections={sections}
            canEdit={canEdit}
            isFixed={collective.isArchived ? false : isFixed} // Never fix `Hero` for archived collectives as css `filter` breaks the fixed layout, see https://drafts.fxtf.org/filter-effects/#FilterProperty
            selectedSection={selectedSection}
            onSectionClick={this.onSectionClick}
            onCollectiveClick={this.onCollectiveClick}
          />
        </Container>
        {sections.map(section => (
          <div key={section} ref={sectionRef => (this.sectionsRefs[section] = sectionRef)} id={`section-${section}`}>
            {this.renderSection(section, canEdit)}
          </div>
        ))}
      </Container>
    );
  }
}

export default CollectivePage;
