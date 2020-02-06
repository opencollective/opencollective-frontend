import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import { get } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';

import Page from '../Page';
import { H1, P } from '../Text';
import CreateCollectiveForm from './sections/CreateCollectiveForm';
import CollectiveCategoryPicker from './sections/CollectiveCategoryPicker';
import ConnectGithub from './sections/ConnectGithub';
import SignInOrJoinFree from '../SignInOrJoinFree';
import { withUser } from '../UserProvider';

import { addCreateCollectiveMutationV2 } from '../../lib/graphql/mutations';
import { getErrorFromGraphqlException } from '../../lib/utils';
import { Router } from '../../server/pages';

class NewCreateCollective extends Component {
  static propTypes = {
    host: PropTypes.object,
    query: PropTypes.object,
    LoggedInUser: PropTypes.object, // from withUser
    refetchLoggedInUser: PropTypes.func.isRequired, // from withUser
    intl: PropTypes.object.isRequired,
    createCollectiveV2: PropTypes.func,
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
    };
    this.createCollective = this.createCollective.bind(this);
    this.messages = defineMessages({
      'host.apply.title': {
        id: 'host.apply.title',
        defaultMessage: 'Apply to create a new {hostname} collective',
      },
      'collective.create.title': {
        id: 'collective.create.title',
        defaultMessage: 'Create an Open Collective',
      },
      'collective.create.description': {
        id: 'collective.create.description',
        defaultMessage: 'The place for your community to collect money and share your finance in full transparency.',
      },
    });

    this.host = props.host;
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

  async createCollective(CreateCollectiveInputType) {
    // check we have agreed to TOS
    if (!CreateCollectiveInputType.tos) {
      this.setState({
        error: 'Please accept the terms of service',
      });
      return;
    }

    // set state to loading
    this.setState({ status: 'loading' });

    // prepare object
    CreateCollectiveInputType.tags = this.state.category;
    if (this.state.github) {
      CreateCollectiveInputType.githubHandle = this.state.github.handle;
      this.host = { slug: 'opensource' };
    }
    delete CreateCollectiveInputType.tos;

    // try mutation
    try {
      const res = await this.props.createCollectiveV2({
        collective: CreateCollectiveInputType,
        host: this.host ? { slug: this.host.slug } : null,
        automateApprovalWithGithub: CreateCollectiveInputType.githubHandle ? true : false,
      });
      const collective = res.data.createCollective;
      const successParams = {
        slug: collective.slug,
      };
      this.setState({
        status: 'idle',
        result: { success: 'Collective created successfully' },
      });
      await this.props.refetchLoggedInUser();
      if (CreateCollectiveInputType.HostCollectiveId) {
        successParams.status = 'collectiveCreated';
        successParams.CollectiveId = collective.id;
        successParams.collectiveSlug = collective.slug;
        Router.pushRoute('collective', {
          slug: collective.slug,
          status: 'collectiveCreated',
          CollectiveId: collective.id,
          CollectiveSlug: collective.slug,
        });
      } else {
        Router.pushRoute('collective', { slug: collective.slug });
      }
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({ status: 'idle', error: errorMsg });
    }
  }

  render() {
    const { LoggedInUser, query } = this.props;
    const { category, form, error } = this.state;
    const { token } = query;

    const canApply = get(this.host, 'settings.apply') || true;

    return (
      <Page>
        <div className="CreateCollective">
          {canApply && !LoggedInUser && (
            <Fragment>
              <Flex flexDirection="column" alignItems="center" mb={5} p={2}>
                <Flex flexDirection="column" p={4} mt={2}>
                  <Box mb={3}>
                    <H1 fontSize="H3" lineHeight="H3" fontWeight="bold" textAlign="center">
                      Join Open Collective
                    </H1>
                  </Box>
                  <Box textAlign="center">
                    <P fontSize="Paragraph" color="black.600" mb={1}>
                      Create an account (or sign in) to start a collective.
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
              host={this.host}
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
              host={this.host}
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

export default injectIntl(withUser(addCreateCollectiveMutationV2(NewCreateCollective)));
