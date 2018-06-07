import React, { Fragment } from 'react';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';

import withData from '../lib/withData'
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';
import { transactionFields } from '../graphql/queries';

import Body from '../components/Body';
import Button from '../components/Button';
import Footer from '../components/Footer';
import Header from '../components/Header';
import TransactionSimple from '../components/TransactionSimple';
import { Link } from '../server/pages';
import { P, H1 } from '../components/Text';
import ListItem from '../components/ListItem';
import Hide from '../components/Hide';
import Container from '../components/Container';
import StyledLink from '../components/StyledLink';

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
            display="flex"
            justifyContent="space-between"
            px={3}
            py="5rem"
          >
            <Container w={[1, null, 0.5]} pr={[null, null, 4]} maxWidth={450}>
              <H1 fontWeight="normal" textAlign="left">A new form of association, <br /> <strong>transparent by design.</strong></H1>

              <P my={3} color="#6E747A">
                It's time to break the mold. 21st century citizens need organizations where all members share the mission;
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
                  py={3}
                  textAlign="center"
                  w={1}
                >
                  Join the movement
                </StyledLink>
                <Link href="/learn-more">
                  <StyledLink mt={[3, null, 0]} ml={[null, null, 3]}>How it works ></StyledLink>
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
  }
`;

const addHomeData = graphql(query)

export { HomePage as MockHomePage };
export default withData(withLoggedInUser(addHomeData(withIntl(HomePage))));
