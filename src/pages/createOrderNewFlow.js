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
      step: props.LoggedInUser ? 'contributeAs' : 'signin',
      unknownEmail: false,
      selectedProfile: null,
    };
  }

  componentDidUpdate(prevProps) {
    // Signin redirect
    if (!prevProps.LoggedInUser && this.props.LoggedInUser) {
      this.setState({ step: 'contributeAs' });
    } else if (prevProps.LoggedInUser && !this.props.LoggedInUser) {
      this.setState({ step: 'signin' });
    }
  }

  nextStep = () => {
    this.setState(state => {
      if (state.step === 'contributeAs') return { ...state, step: 'choose-payment' };
      return state;
    });
  };

  signIn = email => {
    if (this.state.submitting) {
      return false;
    }

    this.setState({ submitting: true });
    return api
      .checkUserExistence(email)
      .then(exists => {
        if (exists) {
          return api.signin({ email }, Router.asPath).then(() => {
            Router.pushRoute('signinLinkSent', { email });
          });
        } else {
          this.setState({ unknownEmail: true, submitting: false });
        }
      })
      .catch(e => {
        this.setState({ error: e.message, submitting: false });
      });
  };

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
            .filter(m => m.role === 'ADMIN' && m.collective.id !== this.props.data.Collective.id)
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
    const { LoggedInUser } = this.props;
    const { step, loading, submitting, unknownEmail, selectedProfile } = this.state;
    const [personal, profiles] = this.getProfiles();

    return (
      <Box id="content" mb={5}>
        {step === 'contributeAs' && (
          <Flex alignItems="center" flexDirection="column">
            <Box>
              <StyledInputField htmlFor="contributeAs" label="Contribute as:">
                {fieldProps => (
                  <ContributeAs
                    {...fieldProps}
                    onChange={profile => this.setState({ selectedProfile: profile })}
                    profiles={profiles}
                    personal={personal}
                  />
                )}
              </StyledInputField>
            </Box>
            <Box mt={5}>
              <StyledButton
                disabled={selectedProfile === null}
                buttonStyle="primary"
                buttonSize="large"
                fontWeight="bold"
                onClick={this.nextStep}
              >
                <FormattedMessage id="contribute.nextStep" defaultMessage="Next step" /> &rarr;
              </StyledButton>
            </Box>
          </Flex>
        )}
        {step === 'signin' && (
          <Flex justifyContent="center">
            <SignIn
              onSubmit={this.signIn}
              onSecondaryAction={() => this.setState({ step: 'signup' })}
              loading={loading || submitting}
              unknownEmail={unknownEmail}
            />
          </Flex>
        )}
        {step === 'signup' && (
          <Flex justifyContent="center">
            <CreateProfile
              onPersonalSubmit={this.createProfile}
              onOrgSubmit={this.createProfile}
              onSecondaryAction={() => this.setState({ step: 'signin' })}
              submitting={submitting}
            />
          </Flex>
        )}
        {step === 'choose-payment' && (
          <Flex justifyContent="center">
            <ContributePayment
              onChange={console.log}
              paymentMethods={get(LoggedInUser, 'collective.paymentMethods', [])}
              collective={this.state.selectedProfile}
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
      name
      description
      twitterHandle
      type
      website
      image
      backgroundImage
      currency
      parentCollective {
        image
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
