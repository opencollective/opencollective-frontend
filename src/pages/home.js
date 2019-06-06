import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import fetch from 'node-fetch';
import { Box, Flex } from '@rebass/grid';
import { FormattedNumber, FormattedMessage, defineMessages } from 'react-intl';
import { Facebook } from 'styled-icons/fa-brands/Facebook';
import { Twitter } from 'styled-icons/fa-brands/Twitter';
import { Linkedin } from 'styled-icons/fa-brands/Linkedin';

import { pickAvatar } from '../lib/collective.lib';
import { getBaseApiUrl, imagePreview } from '../lib/utils';
import { colors } from '../constants/theme';

import { Link } from '../server/pages';

import Body from '../components/Body';
import Footer from '../components/Footer';
import Header from '../components/Header';
import HomepageActivityItem from '../components/HomepageActivityItem';
import { Span, P, H1, H2, H3, H4, H5 } from '../components/Text';
import ListItem from '../components/ListItem';
import Hide from '../components/Hide';
import Container from '../components/Container';
import StyledLink from '../components/StyledLink';
import CollectiveStatsCard from '../components/CollectiveStatsCard';
import NewsletterContainer from '../components/NewsletterContainer';
import HomepageSponsorCard from '../components/HomepageSponsorCard';
import Carousel from '../components/Carousel';
import Currency from '../components/Currency';
import ErrorPage from '../components/ErrorPage';

import withIntl from '../lib/withIntl';

const responsiveAlign = ['center', null, 'left'];
const sectionHeadingStyles = {
  fontSize: ['H4', null, 'H2'],
  lineHeight: ['H4', null, 'H2'],
  fontWeight: 800,
  px: [3, null, 4],
  textAlign: responsiveAlign,
};
const sectionSubHeadingStyles = {
  ...sectionHeadingStyles,
  color: 'black.900',
  fontSize: ['H5', null, 'H4'],
  lineHeight: ['H5', null, 'H4'],
  fontWeight: 600,
  my: 3,
  textAlign: responsiveAlign,
};
const sectionDetailStyles = {
  color: 'black.900',
  fontSize: 'LeadParagraph',
  lineHeight: 'LeadParagraph',
  px: [3, null, 4],
  textAlign: responsiveAlign,
};
const statsContainerStyles = {
  alignItems: 'center',
  backgroundImage: 'url(/static/images/oc-symbol.svg)',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'contain',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  size: [148, null, 240],
};
const statsStyles = {
  fontSize: ['H5', null, 'H3'],
  lineHeight: ['H5', null, 'H3'],
  fontWeight: 'bold',
};
const socialButtonStyles = {
  border: '1px solid',
  borderColor: 'primary.300',
  borderRadius: 50,
  color: 'pimary.500',
  display: 'block',
  fontSize: 'Paragraph',
  maxWidth: 200,
  mb: 3,
  mx: ['auto', null, 3],
  px: 3,
  py: 3,
  target: '_blank',
  textAlign: 'center',
  width: '100%',
};

const BackerAvatar = ({ slug, image, stats: { totalAmountSpent } }) => (
  <Link route={`/${slug}`} passHref>
    <a>
      <Container
        backgroundImage={`url(${imagePreview(image, pickAvatar(), {
          width: 120,
        })})`}
        backgroundSize="cover"
        backgroundPosition="center center"
        backgroundRepeat="no-repeat"
        borderRadius="50%"
        size={[
          Math.floor((totalAmountSpent / 5000) * Math.random()),
          null,
          Math.floor((totalAmountSpent / 2500) * Math.random()),
        ]}
        maxHeight={[80, null, 120]}
        maxWidth={[80, null, 120]}
        minHeight={[30, null, 50]}
        minWidth={[30, null, 50]}
      />
    </a>
  </Link>
);

BackerAvatar.propTypes = {
  slug: PropTypes.string,
  image: PropTypes.string,
  stats: PropTypes.object,
};

class HomePage extends React.Component {
  static getInitialProps({ req, res }) {
    if (res && req && (req.language || req.locale === 'en')) {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=7200');
    }
  }

