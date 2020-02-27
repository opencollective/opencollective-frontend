import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import { get } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import { graphql } from 'react-apollo';

import Page from '../Page';
import { H1, P } from '../Text';
import CreateCollectiveForm from './sections/CreateCollectiveForm';
import CollectiveCategoryPicker from './sections/CollectiveCategoryPicker';
import ConnectGithub from './sections/ConnectGithub';
import SignInOrJoinFree from '../SignInOrJoinFree';
import { withUser } from '../UserProvider';

import { getLoggedInUserQuery } from '../../lib/graphql/queries';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { getErrorFromGraphqlException } from '../../lib/utils';
import { Router } from '../../server/pages';

class NewCreateCollective extends Component {
  static propTypes = {
    host: PropTypes.object,
    query: PropTypes.object,
    LoggedInUser: PropTypes.object, // from withUser
    refetchLoggedInUser: PropTypes.func.isRequired, // from withUser
    intl: PropTypes.object.isRequired,
    createCollective: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      collective: {},
      result: {},
      category: null,
      github: null,
      form: false,
      error: null,
      status: null,
    };
    this.createCollective = this.createCollective.bind(this);
    this.messages = defineMessages({
      joinOC: {
        id: 'collective.create.join',
        defaultMessage: 'Join Open Collective',
      },
      createOrSignIn: {
        id: 'collective.create.createOrSignIn',
        defaultMessage: 'Create an account (or sign in) to start a collective.',
      },
    });
  }

  componentDidMount() {
    const { query } = this.props;
    if (query.category === 'opensource' || query.token) {
      this.setState({ category: 'opensource' });
      if (query.step === 'form') {
        this.setState({ form: true });
      }
      if (!query.step) {
        this.setState({ form: false });
      }
    } else if (query.category === 'community') {
      this.setState({ category: 'community' });
    } else if (query.category === 'climate') {
      this.setState({ category: 'climate' });
    } else if (!query.category) {
      this.setState({ category: null });
    }
    return;
  }

  componentDidUpdate(oldProps) {
    const { query } = this.props;
    if (oldProps.query.step !== query.step) {
      if (query.step === 'form') {
        this.setState({ form: true });
      } else {
        this.setState({ form: false });
      }
    }
    if (oldProps.query.category !== query.category) {
      if (query.category === 'opensource' || query.token) {
        this.setState({ category: 'opensource' });
      } else if (query.category === 'community') {
        this.setState({ category: 'community' });
      } else if (query.category === 'climate') {
        this.setState({ category: 'climate' });
      } else if (!query.category) {
        this.setState({ category: null });
      }
    }
    return;
  }

  handleChange(key, value) {
    this.setState({
      [key]: value,
    });
  }

  async createCollective(collective) {
    // check we have agreed to TOS
    if (!collective.tos) {
      this.setState({
        error: 'Please accept the terms of service',
      });
      return;
    }

    // set state to loading
    this.setState({ status: 'loading' });

    // prepare object
    collective.tags = [this.state.category];
    if (this.state.github) {
      collective.githubHandle = this.state.github.handle;
      this.props.host = { slug: 'opensource' };
    }
    delete collective.tos;

    // try mutation
    try {
      const res = await this.props.createCollective({
        collective,
        host: this.props.host ? { slug: this.props.host.slug } : null,
        automateApprovalWithGithub: this.state.github ? true : false,
      });
      const newCollective = res.data.createCollective;
      this.setState({
        status: 'idle',
        result: { success: 'Collective created successfully' },
      });
      await this.props.refetchLoggedInUser();
      Router.pushRoute('collective', { slug: newCollective.slug });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({ status: 'idle', error: errorMsg });
    }
  }

  render() {
    const { LoggedInUser, query, intl } = this.props;
    const { category, form, error } = this.state;
    const { token } = query;

    let canApply;

    if (query.verb === 'apply') {
      canApply = get(this.props.host, 'canApply');
    } else if (query.verb === 'create') {
      canApply = true;
    }

    return (
      <Page>
        <div>
          {canApply && !LoggedInUser && (
            <Fragment>
              <Flex flexDirection="column" alignItems="center" mb={5} p={2}>
                <Flex flexDirection="column" p={4} mt={2}>
                  <Box mb={3}>
                    <H1 fontSize="H3" lineHeight="H3" fontWeight="bold" textAlign="center">
                      {intl.formatMessage(this.messages.joinOC)}
                    </H1>
                  </Box>
                  <Box textAlign="center">
                    <P fontSize="Paragraph" color="black.600" mb={1}>
                      {intl.formatMessage(this.messages.createOrSignIn)}
                    </P>
                  </Box>
                </Flex>
                <SignInOrJoinFree />
              </Flex>
            </Fragment>
          )}
          {canApply && LoggedInUser && !category && (
            <CollectiveCategoryPicker query={query} onChange={(key, value) => this.handleChange(key, value)} />
          )}
          {canApply && LoggedInUser && category && category !== 'opensource' && (
            <CreateCollectiveForm
              host={this.props.host}
              collective={this.state.collective}
              onSubmit={this.createCollective}
              onChange={(key, value) => this.handleChange(key, value)}
              error={error}
              query={query}
            />
          )}
          {canApply && LoggedInUser && category === 'opensource' && !form && (
            <ConnectGithub token={token} query={query} onChange={(key, value) => this.handleChange(key, value)} />
          )}
          {canApply && LoggedInUser && category === 'opensource' && form && (
            <CreateCollectiveForm
              host={this.props.host}
              collective={this.state.collective}
              onSubmit={this.createCollective}
              onChange={(key, value) => this.handleChange(key, value)}
              error={error}
              query={query}
            />
          )}
        </div>
      </Page>
    );
  }
}

const createCollectiveQuery = gqlV2`
  mutation createCollective(
    $collective: CreateCollectiveInput!
    $host: AccountInput
    $automateApprovalWithGithub: Boolean
  ) {
    createCollective(collective: $collective, host: $host, automateApprovalWithGithub: $automateApprovalWithGithub) {
      name
      slug
      tags
      description
      githubHandle
    }
  }
`;

const addCreateCollectiveMutation = graphql(createCollectiveQuery, {
  options: {
    context: API_V2_CONTEXT,
  },
  props: ({ mutate }) => ({
    createCollective: async ({ collective, host }) => {
      return await mutate({
        variables: {
          collective,
          host: host,
        },
        awaitRefetchQueries: true,
        refetchQueries: [{ query: getLoggedInUserQuery }],
      });
    },
  }),
});

export default injectIntl(withUser(addCreateCollectiveMutation(NewCreateCollective)));
