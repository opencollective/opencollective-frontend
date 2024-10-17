import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { omit, pick } from 'lodash';
import { withRouter } from 'next/router';
import { FormattedMessage, injectIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import { Box, Flex } from '../Grid';
import SignInOrJoinFree from '../SignInOrJoinFree';
import { H1, P } from '../Text';
import { withUser } from '../UserProvider';

import CategoryPicker from './CategoryPicker';
import Form from './Form';

class CreateFund extends Component {
  static propTypes = {
    host: PropTypes.object,
    intl: PropTypes.object,
    LoggedInUser: PropTypes.object, // from withUser
    refetchLoggedInUser: PropTypes.func.isRequired, // from withUser
    router: PropTypes.object.isRequired, // from withRouter
    createFund: PropTypes.func.isRequired, // addCreateFundMutation
  };

  constructor(props) {
    super(props);

    this.state = {
      error: null,
      creating: false,
    };

    this.createFund = this.createFund.bind(this);
  }

  getHost() {
    if (this.props.router.query.category === 'opensource') {
      return {
        slug: 'opensource',
        name: 'Open Source Collective',
        termsUrl:
          'https://docs.google.com/document/u/1/d/e/2PACX-1vQbiyK2Fe0jLdh4vb9BfHY4bJ1LCo4Qvy0jg9P29ZkiC8y_vKJ_1fNgIbV0p6UdvbcT8Ql1gVto8bf9/pub',
      };
    }
    if (this.props.router.query.category === 'europe') {
      return {
        slug: 'europe',
        name: 'Open Collective Europe',
        termsUrl: 'https://docs.opencollective.com/oceurope/getting-started/our-terms-and-conditions',
      };
    }
    if (this.props.router.query.category === 'oce-foundation') {
      return {
        slug: 'oce-foundation',
        name: 'Open Collective Europe Foundation',
        termsUrl: 'https://docs.opencollective.com/oceurope/getting-started/our-terms-and-conditions',
      };
    }
  }

  async createFund(fund) {
    const host = this.getHost();

    // set state to loading
    this.setState({ creating: true });

    // try mutation
    try {
      const res = await this.props.createFund({
        variables: { fund: omit(fund, ['tos', 'hostTos']), host: pick(host, ['slug']) },
      });
      await this.props.refetchLoggedInUser();
      this.props.router
        .push({
          pathname: `/${res.data.createFund.slug}`,
          query: {
            status: 'fundCreated',
          },
        })
        .then(() => window.scrollTo(0, 0));
    } catch (err) {
      const errorMsg = i18nGraphqlException(this.props.intl, err);
      this.setState({ error: errorMsg, creating: false });
    }
  }

  render() {
    const { LoggedInUser, router } = this.props;
    const { creating, error } = this.state;
    const { category } = router.query;

    if (!LoggedInUser) {
      return (
        <Flex flexDirection="column" alignItems="center" mb={5} p={2}>
          <Flex flexDirection="column" p={4} mt={2}>
            <Box mb={3}>
              <H1 fontSize="32px" lineHeight="36px" fontWeight="bold" textAlign="center">
                <FormattedMessage id="collective.create.join" defaultMessage="Join Open Collective" />
              </H1>
            </Box>
            <Box textAlign="center">
              <P fontSize="14px" color="black.600" mb={1}>
                <FormattedMessage
                  id="collective.create.createOrSignIn"
                  defaultMessage="Create an account (or sign in) to start a collective."
                />
              </P>
            </Box>
          </Flex>
          <SignInOrJoinFree />
        </Flex>
      );
    }

    if (!category) {
      return <CategoryPicker />;
    }

    return <Form host={this.getHost()} onSubmit={this.createFund} loading={creating} error={error} />;
  }
}

const createFundMutation = gql`
  mutation CreateFund($fund: FundCreateInput!, $host: AccountReferenceInput) {
    createFund(fund: $fund, host: $host) {
      id
      name
      slug
      tags
      description
    }
  }
`;

const addCreateFundMutation = graphql(createFundMutation, {
  name: 'createFund',
  options: { context: API_V2_CONTEXT },
});

export default withRouter(withUser(addCreateFundMutation(injectIntl(CreateFund))));
