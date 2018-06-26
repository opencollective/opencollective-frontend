import React, { Fragment } from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { take, uniqBy } from 'lodash';

import { Box, Flex } from 'grid-styled';

import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

import Body from '../components/Body';
import Footer from '../components/Footer';
import Header from '../components/Header';
import TransactionSimple from '../components/TransactionSimple';
import { Link } from '../server/pages';
import { Span, P, H1, H2, H3 } from '../components/Text';
import ListItem from '../components/ListItem';
import Hide from '../components/Hide';
import Container from '../components/Container';
import StyledLink from '../components/StyledLink';
import CollectiveStatsCard from '../components/CollectiveStatsCard';
import SponsorCard from '../components/SponsorCard';

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

const BackerAvatar = ({
  slug,
  image,
  stats: {
    totalAmountSent,
  },
}) => (
  <Link route={`/${slug}`}><a>
    <Container
      backgroundImage={image}
      backgroundSize="cover"
      backgroundPosition="center center"
      backgroundRepeat="no-repeat"
      borderRadius="50%"
      size={Math.floor((totalAmountSent / 100) * Math.random())}
      maxHeight={120}
      maxWidth={120}
      minHeight={50}
      minWidth={50}
    />
  </a></Link>
);

class HomePage extends React.Component {
  state = {
    LoggedInUser: {},
  }

