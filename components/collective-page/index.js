import React, { Component } from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { throttle } from 'lodash';
import memoizeOne from 'memoize-one';

// OC Frontend imports
import Container from '../Container';
import CollectiveNavbar, { getSectionsForCollective } from '../CollectiveNavbar';

// Collective page imports
import { Sections } from './_constants';
import Hero from './Hero';
import SectionAbout from './SectionAbout';
import SectionBudget from './SectionBudget';
import SectionContribute from './SectionContribute';
import SectionContributors from './SectionContributors';
import SectionUpdates from './SectionUpdates';
import SectionCollectives from './SectionCollectives';
import SectionTransactions from './SectionTransactions';

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
    isAdmin: PropTypes.bool.isRequired,
    stats: PropTypes.shape({
      balance: PropTypes.number.isRequired,
      yearlyBudget: PropTypes.number.isRequired,
      updates: PropTypes.number.isRequired,
    }),
  };

  constructor(props) {
    super(props);
    this.sectionsRefs = {}; // This will store a map of sectionName => sectionRef
    this.navbarRef = React.createRef();
    this.state = { isFixed: false, selectedSection: null };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.onScroll);
    this.onScroll(); // First tick in case scroll is restored when page loads
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll);
  }

  getSections = memoizeOne(props => {
    return getSectionsForCollective(props.collective, props.idAdmin);
  });

  onScroll = throttle(() => {
    // Ref may be null when NextJS hot reloads the page
    if (!this.navbarRef.current) {
      return;
    }

    let { isFixed, selectedSection } = this.state;

    // Fixes the Hero when a certain scroll threshold is reached
    if (this.navbarRef.current.getBoundingClientRect().top <= 0) {
      isFixed = true;
    } else if (isFixed) {
      isFixed = false;
    }

    // Get the currently selected section
    const distanceThreshold = 400;
    const currentViewBottom = window.scrollY + window.innerHeight - distanceThreshold;
    const sections = this.getSections(this.props);
    for (let i = sections.length - 1; i >= 0; i--) {
      const sectionName = sections[i];
      const sectionRef = this.sectionsRefs[sectionName];
      if (sectionRef && currentViewBottom > sectionRef.offsetTop) {
        selectedSection = sectionName;
        break;
      }
    }

    // Update the state only if necessary
    if (this.state.isFixed !== isFixed || this.state.selectedSection !== selectedSection) {
      this.setState({ isFixed, selectedSection });
    }
  }, 100);

  onSectionClick = sectionName => {
    // Need to take into account the mobile menu
    const scrollOffset = window.innerHeight < 640 ? 5 : -50;
    window.scrollTo(0, this.sectionsRefs[sectionName].offsetTop + scrollOffset);
    // Changing hash directly tends to make the page jump to the section without respect for
    // the smooth scroll behaviour, so we try to use `history.pushState` if available
    if (window.history.pushState) {
      window.history.pushState(null, null, `#section-${sectionName}`);
    } else {
      window.location.hash = `#section-${sectionName}`;
    }
  };

  onCollectiveClick = () => {
    window.scrollTo(0, 0);
  };

  renderSection(section) {
    switch (section) {
      case Sections.ABOUT:
        return (
          <SectionAbout
            collective={this.props.collective}
            canEdit={this.props.isAdmin}
            editMutation={EditCollectiveMutation}
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
            canSeeDrafts={this.props.isAdmin}
            isLoggedIn={Boolean(this.props.LoggedInUser)}
          />
        );
      case Sections.COLLECTIVES:
        return <SectionCollectives collective={this.props.collective} />;
      case Sections.TRANSACTIONS:
        return <SectionTransactions collective={this.props.collective} />;
      default:
        return null;
    }
  }

  render() {
    const { collective, host, isAdmin } = this.props;
    const { isFixed, selectedSection } = this.state;
    const sections = this.getSections(this.props);

    return (
      <Container
        position="relative"
        borderTop="1px solid #E6E8EB"
        css={collective.isArchived ? 'filter: grayscale(100%);' : undefined}
      >
        <Hero collective={collective} host={host} isAdmin={isAdmin} onCollectiveClick={this.onCollectiveClick} />
        <Container mt={[0, -30]} position="sticky" top={0} zIndex={999} ref={this.navbarRef}>
          <CollectiveNavbar
            collective={collective}
            sections={sections}
            isAdmin={isAdmin}
            selected={selectedSection || sections[0]}
            onCollectiveClick={this.onCollectiveClick}
            hideInfos={!isFixed}
            isAnimated={true}
            onSectionClick={this.onSectionClick}
            LinkComponent={({ section, label, ...props }) => (
              <a href={`#section-${section}`} onClick={e => e.preventDefault()} {...props}>
                {label}
              </a>
            )}
          />
        </Container>
        {sections.map(section => (
          <div key={section} ref={sectionRef => (this.sectionsRefs[section] = sectionRef)} id={`section-${section}`}>
            {this.renderSection(section)}
          </div>
        ))}
      </Container>
    );
  }
}

export default CollectivePage;
