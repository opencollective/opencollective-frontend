import React, { Fragment } from 'react';
import slugify from 'slugify';
import { withState } from 'recompose';
import gql from 'graphql-tag';
import { graphql, compose } from 'react-apollo';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import withData from '../lib/withData';
import withLoggedInUser from '../lib/withLoggedInUser';
import withIntl from '../lib/withIntl';
import { addCreateOrderMutation } from '../graphql/mutations';
import { Link, Router } from '../server/pages';
import { imagePreview } from '../lib/utils';
import { defaultImage } from '../constants/collectives';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import { H1, H2, H3, P, Span } from '../components/Text';
import StyledInput, { SubmitInput, TextInput } from '../components/StyledInput';
import StyledInputGroup from '../components/StyledInputGroup';
import { Box, Flex } from 'grid-styled';
import Container from '../components/Container';
import ButtonGroup from '../components/ButtonGroup';
import StyledLink from '../components/StyledLink';
import Currency from '../components/Currency';

const defaultPledgedLogo = '/static/images/default-pledged-logo.svg';

const labelStyles = {
  color: '#6E747A',
  fontSize: '14px',
  fontWeight: 400,
  is: 'label',
  letterSpacing: '0.5px',
  mb: 1,
};

const Details = styled.details`
  &[open] {
    font-size: 14px;
    margin-bottom: 32px;

    summary::after {
      content: '-';
    }
  }

  summary {
    color: #141414;
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 16px;
  }

  summary::after {
    content: '+';
    display: inline-block;
    padding-left: 1rem;
  }
`;

const WordCountTextarea = withState('wordCount', 'setWordCount', 140)(
  ({ wordCount, setWordCount }) => (
    <Flex flexDirection="column">
      <Flex justifyContent="space-between">
        <P {...labelStyles} htmlFor="publicMessage">
          A message for the community <Span fontWeight="200">- Optional</Span>
        </P>
        <P {...labelStyles} is="p">
          {wordCount}
        </P>
      </Flex>
      <StyledInput
        border="1px solid #D5DAE0"
        borderRadius="4px"
        fontSize="14px"
        is="textarea"
        id="publicMessage"
        name="publicMessage"
        placeholder="This will be public and it is also optional"
        onChange={({ target }) => setWordCount(() => 140 - target.value.length)}
        px={2}
        py={1}
        rows={4}
      />
    </Flex>
  ),
);

const AmountField = withState('amount', 'setAmount', 20)(
  ({ amount, setAmount, LoggedInUser }) => (
    <Flex justifyContent="space-between" alignItems="flex-end" flexWrap="wrap">
      <Flex flexDirection="column" mb={3} width={[1, 'auto', 'auto']}>
        <P {...labelStyles} htmlFor="presetAmount">
          Amount ({LoggedInUser && LoggedInUser.collective.currency})
        </P>
        <ButtonGroup
          onChange={value => setAmount(() => value)}
          value={amount}
          values={[5, 10, 15, 20, 50, 100, 250]}
        />
      </Flex>

      <Flex flexDirection="column" mb={3} width={[1, 'auto', 'auto']}>
        <P {...labelStyles} htmlFor="totalAmount">
          Custom
        </P>
        <TextInput
          id="totalAmount"
          name="totalAmount"
          width={[1, null, 70]}
          onChange={({ target }) => setAmount(() => target.value)}
          value={amount}
        />
      </Flex>
    </Flex>
  ),
);

class CreatePledgePage extends React.Component {
  static getInitialProps({ query = {} }) {
    return {
      name: query.name || '',
      slug: query.slug,
    };
  }

