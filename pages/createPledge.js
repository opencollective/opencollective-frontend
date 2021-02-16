import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import themeGet from '@styled-system/theme-get';
import { get } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { suggestSlug } from '../lib/collective.lib';
import { defaultImage } from '../lib/constants/collectives';
import { getErrorFromGraphqlException } from '../lib/errors';
import { legacyCollectiveQuery } from '../lib/graphql/queries';
import { imagePreview } from '../lib/image-utils';
import { compose } from '../lib/utils';

import Avatar from '../components/Avatar';
import Body from '../components/Body';
import Container from '../components/Container';
import Currency from '../components/Currency';
import Footer from '../components/Footer';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import I18nFormatters from '../components/I18nFormatters';
import Link from '../components/Link';
import Loading from '../components/Loading';
import Page from '../components/Page';
import { pledgedCollectivePageQuery } from '../components/PledgedCollectivePage';
import StyledButtonSet from '../components/StyledButtonSet';
import StyledInput, { SubmitInput, TextInput } from '../components/StyledInput';
import StyledInputAmount from '../components/StyledInputAmount';
import StyledInputField from '../components/StyledInputField';
import StyledInputGroup from '../components/StyledInputGroup';
import StyledLink from '../components/StyledLink';
import { H3, H4, H5, P } from '../components/Text';
import { withUser } from '../components/UserProvider';

const defaultPledgedLogo = '/static/images/default-pledged-logo.svg';

const labelStyles = {
  color: 'black.600',
  fontWeight: 400,
  as: 'label',
  mb: 1,
};

const Details = styled.details`
  &[open] {
    font-size: 14px;
    margin-bottom: ${themeGet('space.4')}px;

    summary::after {
      content: '-';
    }
  }

  summary {
    color: ${themeGet('colors.black.900')};
    font-size: 16px;
    font-weight: 500;
    margin-bottom: ${themeGet('space.3')}px;
  }

  summary::after {
    content: '+';
    display: inline-block;
    padding-left: ${themeGet('space.2')}px;
  }
`;

const WordCountTextarea = () => {
  const [wordCount, setWordCount] = useState(140);
  return (
    <Flex flexDirection="column">
      <Flex justifyContent="space-between">
        <P {...labelStyles} htmlFor="publicMessage">
          <FormattedMessage id="createPledge.message" defaultMessage="A message for the community (optional)" />
        </P>
        <P {...labelStyles} as="p">
          {wordCount}
        </P>
      </Flex>
      <StyledInput
        border="1px solid"
        borderColor="black.300"
        borderRadius="4px"
        fontSize="14px"
        as="textarea"
        id="publicMessage"
        name="publicMessage"
        data-cy="publicMessage"
        placeholder="This will be public and it is also optional"
        onChange={({ target }) => setWordCount(() => 140 - target.value.length)}
        px={2}
        py={1}
        rows={4}
      />
    </Flex>
  );
};

const AMOUNT_OPTIONS = [500, 1000, 1500, 2000, 5000, 10000, 25000];

const AmountField = () => {
  const [amount, setAmount] = useState(2000);
  return (
    <Flex flexDirection="column" mb={3} width={[1, 'auto', 'auto']}>
      <Flex mb={3}>
        <StyledInputField
          label={
            <P {...labelStyles}>
              <FormattedMessage
                id="contribution.amount.currency.label"
                defaultMessage="Amount ({currency})"
                values={{ currency: 'USD' }}
              />
            </P>
          }
          htmlFor="amount"
          css={{ flexGrow: 1 }}
        >
          {fieldProps => (
            <Flex>
              <StyledButtonSet combo items={AMOUNT_OPTIONS} selected={amount} onChange={value => setAmount(value)}>
                {({ item }) => <Currency value={item} currency="USD" />}
              </StyledButtonSet>
              <StyledInputAmount
                {...fieldProps}
                type="number"
                currency="USD"
                min={100}
                value={amount}
                width={1}
                onChange={amount => setAmount(amount)}
                containerProps={{ borderRadius: '0 4px 4px 0', ml: '-1px' }}
                prependProps={{ pl: 2, pr: 0, bg: 'white.full' }}
                px="2px"
                minWidth={75}
                required
              />
            </Flex>
          )}
        </StyledInputField>
      </Flex>
    </Flex>
  );
};

