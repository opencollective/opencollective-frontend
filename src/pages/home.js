import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import fetch from 'node-fetch';
import { Box, Flex } from 'grid-styled';
import { FormattedNumber } from 'react-intl';

import { pickAvatar } from '../lib/collective.lib';
import { getBaseApiUrl, imagePreview } from '../lib/utils';

import { Link } from '../server/pages';

import Body from '../components/Body';
import Footer from '../components/Footer';
import Header from '../components/Header';
import TransactionSimple from '../components/TransactionSimple';
import { Span, P, H1, H2, H3, H4 } from '../components/Text';
import ListItem from '../components/ListItem';
import Hide from '../components/Hide';
import Container from '../components/Container';
import StyledLink from '../components/StyledLink';
import CollectiveStatsCard from '../components/CollectiveStatsCard';
import NewsletterContainer from '../components/NewsletterContainer';
import HomepageSponsorCard from '../components/HomepageSponsorCard';
import { FacebookIcon, LinkedInIcon, TwitterIcon } from '../components/icons';
import Carousel from '../components/Carousel';
import Currency from '../components/Currency';
import ErrorPage from '../components/ErrorPage';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

const carouselContent = [
  {
    image: '/static/images/home-slide-01.svg',
    heading: 'Raise money online with recurring subscriptions.',
    details:
      'Connect with the Open Collective community and raise the funds required to sustain your community.',
  },
  {
    image: '/static/images/home-slide-02.svg',
    heading: 'All are welcome to join & contribute.',
    details:
      'Everyone can contribute to your open collective. All you need is for people to believe in your mission.',
  },
  {
    image: '/static/images/home-slide-03.svg',
    heading: 'Show how the money is spent.',
    details:
      'Every contribution helps you support your collective. Open Collective shows everyone how these financial contributions are earned and spent.',
  },
  {
    image: '/static/images/home-slide-04.svg',
    heading: 'A bottom - up group where anyone can become a core contributor.',
    details:
      'The mission is what persists and unites you with your community. Leaders can change over time.',
  },
];

