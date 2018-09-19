import React, { Fragment } from 'react';
import slugify from 'slugify';
import { withState } from 'recompose';

import withData from '../lib/withData';
import { addGetLoggedInUserFunction } from '../graphql/queries';
import { addCreateOrderMutation } from '../graphql/mutations';
import { Router } from '../server/pages';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import { H1, H2, P, Span } from '../components/Text';
import StyledInput, { SubmitInput, TextInput } from '../components/StyledInput';
import StyledInputGroup from '../components/StyledInputGroup';
import { Box, Flex } from 'grid-styled';
import Container from '../components/Container';
import ButtonGroup from '../components/ButtonGroup';

const labelStyles = {
  color: '#6E747A',
  fontSize: '14px',
  fontWeight: 400,
  is: 'label',
  letterSpacing: '0.5px',
  mb: 1,
};

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
    };
  }

  state = {
    loadingUserLogin: true,
    LoggedInUser: null,
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
        },
      },
    } = event;
    const order = {
      collective: {
        name: name.value,
        slug: slug.value,
        website: website.value,
      },
      fromCollective: {
        id: Number(fromCollective.value),
      },
      totalAmount: Number(totalAmount.value) * 100,
    };
    try {
      const {
        data: { createOrder: result },
      } = await this.props.createOrder(order);
      if (result.collective.slug) {
        Router.pushRoute(`/${result.collective.slug}`);
      }
    } catch (error) {
      // TODO: handle server error
      console.error(error);
    }
  }

  validate() {}

  render() {
    const { loadingUserLogin, LoggedInUser } = this.state;
    const { name } = this.props;

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
            px={2}
            py={4}
            display="flex"
            flexDirection={['column', null, 'row']}
            justifyContent="space-around"
            maxWidth="1200px"
          >
            <Container width={[1, null, 0.5]} maxWidth="400px">
              <H1
                color="#121314"
                textAlign="left"
                fontWeight="200"
                mb={4}
                lineHeight="48px"
              >
                Make a pledge{' '}
                {name && (
                  <Fragment>
                    to <Span fontWeight="bold">{name}</Span>
                  </Fragment>
                )}
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
            </Container>

            <Container width={[1, null, 0.5]} maxWidth="600px">
              <form onSubmit={this.createOrder.bind(this)}>
                <Box mb={5}>
                  <H2 fontWeight="200" fontSize="20px" mb={3}>
                    Pledge as:
                  </H2>

                  {!loadingUserLogin &&
                    !LoggedInUser && (
                      <P fontSize={14} my={3} color="#9399A3">
                        Sign up or login to submit an expense.
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
                        {LoggedInUser.memberOf
                          .concat({ ...LoggedInUser, role: 'ADMIN' })
                          .filter(
                            ({ role }) => ~['ADMIN', 'HOST'].indexOf(role),
                          )
                          .map(({ collective }) => (
                            <option key={collective.name} value={collective.id}>
                              {collective.name}
                            </option>
                          ))}
                      </select>
                    </Flex>
                  )}
                </Box>

                <Box mb={5}>
                  <H2 fontWeight="200" fontSize="20px" mb={3}>
                    Pledge details:
                  </H2>

                  <AmountField LoggedInUser={LoggedInUser} />

                  <Flex flexDirection="column" mb={3}>
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

                <Box mb={3}>
                  <H2 fontWeight="200" fontSize="20px" mb={3}>
                    Details of the new collective:
                  </H2>

                  <P fontWeight="bold">You are the first pledger!</P>

                  <P color="#9399A3" fontSize={12} mt={2}>
                    You’ve earned the priviledge to name and describe this
                    awesome cause. We’ll create a pledged collective page for it
                    so other people can find it and pledge to it too.
                  </P>

                  <Flex
                    flexDirection={['column', null, 'row']}
                    alignItems={['flex-start', null, 'flex-end']}
                    mt={4}
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
                      GitHub or Meetup URL - More collective types soon!
                    </P>
                    <StyledInputGroup
                      prepend="https://"
                      id="website"
                      name="website"
                      placeholder="i.e. github.com/airbnb or meetup.com/wwc"
                    />
                  </Flex>
                </Box>

                <SubmitInput
                  value="Make Pledge"
                  mt={4}
                  mx={['auto', null, 0]}
                  display="block"
                />
              </form>
            </Container>
          </Container>
        </Body>
        <Footer />
      </Fragment>
    );
  }
}

export { CreatePledgePage as MockCreatePledgePage };
export default withData(
  addGetLoggedInUserFunction(addCreateOrderMutation(CreatePledgePage)),
);