class CreatePledgePage extends React.Component {
  static getInitialProps({ query = {} }) {
    return {
      name: query.name || '',
      githubHandle: query.githubHandle || '',
      slug: query.slug,
    };
  }

  static propTypes = {
    intl: PropTypes.object.isRequired, // from injectIntl
    data: PropTypes.object,
    name: PropTypes.string,
    slug: PropTypes.string,
    githubHandle: PropTypes.string,
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    createPledge: PropTypes.func,
    router: PropTypes.object,
  };

  state = {
    errorMessage: null,
    loadingUserLogin: true,
    LoggedInUser: undefined,
    submitting: false,
  };

  static messages = defineMessages({
    'menu.createPledge': {
      id: 'menu.createPledge',
      defaultMessage: 'Make a Pledge',
    },
    'frequency.monthly': {
      id: 'Frequency.Monthly',
      defaultMessage: 'Monthly',
    },
    'frequency.yearly': {
      id: 'Frequency.Yearly',
      defaultMessage: 'Yearly',
    },
    'frequency.oneTime': {
      id: 'Frequency.OneTime',
      defaultMessage: 'One time',
    },
  });

  async createPledge(event) {
    event.preventDefault();
    const {
      target: {
        elements: { name, slug, amount, fromCollective, githubHandle, publicMessage, interval },
      },
    } = event;
    const { data } = this.props;

    this.setState({ submitting: true });

    const order = {
      collective: {},
      fromCollective: {
        id: Number(fromCollective.value),
      },
      totalAmount: Number(amount.value) * 100,
      publicMessage: publicMessage.value,
    };

    if (interval.value !== 'none') {
      order.interval = interval.value;
    }

    if (data) {
      order.collective.id = data.Collective.id;
    } else {
      order.collective = {
        name: name.value,
        slug: slug.value,
        tags: ['open source', 'pledged'],
        githubHandle: githubHandle.value,
      };
    }

    try {
      const {
        data: { createOrder: result },
      } = await this.props.createPledge(order, this.props.data?.Collective);
      if (result.collective.slug) {
        this.props.router.push(`/${result.collective.slug}`);
      }
    } catch (error) {
      this.setState({
        errorMessage: getErrorFromGraphqlException(error).message,
        submitting: false,
      });
    } finally {
      this.setState({ submitting: false });
    }
  }