  static propTypes = {
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object.isRequired, // from withIntl
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.carouselMessages = defineMessages({
      raiseMoneyHeading: {
        id: 'home.carousel.raiseMoneyHeading',
        defaultMessage: 'Raise money online with recurring subscriptions.',
      },
      raiseMoneyDetails: {
        id: 'home.carousel.raiseMoneyDetails',
        defaultMessage:
          'Connect with the Open Collective community and raise the funds required to sustain your community.',
      },
      contributeHeading: {
        id: 'home.carousel.contributeHeading',
        defaultMessage: 'All are welcome to join & contribute.',
      },
      contributeDetails: {
        id: 'home.carousel.contributeDetails',
        defaultMessage:
          'Everyone can contribute to your open collective. All you need is for people to believe in your mission.',
      },
      transparencyHeading: {
        id: 'home.carousel.transparencyHeading',
        defaultMessage: 'Show how the money is spent.',
      },
      transparencyDetails: {
        id: 'home.carousel.transparencyDetails',
        defaultMessage:
          'Every contribution helps you support your collective. Open Collective shows everyone how these financial contributions are earned and spent.',
      },
      missionHeading: {
        id: 'home.carousel.missionHeading',
        defaultMessage: 'A bottom - up group where anyone can become a core contributor.',
      },
      missionDetails: {
        id: 'home.carousel.missionDetails',
        defaultMessage:
          'The mission is what persists and unites you with your community. Leaders can change over time.',
      },
    });
  }

  state = {
    stats: {},
  };

  async componentDidMount() {
    // separate request to not block showing LoggedInUser
    const { stats } = await fetch(`${getBaseApiUrl()}/homepage`).then(response => response.json());
    this.setState({ stats });
  }

  // See https://github.com/opencollective/opencollective/issues/1872
  shouldComponentUpdate(newProps) {
    if (this.props.data.transactions && !newProps.data.transactions) {
      return false;
    } else {
      return true;
    }
  }

  getCarouselContent() {
    const { formatMessage } = this.props.intl;

    return [
      {
        image: '/static/images/home-slide-01.svg',
        heading: formatMessage(this.carouselMessages.raiseMoneyHeading),
        details: formatMessage(this.carouselMessages.raiseMoneyDetails),
      },
      {
        image: '/static/images/home-slide-02.svg',
        heading: formatMessage(this.carouselMessages.contributeHeading),
        details: formatMessage(this.carouselMessages.contributeDetails),
      },
      {
        image: '/static/images/home-slide-03.svg',
        heading: formatMessage(this.carouselMessages.transparencyHeading),
        details: formatMessage(this.carouselMessages.transparencyDetails),
      },
      {
        image: '/static/images/home-slide-04.svg',
        heading: formatMessage(this.carouselMessages.missionHeading),
        details: formatMessage(this.carouselMessages.missionDetails),
      },
    ];
  }

