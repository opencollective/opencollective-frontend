import React, { Fragment } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import { FormattedMessage } from 'react-intl';
import gql from 'graphql-tag';
import { get } from 'lodash';

import { compose } from '../lib/utils';

import Button from './Button';
import Link from './Link';
import { P } from './Text';
import Modal, { ModalBody, ModalHeader, ModalFooter } from './StyledModal';
import StyledCheckbox from './StyledCheckbox';
import StyledButton from './StyledButton';
import Container from './Container';

const CheckboxWrapper = styled(Container)`
  color: #090a0a;
  display: flex;
  align-items: baseline;
`;

const TOS = styled(P)`
  color: #090a0a;
  font-size: 16px;
  text-align: left;
  text-shadow: none;
`;

const TOSLinkWrapper = styled.span`
  text-align: left;
  margin-left: 20px;
`;

const TOSLink = styled.a`
  color: rgb(51, 133, 255) !important;
`;

class ApplyToHostBtnLoggedIn extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object.isRequired,
    host: PropTypes.object.isRequired,
    data: PropTypes.object,
    editCollective: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      checkTOS: false,
    };
  }

  handleContinueBtn = async () => {
    const { host } = this.props;
    const CollectiveInputType = {
      id: this.inactiveCollective.id,
      HostCollectiveId: host.id,
    };
    console.log('>>> editCollective', CollectiveInputType);
    const res = await this.props.editCollective(CollectiveInputType);
    this.setState({ showModal: false });
    console.log('>>> res', res);
  };

  handleModalDisplay() {
    const { host } = this.props;
    const tos = get(host, 'settings.tos');
    if (tos) {
      this.setState({ showModal: true });
    } else {
      this.handleContinueBtn();
    }
  }

  render() {
    const { host, data } = this.props;

    if (data.loading) {
      return (
        <Button className="blue" disabled>
          <FormattedMessage id="host.apply.create.btn" defaultMessage="Apply to create a collective" />
        </Button>
      );
    }

    if (host && host.slug === 'opensource') {
      return (
        <Button className="blue" href={`/${host.slug}/apply`}>
          <FormattedMessage id="host.apply.create.btn" defaultMessage="Apply to create a collective" />
        </Button>
      );
    }

    if (data.allCollectives.total > 0) {
      this.inactiveCollective = data.allCollectives.collectives[0];
    }

    return (
      <Fragment>
        <div className="ApplyToHostBtnLoggedIn">
          {!this.inactiveCollective && (
            <Button className="blue" href={`/${host.slug}/apply`}>
              <FormattedMessage id="host.apply.create.btn" defaultMessage="Apply to create a collective" />
            </Button>
          )}
          {this.inactiveCollective &&
            (!this.inactiveCollective.host || get(this.inactiveCollective, 'host.id') !== host.id) && (
              <Button onClick={() => this.handleModalDisplay()} className="blue">
                <FormattedMessage
                  id="host.apply.btn"
                  defaultMessage="Apply to host your collective {collective}"
                  values={{ collective: this.inactiveCollective.name }}
                />
              </Button>
            )}
          {get(this.inactiveCollective, 'host.id') === host.id && (
            <FormattedMessage
              id="host.apply.pending"
              defaultMessage="Application pending for {collective}"
              values={{
                collective: <Link route={`/${this.inactiveCollective.slug}`}>{this.inactiveCollective.name}</Link>,
              }}
            />
          )}
        </div>
        <Modal show={this.state.showModal} width="570px" onClose={() => this.setState({ showModal: false })}>
          <ModalHeader>
            <FormattedMessage
              id="apply.host.tos.modal.header"
              values={{ name: host.name }}
              defaultMessage={'Apply to {name}'}
            />
          </ModalHeader>
          <ModalBody>
            <TOS>Terms of service</TOS>
            <CheckboxWrapper>
              <StyledCheckbox
                onChange={({ checked }) => this.setState({ checkTOS: checked })}
                checked={this.state.checkTOS}
              />
              <TOSLinkWrapper>
                I agree with the{' '}
                <TOSLink href={get(host, 'settings.tos')} target="_blank" rel="noopener noreferrer">
                  {' '}
                  the terms of fiscal sponsorship of the host
                </TOSLink>{' '}
                ({host.name}) that will collect money on behalf of our collective.
              </TOSLinkWrapper>
            </CheckboxWrapper>
          </ModalBody>
          <ModalFooter>
            <Container display="flex" justifyContent="flex-end">
              <StyledButton mx={20} onClick={() => this.setState({ showModal: false })}>
                <FormattedMessage id="apply.host.tos.cancel" defaultMessage={'Cancel'} />
              </StyledButton>
              <StyledButton
                buttonStyle="primary"
                disabled={!this.state.checkTOS}
                onClick={() => this.handleContinueBtn()}
              >
                <FormattedMessage id="apply.host.tos.continue" defaultMessage={'Continue'} />
              </StyledButton>
            </Container>
          </ModalFooter>
        </Modal>
      </Fragment>
    );
  }
}

const getInactiveCollectivesQuery = gql`
  query allCollectives($memberOfCollectiveSlug: String) {
    allCollectives(
      memberOfCollectiveSlug: $memberOfCollectiveSlug
      role: "ADMIN"
      type: COLLECTIVE
      isActive: false
      orderBy: createdAt
      orderDirection: DESC
    ) {
      total
      collectives {
        id
        slug
        name
        host {
          id
          slug
        }
      }
    }
  }
`;

const editCollectiveMutation = gql`
  mutation editCollective($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      id
      isActive
      host {
        id
        slug
      }
    }
  }
`;

const addQuery = graphql(getInactiveCollectivesQuery, {
  options(props) {
    return {
      variables: {
        memberOfCollectiveSlug: props.LoggedInUser.collective.slug,
      },
    };
  },
});

const addMutation = graphql(editCollectiveMutation, {
  props: ({ mutate }) => ({
    editCollective: async CollectiveInputType => {
      return await mutate({ variables: { collective: CollectiveInputType } });
    },
  }),
});

const addGraphQL = compose(
  addQuery,
  addMutation,
);

export default addGraphQL(ApplyToHostBtnLoggedIn);