const responsiveAlign = ['center', null, 'left'];
const sectionHeadingStyles = {
  fontSize: [28, null, 48],
  fontWeight: 800,
  px: [3, null, 4],
  textAlign: responsiveAlign,
};
const sectionSubHeadingStyles = {
  ...sectionHeadingStyles,
  color: '#2E3033',
  fontSize: [20, null, 28],
  fontWeight: 600,
  my: 3,
};
const sectionDetailStyles = {
  color: '#2E3033',
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
  fontSize: [20, null, 36],
  fontWeight: 'bold',
};
const socialButtonStyles = {
  border: '1px solid #99C2FF',
  borderRadius: 50,
  color: '#3385FF',
  display: 'block',
  fontSize: 14,
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
        backgroundImage={`url(${imagePreview(image || pickAvatar())})`}
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

class HomePage extends React.Component {
  static getInitialProps({ req, res }) {
    if (res && req && req.locale == 'en') {
      res.setHeader('Cache-Control', 's-maxage=7200');
    }
  }

  static propTypes = {
    data: PropTypes.object.isRequired, // from withData
    getLoggedInUser: PropTypes.func.isRequired, // from withLoggedInUser
  };

  state = {
    LoggedInUser: {},
    stats: {},
  };

  async componentDidMount() {
    const LoggedInUser = await this.props.getLoggedInUser();
    this.setState({ LoggedInUser });

    // separate request to not block showing LoggedInUser
    const { stats } = await fetch(`${getBaseApiUrl()}/homepage`).then(
      response => response.json(),
    );
    this.setState({ stats });
  }

  render() {
    if (!this.props.data.transactions) {
      return <ErrorPage data={this.props.data} />;
    }

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
      LoggedInUser,
      stats: { totalAnnualBudget, totalCollectives, totalDonors },
    } = this.state;

    const filteredTransactions = transactions.filter(
      ({ type, order, category }) => {
        if (type === 'CREDIT') {
          return !!order;
        }
        return !!category;
      },
    );

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
            <Container
              maxWidth={1200}
              display="flex"
              justifyContent="space-between"
              mx="auto"
            >
              <Container
                width={[1, null, 0.5]}
                pr={[0, null, 4]}
                maxWidth={500}
              >
                <H1 fontWeight="normal" textAlign="left">
                  A new form of association, <br />{' '}
                  <strong>transparent by design.</strong>
                </H1>

                <P my={3} color="#6E747A">
                  The Internet generation needs organizations that reflect who
                  we are; where anybody can contribute to a shared mission;
                  where leaders can easily change; and where money flows in full
                  transparency. Create an Open Collective for your community.
                </P>

                <Flex
                  alignItems="center"
                  flexDirection={['column', null, 'row']}
                  my={4}
                >
                  <StyledLink
                    href="#movement"
                    bg="#3385FF"
                    borderRadius="50px"
                    color="white"
                    fontSize="1.6rem"
                    fontWeight="bold"
                    maxWidth="220px"
                    hover={{ color: 'white' }}
                    py={3}
                    textAlign="center"
                    width={1}
                  >
                    Join the movement
                  </StyledLink>

                  <StyledLink
                    href="/learn-more"
                    mt={[3, null, 0]}
                    ml={[0, null, 3]}
                  >
                    How it works &gt;
                  </StyledLink>
                </Flex>
              </Container>

              <Hide xs sm width={0.5}>
                <P
                  textAlign="center"
                  color="#C2C6CC"
                  textTransform="uppercase"
                  fontSize="1.2rem"
                  letterSpacing="0.8px"
                  mb={3}
                >
                  Latest Transactions
                </P>
                <Container maxHeight="50rem" overflow="scroll">
                  <Box is="ul" p={0}>
                    {filteredTransactions.map(transaction => (
                      <ListItem key={transaction.id} mb={1}>
                        <Container
                          bg="white"
                          border="1px solid rgba(0, 0, 0, 0.1)"
                          borderRadius="8px"
                          boxShadow="0 2px 4px 0 rgba(46,48,51,0.08);"
                          p={3}
                        >
                          <TransactionSimple {...transaction} />
                        </Container>
                      </ListItem>
                    ))}
                  </Box>
                </Container>
              </Hide>
            </Container>
          </Container>

          <Container maxWidth={1200} mx="auto" px={2}>
            <H2 textAlign={['center', null, 'left']} pb={3}>
              Active collectives
            </H2>

            <Container py={3}>
              <Flex mb={3} justifyContent="space-between" px={[1, null, 0]}>
                <H3>Recently created</H3>
                <StyledLink href="/discover">See all &gt;</StyledLink>
              </Flex>
              <Container
                display="flex"
                flexWrap="wrap"
                justifyContent="space-between"
              >
                {collectives.map(c => (
                  <Container
                    key={c.id}
                    width={[0.5, null, 0.25]}
                    mb={2}
                    px={1}
                    maxWidth={224}
                  >
                    <CollectiveStatsCard {...c} />
                  </Container>
                ))}
              </Container>
            </Container>

            <Container py={3}>
              <Flex mb={3} justifyContent="space-between" px={[1, null, 0]}>
                <H3>Most active</H3>
                <StyledLink href="/discover">See all &gt;</StyledLink>
              </Flex>
              <Container
                display="flex"
                flexWrap="wrap"
                justifyContent="space-between"
              >
                {topSpenders.map(c => (
                  <Container
                    width={[0.5, null, 0.25]}
                    mb={2}
                    px={1}
                    maxWidth={224}
                    key={c.id}
                  >
                    <CollectiveStatsCard {...c} />
                  </Container>
                ))}
              </Container>
            </Container>

            <StyledLink
              href="/discover"
              bg="white"
              border="1px solid #D5DAE0"
              borderRadius="50px"
              color="#3385FF"
              display="block"
              fontSize={['1.4rem', null, '1.6rem']}
              fontWeight="bold"
              hover={{ color: '#3385FF' }}
              mt={4}
              mx="auto"
              py={[2, null, 3]}
              textAlign="center"
              width={[250, null, 320]}
            >
              Discover more collectives
            </StyledLink>
          </Container>

          <Container bg="#EBF1FA" py={5} mt={5} id="movement">
            <Container maxWidth={800} mx="auto">
              <H2
                textAlign="center"
                fontWeight="900"
                px={2}
                lineHeight={['36px', null, '58px']}
                fontSize={[H2.defaultProps.fontSize, null, 56]}
              >
                Join the movement for a world with more open, transparent, and
                sustainable communities.
              </H2>
              <P
                color="#6E747A"
                textAlign="center"
                fontSize={[16, null, 20]}
                lineHeight={['24px', null, '28px']}
                px={3}
                my={[3, null, 4]}
              >
                There are many ways to participate: create an open collective,
                become a host, make a financial contribution, attend an event or
                simply share the love by showing others how they can benefit
                from operating as an open community. Here’s how:
              </P>
            </Container>

            <Container
              bg={['#3385FF', null, 'transparent']}
              height={2}
              width={32}
              mx="auto"
              my={[5, null, 3]}
            />

            <Container
              display="flex"
              flexDirection={['column', null, 'row']}
              maxWidth={1200}
              mx="auto"
              alignItems="center"
            >
              <Container width={[1, null, 0.5]}>
                <H3 {...sectionHeadingStyles}>Create an open collective</H3>

                <P {...sectionSubHeadingStyles}>
                  A group of people with a shared mission that operates in full
                  transparency 👀
                </P>

                <P {...sectionDetailStyles}>
                  Create an open collective for your group and leverage the
                  power of the community to live up to your mission.{' '}
                  <a href="/discover">Learn more.</a>
                </P>

                <Link route="/create" passHref>
                  <StyledLink
                    bg="#3385FF"
                    borderRadius="50px"
                    color="white"
                    display="block"
                    fontSize="1.6rem"
                    fontWeight="bold"
                    maxWidth="220px"
                    mx={['auto', null, 4]}
                    mt={4}
                    mb={4}
                    hover={{ color: 'white' }}
                    py={3}
                    textAlign="center"
                    width={[250, null, 320]}
                  >
                    Create an open collective
                  </StyledLink>
                </Link>
              </Container>
              <Container width={[1, null, 0.5]}>
                <Carousel content={carouselContent} />
              </Container>
            </Container>

            <Container
              bg={['#3385FF', null, 'transparent']}
              height={2}
              width={32}
              mx="auto"
              my={[5]}
            />

            <Container
              display="flex"
              flexDirection={['column', null, 'row']}
              maxWidth={1200}
              mx="auto"
            >
              <Container width={[1, null, 0.5]}>
                <H3 {...sectionHeadingStyles}>Become a sponsor</H3>

                <P {...sectionSubHeadingStyles}>
                  Great companies supporting great collectives with 💙
                </P>

                <P {...sectionDetailStyles}>
                  Support collectives on behalf of your organization.{' '}
                  <Span fontWeight="bold">
                    You&apos;ll get an invoice for every financial contribution
                    your company makes as well as a monthly report.
                  </Span>
                </P>

                <P {...sectionDetailStyles} my={3}>
                  If you’re looking to onboard and financially support an
                  initiative through Open Collective,{' '}
                  <a href="mailto:info@opencollective.com">let us know</a> and
                  we’ll gladly set them up and get them going.
                </P>

                <Link route="/organizations/new" passHref>
                  <StyledLink
                    bg="#3385FF"
                    borderRadius="50px"
                    color="white"
                    display="block"
                    fontSize="1.6rem"
                    fontWeight="bold"
                    maxWidth="220px"
                    mx={['auto', null, 4]}
                    mt={4}
                    mb={4}
                    hover={{ color: 'white' }}
                    py={3}
                    textAlign="center"
                    width={[250, null, 320]}
                  >
                    Become a sponsor
                  </StyledLink>
                </Link>
              </Container>
              <Container
                width={[1, null, 0.5]}
                display="flex"
                flexWrap="wrap"
                justifyContent="space-between"
                px={[1, null, 4]}
              >
                {sponsors.map(c => (
                  <Container
                    width={[0.5, null, 0.33]}
                    mb={2}
                    px={1}
                    maxWidth={224}
                    key={c.id}
                  >
                    <HomepageSponsorCard {...c} />
                  </Container>
                ))}
              </Container>
            </Container>

            <Container
              bg={['#3385FF', null, 'transparent']}
              height={2}
              width={32}
              mx="auto"
              my={[5]}
            />

            <Container
              display="flex"
              flexDirection={['column', null, 'row']}
              maxWidth={1200}
              mx="auto"
            >
              <Container width={[1, null, 0.5]} mb={4}>
                <H3 {...sectionHeadingStyles}>Become a backer</H3>

                <P {...sectionSubHeadingStyles}>
                  For those who believe in giving back
                </P>

                <P {...sectionDetailStyles}>
                  Join Open Collective and discover the different initiatives
                  that need your support. Embrace the mission that drives them
                  and contribute to their group effort.{' '}
                  <Span fontWeight="bold">Become part of the movement.</Span>
                </P>

                <StyledLink
                  bg="#3385FF"
                  borderRadius="50px"
                  color="white"
                  display="block"
                  href="/discover"
                  fontSize="1.6rem"
                  fontWeight="bold"
                  maxWidth="220px"
                  mx={['auto', null, 4]}
                  mt={4}
                  hover={{ color: 'white' }}
                  py={3}
                  textAlign="center"
                  width={[250, null, 320]}
                >
                  Become a backer
                </StyledLink>
              </Container>
              <Container
                width={[1, null, 0.5]}
                overflow="hidden"
                position="relative"
              >
                <Container
                  width={['100%', null, '160%']}
                  display="flex"
                  flexWrap="wrap"
                  justifyContent="center"
                  alignItems="center"
                  position="relative"
                >
                  {backers.filter(({ image }) => !!image).map(c => (
                    <Container px={1} key={c.id}>
                      <BackerAvatar {...c} />
                    </Container>
                  ))}
                </Container>
                <Hide
                  xs
                  sm
                  position="absolute"
                  top={0}
                  left={0}
                  width="100%"
                  height="100%"
                  pointerEvents="none"
                >
                  <Container
                    background="linear-gradient(to left, #EBF1FA, rgba(255, 255, 255, 0) 50%)"
                    width="100%"
                    height="100%"
                  />
                </Hide>
              </Container>
            </Container>

            <Container
              bg={['#3385FF', null, 'transparent']}
              height={2}
              width={32}
              mx="auto"
              my={[5]}
            />

            <Container
              display="flex"
              flexDirection={['column', null, 'row']}
              justifyContent="space-between"
              maxWidth={1200}
              mx="auto"
            >
              <Container width={[1, null, 0.5]}>
                <H3 {...sectionHeadingStyles}>Contribute code 👩🏻‍💻👨🏿‍💻</H3>

                <P {...sectionSubHeadingStyles}>
                  Building Open Collective together to get further, faster 🚀
                </P>

                <P {...sectionDetailStyles}>
                  Are you a developer who believes in supporting open and
                  welcoming communities? Open Collective is open source (MIT
                  License) so anyone can contribute code or report issues
                  publicly.
                </P>

                <P {...sectionDetailStyles} my={3}>
                  Our goal is to provide all communities around the world the
                  software that they need to operate as open and transparent
                  collectives. We want to enable them to thrive in the same way
                  that WordPress enabled millions of blogs to exist.
                </P>

                <P {...sectionDetailStyles} my={3}>
                  Special thanks to all of you who already contributed in some
                  way! 🙏
                </P>

                <StyledLink
                  {...sectionDetailStyles}
                  color="#3385FF"
                  display="inline-block"
                  my={4}
                  href="https://github.com/opencollective"
                >
                  Check out our Github organization to find out more
                </StyledLink>
              </Container>
              <Container
                width={[1, null, 0.5]}
                textAlign="center"
                px={2}
                maxWidth={600}
              >
                <img
                  src="/static/images/home-contributors.png"
                  alt="Open Collective Contribution Commits"
                  width="100%"
                  height="auto"
                />
              </Container>
            </Container>

            <Container
              bg={['#3385FF', null, 'transparent']}
              height={2}
              width={32}
              mx="auto"
              my={[5]}
            />

            <Container
              display="flex"
              flexDirection={['column', null, 'row']}
              maxWidth={1200}
              mx="auto"
              alignItems="center"
            >
              <Container width={[1, null, 0.5]}>
                <H3 {...sectionHeadingStyles}>Become a host</H3>

                <P {...sectionSubHeadingStyles}>
                  Help provide the umbrella legal entities open collectives need
                  to raise funds ⚖️
                </P>

                <P {...sectionDetailStyles}>
                  <Span fontWeight="bold">Grow the movement</Span> by becoming a
                  host of open collectives in your city or your industry. Hosts
                  are acting as fiscal sponsors. They collect the money on
                  behalf of the collectives and enable them to issue invoices.
                  They are mutualising the legal and accounting overhead that
                  come with creating and maintaining a legal entity so that the
                  open collectives that they host can focus on their mission.
                </P>

                <Link route="/hosts" passHref>
                  <StyledLink
                    bg="#3385FF"
                    borderRadius="50px"
                    color="white"
                    display="block"
                    fontSize="1.6rem"
                    fontWeight="bold"
                    maxWidth="220px"
                    mx={['auto', null, 4]}
                    mt={4}
                    py={3}
                    textAlign="center"
                    width={[250, null, 320]}
                  >
                    Become a host
                  </StyledLink>
                </Link>
              </Container>
              <Container
                width={[1, null, 0.5]}
                textAlign="center"
                px={4}
                maxWidth={600}
                mt={[5, null, 0]}
              >
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
                Today we are:
              </P>
              {totalCollectives && (
                <Container
                  display="flex"
                  flexWrap="wrap"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Container {...statsContainerStyles}>
                    <P {...statsStyles}>
                      <FormattedNumber value={totalCollectives} />
                    </P>
                    <P>
                      <a href="https://opencollective.com/discover">
                        collectives
                      </a>
                    </P>
                  </Container>
                  <Container {...statsContainerStyles}>
                    <P {...statsStyles}>
                      <FormattedNumber value={totalDonors} />
                    </P>
                    <P>backers</P>
                  </Container>
                  <Container {...statsContainerStyles}>
                    <P {...statsStyles}>
                      <FormattedNumber value={totalChapters} />
                    </P>
                    <P>
                      <Link route={'chapters'}>
                        <a>chapters</a>
                      </Link>
                    </P>
                  </Container>
                  <Container {...statsContainerStyles}>
                    <P {...statsStyles}>
                      <Currency
                        value={totalAnnualBudget}
                        abbreviate
                        currency="USD"
                      />
                    </P>
                    <P>raised</P>
                  </Container>
                </Container>
              )}
            </Container>

            <Container mt={5} px={3}>
              <H3 textAlign="center" fontSize={[28, null, 48]} pb={4}>
                Spread the word!
              </H3>

              <Container maxWidth={600} mx="auto">
                <P
                  textAlign="center"
                  fontSize={[14, null, 16]}
                  color="#494D52"
                  mb={4}
                >
                  Do you know people or organizations that will benefit from an
                  open structure and a transparent operation? Let them know that
                  Open Collective exists!
                </P>
              </Container>

              <Flex
                flexDirection={['column', null, 'row']}
                justifyContent="center"
              >
                <StyledLink
                  {...socialButtonStyles}
                  href="https://twitter.com/intent/tweet?text=Check%20out%20Open%20Collection%2C%20a%20platform%20for%20organizations%2C%20communities%2C%20and%20projects%20to%20operate%20transparently!&url=https%3A%2F%2Fopencollective.com"
                >
                  <Container
                    display="flex"
                    alignItems="center"
                    justifyContent="space-evenly"
                  >
                    <TwitterIcon size={18} fill="#3385FF" />
                    <Span>Share on Twitter</Span>
                  </Container>
                </StyledLink>

                <StyledLink
                  {...socialButtonStyles}
                  href="https://www.facebook.com/sharer/sharer.php?u=https%3A//opencollective.com"
                >
                  <Container
                    display="flex"
                    alignItems="center"
                    justifyContent="space-evenly"
                  >
                    <FacebookIcon size={18} fill="#3385FF" />
                    <Span>Share on Facebook</Span>
                  </Container>
                </StyledLink>

                <StyledLink
                  {...socialButtonStyles}
                  href="https://www.linkedin.com/shareArticle?mini=true&url=https%3A//opencollective.com&title=Check%20out%20Open%20Collective&summary=Open%20Collection%20is%20a%20platform%20for%20organizations,%20communities,%20and%20projects%20to%20operate%20transparently&source="
                >
                  <Container
                    display="flex"
                    alignItems="center"
                    justifyContent="space-evenly"
                  >
                    <LinkedInIcon size={18} fill="#3385FF" />
                    <Span>Share on LinkedIn</Span>
                  </Container>
                </StyledLink>
              </Flex>
            </Container>
          </Container>

          <Container
            background="linear-gradient(182.45deg, #222584 4.38%, #6266EC 118.14%)"
            position="relative"
            py={6}
          >
            <Container
              background="#EBF1FA"
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
                <P color="rgba(255, 255, 255, 0.5)" fontSize="1.6rem" mb={4}>
                  Introducing
                </P>

                <Box mb={3}>
                  <img src="/static/images/backyourstack.svg" alt="Back Your Stack" />
                </Box>

                <H4 color="white" fontSize="2.4rem" mb={4}>
                  Discover the Open Source projects your organization is using
                  that need financial support.
                </H4>

                <P color="white" fontSize="1.6rem">
                  BackYourStack is a community project initiated by Open
                  Collective.
                  <StyledLink
                    href="https://backyourstack.com/contributing"
                    color="white"
                    px={2}
                    textDecoration="underline"
                  >
                    Learn how to contribute here.
                  </StyledLink>
                </P>

                <StyledLink
                  href="https://backyourstack.com/"
                  bg="#FFF"
                  borderRadius="50px"
                  color="#3C40AE"
                  display="block"
                  fontSize="1.6rem"
                  fontWeight="bold"
                  maxWidth="220px"
                  mx={['auto', null, 0]}
                  mt={4}
                  py={3}
                  textAlign="center"
                  width={[250, null, 320]}
                >
                  Go to Back Your Stack
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
        }
        collective {
          name
          slug
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
    topSpenders: allCollectives(
      type: COLLECTIVE
      limit: 4
      orderBy: monthlySpending
      orderDirection: DESC
      offset: 0
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
    sponsors: allCollectives(
      type: ORGANIZATION
      limit: 6
      orderBy: monthlySpending
      orderDirection: DESC
      offset: 0
    ) {
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
    backers: allCollectives(
      type: USER
      limit: 30
      orderBy: monthlySpending
      orderDirection: DESC
      offset: 0
    ) {
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

export default withData(withLoggedInUser(addHomeData(withIntl(HomePage))));
