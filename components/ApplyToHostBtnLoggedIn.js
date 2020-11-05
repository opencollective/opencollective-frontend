import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { get, truncate } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { compose } from '../lib/utils';

import Container from './Container';
import Link from './Link';
import StyledButton from './StyledButton';
import StyledCheckbox from './StyledCheckbox';
import StyledLink from './StyledLink';
import Modal, { ModalBody, ModalFooter, ModalHeader } from './StyledModal';
import { P } from './Text';

const CheckboxWrapper = styled(Container)`
  color: #090a0a;
  display: flex;
  align-items: center;
`;

const TOS = styled(P)`
  color: #090a0a;
  font-size: 16px;
  text-align: left;
  text-shadow: none;
  margin-top: 8px;
  margin-bottom: 16px;
`;

class ApplyToHostBtnLoggedIn extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object.isRequired,
    host: PropTypes.object.isRequired,
    data: PropTypes.object,
    editCollective: PropTypes.func,
    buttonStyle: PropTypes.string,
    buttonSize: PropTypes.string,
    minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    disabled: PropTypes.bool,
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
    await this.props.editCollective({
      variables: {
        collective: {
          id: this.inactiveCollective.id,
          HostCollectiveId: host.id,
        },
      },
    });
    this.setState({ showModal: false });
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
    const { host, data, disabled, buttonStyle, buttonSize, minWidth } = this.props;

    if (data.loading) {
      return (
        <StyledButton
          buttonStyle={buttonStyle}
          buttonSize={buttonSize}
          minWidth={minWidth}
          disabled
          data-cy="host-apply-btn-loading"
        >
          <FormattedMessage id="host.apply.create.btn" defaultMessage="Apply" />
        </StyledButton>
      );
    }

    if (data.allCollectives.total > 0) {
      this.inactiveCollective = data.allCollectives.collectives[0];
    }

    return (
      <Fragment>
        <div className="ApplyToHostBtnLoggedIn">
          {!this.inactiveCollective && (
            <Link route={`/${host.slug}/apply`}>
              <StyledButton
                buttonStyle={buttonStyle}
                buttonSize={buttonSize}
                disabled={disabled}
                minWidth={minWidth}
                data-cy="host-apply-btn"
              >
                <FormattedMessage id="host.apply.create.btn" defaultMessage="Apply" />
              </StyledButton>
            </Link>
          )}
          {this.inactiveCollective &&
            (!this.inactiveCollective.host || get(this.inactiveCollective, 'host.id') !== host.id) && (
              <StyledButton
                buttonStyle={buttonStyle}
                buttonSize={buttonSize}
                disabled={disabled}
                onClick={() => this.handleModalDisplay()}
                minWidth={minWidth}
                data-cy="host-apply-btn"
              >
                <FormattedMessage
                  id="host.apply.btn"
                  defaultMessage="Apply with {collective}"
                  values={{ collective: <strong>{truncate(this.inactiveCollective.name, { length: 18 })}</strong> }}
                />
              </StyledButton>
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
            <TOS>
              <FormattedMessage id="collective.tos.label" defaultMessage="Terms of Service" />
            </TOS>
            <CheckboxWrapper>
              <StyledCheckbox
                onChange={({ checked }) => this.setState({ checkTOS: checked })}
                checked={this.state.checkTOS}
                size={16}
                label={
                  <Container ml={2}>
                    <FormattedMessage
                      id="ApplyToHostBtnLoggedIn.TOS"
                      defaultMessage="I agree with the <tos-link>terms of fiscal sponsorship of the host</tos-link> ({hostName}) that will collect money on behalf of our collective."
                      values={{
                        'tos-link': msg => (
                          <StyledLink href={get(host, 'settings.tos')} openInNewTab>
                            {msg}
                          </StyledLink>
                        ),
                        hostName: host.name,
                      }}
                    />
                  </Container>
                }
              />
            </CheckboxWrapper>
          </ModalBody>
          <ModalFooter>
            <Container display="flex" justifyContent="flex-end">
              <StyledButton mx={20} onClick={() => this.setState({ showModal: false })}>
                <FormattedMessage id="actions.cancel" defaultMessage={'Cancel'} />
              </StyledButton>
              <StyledButton
                buttonStyle="primary"
                disabled={!this.state.checkTOS}
                onClick={() => this.handleContinueBtn()}
              >
                <FormattedMessage id="actions.continue" defaultMessage={'Continue'} />
              </StyledButton>
            </Container>
          </ModalFooter>
        </Modal>
      </Fragment>
    );
  }
}

const inactiveCollectivesQuery = gql`
  query ApplyToHostInactiveCollectives($memberOfCollectiveSlug: String) {
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

export const applyToHostMutation = gql`
  mutation ApplyToHost($collective: CollectiveInputType!) {
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

const addInactiveCollectivesData = graphql(inactiveCollectivesQuery, {
  options: props => ({
    variables: {
      memberOfCollectiveSlug: props.LoggedInUser.collective.slug,
    },
  }),
});

const addApplyToHostMutation = graphql(applyToHostMutation, {
  name: 'editCollective',
});

const addGraphql = compose(addInactiveCollectivesData, addApplyToHostMutation);

export default addGraphql(ApplyToHostBtnLoggedIn);