  render() {
    if (!this.props.data.transactions) {
      return <ErrorPage data={this.props.data} />;
    }

    const { LoggedInUser } = this.props;
    const {
      topSpenders: { collectives: topSpenders },
      backers: { collectives: backers },
      chapters: {
        stats: {
          collectives: { memberOf: totalChapters },
        },
      },
      recent: { collectives },
      sponsors: { collectives: sponsors },
      transactions: { transactions },
    } = this.props.data;
    const {
      stats: { totalAnnualBudget, totalCollectives, totalDonors },
    } = this.state;

    const filteredTransactions = transactions.filter(({ type, order, category, fromCollective, collective }) => {
      // Ignore corrupt entries (should not happen)
      if (!fromCollective || !collective) {
        return false;
      }
      if (type === 'CREDIT') {
        return !!order;
      }
      return !!category;
    });

    return (
      <Fragment>
        <Header title="Home" LoggedInUser={LoggedInUser} />
        <Body>
          <Container
            alignItems="center"
            backgroundImage="url(/static/images/hero-bg.svg)"
            backgroundPosition="center top"
            backgroundSize="cover"
            backgroundRepeat="no-repeat"
            boxShadow="inset 0px -60px 100px 0 rgba(78,121,187,0.1), 0px 40px 80px 0 rgba(78, 121,187, 0.12)"
            px={3}
            py="5rem"
          >
            <Container alignItems="center" maxWidth={1200} display="flex" justifyContent="space-between" mx="auto">
              <Container width={[1, null, 0.6]} pr={[0, null, 4]}>
                <H1
                  fontSize={['H3', null, 'H1']}
                  lineHeight={['H3', null, 'H1']}
                  fontWeight="normal"
                  textAlign="left"
                  mb={4}
                >
                  <FormattedMessage id="home.tagline1" defaultMessage="A new form of association" />,
                  <br />
                  <strong>
                    <FormattedMessage id="home.tagline2" defaultMessage="transparent by design" />
                  </strong>
                  .
                </H1>

                <Container maxWidth={500}>
                  <P fontSize="LeadParagraph" lineHeight="LeadParagraph" my={3} color="black.700">
                    <FormattedMessage
                      id="home.presentation"
                      defaultMessage="The Internet generation needs organizations that reflect who we are; where anybody can contribute to
                    a shared mission; where leaders can easily change; and where money flows in full transparency.
                    Create an Open Collective for your community."
                    />
                  </P>
                </Container>

                <Flex alignItems="center" flexDirection={['column', null, 'row']} my={4}>
                  <StyledLink
                    href="#movement"
                    buttonStyle="primary"
                    buttonSize="large"
                    fontWeight="500"
                    maxWidth="270px"
                    textAlign="center"
                    width={1}
                  >
                    <FormattedMessage id="home.join" defaultMessage="Join the movement" />
                  </StyledLink>

                  <Link route="marketing" params={{ pageSlug: 'how-it-works' }} passHref>
                    <StyledLink href="/how-it-works" mt={[3, null, 0]} ml={[0, null, 3]}>
                      <FormattedMessage id="home.howItWorks" defaultMessage="How it works" /> &gt;
                    </StyledLink>
                  </Link>
                </Flex>
              </Container>

              <Hide xs sm width={0.4}>
                <Container maxHeight="50rem" overflow="scroll">
                  <Box as="ul" p={0}>
                    {filteredTransactions.map(transaction => (
                      <ListItem key={transaction.id} mb={1}>
                        <Container
                          bg="white.full"
                          border="1px solid rgba(0, 0, 0, 0.1)"
                          borderRadius="8px"
                          boxShadow="0 2px 4px 0 rgba(46,48,51,0.08);"
                          p={3}
                        >
                          <HomepageActivityItem {...transaction} />
                        </Container>
                      </ListItem>
                    ))}
                  </Box>
                </Container>
              </Hide>
            </Container>
          </Container>

          <Container maxWidth={1200} mx="auto" px={2}>
            <H3 as="h2" textAlign={['center', null, 'left']} pb={3}>
              <FormattedMessage id="home.activeCollectives" defaultMessage="Active collectives" />
            </H3>

            <Container py={3}>
              <Flex mb={3} justifyContent="space-between" px={[1, null, 0]}>
                <H5 textAlign="left">
                  <FormattedMessage id="home.recentlyCreated" defaultMessage="Recently created" />
                </H5>
                <StyledLink href="/discover">
                  <FormattedMessage id="home.seeAll" defaultMessage="See all" /> &gt;
                </StyledLink>
              </Flex>
              <Container display="flex" flexWrap="wrap" justifyContent="space-between">
                {collectives.map(c => (
                  <Container key={c.id} width={[0.5, null, 0.25]} mb={2} px={1} maxWidth={224}>
                    <CollectiveStatsCard {...c} />
                  </Container>
                ))}
              </Container>
            </Container>

            <Container py={3}>
              <Flex mb={3} justifyContent="space-between" px={[1, null, 0]}>
                <H5 textAlign="left">
                  <FormattedMessage id="home.mostActive" defaultMessage="Most active" />
                </H5>
                <StyledLink href="/discover">
                  <FormattedMessage id="home.seeAll" defaultMessage="See all" /> &gt;
                </StyledLink>
              </Flex>
              <Container display="flex" flexWrap="wrap" justifyContent="space-between">
                {topSpenders.map(c => (
                  <Container width={[0.5, null, 0.25]} mb={2} px={1} maxWidth={224} key={c.id}>
                    <CollectiveStatsCard {...c} />
                  </Container>
                ))}
              </Container>
            </Container>

            <StyledLink
              href="/discover"
              buttonStyle="standard"
              buttonSize="large"
              display="block"
              fontWeight="500"
              maxWidth={330}
              mt={4}
              mx="auto"
              textAlign="center"
            >
              <FormattedMessage id="home.discoverMore" defaultMessage="Discover more collectives" />
            </StyledLink>
          </Container>

          <Container bg="primary.200" py={5} mt={5} id="movement">
            <Container maxWidth={800} mx="auto">
              <H1
                textAlign="center"
                fontWeight="900"
                px={2}
                as="h2"
                fontSize={['H2', null, 'H1']}
                lineHeight={['H2', null, 'H1']}
              >
                <FormattedMessage
                  id="home.joinFor"
                  defaultMessage="Join the movement for a world with more open, transparent, and sustainable communities."
                />
              </H1>
              <P
                color="black.700"
                textAlign="center"
                fontSize="LeadParagraph"
                lineHeight="LeadParagraph"
                px={3}
                my={[3, null, 4]}
              >
                <FormattedMessage
                  id="home.participate"
                  defaultMessage="There are many ways to participate: create an open collective, become a host, make a financial
                contribution, attend an event or simply share the love by showing others how they can benefit from
                operating as an open community. Here’s how:"
                />
              </P>
            </Container>

            <Container bg={['primary.500', null, 'transparent']} height={2} width={32} mx="auto" my={[5, null, 3]} />

            <Container
              display="flex"
              flexDirection={['column', null, 'row']}
              maxWidth={1200}
              mx="auto"
              alignItems="center"
            >
              <Container width={[1, null, 0.5]}>
                <H2 {...sectionHeadingStyles}>
                  <FormattedMessage id="home.create" defaultMessage="Create an open collective" />
                </H2>

                <H4 {...sectionSubHeadingStyles}>
                  <FormattedMessage
                    id="home.transparency"
                    defaultMessage="A group of people with a shared mission that operates in full transparency"
                  />{' '}
                  👀
                </H4>

                <P {...sectionDetailStyles}>
                  <FormattedMessage
                    id="home.createFor"
                    defaultMessage="Create an open collective for your group and leverage the power of the community to live up to your
                  mission."
                  />{' '}
                  <a href="/discover">
                    <FormattedMessage id="home.learnMore" defaultMessage="Learn more" />.
                  </a>
                </P>

                <Flex mx={['auto', null, 4]} my={4} justifyContent={['center', null, 'flex-start']}>
                  <Link route="/create" passHref>
                    <StyledLink
                      buttonStyle="primary"
                      buttonSize="large"
                      display="inline-block"
                      fontWeight="500"
                      textAlign="center"
                    >
                      <FormattedMessage id="home.create" defaultMessage="Create an open collective" />
                    </StyledLink>
                  </Link>
                </Flex>
              </Container>

              <Container width={[1, null, 0.5]}>
                <Carousel content={this.getCarouselContent()} />
              </Container>
            </Container>

            <Container bg={['primary.500', null, 'transparent']} height={2} width={32} mx="auto" my={[5]} />

            <Container display="flex" flexDirection={['column', null, 'row']} maxWidth={1200} mx="auto">
              <Container width={[1, null, 0.5]}>
                <H2 {...sectionHeadingStyles}>
                  <FormattedMessage id="home.sponsor" defaultMessage="Become a sponsor" />
                </H2>

                <H4 {...sectionSubHeadingStyles}>
                  <FormattedMessage
                    id="home.greatCompanies"
                    defaultMessage="Great companies supporting great collectives with"
                  />{' '}
                  💙
                </H4>

                <P {...sectionDetailStyles}>
                  <FormattedMessage
                    id="home.orgSupport"
                    defaultMessage="Support collectives on behalf of your organization."
                  />{' '}
                  <strong>
                    <FormattedMessage
                      id="home.invoice"
                      defaultMessage="You'll get an invoice for every financial contribution your company makes as well as a monthly
                    report."
                    />
                  </strong>
                </P>

                <P {...sectionDetailStyles} my={3}>
                  <FormattedMessage
                    id="home.onboard"
                    defaultMessage="If you’re looking to onboard and financially support an initiative through Open Collective, {letUsKnowLink} and we’ll gladly set them up and get them going."
                    values={{
                      letUsKnowLink: (
                        <a href="mailto:info@opencollective.com">
                          <FormattedMessage id="home.letUsKnow" defaultMessage="let us know" />
                        </a>
                      ),
                    }}
                  />
                </P>

                <Flex mx={['auto', null, 4]} my={4} justifyContent={['center', null, 'flex-start']}>
                  <Link route="marketing" params={{ pageSlug: 'become-a-sponsor' }} passHref>
                    <StyledLink
                      buttonStyle="primary"
                      buttonSize="large"
                      display="inline-block"
                      fontWeight="bold"
                      textAlign="center"
                    >
                      <FormattedMessage id="home.sponsor" defaultMessage="Become a sponsor" />
                    </StyledLink>
                  </Link>
                </Flex>
              </Container>
              <Container
                width={[1, null, 0.5]}
                display="flex"
                flexWrap="wrap"
                justifyContent="space-between"
                px={[1, null, 4]}
              >
                {sponsors.map(c => (
                  <Container width={[0.5, null, 0.33]} mb={2} px={1} maxWidth={224} key={c.id}>
                    <HomepageSponsorCard {...c} />
                  </Container>
                ))}
              </Container>
            </Container>

            <Container bg={['primary.500', null, 'transparent']} height={2} width={32} mx="auto" my={[5]} />

            <Container display="flex" flexDirection={['column', null, 'row']} maxWidth={1200} mx="auto">
              <Container width={[1, null, 0.5]} mb={4}>
                <H2 {...sectionHeadingStyles}>
                  <FormattedMessage id="home.becomeABacker" defaultMessage="Become a backer" />
                </H2>

                <H4 {...sectionSubHeadingStyles}>
                  <FormattedMessage id="home.givingBack" defaultMessage="For those who believe in giving back" />
                </H4>

                <P {...sectionDetailStyles}>
                  <FormattedMessage
                    id="home.joinAndDiscover"
                    defaultMessage="Join Open Collective and discover the different initiatives that need your support. Embrace the
                  mission that drives them and contribute to their group effort."
                  />{' '}
                  <strong>
                    <FormattedMessage id="home.becomePart" defaultMessage="Become part of the movement." />
                  </strong>
                </P>

                <Flex mx={['auto', null, 4]} my={4} justifyContent={['center', null, 'flex-start']}>
                  <StyledLink
                    buttonStyle="primary"
                    buttonSize="large"
                    display="inline-block"
                    href="/discover"
                    fontWeight="bold"
                    textAlign="center"
                  >
                    <FormattedMessage id="home.becomeABacker" defaultMessage="Become a backer" />
                  </StyledLink>
                </Flex>
              </Container>
              <Container width={[1, null, 0.5]} overflow="hidden" position="relative">
                <Container
                  width={['100%', null, '160%']}
                  display="flex"
                  flexWrap="wrap"
                  justifyContent="center"
                  alignItems="center"
                  position="relative"
                >
                  {backers
                    .filter(({ image }) => !!image)
                    .map(c => (
                      <Container px={1} key={c.id}>
                        <BackerAvatar {...c} />
                      </Container>
                    ))}
                </Container>
                <Hide xs sm position="absolute" top={0} left={0} width="100%" height="100%" pointerEvents="none">
                  <Container
                    background={`linear-gradient(to left, ${colors.primary[200]}, rgba(255, 255, 255, 0) 50%)`}
                    width="100%"
                    height="100%"
                  />
                </Hide>
              </Container>
            </Container>

            <Container bg={['primary.500', null, 'transparent']} height={2} width={32} mx="auto" my={[5]} />

            <Container
              display="flex"
              flexDirection={['column', null, 'row']}
              justifyContent="space-between"
              maxWidth={1200}
              mx="auto"
            >
              <Container width={[1, null, 0.5]}>
                <H2 {...sectionHeadingStyles}>
                  <FormattedMessage id="home.contributeCode" defaultMessage="Contribute code" /> 👩🏻‍💻👨🏿‍💻
                </H2>

                <H4 {...sectionSubHeadingStyles}>
                  <FormattedMessage
                    id="home.buildingTogether"
                    defaultMessage="Building Open Collective together to get further, faster"
                  />{' '}
                  🚀
                </H4>

                <P {...sectionDetailStyles}>
                  <FormattedMessage
                    id="home.devOpenSource"
                    defaultMessage="Are you a developer who believes in supporting open and welcoming communities? Open Collective is open
                  source (MIT License) so anyone can contribute code or report issues publicly."
                  />
                </P>

                <P {...sectionDetailStyles} my={3}>
                  <FormattedMessage
                    id="home.goal"
                    defaultMessage="Our goal is to provide all communities around the world the software that they need to operate as open
                  and transparent collectives. We want to enable them to thrive in the same way that WordPress enabled
                  millions of blogs to exist."
                  />
                </P>

                <P {...sectionDetailStyles} my={3}>
                  <FormattedMessage
                    id="home.specialThanks"
                    defaultMessage="Special thanks to all of you who already contributed in some way!"
                  />{' '}
                  🙏
                </P>

                <StyledLink
                  {...sectionDetailStyles}
                  color="primary.700"
                  display="inline-block"
                  my={4}
                  href="https://github.com/opencollective"
                >
                  <FormattedMessage
                    id="home.github"
                    defaultMessage="Check out our Github organization to find out more"
                  />
                </StyledLink>
              </Container>
              <Container width={[1, null, 0.5]} textAlign="center" px={2} maxWidth={600}>
                <img
                  src="/static/images/home-contributors.png"
                  alt="Open Collective Contribution Commits"
                  width="100%"
                  height="auto"
                />
              </Container>
            </Container>

            <Container bg={['primary.500', null, 'transparent']} height={2} width={32} mx="auto" my={[5]} />

            <Container
              display="flex"
              flexDirection={['column', null, 'row']}
              maxWidth={1200}
              mx="auto"
              alignItems="center"
            >
              <Container width={[1, null, 0.5]}>
                <H2 {...sectionHeadingStyles}>Become a host</H2>

                <H4 {...sectionSubHeadingStyles}>
                  <FormattedMessage
                    id="home.umbrella"
                    defaultMessage="Help provide the umbrella legal entities open collectives need to raise funds"
                  />{' '}
                  ⚖️
                </H4>

                <P {...sectionDetailStyles}>
                  <strong>
                    <FormattedMessage id="home.hostDetails1" defaultMessage="Grow the movement" />
                  </strong>{' '}
                  <FormattedMessage
                    id="home.hostDetails2"
                    defaultMessage="by becoming a host of open collectives in your city or your
                  industry. Hosts are acting as fiscal sponsors. They collect the money on behalf of the collectives and
                  enable them to issue invoices. They are mutualising the legal and accounting overhead that come with
                  creating and maintaining a legal entity so that the open collectives that they host can focus on their
                  mission."
                  />
                </P>

                <Flex mx={['auto', null, 4]} my={4} justifyContent={['center', null, 'flex-start']}>
                  <Link route="/hosts" passHref>
                    <StyledLink
                      buttonStyle="primary"
                      buttonSize="large"
                      display="inline-block"
                      fontWeight="500"
                      textAlign="center"
                    >
                      <FormattedMessage id="home.becomeHost" defaultMessage="Become a host" />
                    </StyledLink>
                  </Link>
                </Flex>
              </Container>
              <Container width={[1, null, 0.5]} textAlign="center" px={4} maxWidth={600} mt={[5, null, 0]}>
                <img
                  src="/static/images/home-local-chapter.svg"
                  alt="Open Collective Local Chapter"
                  width="100%"
                  height="auto"
                />
              </Container>
            </Container>

            <Container mt={6}>
              <P textAlign="center" fontSize={[20, null, 28]} mb={2}>
                <FormattedMessage id="home.todayWeAre" defaultMessage="Today we are:" />
              </P>
              {totalCollectives && (
                <Container display="flex" flexWrap="wrap" alignItems="center" justifyContent="center">
                  <Container {...statsContainerStyles}>
                    <P {...statsStyles}>
                      <FormattedNumber value={totalCollectives} />
                    </P>
                    <P>
                      <a href="https://opencollective.com/discover">
                        <FormattedMessage id="home.collectives" defaultMessage="collectives" />
                      </a>
                    </P>
                  </Container>
                  <Container {...statsContainerStyles}>
                    <P {...statsStyles}>
                      <FormattedNumber value={totalDonors} />
                    </P>
                    <P>
                      <FormattedMessage id="home.backers" defaultMessage="backers" />
                    </P>
                  </Container>
                  <Container {...statsContainerStyles}>
                    <P {...statsStyles}>
                      <FormattedNumber value={totalChapters} />
                    </P>
                    <P>
                      <Link route="chapters" passHref>
                        <a>
                          <FormattedMessage id="home.chapters" defaultMessage="chapters" />
                        </a>
                      </Link>
                    </P>
                  </Container>
                  <Container {...statsContainerStyles}>
                    <P {...statsStyles}>
                      <Currency value={totalAnnualBudget} abbreviate currency="USD" />
                    </P>
                    <P>
                      <FormattedMessage id="home.moneyRaised" defaultMessage="raised" />
                    </P>
                  </Container>
                </Container>
              )}
            </Container>

            <Container mt={5} px={3}>
              <H3 textAlign="center" fontSize={['H4', null, 'H2']} lineHeight={['H4', null, 'H2']} pb={4}>
                <FormattedMessage id="home.spread" defaultMessage="Spread the word!" />
              </H3>

              <Container maxWidth={600} mx="auto">
                <P
                  textAlign="center"
                  fontSize={['Paragraph', null, 'LeadParagraph']}
                  lineHeight={['Paragraph', null, 'LeadParagraph']}
                  color="black.700"
                  mb={4}
                >
                  <FormattedMessage
                    id="home.speadDescription"
                    defaultMessage="Do you know people or organizations that will benefit from an open structure and a transparent
                  operation? Let them know that Open Collective exists!"
                  />
                </P>
              </Container>

              <Flex flexDirection={['column', null, 'row']} justifyContent="center">
                <StyledLink
                  {...socialButtonStyles}
                  href="https://twitter.com/intent/tweet?text=Check%20out%20Open%20Collection%2C%20a%20platform%20for%20organizations%2C%20communities%2C%20and%20projects%20to%20operate%20transparently!&url=https%3A%2F%2Fopencollective.com"
                >
                  <Container display="flex" alignItems="center" justifyContent="space-evenly">
                    <Twitter size={18} color={colors.primary[500]} />
                    <Span>
                      <FormattedMessage id="shareOnTwitter" defaultMessage="Share on Twitter" />
                    </Span>
                  </Container>
                </StyledLink>

                <StyledLink
                  {...socialButtonStyles}
                  href="https://www.facebook.com/sharer/sharer.php?u=https%3A//opencollective.com"
                >
                  <Container display="flex" alignItems="center" justifyContent="space-evenly">
                    <Facebook size={18} color={colors.primary[500]} />
                    <Span>
                      <FormattedMessage id="shareOnFacebook" defaultMessage="Share on Facebook" />
                    </Span>
                  </Container>
                </StyledLink>

                <StyledLink
                  {...socialButtonStyles}
                  href="https://www.linkedin.com/shareArticle?mini=true&url=https%3A//opencollective.com&title=Check%20out%20Open%20Collective&summary=Open%20Collection%20is%20a%20platform%20for%20organizations,%20communities,%20and%20projects%20to%20operate%20transparently&source="
                >
                  <Container display="flex" alignItems="center" justifyContent="space-evenly">
                    <Linkedin size={18} color={colors.primary[500]} />
                    <Span>
                      <FormattedMessage id="shareOnLinkedIn" defaultMessage="Share on LinkedIn" />
                    </Span>
                  </Container>
                </StyledLink>
              </Flex>
            </Container>
          </Container>

          <Container background="linear-gradient(182.45deg, #222584 4.38%, #6266EC 118.14%)" position="relative" py={6}>
            <Container
              bg="primary.200"
              height="15rem"
              position="absolute"
              style={{ clipPath: 'ellipse(58% 48% at 50% 52%)' }}
              top={-80}
              width={1}
            />
            <Container
              alignItems="center"
              display="flex"
              flexDirection={['column', null, 'row']}
              justifyContent="space-around"
              maxWidth={1200}
              mx="auto"
            >
              <Container maxWidth={550} px={[3, null, 0]}>
                <P color="white.transparent.48" fontSize="LeadParagraph" mb={4}>
                  <FormattedMessage id="home.intoducing" defaultMessage="Introducing" />
                </P>

                <Box mb={3}>
                  <img src="/static/images/backyourstack.svg" alt="Back Your Stack" />
                </Box>

                <H4 color="white.full" mb={4}>
                  <FormattedMessage
                    id="home.discoverOpenSourceProjects"
                    defaultMessage="Discover the Open Source projects your organization is using that need financial support."
                  />
                </H4>

                <P color="white.full" fontSize="LeadParagraph" lineHeight="24px">
                  <FormattedMessage
                    id="home.backYourStack"
                    defaultMessage="BackYourStack is a community project initiated by Open Collective."
                  />
                  <StyledLink
                    href="https://backyourstack.com/contributing"
                    color="white.full"
                    px={2}
                    textDecoration="underline"
                  >
                    <FormattedMessage id="home.contributeLearnHow" defaultMessage="Learn how to contribute here." />
                  </StyledLink>
                </P>

                <StyledLink
                  href="https://backyourstack.com/"
                  bg="white.full"
                  borderRadius="50px"
                  color="#3C40AE"
                  display="block"
                  fontWeight="bold"
                  maxWidth={300}
                  mx={['auto', null, 0]}
                  mt={4}
                  textAlign="center"
                  buttonSize="large"
                >
                  <FormattedMessage id="home.goToBackYourStack" defaultMessage="Go to Back Your Stack" />
                </StyledLink>
              </Container>

              <Box order={[-1, null, 1]}>
                <img src="/static/images/bys-logo.svg" alt="Back Your Stack" />
              </Box>
            </Container>
          </Container>

          <NewsletterContainer />
        </Body>
        <Footer />
      </Fragment>
    );
  }
}