  render() {
    const { errorMessage, submitting } = this.state;
    const { data = {}, name, slug, githubHandle, LoggedInUser, loadingLoggedInUser, intl } = this.props;

    if (data.loading) {
      return (
        <Page>
          <Container my={6}>
            <Loading />
          </Container>
        </Page>
      );
    }

    let website;
    if (data.Collective) {
      website = data.Collective.githubHandle
        ? `https://github.com/${data.Collective.githubHandle}`
        : data.Collective.website;
    }

    const profiles =
      LoggedInUser &&
      LoggedInUser.memberOf
        .concat({ ...LoggedInUser, role: 'ADMIN' })
        .filter(({ role }) => ['ADMIN', 'HOST'].includes(role));

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
          title={intl.formatMessage(CreatePledgePage.messages['menu.createPledge'])}
          className={loadingLoggedInUser ? 'loading' : ''}
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
              <H3 as="h1" color="black.900" textAlign="left" mb={4}>
                <FormattedMessage id="menu.createPledge" defaultMessage="Make a Pledge" />
              </H3>

              <P my={3} color="black.500">
                <FormattedMessage
                  id="createPledge.why"
                  defaultMessage="If the cause or collective that you want to support is not yet on Open Collective, you can make a pledge. This will incentivize them to create an open collective for their activities and offer you much more visibility on how your money is spent to advance their cause."
                />
              </P>

              <P my={3} color="black.500">
                <FormattedMessage
                  id="createPledge.onceTheyCreateIt"
                  defaultMessage="Once they create it (and verify that they own the URL you’ll enter in this form), you will receive an email to ask you to fulfill your pledge."
                />
              </P>

              <P my={3} color="black.500">
                <FormattedMessage
                  id="createPledge.conditions"
                  defaultMessage="At the moment, you can only pledge for Open Source projects with a GitHub repository or organization. We request the project to have a least 100 stars on GitHub!"
                />
              </P>

              {loadingLoggedInUser && (
                <P my={3} color="black.500">
                  <FormattedMessage id="createPledge.loadingProfile" defaultMessage="Loading profile..." />
                </P>
              )}

              {!loadingLoggedInUser && !LoggedInUser && (
                <P mt={[5, null, 4]} color="black.700" fontSize="16px" lineHeight="24px" data-cy="signupOrLogin">
                  <FormattedMessage
                    id="createPledge.signinToCreate"
                    defaultMessage="<signin-link>Sign in or join free</signin-link> to create a pledge."
                    values={{
                      'signin-link': msg => (
                        <Link
                          href={{
                            pathname: '/signin',
                            query: { next: slug ? `/${slug}/pledges/new` : '/pledges/new' },
                          }}
                        >
                          {msg}
                        </Link>
                      ),
                    }}
                  />
                </P>
              )}

              {!loadingLoggedInUser && LoggedInUser && (
                <form onSubmit={this.createPledge.bind(this)}>
                  {!slug && (
                    <Box mb={3}>
                      <H5 textAlign="left" mb={4}>
                        <FormattedMessage
                          id="createPledge.collectiveDetails"
                          defaultMessage="Details of the new collective:"
                        />
                      </H5>

                      <Container position="relative">
                        <Container position="absolute" left={-45} top={0}>
                          <img src="/static/icons/first-pledge-badge.svg" alt="first pledge" />
                        </Container>

                        <P fontWeight="bold">
                          <FormattedMessage id="createPledge.first" defaultMessage="You are the first pledger!" />
                        </P>
                      </Container>

                      <P color="black.500" fontSize="12px" mt={2}>
                        <FormattedMessage
                          id="createPledge.priviledge"
                          defaultMessage="You’ve earned the privilege to name and describe this awesome cause. We’ll create a pledged collective page for it so other people can find it and pledge to it too."
                        />
                      </P>

                      <Flex
                        flexDirection={['column', null, 'row']}
                        alignItems={['flex-start', null, 'flex-end']}
                        mt={3}
                        flexWrap="wrap"
                      >
                        <Flex flexDirection="column" mb={3} pr={[0, null, 3]}>
                          <P {...labelStyles} htmlFor="name">
                            <FormattedMessage id="Fields.name" defaultMessage="Name" />
                          </P>
                          <TextInput data-cy="nameInput" name="name" id="name" defaultValue={name} />
                        </Flex>

                        <Flex flexDirection="column" mb={3}>
                          <P {...labelStyles} htmlFor="slug">
                            <FormattedMessage id="Collective.URL" defaultMessage="Collective URL" />
                          </P>
                          <StyledInputGroup
                            prepend="https://opencollective.com/"
                            id="slug"
                            name="slug"
                            defaultValue={suggestSlug(name || '').toLowerCase()}
                            data-cy="slugInput"
                          />
                        </Flex>
                      </Flex>

                      <Flex flexDirection="column" mb={3}>
                        <P {...labelStyles} htmlFor="githubHandle">
                          <FormattedMessage
                            id="createPledge.githubURL"
                            defaultMessage="GitHub URL: repository or organization with at least 100 stars!"
                          />
                        </P>
                        <StyledInputGroup
                          prepend="https://github.com/"
                          id="githubHandle"
                          name="githubHandle"
                          placeholder="e.g. babel/babel"
                          defaultValue={githubHandle || ''}
                          data-cy="githubHandleInput"
                        />
                      </Flex>
                    </Box>
                  )}

                  <Box my={5}>
                    <H5 textAlign="left" mb={3}>
                      <FormattedMessage id="createPledge.pledgeAs" defaultMessage="Pledge as:" />
                    </H5>

                    <Flex flexDirection="column" my={3}>
                      <P {...labelStyles} htmlFor="fromCollective">
                        <FormattedMessage id="createPledge.profile" defaultMessage="Choose a profile" />
                      </P>
                      <select id="fromCollective" name="fromCollective" defaultValue={LoggedInUser.CollectiveId}>
                        {profiles.map(({ collective }) => (
                          <option key={collective.slug + collective.id} value={collective.id}>
                            {collective.name}
                          </option>
                        ))}
                      </select>
                    </Flex>
                  </Box>

                  <Box mb={5}>
                    <H5 textAlign="left" mb={3}>
                      <FormattedMessage id="createPledge.pledgeDetails" defaultMessage="Pledge details:" />
                    </H5>

                    <AmountField LoggedInUser={LoggedInUser} />

                    <Flex flexDirection="column" mb={3} width={200}>
                      <P {...labelStyles} htmlFor="interval">
                        <FormattedMessage id="contribution.interval.label" defaultMessage="Frequency" />
                      </P>
                      <select id="interval" name="interval" defaultValue="monthly">
                        <option key="monthly" value="month">
                          {intl.formatMessage(CreatePledgePage.messages['frequency.monthly'])}
                        </option>
                        <option key="yearly" value="year">
                          {intl.formatMessage(CreatePledgePage.messages['frequency.yearly'])}
                        </option>
                        <option key="none" value="none">
                          {intl.formatMessage(CreatePledgePage.messages['frequency.oneTime'])}
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
                    data-cy="submit"
                  />
                </form>
              )}

              {errorMessage && (
                <P color="red.500" data-cy="errorMessage" mt={3}>
                  <FormattedMessage id="errorMsg" defaultMessage="Error: {error}" values={{ error: errorMessage }} />
                </P>
              )}
            </Container>

            {slug && (
              <Fragment>
                <Container
                  borderBottom={['1px solid', null, 'none']}
                  borderColor="black.300"
                  float={['none', null, 'right']}
                  pb={[4, null, 0]}
                  px={[3, null, 5]}
                  textAlign={['center', null, 'left']}
                  order={[1, null, 2]}
                  width={[1, null, 0.5]}
                >
                  <img src={defaultPledgedLogo} alt="Pledged Collective" />

                  <H3 mt={3} mb={1}>
                    {data.Collective.name}
                  </H3>

                  <StyledLink fontSize="14px" href={website}>
                    {website}
                  </StyledLink>
                </Container>

                <Container float={['none', null, 'right']} px={[3, null, 5]} order={3} mt={5} width={[1, null, 0.5]}>
                  <H5 textAlign="left" fontWeight="normal" mb={2} data-cy="amountPledgedTotal">
                    <Currency
                      fontWeight="bold"
                      value={pledgeStats.total}
                      currency={data.Collective.currency}
                      precision={0}
                    />{' '}
                    {data.Collective.currency} pledged
                  </H5>

                  <P color="black.600">
                    <FormattedMessage
                      id="create.pledge.stats"
                      values={{
                        both: pledgeStats.ORGANIZATION + pledgeStats.COLLECTIVE && pledgeStats.USER ? 1 : 0,
                        orgCount: pledgeStats.ORGANIZATION + pledgeStats.COLLECTIVE,
                        userCount: pledgeStats.USER,
                        totalCount: pledgeStats.ORGANIZATION + pledgeStats.COLLECTIVE + pledgeStats.USER,
                      }}
                      defaultMessage={
                        'by {orgCount, plural, =0 {} one {# sponsor} other {# sponsors}} {both, plural, =0 {} one { and }} {userCount, plural, =0 {} one {# backer } other {# backers }}'
                      }
                    />
                  </P>

                  <Flex flexWrap="wrap" mb={3} mt={4}>
                    {data.Collective.pledges
                      .filter(({ fromCollective }) => fromCollective.type === 'USER')
                      .map(({ fromCollective }) => (
                        <Box key={fromCollective.id} mr={2} mt={2}>
                          <Link href={`/${fromCollective.slug}`}>
                            <Avatar collective={fromCollective} radius={40} />
                          </Link>
                        </Box>
                      ))}
                  </Flex>

                  <Flex flexWrap="wrap">
                    {data.Collective.pledges
                      .filter(
                        ({ fromCollective }) =>
                          fromCollective.type === 'ORGANIZATION' || fromCollective.type === 'COLLECTIVE',
                      )
                      .map(({ fromCollective }) => (
                        <Box key={fromCollective.id} mr={2} mt={2}>
                          <Link href={`/${fromCollective.slug}`}>
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
                          </Link>
                        </Box>
                      ))}
                  </Flex>
                </Container>
              </Fragment>
            )}

            <Container
              clear={!LoggedInUser && slug ? 'both' : 'none'}
              float={['none', null, 'right']}
              mt={5}
              px={[3, null, 5]}
              order={4}
              width={[1, null, 0.5]}
            >
              <H4 fontWeight="medium" mb={3}>
                FAQs
              </H4>

              <Details data-cy="whatIsAPledge">
                <summary>
                  <FormattedMessage id="createPledge.faq.whatSummary" defaultMessage="What is a pledge?" />
                </summary>
                <FormattedMessage
                  id="createPledge.faq.what"
                  defaultMessage="A pledge allows supporters (companies and individuals) to pledge funds towards a collective that hasn’t been created yet. If you can’t find a collective you want to support, pledge to it!"
                />
              </Details>

              <Details data-cy="WHAIP">
                <summary>
                  <FormattedMessage
                    id="createPledge.faq.whatHappensSummary"
                    defaultMessage="What happens after I pledge?"
                  />
                </summary>
                <FormattedMessage
                  id="createPledge.faq.whatHappens"
                  defaultMessage="Once someone makes a pledge to a collective, we automatically create a pledged collective. We don’t spam folks, so please help us reach out to the community via twitter / github or, if you can, via email."
                />
              </Details>

              <Details data-cy="whenDoIPay">
                <summary>
                  <FormattedMessage id="createPledge.faq.paySummary" defaultMessage="When do I pay?" />
                </summary>
                <FormattedMessage
                  id="createPledge.faq.pay"
                  defaultMessage="Once that pledged collective is claimed, we will email you to fulfill your pledge."
                />
              </Details>

              <Details data-cy="howDoIClaimPledge">
                <summary>
                  <FormattedMessage
                    id="createPledge.faq.howToClaimSummary"
                    defaultMessage="How do I claim a pledged collective?"
                  />
                </summary>
                <FormattedMessage
                  id="createPledge.faq.howToClaim"
                  defaultMessage="You’ll need to contact <SupportLink></SupportLink> to prove that you are an admin of this project."
                  values={I18nFormatters}
                />
              </Details>
            </Container>
          </Container>
        </Body>
        <Footer />
      </Fragment>
    );
  }
}

