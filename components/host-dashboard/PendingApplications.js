import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Mutation, graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Flex, Box } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';
import { get } from 'lodash';

import { Check } from '@styled-icons/boxicons-regular/Check';
import { Github } from '@styled-icons/fa-brands/Github';

import { withUser } from '../UserProvider';
import Loading from '../Loading';
import StyledCard from '../StyledCard';
import { Span } from '../Text';
import Container from '../Container';
import LinkCollective from '../LinkCollective';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import ExternalLink from '../ExternalLink';
import Avatar from '../Avatar';
import MessageBox from '../MessageBox';
import AppRejectionReasonModal from './AppRejectionReasonModal';
import { getHostPendingApplicationsQuery } from '../../lib/graphql/queries';
import { getErrorFromGraphqlException } from '../../lib/errors';

const ApproveCollectiveMutation = gql`
  mutation approveCollective($id: Int!) {
    approveCollective(id: $id) {
      id
      isActive
    }
  }
`;

class HostPendingApplications extends React.Component {
  static propTypes = {
    hostCollectiveSlug: PropTypes.string.isRequired,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      Collective: PropTypes.shape({
        id: PropTypes.number,
      }),
    }),
  };

  constructor(props) {
    super(props);
    this.state = {
      showRejectionModal: false,
      collectiveId: null,
    };
  }

  componentDidMount() {
    this.scrollToSelectedApplication();
  }

  componentDidUpdate(oldProps) {
    if (!oldProps.data.Collective && this.props.data.Collective) {
      this.scrollToSelectedApplication();
    }
  }

  scrollToSelectedApplication() {
    const selectedCollectiveId = this.getSelectedApplicationCollectiveId();
    if (selectedCollectiveId) {
      const elem = document.getElementById(`application-${selectedCollectiveId}`);
      if (elem) {
        elem.scrollIntoView();
      }
    }
  }

  getSelectedApplicationCollectiveId() {
    try {
      const hash = window.location.hash;
      const regex = /application-(\d+)/;
      const idStr = regex.exec(hash)[1];
      const idInt = parseInt(idStr);
      return idInt || null;
    } catch {
      return null;
    }
  }

  renderPendingCollectives(data, loading) {
    if (loading) {
      return (
        <Box px={2} py={5}>
          <Loading />
        </Box>
      );
    }

    const pendingCollectives = get(data, 'Collective.pending.collectives', []);
    const selectedCollectiveId = this.getSelectedApplicationCollectiveId();

    return (
      <Container
        display="flex"
        background="linear-gradient(180deg, #EBF4FF, #FFFFFF)"
        flexDirection="column"
        alignItems="center"
        px={2}
        py={5}
      >
        {pendingCollectives.length === 0 && (
          <MessageBox type="info" withIcon mb={5}>
            <FormattedMessage
              id="host.pending-applications.noPending"
              defaultMessage="No collective waiting for approval"
            />
          </MessageBox>
        )}

        {pendingCollectives.map(c => (
          <StyledCard
            key={c.id}
            width={1}
            maxWidth={400}
            p={3}
            mb={4}
            id={`application-${c.id}`}
            boxShadow="rgba(144, 144, 144, 0.25) 4px 4px 16px"
            borderColor={selectedCollectiveId === c.id ? 'primary.300' : undefined}
          >
            <Flex>
              <Avatar collective={c} mr={2} radius={42} />
              <Container pl={2} flex="1 1" borderLeft="1px solid #e8e8e8">
                <div>
                  <LinkCollective collective={c}>
                    <strong>{c.name}</strong> <small>({c.slug})</small>
                  </LinkCollective>
                </div>
                {c.githubHandle && (
                  <ExternalLink href={`https://github.com/${c.githubHandle}`} openInNewTab>
                    <Github size="1em" />
                    <Span ml={1}>{c.githubHandle}</Span>
                  </ExternalLink>
                )}
              </Container>
            </Flex>
            <StyledHr my={3} borderColor="black.200" />
            <Flex justifyContent="space-evenly" flexWrap="wrap">
              {c.isActive ? (
                <Box color="green.700" data-cy={`${c.slug}-approved`}>
                  <Check size={39} />
                </Box>
              ) : (
                <Fragment>
                  <Mutation mutation={ApproveCollectiveMutation}>
                    {(approveCollective, { loading }) => (
                      <StyledButton
                        m={1}
                        loading={loading}
                        onClick={() => approveCollective({ variables: { id: c.id } })}
                        data-cy={`${c.slug}-approve`}
                        buttonStyle="success"
                        minWidth={125}
                      >
                        <FormattedMessage id="actions.approve" defaultMessage="Approve" />
                      </StyledButton>
                    )}
                  </Mutation>
                  <StyledButton
                    buttonStyle="danger"
                    minWidth={125}
                    m={1}
                    onClick={() => this.setState({ showRejectionModal: true, collectiveId: c.id })}
                  >
                    <FormattedMessage id="actions.reject" defaultMessage="Reject" />
                  </StyledButton>
                </Fragment>
              )}
            </Flex>
          </StyledCard>
        ))}

        {this.state.showRejectionModal && (
          <AppRejectionReasonModal
            show={this.state.showRejectionModal}
            onClose={() => this.setState({ showRejectionModal: false })}
            collectiveId={this.state.collectiveId}
            hostCollectiveSlug={this.props.hostCollectiveSlug}
          />
        )}
      </Container>
    );
  }

  render() {
    const { data } = this.props;

    return data.error ? (
      <MessageBox type="error" withIcon>
        {getErrorFromGraphqlException(data.error).message}
      </MessageBox>
    ) : (
      this.renderPendingCollectives(data, data.loading)
    );
  }
}

export default withUser(graphql(getHostPendingApplicationsQuery)(HostPendingApplications));