const query = gql`
  query home {
    transactions(limit: 30) {
      transactions {
        amount
        createdAt
        currency
        id
        type
        fromCollective {
          id
          image
          name
          slug
          type
        }
        collective {
          name
          slug
          type
          parentCollective {
            slug
          }
        }
        ... on Order {
          order {
            id
          }
          subscription {
            interval
          }
        }
        ... on Expense {
          category
        }
      }
    }
    recent: allCollectives(
      type: COLLECTIVE
      minBackerCount: 10
      isActive: true
      orderBy: createdAt
      orderDirection: DESC
      limit: 4
    ) {
      collectives {
        id
        type
        slug
        currency
        name
        image
        backgroundImage
        description
        settings
        stats {
          id
          monthlySpending
          balance
          yearlyBudget
          backers {
            all
          }
        }
      }
    }
    topSpenders: allCollectives(type: COLLECTIVE, limit: 4, orderBy: monthlySpending, orderDirection: DESC, offset: 0) {
      collectives {
        id
        type
        slug
        currency
        name
        image
        backgroundImage
        description
        settings
        stats {
          id
          monthlySpending
          balance
          yearlyBudget
          backers {
            all
          }
        }
      }
    }
    sponsors: allCollectives(type: ORGANIZATION, limit: 6, orderBy: monthlySpending, orderDirection: DESC, offset: 0) {
      collectives {
        id
        currency
        type
        slug
        name
        image
        stats {
          totalAmountSpent
        }
      }
    }
    backers: allCollectives(type: USER, limit: 30, orderBy: monthlySpending, orderDirection: DESC, offset: 0) {
      collectives {
        id
        currency
        type
        slug
        name
        image
        stats {
          totalAmountSpent
        }
      }
    }
    chapters: Collective(slug: "chapters") {
      stats {
        collectives {
          memberOf
        }
      }
    }
  }
`;

const addHomeData = graphql(query);

export { HomePage as MockHomePage };

export default addHomeData(withIntl(HomePage));
