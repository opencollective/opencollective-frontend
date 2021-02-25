import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import { Box, Flex } from '../Grid';
import SignInOrJoinFree from '../SignInOrJoinFree';
import { H1, P } from '../Text';
import { withUser } from '../UserProvider';

import Form from './Form';

class CreateProject extends Component {
  static propTypes = {
    parent: PropTypes.object,
    LoggedInUser: PropTypes.object, // from withUser
    refetchLoggedInUser: PropTypes.func.isRequired, // from withUser
    createProject: PropTypes.func.isRequired, // addCreateProjectMutation
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = { error: null, creating: false };

    this.createProject = this.createProject.bind(this);
  }

  async createProject(project) {
    // set state to loading
    this.setState({ creating: true });

    // try mutation
    try {
      const res = await this.props.createProject({
        variables: { project, parent: { slug: this.props.parent.slug } },
      });
      const createdProject = res.data.createProject;
      await this.props.refetchLoggedInUser();
      this.props.router
        .push({
          pathname: `/${this.props.parent.slug}/projects/${createdProject.slug}`,
          query: {
            status: 'projectCreated',
          },
        })
        .then(() => window.scrollTo(0, 0));
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({ error: errorMsg, creating: false });
    }
  }

  render() {
    const { LoggedInUser, parent } = this.props;
    const { creating, error } = this.state;

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

    return <Form parent={parent} onSubmit={this.createProject} loading={creating} error={error} />;
  }
}

const createProjectMutation = gqlV2/* GraphQL */ `
  mutation CreateProject($project: ProjectCreateInput!, $parent: AccountReferenceInput) {
    createProject(project: $project, parent: $parent) {
      id
      name
      slug
      description
    }
  }
`;

const addCreateProjectMutation = graphql(createProjectMutation, {
  name: 'createProject',
  options: { context: API_V2_CONTEXT },
});

export default withRouter(withUser(addCreateProjectMutation(CreateProject)));