const createPledgePageQuery = gql`
  query CreatePledgePage($slug: String!) {
    Collective(slug: $slug) {
      currency
      id
      name
      website
      githubHandle
      pledges: orders(status: PENDING) {
        id
        totalAmount
        fromCollective {
          id
          imageUrl(height: 128)
          slug
          name
          type
        }
      }
    }
  }
`;

const addCreatePledgePageData = graphql(createPledgePageQuery, {
  skip: props => !props.slug,
});

const createPledgeMutation = gql`
  mutation CreatePledge($order: OrderInputType!) {
    createOrder(order: $order) {
      id
      createdAt
      status
      fromCollective {
        id
        slug
      }
      collective {
        id
        slug
      }
      transactions(type: "CREDIT") {
        id
        uuid
      }
    }
  }
`;

export const addCreatePledgeMutation = graphql(createPledgeMutation, {
  props: ({ mutate }) => ({
    createPledge: async (order, collective) => {
      return await mutate({
        variables: { order },
        refetchQueries: !collective
          ? []
          : [
              { query: legacyCollectiveQuery, variables: { slug: collective.slug } },
              { query: pledgedCollectivePageQuery, variables: { id: collective.id } },
            ],
      });
    },
  }),
});

const addGraphql = compose(addCreatePledgePageData, addCreatePledgeMutation);

export default injectIntl(withUser(addGraphql(withRouter(CreatePledgePage))));
