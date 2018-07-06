import React, { Fragment } from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { take, uniqBy } from 'lodash';

import { Box, Flex } from 'grid-styled';

import { pickAvatar } from '../lib/collective.lib';
import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';
import { imagePreview } from '../lib/utils';

import Body from '../components/Body';
import Footer from '../components/Footer';
import Header from '../components/Header';
import TransactionSimple from '../components/TransactionSimple';
import { Link } from '../server/pages';
import { Span, P, H1, H2, H3, H4 } from '../components/Text';
import ListItem from '../components/ListItem';
import Hide from '../components/Hide';
import Container from '../components/Container';
import StyledLink from '../components/StyledLink';
import CollectiveStatsCard from '../components/CollectiveStatsCard';
import SponsorCard from '../components/SponsorCard';
import {
  FacebookIcon,
  LinkedInIcon,
  TwitterIcon,
} from '../components/icons';
import StyledInput from '../components/StyledInput';

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
  backgroundImage: '/static/images/oc-symbol.svg',
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

const BackerAvatar = ({
  slug,
  image,
  stats: {
    totalAmountSent,
  },
}) => (
  <Link route={`/${slug}`} passHref><a>
    <Container
      backgroundImage={imagePreview(image || pickAvatar())}
      backgroundSize="cover"
      backgroundPosition="center center"
      backgroundRepeat="no-repeat"
      borderRadius="50%"
      size={[Math.floor((totalAmountSent / 7500) * Math.random()), null, Math.floor((totalAmountSent / 5000) * Math.random())]}
      maxHeight={[80, null, 120]}
      maxWidth={[80, null, 120]}
      minHeight={[30, null, 50]}
      minWidth={[30, null, 50]}
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
        total: totalBackers,
      },
      chapters: {
        stats: {
          collectives: {
            memberOf: totalChapters,
          },
        },
      },
      recent: {
        collectives,
        total: totalCollectives,
      },
      sponsors: {
        collectives: sponsors,
        total: totalSponsors,
      },
      transactions: {
        transactions,
      },
      loading,
    } = this.props.data;
    const {
      LoggedInUser,
    } = this.state;

    if (loading) {
      return <p>loading...</p>;
    }

    const activeCollectives = take(uniqBy(expenses.map(({ collective }) => collective), 'slug'), 4);
    const filteredTransactions = transactions.filter(({ type, order, category }) => {
      if (type === 'CREDIT') {
        return !!order;
      }
      return !!category;
    });

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
                  It&apos;s time to break the mold. The Internet generation needs organizations that reflect who we are; where anybody can contribute to a shared mission; where leaders can easily change; and where money flows in full transparency. Open Collective provides the digitals tools your community needs to thrive.
                </P>

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
                  <Link route="/learn-more" passHref>
                    <StyledLink mt={[3, null, 0]} ml={[null, null, 3]}>How it works &gt;</StyledLink>
                  </Link>
                </Flex>
              </Container>

              <Hide xs sm w={0.5}>
                <P textAlign="center" color="#C2C6CC" textTransform="uppercase" fontSize="1.2rem" letterSpacing="0.8px" mb={3}>Latest Transactions</P>
                <Container maxHeight="50rem" overflow="scroll">
                  <Box is="ul" p={0}>
                    {filteredTransactions.map((transaction) => (
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
                <H3>Recently created</H3>
                <StyledLink href="/discover">See all &gt;</StyledLink>
              </Flex>
              <Container display="flex" flexWrap="wrap" justifyContent="space-between">
                {collectives.map((c) => <Container w={[0.5, null, 0.25]} mb={2} px={1} maxWidth={224}><CollectiveStatsCard {...c} /></Container>)} 
              </Container>
            </Container>

            <Container py={3}>
              <Flex mb={3} justifyContent="space-between" px={[1, null, 0]}>
                <H3>Most active</H3>
                <StyledLink href="/discover">See all &gt;</StyledLink>
              </Flex>
              <Container display="flex" flexWrap="wrap" justifyContent="space-between">
                {activeCollectives.map((c) => <Container w={[0.5, null, 0.25]} mb={2} px={1} maxWidth={224} key={c.id}><CollectiveStatsCard {...c} /></Container>)} 
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
              mt={4}
              mx="auto"
              py={[2, null, 3]}
              textAlign="center"
              w={[250, null, 320]}
            >
              Discover more collectives
            </StyledLink>
          </Container>

          <Container bg="#EBF1FA" py={5} mt={5} id="movement">
            <Container maxWidth={800} mx="auto">
              <H2 textAlign="center" fontWeight="900" px={2} lineHeight={['36px', null, '58px']} fontSize={[null, null, 56]}>
                Join the movement for a world with more open, transparent, and sustainable communities.
              </H2>
              <P color="#6E747A" textAlign="center" fontSize={[16, null, 20]} lineHeight={['24px', null, '28px']} px={3} my={[3, null, 4]}>
                There are many ways to participate! Host an open collective, make a financial contribution, attend an event or simply share the love by showing others how they can benefit from operating as an open community. Here’s how:
              </P>
            </Container>

            <Container bg={['#3385FF', null, 'transparent']} height={2} width={32} mx="auto" my={[5, null, 3]} />

            <Container display="flex" flexDirection={['column', null, 'row']} maxWidth={1200} mx="auto">
              <Container w={[1, null, 0.5]}>
                <H3 {...sectionHeadingStyles}>Create an open collective</H3>

                <P {...sectionSubHeadingStyles}>
                  A group of people with a shared mission that operates in full transparency. 👀
                </P>

                <P {...sectionDetailStyles}>
                  Create an open collective for your group and leverage the power of the community to live up to your mission. <a href="/discover">Learn more.</a>
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
                    w={[250, null, 320]}
                  >
                    Create an open collective
                  </StyledLink>
                </Link>
              </Container>
              <Container w={[1, null, 0.5]}>
              </Container>
            </Container>

            <Container bg={['#3385FF', null, 'transparent']} height={2} width={32} mx="auto" my={[5]} />

            <Container display="flex" flexDirection={['column', null, 'row']} maxWidth={1200} mx="auto">
              <Container w={[1, null, 0.5]}>
                <H3 {...sectionHeadingStyles}>Become a sponsor</H3>

                <P {...sectionSubHeadingStyles}>Great companies supporting great collectives with 💙.</P>

                <P {...sectionDetailStyles}>Support collectives on behalf of your organization. <Span fontWeight="bold">You&apos;ll get an invoice for every financial contribution your company makes as well as a monthly report.</Span></P>

                <P {...sectionDetailStyles} my={3}>If you’re looking to onboard and financially support an initiative through Open Collective, <a href="mailto:info@opencollective.com">let us know</a> and we’ll gladly set them up and get them going.</P>

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
                    w={[250, null, 320]}
                  >
                    Become a sponsor
                  </StyledLink>
                </Link>
              </Container>
              <Container w={[1, null, 0.5]} display="flex" flexWrap="wrap" justifyContent="space-between" px={[1, null, 4]}>
                {sponsors.map((c) => <Container w={[0.5, null, 0.33]} mb={2} px={1} maxWidth={224} key={c.id}><SponsorCard {...c} /></Container>)}
              </Container>
            </Container>

            <Container bg={['#3385FF', null, 'transparent']} height={2} width={32} mx="auto" my={[5]} />

            <Container display="flex" flexDirection={['column', null, 'row']} maxWidth={1200} mx="auto">
              <Container w={[1, null, 0.5]} mb={4}>
                <H3 {...sectionHeadingStyles}>Become a backer</H3>

                <P {...sectionSubHeadingStyles}>For those who believe in giving back in financial support giving back and are able to.</P>

                <P {...sectionDetailStyles}>Join Open Collective and discover the different initiatives that are seeking your support. Embrace the mission that drives them and contribute to their group efforts. <Span fontWeight="bold">Become part of the movement.</Span></P>

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
                  w={[250, null, 320]}
                >
                  Become a backer
                </StyledLink>
              </Container>
              <Container w={[1, null, 0.5]} overflow="hidden" position="relative">
                <Container width={["100%", null, "160%"]} display="flex" flexWrap="wrap" justifyContent="center" alignItems="center" position="relative" >
                  {backers.filter(({ image }) => !!image).map((c) => <Container px={1} key={c.id}><BackerAvatar {...c} /></Container>)}
                </Container>
                <Hide xs sm position="absolute" top={0} left={0} width="100%" height="100%" pointerEvents="none">
                  <Container background="linear-gradient(to left, #EBF1FA, rgba(255, 255, 255, 0) 50%)" width="100%" height="100%" />
                </Hide>
              </Container>
            </Container>

            <Container bg={['#3385FF', null, 'transparent']} height={2} width={32} mx="auto" my={[5]} />

            <Container display="flex" flexDirection={['column', null, 'row']} justifyContent="space-between" maxWidth={1200} mx="auto">
              <Container w={[1, null, 0.5]}>
                <H3 {...sectionHeadingStyles}>Contribute to Open Collective’s development.</H3>

                <P {...sectionSubHeadingStyles}>Building Open Collective together to get further, faster. 🚀</P>

                <P {...sectionDetailStyles}>Are you interested in helping us improve the platform experience? Are you a developer who believes in supporting open and welcoming communities? Open Collective is open source so anyone can contribute code or report issues publicly.</P>

                <P {...sectionDetailStyles} my={3}>Special thanks to all of you who already contributed in some way.</P>

                <StyledLink {...sectionDetailStyles} color="#3385FF" display="inline-block" my={4} href="https://github.com/opencollective">
                  Check out our Github organization to find out more
                </StyledLink>
              </Container>
              <Container w={[1, null, 0.5]} textAlign="center" px={2} maxWidth={600}>
                <img src="/static/images/home-contributors.png" alt="Open Collective Contribution Commits" width="100%" height="auto" />
              </Container>
            </Container>

            <Container bg={['#3385FF', null, 'transparent']} height={2} width={32} mx="auto" my={[5]} />

            <Container display="flex" flexDirection={['column', null, 'row']} maxWidth={1200} mx="auto">
              <Container w={[1, null, 0.5]}>
                <H3 {...sectionHeadingStyles}>Create a local Chapter</H3>

                <P {...sectionSubHeadingStyles}>Help provide the legal entities open collectives need to raise funds. ⚖️</P>

                <P {...sectionDetailStyles}><Span fontWeight="bold">Grow the movement</Span> by becoming a fiscal host for open collectives in your city or your ecosystem. Help organize initiatives and provide a means for them to receive financial support from the Open Collective community.</P>

                <Link route="/chapters" passHref>
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

            <Container mt={6}>
              <P textAlign="center" fontSize={[20, null, 28]} mb={2}>Today we are:</P>
              <Container display="flex" flexWrap="wrap" alignItems="center" justifyContent="center">
                <Container {...statsContainerStyles}>
                  <P {...statsStyles}>{totalCollectives}</P>
                  <P>collectives</P>
                </Container>
                <Container {...statsContainerStyles}>
                  <P {...statsStyles}>{totalSponsors}</P>
                  <P>sponsors</P>
                </Container>
                <Container {...statsContainerStyles}>
                  <P {...statsStyles}>{totalBackers}</P>
                  <P>backers</P>
                </Container>
                <Container {...statsContainerStyles}>
                  <P {...statsStyles}>{totalChapters}</P>
                  <P>chapters</P>
                </Container>
              </Container>
            </Container>

            <Container mt={5} px={3}>
              <H3 textAlign="center" fontSize={[28, null, 48]} pb={4}>Spread the word!</H3>

              <Container maxWidth={600} mx="auto">
                <P textAlign="center" fontSize={[14, null, 16]} color="#494D52" mb={4}>Do you know people or organizations that will benefit from an open structure and
a transparent operation? Let them know that Open Collective exists!</P>
              </Container>

              <Flex flexDirection={['column', null, 'row']} justifyContent="center">
                <StyledLink
                  {...socialButtonStyles}
                  href="https://twitter.com/intent/tweet?text=Check%20out%20Open%20Collection%2C%20a%20platform%20for%20organizations%2C%20communities%2C%20and%20projects%20to%20operate%20transparently!&url=https%3A%2F%2Fopencollective.com"
                >
                  <Container display="flex" alignItems="center" justifyContent="space-evenly">
                    <TwitterIcon size={18} fill="#3385FF" />
                    <Span>Share on Twitter</Span>
                  </Container>
                </StyledLink>

                <StyledLink
                  {...socialButtonStyles}
                  href="https://www.facebook.com/sharer/sharer.php?u=https%3A//opencollective.com"
                >
                  <Container display="flex" alignItems="center" justifyContent="space-evenly">
                    <FacebookIcon size={18} fill="#3385FF" />
                    <Span>Share on Facebook</Span>
                  </Container>
                </StyledLink>

                <StyledLink
                  {...socialButtonStyles}
                  href="https://www.linkedin.com/shareArticle?mini=true&url=https%3A//opencollective.com&title=Check%20out%20Open%20Collective&summary=Open%20Collection%20is%20a%20platform%20for%20organizations,%20communities,%20and%20projects%20to%20operate%20transparently&source="
                >
                  <Container display="flex" alignItems="center" justifyContent="space-evenly">
                    <LinkedInIcon size={18} fill="#3385FF" />
                    <Span>Share on LinkedIn</Span>
                  </Container>
                </StyledLink>
              </Flex>
            </Container>
          </Container>

          <Container py={5}>
            <H4 textAlign="center" fontSize={20} mb={4} px={3}>Stay updated about our news and progress.</H4>

            <Flex justifyContent="center">
              <form
                action="https://opencollective.us12.list-manage.com/subscribe/post?u=88fc8f0f3b646152f1cfe447a&amp;id=c44469099e"
                method="post"
                name="mc-embedded-subscribe-form"
                target="_blank"
              >
                <Container
                  border="1px solid rgba(18,19,20,0.12)"
                  borderRadius={50}
                  bg="white"
                  display="flex"
                  justifyContent="space-between"
                  overflow="hidden"
                  width={300}
                >
                  <StyledInput
                    fontSize={14}
                    name="EMAIL"
                    px={3}
                    py={1}
                    placeholder="Your email address"
                    type="email"
                    width={1}
                  />
                  <StyledInput
                    bg="#3385FF"
                    borderRadius={50}
                    color="white"
                    fontSize={12}
                    fontWeight="bold"
                    hover={{ color: 'white' }}
                    px={3}
                    py={2}
                    textAlign="center"
                    name="subscribe"
                    type="submit"
                    value="Subscribe"
                  />
                </Container>
              </form>
            </Flex>
          </Container>
        </Body>
        <Footer />
      </Fragment>
    );
  }
}

const query = gql`
  query home {
    transactions(limit: 50) {
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
    recent: allCollectives(type: COLLECTIVE, orderBy: createdAt, orderDirection: DESC, limit: 4) {
      total
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
      total
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
    backers: allCollectives(type: USER, limit: 30, orderBy: amountSent, orderDirection: DESC, offset: 0) {
      total
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
    chapters: Collective(slug: "chapters") {
      stats {
        collectives {
          memberOf
        }
      }
    }
  }
`;

const addHomeData = graphql(query)

export { HomePage as MockHomePage };
export default withData(withLoggedInUser(addHomeData(withIntl(HomePage))));
