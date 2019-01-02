import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { get, pick } from 'lodash';
import { Box, Flex } from '@rebass/grid';

import { Router } from '../server/pages';

import { H2, P } from '../components/Text';
import Logo from '../components/Logo';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import Link from '../components/Link';
import SignIn from '../components/SignIn';
import CreateProfile from '../components/CreateProfile';
import ContributeAs from '../components/ContributeAs';
import StyledInputField from '../components/StyledInputField';
import StyledButton from '../components/StyledButton';

import { addCreateOrderMutation, createUserQuery } from '../graphql/mutations';

import * as api from '../lib/api';
import withIntl from '../lib/withIntl';
import { withUser } from '../components/UserProvider';
import ContributePayment from '../components/ContributePayment';
import Loading from '../components/Loading';

class CreateOrderPage extends React.Component {
  static getInitialProps({
    query: {
      collectiveSlug,
      eventSlug,
      TierId,
      amount,
      quantity,
      totalAmount,
      interval,
      description,
      verb,
      redeem,
      redirect,
    },
  }) {
    return {
      slug: eventSlug || collectiveSlug,
      TierId,
      quantity,
      totalAmount: totalAmount || amount * 100,
      interval,
      description,
      verb,
      redeem,
      redirect,
    };
  }

  static propTypes = {
    slug: PropTypes.string, // for addData
    TierId: PropTypes.string,
    quantity: PropTypes.number,
    totalAmount: PropTypes.number,
    interval: PropTypes.string,
    description: PropTypes.string,
    verb: PropTypes.string,
    redirect: PropTypes.string,
    redeem: PropTypes.bool,
    createOrder: PropTypes.func.isRequired, // from addCreateOrderMutation
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object.isRequired, // from withIntl
  };

  constructor(props) {
    super(props);
    this.createProfile = this.createProfile.bind(this);
    const interval = (props.interval || '').toLowerCase().replace(/ly$/, '');
    this.order = {
      quantity: parseInt(props.quantity, 10) || 1,
      interval: ['month', 'year'].indexOf(interval) !== -1 ? interval : null,
      totalAmount: parseInt(props.totalAmount, 10) || null,
    };
    this.state = {
      loading: false,
      submitting: false,
      result: {},
      step: props.LoggedInUser ? 'showOrder' : 'signin',
    };
  }

  componentDidUpdate(prevProps) {
    // Signin redirect
    if (!prevProps.LoggedInUser && this.props.LoggedInUser) {
      this.setState({ step: 'showOrder' });
    } else if (prevProps.LoggedInUser && !this.props.LoggedInUser) {
      this.setState({ step: 'signin' });
    }
  }

  createProfile = data => {
    if (this.state.submitting) {
      return false;
    }

    const redirect = window.location.pathname;
    const user = pick(data, ['email', 'firstName', 'lastName']);
    const organizationData = pick(data, ['orgName', 'githubHandle', 'twitterHandle', 'website']);
    const organization = Object.keys(organizationData).length > 0 ? organizationData : null;
    if (organization) {
      organization.name = organization.orgName;
      delete organization.orgName;
    }

    this.setState({ submitting: true });
    this.props
      .createUser({ user, organization, redirect })
      .then(() => {
        Router.pushRoute('signinLinkSent', { email: user.email });
      })
      .catch(error => {
        this.setState({ result: { error: error.message }, submitting: false });
      });
  };

  /** Returns an array like [personnalProfile, otherProfiles] */
  getProfiles() {
    const { LoggedInUser } = this.props;
    return !LoggedInUser
      ? [{}, {}]
      : [
          { email: LoggedInUser.email, image: LoggedInUser.iamge, ...LoggedInUser.collective },
          LoggedInUser.memberOf
            .filter(m => m.role === 'ADMIN')
            .reduce((data, { collective }) => ({ ...data, [collective.id]: collective }), {}),
        ];
  }

  getContributorTypeName() {
    switch (this.props.verb) {
      case 'pay':
        return <FormattedMessage id="member.title" defaultMessage="member" />;
      default:
        return <FormattedMessage id="backer.title" defaultMessage="backer" />;
    }
  }