  async componentDidMount() {
    const LoggedInUser = this.props.getLoggedInUser && await this.props.getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  render() {
    const {
      activeSpending: {
        expenses,
      },
      backers: {
        collectives: backers,
      },
      recent: {
        collectives,
      },
      sponsors: {
        collectives: sponsors,
      },
      transactions: {
        transactions,
      },
      loading,
    } = this.props.data
    const {
      LoggedInUser,
    } = this.state;

    if (loading) {
      return <p>loading...</p>;
    }

    const activeCollectives = take(uniqBy(expenses.map(({ collective }) => collective), 'slug'), 4);

    return (
      <Fragment>
        <Header
          title="Home"
          LoggedInUser={LoggedInUser}
        />
        <Body>
          <Container
            alignItems="center"
            backgroundImage="/static/images/hero-bg.svg"
            backgroundPosition="center top"
            backgroundSize="cover"
            backgroundRepeat="no-repeat"
            boxShadown="inset 0px -60px 100px 0 rgba(78,121,187,0.1), 0px 40px 80px 0 rgba(78, 121,187, 0.12)"
            px={3}
            py="5rem"
          >
            <Container maxWidth={1200} display="flex" justifyContent="space-between" mx="auto">
              <Container w={[1, null, 0.5]} pr={[null, null, 4]} maxWidth={450}>
                <H1 fontWeight="normal" textAlign="left">A new form of association, <br /> <strong>transparent by design.</strong></H1>

                <P my={3} color="#6E747A">
                  It&apos;s time to break the mold. 21st century citizens need organizations where all members share the mission;
                   where anybody can contribute; where leaders can change; and where money works in full transparency.
                  Open Collective provides the digitals tools you need to take your group a step closer in that direction.
                </P>

                <P fontWeight="bold" fontSize="2rem">The movement has begun. Are you ready?</P>

                <Flex alignItems="center" flexDirection={['column', null, 'row']} my={4}>
                  <StyledLink
                    href="#movement"
                    bg="#3385FF"
                    borderRadius="50px"
                    color="white"
                    fontSize="1.6rem"
                    fontWeight="bold"
                    maxWidth="220px"
                    hover={{ color: 'white' }}
                    py={3} textAlign="center"
                    w={1}
                  >
                    Join the movement
                  </StyledLink>
                  <Link href="/learn-more">
                    <StyledLink mt={[3, null, 0]} ml={[null, null, 3]}>How it works &gt;</StyledLink>
                  </Link>
                </Flex>
              </Container>

              <Hide xs sm w={0.5}>
                <P textAlign="center" color="#C2C6CC" textTransform="uppercase" fontSize="1.2rem" letterSpacing="0.8px" mb={3}>Latest Transactions</P>
                <Container maxHeight="50rem" overflow="scroll">
                  <Box is="ul" p={0}>
                    {transactions.map((transaction) => (
                      <ListItem key={transaction.id} mb={1}>
                        <Container bg="white" border="1px solid rgba(0, 0, 0, 0.1)" borderRadius="8px" boxShadow="0 2px 4px 0 rgba(46,48,51,0.08);" p={3}>
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
            <H2 textAlign={["center", null, "left"]} pb={3} >Active Collectives</H2>

            <Container py={3}>
              <Flex mb={3} justifyContent="space-between" px={[1, null, 0]}>
                <H3>Most active spending</H3>
                <StyledLink href="/discover">See all &gt;</StyledLink>
              </Flex>
              <Container display="flex" flexWrap="wrap" justifyContent="space-between">
                {activeCollectives.map((c) => <Container w={[0.5, null, 0.25]} mb={2} px={1} maxWidth={224} key={c.id}><CollectiveStatsCard {...c} /></Container>)} 
              </Container>
            </Container>

            <Container py={3}>
              <Flex mb={3} justifyContent="space-between" px={[1, null, 0]}>
                <H3>Recently created</H3>
                <StyledLink href="/discover">See all &gt;</StyledLink>
              </Flex>
              <Container display="flex" flexWrap="wrap" justifyContent="space-between">
                {collectives.map((c) => <Container w={[0.5, null, 0.25]} mb={2} px={1} maxWidth={224}><CollectiveStatsCard {...c} /></Container>)} 
              </Container>
            </Container>

            <StyledLink
              href="/discover"
              bg="white"
              border="1px solid #D5DAE0"
              borderRadius="50px"
              color="#3385FF"
              display="block"
              fontSize={["1.4rem", null, "1.6rem"]}
              fontWeight="bold"
              hover={{ color: '#3385FF' }}
              mx="auto"
              py={[2, null, 3]}
              textAlign="center"
              w={[250, null, 320]}
            >
              Discover more collectives
            </StyledLink>
          </Container>

          <Container bg="#EBF1FA" py={3} my={5}>
            <Container maxWidth={800} mx="auto">
              <H2 textAlign="center" fontWeight="900" px={2} lineHeight={['36px', null, '58px']} fontSize={[null, null, 56]}>
                Join the movement for a world with more open, transparent, and fluid organizations.
              </H2>
              <P color="#6E747A" textAlign="center" fontSize={[16, null, 20]} lineHeight={['24px', null, '28px']} px={3} my={[3, null, 4]}>
                There are many ways to participate; from fiscally hosting collectives to spreading the word to whomever you believe will benefit from operating as an open association. Here’s how:
              </P>
            </Container>

            <Container bg={['#3385FF', null, 'transparent']} height={2} width={32} mx="auto" my={[5, null, 3]} />

            <Container display="flex" flexDirection={['column', null, 'row']}>
              <Container w={[1, null, 0.5]}>
                <H3 {...sectionHeadingStyles}>Create an open collective</H3>

                <P {...sectionSubHeadingStyles}>
                  A group of people with a shared mission that operates in full transparency. 👀
                </P>

                <P {...sectionDetailStyles}>
                  Want to evolve from the democracy of our voices to the democracy of our actions? Create an open collective for your group and leverage the power of the community to live up to your mission. <a href="/discover">Learn more.</a>
                </P>
              </Container>
              <Container w={[1, null, 0.5]}>
              </Container>
            </Container>

            <Container bg={['#3385FF', null, 'transparent']} height={2} width={32} mx="auto" my={[5]} />

            <Container display="flex" flexDirection={['column', null, 'row']}>
              <Container w={[1, null, 0.5]}>
                <H3 {...sectionHeadingStyles}>Become a sponsor</H3>

                <P {...sectionSubHeadingStyles}>Great companies supporting great collectives with 💙.</P>

                <P {...sectionDetailStyles}>Accelerate collectives on behalf of your organization. <Span fontWeight="bold">You&apos;ll get an invoice for every financial contribution your company makes as well as monthly reporting.</Span></P>

                <P {...sectionDetailStyles} my={3}>If you’re looking to onboard and financially support an initiative through Open Collective, <a href="mailto:info@opencollective.com">let us know</a> and we’ll gladly set them up and get them going.</P>

                <Link route="/organizations/new">
                  <StyledLink
                    bg="#3385FF"
                    borderRadius="50px"
                    color="white"
                    display="block"
                    fontSize="1.6rem"
                    fontWeight="bold"
                    maxWidth="220px"
                    mx="auto"
                    mt={4}
                    mb={4}
                    hover={{ color: 'white' }}
                    py={3}
                    textAlign="center"
                    w={[250, null, 320]}
                  >
                    Become a sponsor
                  </StyledLink>
                </Link>
              </Container>
              <Container w={[1, null, 0.5]} display="flex" flexWrap="wrap" justifySpace="space-between" px={[1, null, 4]}>
                {sponsors.map((c) => <Container w={[0.5, null, 0.33]} mb={2} px={1} maxWidth={224} key={c.id}><SponsorCard {...c} /></Container>)}
              </Container>
            </Container>

            <Container bg={['#3385FF', null, 'transparent']} height={2} width={32} mx="auto" my={[5]} />

            <Container display="flex" flexDirection={['column', null, 'row']}>
              <Container w={[1, null, 0.5]} mb={4}>
                <H3 {...sectionHeadingStyles}>Become a backer</H3>

                <P {...sectionSubHeadingStyles}>Those who believe that giving back in unified financial support is the way to go. 👊</P>

                <P {...sectionDetailStyles}>Join Open Collective and discover the different initiatives that are seeking your support. Embrace the mission that drives them and contribute to their group efforts. <Span fontWeight="bold">Become part of the movement.</Span></P>

                <Link route="/discover">
                  <StyledLink
                    bg="#3385FF"
                    borderRadius="50px"
                    color="white"
                    display="block"
                    fontSize="1.6rem"
                    fontWeight="bold"
                    maxWidth="220px"
                    mx="auto"
                    mt={4}
                    hover={{ color: 'white' }}
                    py={3}
                    textAlign="center"
                    w={[250, null, 320]}
                  >
                    Become a backer
                  </StyledLink>
                </Link>
              </Container>
              <Container w={[1, null, 0.5]} overflow="hidden" position="relative">
                <Container width={["100%", null, "160%"]} display="flex" flexWrap="wrap" justifyContent="center" alignItems="center" position="relative" >
                  {backers.map((c) => <Container px={1} key={c.id}><BackerAvatar {...c} /></Container>)}
                </Container>
                <Hide xs sm position="absolute" top={0} left={0} width="100%" height="100%">
                  <Container background="linear-gradient(to left, #EBF1FA, transparent 50%)" width="100%" height="100%" pointerEvents="none" />
                </Hide>
              </Container>
            </Container>

            <Container bg={['#3385FF', null, 'transparent']} height={2} width={32} mx="auto" my={[5]} />

            <Container display="flex" flexDirection={['column', null, 'row']}>
              <Container w={[1, null, 0.5]}>
                <H3 {...sectionHeadingStyles}>Contribute to OC’s development.</H3>

                <P {...sectionSubHeadingStyles}>Building Open Collective together to get further, faster. 🚀</P>

                <P {...sectionDetailStyles}>Are you interested in helping us improve the platform experience? Are you a developer who believes in the movement? Open Collective is open source so anyone can contribute code or report issues publicly.</P>

                <P {...sectionDetailStyles} my={3}>Special thanks to all of you who already contributed in some way.</P>

                <StyledLink {...sectionDetailStyles} color="#3385FF" display="inline-block" my={4} href="https://github.com/opencollective">
                  Check out our Github organization to find out more
                </StyledLink>
              </Container>
              <Container w={[1, null, 0.5]} textAlign="center" px={2}>
                <img src="/public/images/home-contributors.png" alt="Open Collective Contribution Commits" width="100%" height="auto" />
              </Container>
            </Container>

            <Container bg={['#3385FF', null, 'transparent']} height={2} width={32} mx="auto" my={[5]} />

            <Container display="flex" flexDirection={['column', null, 'row']}>
              <Container w={[1, null, 0.5]}>
                <H3 {...sectionHeadingStyles}>Create an OC Chapter</H3>

                <P {...sectionSubHeadingStyles}>Providing the legal and fiscal entities open collectives need to raise funds. ⚖️</P>

                <P {...sectionDetailStyles}><Span fontWeight="bold">Expand the movement</Span> by becoming a fiscal host for open collectives in your region or for those focusing on topics that matter to you. Help organize initiatives and provide a means for them to recieve financial support from the Open Collective community.</P>

                <Link route="/chapters">
                  <StyledLink
                    bg="#3385FF"
                    borderRadius="50px"
                    color="white"
                    display="block"
                    fontSize="1.6rem"
                    fontWeight="bold"
                    maxWidth="220px"
                    mx="auto"
                    mt={4}
                    hover={{ color: 'white' }}
                    py={3}
                    textAlign="center"
                    w={[250, null, 320]}
                  >
                    Create a chapter
                  </StyledLink>
                </Link>
              </Container>
              <Container w={[1, null, 0.5]}>
              </Container>
            </Container>
          </Container>
        </Body>
        <Footer />
      </Fragment>
    );
  }
}

const query = gql`
  query home {
    transactions {
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
        host {
          name
          slug
        }
        ... on Order {
          subscription {
            interval
          }
        }
      }
    }
    recent: allCollectives(type: COLLECTIVE, orderBy: createdAt, orderDirection: DESC, limit: 4) {
      collectives {
        id
        type
        slug
        name
        image
        backgroundImage
        description
        settings
        stats {
          id
          balance
          yearlyBudget
          backers {
            users
            organizations
          }
        }
      }
    }
    activeSpending: expenses(status: PAID, orderBy: { field: updatedAt }) {
      expenses {
        collective {
          id
          type
          slug
          name
          image
          backgroundImage
          description
          settings
          stats {
            id
            balance
            yearlyBudget
            backers {
              users
              organizations
            }
          }
        }
      }
    }
    sponsors: allCollectives(type: ORGANIZATION, limit: 6, orderBy: amountSent, orderDirection: DESC, offset: 0) {
      collectives {
        id
        currency
        type
        slug
        name
        image
        stats {
          totalAmountSent
        }
      }
    }
    backers: allCollectives(type: USER, limit: 20, orderBy: amountSent, orderDirection: DESC, offset: 0) {
      collectives {
        id
        currency
        type
        slug
        name
        image
        stats {
          totalAmountSent
        }
      }
    }
  }
`;

const addHomeData = graphql(query)

export { HomePage as MockHomePage };
export default withData(withLoggedInUser(addHomeData(withIntl(HomePage))));
