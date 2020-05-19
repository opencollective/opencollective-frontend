import React from 'react';
import PropTypes from 'prop-types';
import { Mutation, Query } from '@apollo/react-components';
import gql from 'graphql-tag';
import { cloneDeep, get, update } from 'lodash';
import { FormattedMessage } from 'react-intl';

import AuthenticatedPage from '../components/AuthenticatedPage';
import Container from '../components/Container';
import { Box, Flex } from '../components/Grid';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import StyledButton from '../components/StyledButton';
import StyledCard from '../components/StyledCard';
import StyledHr from '../components/StyledHr';
import StyledLink from '../components/StyledLink';

const loggedInUserApplicationsQuery = gql`
  query LoggedInUserApplications {
    LoggedInUser {
      id
      collective {
        id
        ... on User {
          id
          applications {
            id
            type
            apiKey
          }
        }
      }
    }
  }
`;

const createApplicationMutation = gql`
  mutation CreateApplication($application: ApplicationInput!) {
    createApplication(application: $application) {
      id
      type
      apiKey
    }
  }
`;

const deleteApplicationMutation = gql`
  mutation DeleteApplication($id: Int!) {
    deleteApplication(id: $id) {
      id
    }
  }
`;

class Apps extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
  };

  render() {
    return (
      <AuthenticatedPage title="Applications">
        {() => (
          <Query query={loggedInUserApplicationsQuery}>
            {({ data, loading }) => {
              if (loading) {
                return (
                  <Flex justifyContent="center" my={6}>
                    <Loading />
                  </Flex>
                );
              }

              const applications = get(data, 'LoggedInUser.collective.applications', []);
              const apiKeys = applications.filter(app => app.type === 'API_KEY');

              return (
                <Container maxWidth="80%" m="40px auto">
                  <h3>
                    <FormattedMessage id="applications.ApiKeys" defaultMessage="API Keys" />
                  </h3>

                  <p>
                    <FormattedMessage
                      id="applications.ApiKeys.description"
                      defaultMessage="Use API Keys to interact with the Open Collective GraphQL API with your own account."
                    />
                  </p>

                  {(!apiKeys || apiKeys.length === 0) && (
                    <MessageBox type="info" withIcon>
                      <FormattedMessage id="applications.ApiKeys.none" defaultMessage="No API Key registered." />
                    </MessageBox>
                  )}

                  {apiKeys && apiKeys.length > 0 && (
                    <Mutation
                      mutation={deleteApplicationMutation}
                      update={(cache, { data: { deleteApplication } }) => {
                        const { LoggedInUser } = cache.readQuery({ query: loggedInUserApplicationsQuery });
                        const updatedUser = cloneDeep(LoggedInUser);

                        update(updatedUser, 'collective.applications', applications => {
                          return applications ? applications.filter(a => a.id !== deleteApplication.id) : [];
                        });

                        cache.writeQuery({
                          query: loggedInUserApplicationsQuery,
                          data: { LoggedInUser: updatedUser },
                        });
                      }}
                    >
                      {(deleteApplication, { loading, error }) => (
                        <Box>
                          {error && (
                            <MessageBox type="error" withIcon mb={3}>
                              {error.message}
                            </MessageBox>
                          )}
                          {apiKeys.map(application => (
                            <StyledCard m="20px 0" p={10} key={application.id} data-cy="api-key">
                              <div className="keys">
                                <FormattedMessage
                                  id="applications.ApiKeys.code"
                                  defaultMessage="API Key: {code}"
                                  values={{ code: <code>{application.apiKey}</code> }}
                                />
                                &nbsp; - &nbsp;
                                <StyledLink
                                  disabled={loading}
                                  onClick={() => deleteApplication({ variables: { id: application.id } })}
                                >
                                  <FormattedMessage id="actions.delete" defaultMessage="Delete" />
                                </StyledLink>
                              </div>
                            </StyledCard>
                          ))}
                        </Box>
                      )}
                    </Mutation>
                  )}

                  <StyledHr my={3} />
                  <Mutation
                    mutation={createApplicationMutation}
                    update={(cache, { data: { createApplication } }) => {
                      const { LoggedInUser } = cache.readQuery({ query: loggedInUserApplicationsQuery });
                      const updatedUser = cloneDeep(LoggedInUser);

                      update(updatedUser, 'collective.applications', applications => {
                        return applications ? [...applications, createApplication] : [createApplication];
                      }),
                        cache.writeQuery({
                          query: loggedInUserApplicationsQuery,
                          data: {
                            LoggedInUser: updatedUser,
                          },
                        });
                    }}
                  >
                    {(createApplication, { loading, error }) => (
                      <Box>
                        {error && (
                          <MessageBox type="error" withIcon mb={3}>
                            {error.message}
                          </MessageBox>
                        )}
                        <StyledButton
                          buttonStyle="primary"
                          loading={loading}
                          onClick={() => createApplication({ variables: { application: { type: 'API_KEY' } } })}
                        >
                          <FormattedMessage id="applications.ApiKeys.new" defaultMessage="New API Key" />
                        </StyledButton>
                      </Box>
                    )}
                  </Mutation>
                </Container>
              );
            }}
          </Query>
        )}
      </AuthenticatedPage>
    );
  }
}

export default Apps;