  renderContent() {
    const { step } = this.state;
    const [personal, profiles] = this.getProfiles();

    return (
      <Box id="content" mb={5}>
        {step === 'showOrder' && (
          <Flex alignItems="center" flexDirection="column">
            <Box>
              <StyledInputField htmlFor="contributeAs" label="Contribute as:">
                {fieldProps => (
                  <ContributeAs {...fieldProps} onChange={console.log} profiles={profiles} personal={personal} />
                )}
              </StyledInputField>
            </Box>
            <Box mt={5}>
              <StyledButton buttonStyle="primary" buttonSize="large" fontWeight="bold">
                Next step &rarr;
              </StyledButton>
            </Box>
          </Flex>
        )}
        {step === 'signin' && (
          <Flex justifyContent="center">
            <SignIn
              onSubmit={email =>
                api.signin({ email }, Router.asPath).then(() => Router.pushRoute('signinLinkSent', { email }))
              }
              onSecondaryAction={() => this.setState({ step: 'signup' })}
            />
          </Flex>
        )}
        {step === 'signup' && (
          <Flex justifyContent="center">
            <CreateProfile
              onPersonalSubmit={this.createProfile}
              onOrgSubmit={this.createProfile}
              onSecondaryAction={() => this.setState({ step: 'signin' })}
              submitting={this.state.submitting}
            />
          </Flex>
        )}
        {step === 'choose-payment' && (
          <Flex justifyContent="center">
            <ContributePayment
              onChange={console.log}
              paymentMethods={[
                {
                  id: 8771,
                  uuid: 'ce4e0885-ebb4-4e1b-b644-4fa009370300',
                  name: '4444',
                  data: {
                    expMonth: 2,
                    expYear: 2022,
                    brand: 'MasterCard',
                    country: 'US',
                  },
                  monthlyLimitPerMember: null,
                  service: 'stripe',
                  type: 'creditcard',
                  balance: 10000000,
                  currency: 'USD',
                  expiryDate: 'Sun Mar 03 2019 13:10:53 GMT+0100 (Central European Standard Time)',
                },
                {
                  id: 8783,
                  uuid: '493eb5de-905f-4f9a-a11e-668bd19d8750',
                  name: '$100 Gift Card from New Collective',
                  data: null,
                  monthlyLimitPerMember: null,
                  service: 'opencollective',
                  type: 'virtualcard',
                  balance: 2300,
                  currency: 'USD',
                  expiryDate: 'Sun Mar 03 2019 13:10:53 GMT+0100 (Central European Standard Time)',
                },
              ]}
            />
          </Flex>
        )}
        <div className="row result">
          <div className="col-sm-2" />
          <div className="col-sm-10">
            <div className="success">{this.state.result.success}</div>
            {this.state.result.error && <div className="error">{this.state.result.error}</div>}
          </div>
        </div>
      </Box>
    );
  }

  render() {
    const { data, loadingLoggedInUser } = this.props;

    if (!data.Collective) {
      return <ErrorPage data={data} />;
    }

    const collective = data.Collective;
    const logo = collective.image || get(collective.parentCollective, 'image');
    const tierName = this.getContributorTypeName();

    return (
      <Page
        title={`Contribute - ${collective.name}`}
        description={collective.description}
        twitterHandle={collective.twitterHandle}
        image={collective.image || collective.backgroundImage}
      >
        <Flex alignItems="center" flexDirection="column" mx="auto" width={300} pt={4} mb={4}>
          <Link route="collective" params={{ slug: collective.slug }} className="goBack">
            <Logo
              src={logo}
              className="logo"
              type={collective.type}
              website={collective.website}
              height="10rem"
              key={logo}
            />
          </Link>

          <Link route="collective" params={{ slug: collective.slug }} className="goBack">
            <H2 as="h1" color="black.900">
              {collective.name}
            </H2>
          </Link>

          <P fontSize="LeadParagraph" fontWeight="LeadParagraph" color="black.600" mt={3}>
            <FormattedMessage
              id="contribute.contributorType"
              defaultMessage="Become a {name}"
              values={{ name: tierName }}
            />
          </P>
        </Flex>

        {loadingLoggedInUser ? <Loading mb={4} /> : this.renderContent()}
      </Page>
    );
  }
}

const addData = graphql(gql`
  query Collective($slug: String) {
    Collective(slug: $slug) {
      id
      slug
      path
      name
      type
      tags
      description
      twitterHandle
      image
      isActive
      host {
        id
        name
        slug
        image
        settings
      }
      location {
        name
      }
      startsAt
      endsAt
      timezone
      parentCollective {
        id
        slug
        name
        image
        backgroundImage
      }
      stats {
        id
        yearlyBudget
        balance
        backers {
          all
        }
      }
      members(role: "ADMIN") {
        id
        role
        createdAt
        description
        member {
          id
          description
          name
          slug
          type
          image
        }
      }
      backgroundImage
      settings
      currency
      tiers {
        id
        type
        name
        slug
        description
        amount
        currency
        interval
        presets
        maxQuantity
        stats {
          id
          availableQuantity
        }
      }
    }
  }
`);

const addCreateUserMutation = graphql(createUserQuery, {
  props: ({ mutate }) => ({
    createUser: variables => mutate({ variables }),
  }),
});

const addGraphQL = compose(
  addData,
  addCreateOrderMutation,
  addCreateUserMutation,
);

export default withIntl(addGraphQL(withUser(CreateOrderPage)));
