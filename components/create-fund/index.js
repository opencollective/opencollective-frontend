import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { Router } from '../../server/pages';

import { Box, Flex } from '../Grid';
import SignInOrJoinFree from '../SignInOrJoinFree';
import { H1, P } from '../Text';
import { withUser } from '../UserProvider';

import CategoryPicker from './CategoryPicker';
import Form from './Form';

const defaultSettings = {
  fund: true,
  features: { conversations: false },
  collectivePage: { sections: ['budget', 'about'] },
};

class CreateFund extends Component {
  static propTypes = {
    host: PropTypes.object,
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
    if (this.props.router.query.category === 'foundation') {
      return {
        slug: 'foundation',
        termsUrl:
          'https://docs.google.com/document/u/2/d/e/2PACX-1vQ_fs7IOojAHaMBKYtaJetlTXJZLnJ7flIWkwxUSQtTkWUMtwFYC2ssb-ooBnT-Ldl6wbVhNQiCkSms/pub',
      };
    }
  }

  async createFund(collective) {
    const host = this.getHost();

    // set state to loading
    this.setState({ creating: true });

    // Settings
    collective.settings = defaultSettings;

    delete collective.tos;
    delete collective.hostTos;
    delete host.termsUrl;

    // try mutation
    try {
      const res = await this.props.createFund({ variables: { collective, host } });
      const newCollective = res.data.createCollective;
      await this.props.refetchLoggedInUser();
      Router.pushRoute('collective', {
        slug: newCollective.slug,
        status: 'fundCreated',
      }).then(() => window.scrollTo(0, 0));
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({ error: errorMsg, creating: false });
    }
  }

  render() {
    const { LoggedInUser, router } = this.props;
    const { error } = this.state;
    const { category } = router.query;

    if (!LoggedInUser) {
      return (
        <Flex flexDirection="column" alignItems="center" mb={5} p={2}>
          <Flex flexDirection="column" p={4} mt={2}>
            <Box mb={3}>
              <H1 fontSize="H3" lineHeight="H3" fontWeight="bold" textAlign="center">
                <FormattedMessage id="collective.create.join" defaultMessage="Join Open Collective" />
              </H1>
            </Box>
            <Box textAlign="center">
              <P fontSize="Paragraph" color="black.600" mb={1}>
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

    return (
      <Form
        host={this.getHost()}
        onSubmit={this.createFund}
        onChange={this.handleChange}
        loading={this.state.creating}
        error={error}
      />
    );
  }
}

const createFundMutation = gqlV2`
  mutation CreateFund(
    $collective: CollectiveCreateInput!
    $host: AccountReferenceInput,
  ) {
    createCollective(collective: $collective, host: $host) {
      name
      slug
      tags
      description
      githubHandle
      legacyId
    }
  }
`;

const addCreateFundMutation = graphql(createFundMutation, {
  name: 'createFund',
  options: { context: API_V2_CONTEXT },
});

export default withRouter(withUser(addCreateFundMutation(CreateFund)));
