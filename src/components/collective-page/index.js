import React, { Component } from 'react';
import PropTypes from 'prop-types';

import theme from '../../constants/theme';
import { debounceScroll } from '../../lib/ui-utils';
import Container from '../Container';

import { AllSectionsNames, Dimensions } from './_constants';
import Hero from './Hero';

/**
 * This is the collective page main layout, holding different blocks together
 * and watching scroll to synchronise the view for children properly.
 *
 * See design: https://www.figma.com/file/e71tBo0Sr8J7R5n6iMkqI42d/09.-Collectives?node-id=2338%3A36062
 */
export default class CollectivePage extends Component {
  static propTypes = {
    /** The collective to display */
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      image: PropTypes.string,
      backgroundImage: PropTypes.string,
      twitterHandle: PropTypes.string,
      githubHandle: PropTypes.string,
      website: PropTypes.string,
      description: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,

    /** Collective's host */
    host: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      image: PropTypes.string,
    }),

    /** The logged in user */
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.sectionsRefs = {}; // This will store a map of sectionName => sectionRef
    this.heroRef = React.createRef();
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

  onScroll = debounceScroll(() => {
    // Fixes the Hero when a certain scroll threshold is reached
    if (window.scrollY >= theme.sizes.navbarHeight) {
      if (!this.state.isFixed) {
        this.setState({ isFixed: true });
      }
    } else if (this.state.isFixed) {
      this.setState({ isFixed: false });
    }

    // Update selected section
    const distanceThreshold = 200;
    for (let i = AllSectionsNames.length - 1; i >= 0; i--) {
      const sectionName = AllSectionsNames[i];
      const sectionRef = this.sectionsRefs[sectionName];
      const currentViewBottom = window.scrollY + window.innerHeight;
      if (currentViewBottom - distanceThreshold > sectionRef.offsetTop) {
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
    if (this.state.isFixed) {
      window.scrollTo(0, sectionTop);
    } else {
      // If not fixed, we have to acknowledge the fact that Hero is going to shrink, thus
      // reducting the size of the navbar
      const heroRect = this.heroRef.current.getBoundingClientRect();
      window.scrollTo(0, sectionTop - heroRect.height + Dimensions.HERO_FIXED_HEIGHT);
    }
  };

  onCollectiveClick = () => {
    window.scrollTo(0, 0);
  };

  render() {
    const { collective, host, LoggedInUser } = this.props;
    const { isFixed, selectedSection } = this.state;
    const canEditCollective = LoggedInUser && LoggedInUser.canEditCollective(collective);

    return (
      <Container position="relative" borderTop="1px solid #E6E8EB">
        <Container ref={this.heroRef} height={isFixed ? Dimensions.HERO_FIXED_HEIGHT : 'auto'}>
          <Hero
            collective={collective}
            host={host}
            sections={AllSectionsNames}
            canEditCollective={canEditCollective}
            isFixed={isFixed}
            selectedSection={selectedSection}
            onSectionClick={this.onSectionClick}
            onCollectiveClick={this.onCollectiveClick}
          />
        </Container>

        {/* Placeholders for sections not implemented yet */}
        {AllSectionsNames.map(section => (
          <Container
            ref={sectionRef => (this.sectionsRefs[section] = sectionRef)}
            key={section}
            id={`section-${section}`}
            display="flex"
            borderBottom="1px solid lightgrey"
            py={8}
            justifyContent="center"
            fontSize={36}
          >
            [Section] {section}
          </Container>
        ))}
      </Container>
    );
  }
}
