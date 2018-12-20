import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage } from 'react-intl';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { get, pick } from 'lodash';

import { Router } from '../server/pages';

import { Box, Flex } from '@rebass/grid';
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

import { addCreateOrderMutation } from '../graphql/mutations';

import * as api from '../lib/api';
import storage from '../lib/storage';
import withIntl from '../lib/withIntl';
import { withUser } from '../components/UserProvider';
import { isValidUrl, getDomain } from '../lib/utils';

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
      result: {},
      step: props.LoggedInUser ? 'showOrder' : 'signin',
    };

    switch (props.verb) {
      case 'pay':
        this.defaultType = 'PAYMENT';
        break;
      case 'donate':
        this.defaultType = 'DONATION';
        break;
      case 'contribute':
      default:
        this.defaultType = 'CONTRIBUTION';
        break;
    }

    this.messages = defineMessages({
      'ticket.title': { id: 'tier.order.ticket.title', defaultMessage: 'RSVP' },
      'tier.title': {
        id: 'tier.order.backer.title',
        defaultMessage: 'Become a {name}',
      },
      'donation.title': {
        id: 'tier.order.donation.title',
        defaultMessage: 'Contributer',
      },
      'membership.title': {
        id: 'tier.order.membership.title',
        defaultMessage: 'Become a member',
      },
      'service.title': {
        id: 'tier.order.service.title',
        defaultMessage: 'Order',
      },
      'product.title': {
        id: 'tier.order.product.title',
        defaultMessage: 'Order',
      },
      'contribution.title': {
        id: 'tier.name.contribution',
        defaultMessage: 'contribution',
      },
      'payment.title': { id: 'tier.name.payment', defaultMessage: 'payment' },
      'order.success': {
        id: 'tier.order.success',
        defaultMessage: 'Order processed successfully',
      },
      'order.successRedirect': {
        id: 'tier.order.successRedirect',
        defaultMessage: 'Order processed successfully. Redirecting you to {domain}...',
      },
      'order.error': {
        id: 'tier.order.error',
        defaultMessage: "An error occured 😳. The order didn't go through. Please try again in a few.",
      },
      'tier.donation.button': {
        id: 'tier.donation.button',
        defaultMessage: 'donate',
      },
      'tier.donation.description': {
        id: 'tier.donation.description',
        defaultMessage: 'Thank you for your kind donation 🙏',
      },
    });
  }

  async componentDidMount() {
    const { data } = this.props;
    const newState = {};
    if (!data.Tier && data.fetchData) {
      data.fetchData();
    }
    this.referral = storage.get('referral');
    const matchingFund = storage.get('matchingFund');
    if (matchingFund) {
      newState.matchingFund = matchingFund;
    }
    this.setState(newState);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.LoggedInUser && this.props.LoggedInUser) {
      this.setState({ step: 'showOrder' });
    }

    if (prevProps.LoggedInUser && !this.props.LoggedInUser) {
      this.setState({ step: 'signin' });
    }
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (this.state.matchingFund) return;
    const matchingFund = get(newProps, 'data.Collective.settings.matchingFund');
    if (matchingFund) {
      this.setState({ matchingFund });
    }
  }

  createOrder = async order => {
    const { intl, data, redirect } = this.props;

    if (this.referral && this.referral > 0) {
      order.referral = { id: this.referral };
    }
    order.paymentMethod = pick(order.paymentMethod, [
      'uuid',
      'service',
      'type',
      'token',
      'customerId',
      'data',
      'name',
      'currency',
      'save',
    ]);
    if (this.props.LoggedInUser) {
      delete order.user;
    }
    try {
      this.setState({ loading: true });
      const res = await this.props.createOrder(order);
      const orderCreated = res.data.createOrder;
      if (redirect && isValidUrl(redirect)) {
        const domain = getDomain(redirect);
        this.setState({
          loading: false,
          order,
          result: {
            success: intl.formatMessage(this.messages['order.successRedirect'], { domain }),
          },
        });
        const redirectTo = `${redirect}?transactionid=${get(orderCreated, 'transactions[0].id')}&status=${
          orderCreated.status
        }`;
        window.location.href = redirectTo;
      } else {
        await Router.pushRoute('collective', {
          slug: orderCreated.fromCollective.slug,
          status: orderCreated.status,
          CollectiveId: order.collective.id,
          collectiveType: data.Collective.type,
          OrderId: orderCreated.id,
          TierId: get(order, 'tier.id'),
          totalAmount: order.totalAmount,
          paymentMethodType: order.paymentMethod.type,
        });
        this.setState({
          loading: false,
          order,
          result: {
            success: intl.formatMessage(this.messages['order.success']),
          },
        });
        window.scrollTo(0, 0);
      }
    } catch (e) {
      console.error('>>> createOrder error: ', e);
      const error = e
        .toString()
        .replace('GraphQL error: ', '')
        .replace('Error:', '');
      this.setState({
        loading: false,
        result: {
          error: error || intl.formatMessage(this.messages['order.error']),
        },
      });
    }
  };

  render() {
    const { intl, data, LoggedInUser, loadingLoggedInUser } = this.props;
    const { step } = this.state;

    if (!data.Collective) return <ErrorPage data={data} />;

    const description = decodeURIComponent(this.props.description || '');
    const collective = data.Collective;

    const TierId = parseInt(this.props.TierId);
    let tier;
    if (TierId) {
      tier = collective.tiers.find(t => t.id === TierId);
    }

    tier = tier || {
      name: intl.formatMessage(this.messages[`${this.defaultType.toLowerCase()}.title`]),
      presets: !this.order.totalAmount && [1000, 5000, 10000], // we only offer to customize the contribution if it hasn't been specified in the URL
      type: this.defaultType,
      currency: collective.currency,
      interval: this.order.interval,
      button: intl.formatMessage(this.messages['tier.donation.button']),
      description: description || intl.formatMessage(this.messages['tier.donation.description']),
    };

    this.order.tier = tier;
    this.order.description = description;

    const logo = collective.image || get(collective.parentCollective, 'image');
    const tierName = (tier.name && tier.name.replace(/s$/, '')) || 'backer';

    const profiles = LoggedInUser
      ? LoggedInUser.memberOf
          .filter(({ role }) => role === 'ADMIN')
          .reduce((data, { collective }) => {
            return { ...data, [collective.id]: collective };
          }, {})
      : {};

    const personal = LoggedInUser
      ? { email: LoggedInUser.email, image: LoggedInUser.iamge, ...LoggedInUser.collective }
      : {};

    return (
      <Page
        title={`Contribute - ${collective.name}`}
        description={collective.description}
        twitterHandle={collective.twitterHandle}
        image={collective.image || collective.backgroundImage}
      >
        <style jsx>
          {`
            .result {
              margin-bottom: 5rem;
            }
            .success {
              color: green;
            }
            .error {
              color: red;
            }
          `}
        </style>

        <Flex alignItems="center" flexDirection="column" mx="auto" width={300} pt={4}>
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
              id="tier.defaultDescription"
              defaultMessage="Become a {name}"
              values={{
                name: tierName,
              }}
            />
          </P>
        </Flex>

        <div id="content">
          {step === 'showOrder' && (
            <Flex mt={4} alignItems="center" flexDirection="column">
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
          {step === 'signin' && !loadingLoggedInUser && (
            <Flex justifyContent="center" mt={4}>
              <SignIn
                onSubmit={email =>
                  api.signin({ email }, Router.asPath).then(() => Router.pushRoute('signinLinkSent', { email }))
                }
                onSecondaryAction={() => this.setState({ step: 'signup' })}
              />
            </Flex>
          )}
          {step === 'signup' && (
            <Flex justifyContent="center" mt={4}>
              <CreateProfile
                onPersonalSubmit={console.log}
                onOrgSubmit={console.log}
                onSecondaryAction={() => this.setState({ step: 'signin' })}
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
        </div>
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
      members {
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

const addGraphQL = compose(
  addData,
  addCreateOrderMutation,
);

export default withIntl(addGraphQL(withUser(CreateOrderPage)));
