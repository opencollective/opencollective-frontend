import React, { Component } from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { get, isEmpty, throttle } from 'lodash';
import memoizeOne from 'memoize-one';
import { ThemeProvider } from 'styled-components';
import { lighten, darken } from 'polished';

// OC Frontend imports
import theme, { generateTheme } from '../../constants/theme';
import Container from '../Container';
import CollectiveNavbar from '../CollectiveNavbar';

// Collective page imports
import { AllSectionsNames, Sections } from './_constants';
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
    isAdmin: PropTypes.bool.isRequired,
    stats: PropTypes.shape({
      balance: PropTypes.number.isRequired,
      yearlyBudget: PropTypes.number.isRequired,
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
    const { collective, host, stats, updates, transactions, expenses, isAdmin } = props;
    const sections = get(collective, 'settings.collectivePage.sections', AllSectionsNames);
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
    const isAdmin = this.isAdmin(this.props.LoggedInUser, this.props.collective);
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
    window.scrollTo(0, this.sectionsRefs[sectionName].offsetTop - 50);
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
      default:
        return null;
    }
  }

  getTheme() {
    const customColor = get(this.props.collective, 'settings.collectivePage.primaryColor', '#000000');
    if (!customColor) {
      return theme;
    } else {
      return generateTheme({
        colors: {
          ...theme.colors,
          primary: {
            800: darken(0.1, customColor),
            700: darken(0.05, customColor),
            500: customColor,
            400: lighten(0.05, customColor),
            300: lighten(0.1, customColor),
            200: lighten(0.15, customColor),
            100: lighten(0.2, customColor),
            50: lighten(0.25, customColor),
          },
        },
      });
    }
  }

  render() {
    const { collective, host, isAdmin } = this.props;
    const { isFixed, selectedSection } = this.state;
    const sections = this.getSections(this.props);
    const pageTheme = this.getTheme();

    return (
      <ThemeProvider theme={pageTheme}>
        <Container
          position="relative"
          borderTop="1px solid #E6E8EB"
          css={collective.isArchived ? 'filter: grayscale(100%);' : undefined}
        >
          <Hero collective={collective} host={host} isAdmin={isAdmin} onCollectiveClick={this.onCollectiveClick} />
          <Container mt={-30} position="sticky" top={0} zIndex={999} ref={this.navbarRef}>
            <CollectiveNavbar
              collective={collective}
              sections={sections}
              selected={selectedSection || sections[0]}
              onCollectiveClick={this.onCollectiveClick}
              hideInfos={!isFixed}
              isAnimated={true}
              onSectionClick={this.onSectionClick}
              LinkComponent={({ section, label }) => (
                <a href={`#section-${section}`} onClick={e => e.preventDefault()}>
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
      </ThemeProvider>
    );
  }
}

export default CollectivePage;