  state = {
    errorMessage: null,
    loadingUserLogin: true,
    LoggedInUser: null,
    submitting: false,
  };

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    try {
      const LoggedInUser = getLoggedInUser && (await getLoggedInUser());
      this.setState({
        loadingUserLogin: false,
        LoggedInUser,
      });
    } catch (error) {
      this.setState({ loadingUserLogin: false });
    }
  }

  async createOrder(event) {
    event.preventDefault();
    const {
      target: {
        elements: {
          name,
          slug,
          totalAmount,
          fromCollective,
          website,
          publicMessage,
        },
      },
    } = event;
    const { data } = this.props;

    this.setState({ submitting: true });

    const order = {
      collective: {},
      fromCollective: {
        id: Number(fromCollective.value),
      },
      totalAmount: Number(totalAmount.value) * 100,
      publicMessage: publicMessage.value,
    };

    if (data) {
      order.collective.id = data.Collective.id;
    } else {
      order.collective = {
        name: name.value,
        slug: slug.value,
        website: website.value,
      };
    }

    try {
      const {
        data: { createOrder: result },
      } = await this.props.createOrder(order);
      if (result.collective.slug) {
        const params = { slug: result.collective.slug };
        if (data.Collective) {
          params.refetch = true;
        }
        Router.pushRoute('collective', params);
      }
    } catch (error) {
      this.setState({
        errorMessage: error.toString(),
      });
    } finally {
      this.setState({ submitting: false });
    }
  }

  render() {
    const {
      errorMessage,
      loadingUserLogin,
      LoggedInUser,
      submitting,
    } = this.state;
    const { data = {}, name, slug } = this.props;

    const profiles =
      LoggedInUser &&
      LoggedInUser.memberOf
        .concat({ ...LoggedInUser, role: 'ADMIN' })
        .filter(({ role }) => ~['ADMIN', 'HOST'].indexOf(role));

    const pledgeStats = get(data, 'Collective.pledges', []).reduce(
      (stats, { fromCollective, totalAmount }) => {
        stats[fromCollective.type]++;
        stats.total += totalAmount;
        return stats;
      },
      {
        USER: 0,
        ORGANIZATION: 0,
        COLLECTIVE: 0,
        total: 0,
      },
    );

    return (
      <Fragment>
        <Header
          title="Make a Pledge"
          className={loadingUserLogin ? 'loading' : ''}
          LoggedInUser={LoggedInUser}
        />
        <Body>
          <Container
            mx="auto"
            py={4}
            display={['flex', null, 'block']}
            flexDirection="column"
            justifyContent="space-around"
            maxWidth="1200px"
            clearfix
          >
            <Container
              float={['none', null, 'left']}
              maxWidth="600px"
              mt={[4, null, 0]}
              order={[2, null, 1]}
              px={3}
              width={[1, null, 0.5]}
            >
              <H1 color="#121314" textAlign="left" mb={4}>
                Make a pledge
              </H1>

              <P fontSize={14} my={3} color="#9399A3">
                If the cause or collective that you want to support is not yet
                on Open Collective, you can make a pledge. This will incentivize
                them to create an open collective for their activities and offer
                you much more visibility on how your money is spent to advance
                their cause.
              </P>

              <P fontSize={14} my={3} color="#9399A3">
                Once they create it (and verify that they own the URL you’ll
                enter in this form), you will receive an email to ask you to
                fulfill your pledge.
              </P>

              <form onSubmit={this.createOrder.bind(this)}>
                {!slug && (
                  <Box mb={3}>
                    <H2 fontSize="20px" mb={4}>
                      Details of the new collective:
                    </H2>

                    <Container position="relative">
                      <Container position="absolute" left={-45} top={0}>
                        <img
                          src="/static/icons/first-pledge-badge.svg"
                          alt="first pledge"
                        />
                      </Container>

                      <P fontWeight="bold">You are the first pledger!</P>
                    </Container>

                    <P color="#9399A3" fontSize={12} mt={2}>
                      You’ve earned the priviledge to name and describe this
                      awesome cause. We’ll create a pledged collective page for
                      it so other people can find it and pledge to it too.
                    </P>

                    <Flex
                      flexDirection={['column', null, 'row']}
                      alignItems={['flex-start', null, 'flex-end']}
                      mt={3}
                      flexWrap="wrap"
                    >
                      <Flex flexDirection="column" mb={3} pr={[0, null, 3]}>
                        <P {...labelStyles} htmlFor="name">
                          Name
                        </P>
                        <TextInput name="name" id="name" defaultValue={name} />
                      </Flex>

                      <Flex flexDirection="column" mb={3}>
                        <P {...labelStyles} htmlFor="slug">
                          Collective URL
                        </P>
                        <StyledInputGroup
                          prepend="https://opencollective.com/"
                          id="slug"
                          name="slug"
                          defaultValue={slugify(name)}
                        />
                      </Flex>
                    </Flex>

                    <Flex flexDirection="column" mb={3}>
                      <P {...labelStyles} htmlFor="website">
                        GitHub URL - More collective types soon!
                      </P>
                      <StyledInputGroup
                        prepend="https://"
                        id="website"
                        name="website"
                        placeholder="i.e. github.com/babel/babel"
                      />
                    </Flex>
                  </Box>
                )}

                <Box my={5}>
                  <H2 fontSize="20px" mb={3}>
                    Pledge as:
                  </H2>

                  {loadingUserLogin && (
                    <P fontSize={14} my={3} color="#9399A3">
                      Loading profile...
                    </P>
                  )}

                  {!loadingUserLogin &&
                    !LoggedInUser && (
                      <P fontSize={14} my={3} color="#9399A3">
                        Sign up or login to create a pledge.
                      </P>
                    )}

                  {LoggedInUser && (
                    <Flex flexDirection="column" my={3}>
                      <P {...labelStyles} htmlFor="fromCollective">
                        Choose a profile
                      </P>
                      <select
                        id="fromCollective"
                        name="fromCollective"
                        defaultValue={LoggedInUser.CollectiveId}
                      >
                        {profiles.map(({ collective }) => (
                          <option key={collective.name} value={collective.id}>
                            {collective.name}
                          </option>
                        ))}
                      </select>
                    </Flex>
                  )}
                </Box>

                <Box mb={5}>
                  <H2 fontSize="20px" mb={3}>
                    Pledge details:
                  </H2>

                  <AmountField LoggedInUser={LoggedInUser} />

                  <Flex flexDirection="column" mb={3} width={200}>
                    <P {...labelStyles} htmlFor="interval">
                      Frequency
                    </P>
                    <select
                      id="interval"
                      name="interval"
                      defaultValue="monthly"
                    >
                      <option key="monthly" value="monthly">
                        Monthly
                      </option>
                      <option key="yearly" value="yearly">
                        Yearly
                      </option>
                      <option key="none" value={null}>
                        One-Time
                      </option>
                    </select>
                  </Flex>

                  <WordCountTextarea />
                </Box>

                <SubmitInput
                  value={submitting ? 'Submitting...' : 'Make Pledge'}
                  mt={4}
                  mx={['auto', null, 0]}
                  display="block"
                  disabled={!LoggedInUser || submitting}
                />
              </form>
              {errorMessage && (
                <P color="red" mt={3}>
                  {errorMessage}
                </P>
              )}
            </Container>

            {slug && (
              <Fragment>
                <Container
                  borderBottom={['1px solid #DCDEE0', null, 'none']}
                  float={['none', null, 'right']}
                  pb={[4, null, 0]}
                  px={[3, null, 5]}
                  textAlign={['center', null, 'left']}
                  order={[1, null, 2]}
                  width={[1, null, 0.5]}
                >
                  <img src={defaultPledgedLogo} alt="Pledged Collective" />

                  <H2 fontSize={28} mt={3} mb={1}>
                    {data.Collective.name}
                  </H2>

                  <StyledLink fontSize={14} href={data.Collective.website}>
                    {data.Collective.website}
                  </StyledLink>
                </Container>

                <Container
                  float={['none', null, 'right']}
                  px={[3, null, 5]}
                  order={3}
                  mt={5}
                  width={[1, null, 0.5]}
                >
                  <H3 fontSize={28} fontWeight="normal" mb={2}>
                    <Currency
                      fontWeight="bold"
                      value={pledgeStats.total}
                      currency={data.Collective.currency}
                      precision={0}
                    />{' '}
                    {data.Collective.currency} pledged
                  </H3>

                  <P color="#6E747A">
                    <FormattedMessage
                      id="pledge.stats"
                      values={{
                        both:
                          pledgeStats.ORGANIZATION + pledgeStats.COLLECTIVE &&
                          pledgeStats.USER
                            ? 1
                            : 0,
                        orgCount:
                          pledgeStats.ORGANIZATION + pledgeStats.COLLECTIVE,
                        userCount: pledgeStats.USER,
                        totalCount:
                          pledgeStats.ORGANIZATION +
                          pledgeStats.COLLECTIVE +
                          pledgeStats.USER,
                      }}
                      defaultMessage={
                        'by {orgCount, plural, =0 {} one {# sponsor} other {# sponsors}} {both, plural, =0 {} one { and }} {userCount, plural, =0 {} one {# backer } other {# backers }}'
                      }
                    />
                  </P>

                  <Flex flexWrap="wrap" mb={3} mt={4}>
                    {data.Collective.pledges
                      .filter(
                        ({ fromCollective }) => fromCollective.type === 'USER',
                      )
                      .map(({ fromCollective }) => (
                        <Box mr={2}>
                          <Link
                            route="collective"
                            params={{ slug: fromCollective.slug }}
                            passHref
                          >
                            <a>
                              <Container
                                backgroundImage={`url(${imagePreview(
                                  fromCollective.image,
                                  defaultImage[fromCollective.type],
                                  {
                                    width: 65,
                                  },
                                )})`}
                                backgroundSize="contain"
                                backgroundRepeat="no-repeat"
                                backgroundPosition="center center"
                                borderRadius={100}
                                height={40}
                                width={40}
                              />
                            </a>
                          </Link>
                        </Box>
                      ))}
                  </Flex>

                  <Flex flexWrap="wrap">
                    {data.Collective.pledges
                      .filter(
                        ({ fromCollective }) =>
                          fromCollective.type === 'ORGANIZATION' ||
                          fromCollective.type === 'COLLECTIVE',
                      )
                      .map(({ fromCollective }) => (
                        <Box mr={2}>
                          <Link
                            route="collective"
                            params={{ slug: fromCollective.slug }}
                            passHref
                          >
                            <a>
                              <Container
                                backgroundImage={`url(${imagePreview(
                                  fromCollective.image,
                                  defaultImage[fromCollective.type],
                                  {
                                    width: 65,
                                  },
                                )})`}
                                backgroundSize="contain"
                                backgroundRepeat="no-repeat"
                                backgroundPosition="center center"
                                borderRadius={8}
                                height={40}
                                width={40}
                              />
                            </a>
                          </Link>
                        </Box>
                      ))}
                  </Flex>
                </Container>
              </Fragment>
            )}

            <Container
              float={['none', null, 'right']}
              mt={5}
              px={[3, null, 5]}
              order={4}
              width={[1, null, 0.5]}
            >
              <H3 fontSize={24} fontWeight="medium" mb={3}>
                FAQs
              </H3>

              <Details>
                <summary>What is a pledge?</summary>A pledge allows supporters
                (companies and individuals) to pledge funds towards a collective
                that hasn’t been created yet. If you can’t collective you want
                to support, pledge to it!
              </Details>

              <Details>
                <summary>What happens after I pledge?</summary>
                Once someone makes a pledge to a collective, we automatically
                create a pledged collective. We don’t spam folks, so please help
                us reach out to the community via twitter / github or, if you
                can, via email.
              </Details>

              <Details>
                <summary>When do I pay?</summary>
                Once that pledged collective is claimed, we will email you to
                fulfill your pledge.
              </Details>

              <Details>
                <summary>How do I claim a pledged collective?</summary>
                You’ll need to authenticate with the github profile that owns /
                admins that project. Just click on the Claim Collective button
                in the pledged collective. We will be rolling out other forms of
                authentication in the future.
              </Details>
            </Container>
          </Container>
        </Body>
        <Footer />
      </Fragment>
    );
  }
}

const addCollectiveData = graphql(
  gql`
    query getCollective($slug: String!) {
      Collective(slug: $slug) {
        currency
        id
        name
        website
        pledges: orders(status: PENDING) {
          totalAmount
          fromCollective {
            image
            slug
            type
          }
        }
      }
    }
  `,
  {
    skip: props => !props.slug,
  },
);

const addGraphQL = compose(
  addCollectiveData,
  addCreateOrderMutation,
);

export { CreatePledgePage as MockCreatePledgePage };
export default withIntl(
  withData(withLoggedInUser(addGraphQL(CreatePledgePage))),
);
