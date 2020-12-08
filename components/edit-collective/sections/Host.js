import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Radio } from '@material-ui/core';
import { get, groupBy } from 'lodash';
import { withRouter } from 'next/router';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { formatCurrency } from '../../../lib/currency-utils';
import { formatDate } from '../../../lib/utils';
import { Router } from '../../../server/pages';

import CollectiveCard from '../../CollectiveCard';
import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import HostsWithData from '../../HostsWithData';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import { H3, P } from '../../Text';
import CreateHostFormWithData from '../CreateHostFormWithData';
import EditConnectedAccount from '../EditConnectedAccount';

const Option = styled.div`
  h2 {
    margin: 10px 0px 5px 0px;
    font-weight: bold;
  }
`;

const Fineprint = styled.div`
  font-size: 14px;
`;

const EditCollectiveHostSection = styled.div`
  h2 label {
    cursor: pointer;
    width: auto;
  }

  select {
    cursor: pointer;
  }
`;

class Host extends React.Component {
  static propTypes = {
    goals: PropTypes.arrayOf(PropTypes.object),
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
    editCollectiveMutation: PropTypes.func.isRequired,
    router: PropTypes.object.isRequired, // from withRouter
  };

  constructor(props) {
    super(props);
    this.changeHost = this.changeHost.bind(this);
    this.updateSelectedOption = this.updateSelectedOption.bind(this);
    this.state = {
      collective: props.collective,
      showModal: false,
      action: '',
    };
  }

  updateSelectedOption(option) {
    Router.pushRoute('editCollective', {
      slug: this.props.collective.slug,
      section: 'host',
      selectedOption: option,
    });
  }

  async changeHost(newHost = { id: null }) {
    const { collective } = this.props;
    this.setState({ showModal: false });
    if (newHost.id === get(collective, 'host.id')) {
      return;
    }
    await this.props.editCollectiveMutation({
      id: collective.id,
      HostCollectiveId: newHost.id,
    });
    if (!newHost.id) {
      this.updateSelectedOption('noHost');
    }
  }

  render() {
    const { LoggedInUser, collective, router } = this.props;
    const { showModal, action } = this.state;

    const selectedOption = get(router, 'query.selectedOption', 'noHost');
    const hostMembership = get(collective, 'members', []).find(m => m.role === 'HOST');

    const closeModal = () => this.setState({ showModal: false });

    if (get(collective, 'host.id') === collective.id) {
      return (
        <Fragment>
          <p>
            <FormattedMessage
              id="editCollective.selfHost.label"
              defaultMessage="{type, select, COLLECTIVE {Your Collective} FUND {Your Fund}} is receiving contributions directly, it doesn't use a Fiscal Host."
              values={{
                type: collective.type,
              }}
            />
          </p>
          {collective.stats.balance > 0 && (
            <Fragment>
              <p>
                <FormattedMessage
                  id="editCollective.selfHost.balance"
                  defaultMessage="It currently holds {balance}."
                  values={{
                    balance: formatCurrency(collective.stats.balance, collective.currency),
                    type: collective.type,
                  }}
                />{' '}
                <FormattedMessage
                  id="editCollective.selfHost.change.balanceNotEmpty"
                  defaultMessage="If you would like to change your Fiscal Host settings, you first need to empty {type, select, COLLECTIVE {your Collective's balance} FUND {your Fund's balance}}. You can do this by submitting and paying expenses."
                  values={{
                    type: collective.type,
                  }}
                />
              </p>
            </Fragment>
          )}
          {collective.stats.balance === 0 && (
            <Fragment>
              <p>
                <Button bsStyle="primary" type="submit" onClick={() => this.changeHost()} className="removeHostBtn">
                  <FormattedMessage
                    id="editCollective.selfHost.removeBtn"
                    defaultMessage="Reset Fiscal Host settings"
                  />
                </Button>
              </p>
            </Fragment>
          )}
        </Fragment>
      );
    }

    if (get(collective, 'host.id')) {
      const name = collective.host.name;

      return (
        <Fragment>
          <Flex>
            <Box p={1} mr={3}>
              <CollectiveCard collective={collective.host} membership={hostMembership} />
            </Box>
            <Box>
              {!collective.isActive && (
                <Fragment>
                  <p>
                    <FormattedMessage
                      id="editCollective.host.pending"
                      defaultMessage="You have applied to be hosted by {host} on {date}. Your application is being reviewed."
                      values={{
                        host: get(collective, 'host.name'),
                        date: formatDate(get(hostMembership, 'createdAt'), {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }),
                      }}
                    />
                  </p>
                  <p>
                    <Button
                      bsStyle="primary"
                      type="submit"
                      onClick={() => this.setState({ showModal: true, action: 'Withdraw' })}
                      className="removeHostBtn"
                    >
                      <FormattedMessage
                        id="editCollective.host.cancelApplicationBtn"
                        defaultMessage="Withdraw application"
                      />
                    </Button>
                  </p>
                </Fragment>
              )}
              {collective.isActive && (
                <Fragment>
                  <p>
                    <FormattedMessage
                      id="editCollective.host.label"
                      defaultMessage="Your Fiscal Host is {host}."
                      values={{ host: get(collective, 'host.name') }}
                    />
                  </p>
                  {collective.stats.balance > 0 && (
                    <p>
                      <FormattedMessage
                        id="editCollective.host.balance"
                        defaultMessage="It currently holds {balance} on behalf of {type, select, COLLECTIVE {your Collective} FUND {your Fund}}."
                        values={{
                          balance: formatCurrency(collective.stats.balance, collective.currency),
                          type: collective.type,
                        }}
                      />
                    </p>
                  )}
                  {collective.stats.balance > 0 && (
                    <p>
                      <FormattedMessage
                        id="editCollective.host.change.balanceNotEmpty"
                        defaultMessage="If you would like to change your Fiscal Host, you first need to empty {type, select, COLLECTIVE {your Collective's balance} FUND {your Fund's balance}}. You can do this by submitting expenses, making financial contributions (select  {type, select, COLLECTIVE {your Collective} FUND {your Fund}} as 'Contribute As') or by donating to your Fiscal Host using the {emptyBalanceLink} feature."
                        values={{
                          type: collective.type,
                          emptyBalanceLink: (
                            <Link route="editCollective" params={{ slug: collective.slug, section: 'advanced' }}>
                              <FormattedMessage id="emptyBalance" defaultMessage="Empty Balance" />
                            </Link>
                          ),
                        }}
                      />
                    </p>
                  )}
                  {collective.stats.balance === 0 && (
                    <Fragment>
                      <p>
                        <Button
                          bsStyle="primary"
                          type="submit"
                          onClick={() => this.setState({ showModal: true, action: 'Remove' })}
                          className="removeHostBtn"
                        >
                          <FormattedMessage id="editCollective.host.removeBtn" defaultMessage="Remove Host" />
                        </Button>
                      </p>
                      <Fineprint>
                        <FormattedMessage
                          id="editCollective.host.change.removeFirst"
                          defaultMessage="Once removed, {type, select, COLLECTIVE {your Collective} FUND {your Fund}} won't be able to accept financial contributions anymore. You will be able to apply to another Fiscal Host."
                          values={{ type: collective.type }}
                        />
                      </Fineprint>
                    </Fragment>
                  )}
                </Fragment>
              )}
            </Box>
          </Flex>
          <Modal show={showModal} width="570px" onClose={closeModal}>
            <ModalHeader onClose={closeModal}>
              {action === 'Remove' ? (
                <FormattedMessage id="collective.editHost.remove" values={{ name }} defaultMessage={'Remove {name}'} />
              ) : (
                <FormattedMessage
                  id="collective.editHost.header"
                  values={{ name }}
                  defaultMessage={'Withdraw application from {name}'}
                />
              )}
            </ModalHeader>
            <ModalBody>
              <P>
                {action === 'Withdraw' && (
                  <FormattedMessage
                    id="collective.editHost.withdrawApp"
                    values={{ name }}
                    defaultMessage={'Are you sure you want to withdraw application from {name}?'}
                  />
                )}
                {action === 'Remove' && (
                  <FormattedMessage
                    id="collective.editHost.removeHost"
                    values={{ name }}
                    defaultMessage={'Are you sure you want to remove {name}?'}
                  />
                )}
              </P>
            </ModalBody>
            <ModalFooter>
              <Container display="flex" justifyContent="flex-end">
                <StyledButton
                  mx={20}
                  onClick={() =>
                    this.setState({
                      showModal: false,
                    })
                  }
                >
                  <FormattedMessage id="actions.cancel" defaultMessage={'Cancel'} />
                </StyledButton>
                <StyledButton buttonStyle="primary" onClick={() => this.changeHost()} data-cy="continue">
                  <FormattedMessage
                    id="collective.editHost.continue.btn"
                    values={{ action }}
                    defaultMessage={'{action}'}
                  />
                </StyledButton>
              </Container>
            </ModalFooter>
          </Modal>
        </Fragment>
      );
    }

    const connectedAccounts = groupBy(collective.connectedAccounts, 'service');
    const stripeAccount = connectedAccounts && connectedAccounts['stripe'] && connectedAccounts['stripe'][0];

    return (
      <EditCollectiveHostSection>
        <H3 mb={4}>
          <FormattedMessage
            id="acceptContributions.picker.subtitle"
            defaultMessage="Who will hold money on behalf of the Collective?"
          />
        </H3>

        <Option id="noHost">
          <Flex>
            <Box width="50px" mr={2}>
              <Radio
                id="host-radio-noHost"
                checked={selectedOption === 'noHost'}
                onChange={() => this.updateSelectedOption('noHost')}
                className="hostRadio"
              />
            </Box>
            <Box mb={4}>
              <h2>
                <label htmlFor="host-radio-noHost">
                  <FormattedMessage id="collective.edit.host.noHost.title" defaultMessage="No one" />
                </label>
              </h2>
              <FormattedMessage
                id="collective.edit.host.noHost.description"
                defaultMessage="You can't receive financial contributions or use the budget features. You can still edit your profile page, submit expenses to be paid later, and post updates."
              />
            </Box>
          </Flex>
        </Option>

        <Option id="selfHost">
          <Flex>
            <Box width="50px" mr={2}>
              <Radio
                id="host-radio-selfHost"
                checked={selectedOption === 'selfHost'}
                onChange={() => this.updateSelectedOption('selfHost')}
                className="hostRadio"
              />
            </Box>
            <Box mb={4}>
              <h2>
                <label htmlFor="host-radio-selfHost">
                  <FormattedMessage id="collective.edit.host.selfHost.title" defaultMessage="Ourselves" />
                </label>
              </h2>
              <FormattedMessage
                id="collective.edit.host.selfHost.description"
                defaultMessage="No Fiscal Host, simply connect a bank account. You will be responsible for accounting, taxes, payments, and liability."
              />
              {selectedOption === 'selfHost' && LoggedInUser && (
                <Flex justifyContent="space-between" alignItems="flex-end" mt={3}>
                  <Box>
                    <Button bsStyle="primary" type="submit" onClick={() => this.changeHost({ id: collective.id })}>
                      <FormattedMessage
                        id="host.selfHost.confirm"
                        defaultMessage="Yes, hold money ourselves, no Fiscal Host"
                      />
                    </Button>
                  </Box>
                  {!stripeAccount && (
                    <Box textAlign="right">
                      <EditConnectedAccount
                        collective={collective}
                        service="stripe"
                        options={{
                          redirect: `${process.env.WEBSITE_URL}/${collective.slug}/edit/host?selectedOption=selfHost`,
                        }}
                      />
                    </Box>
                  )}
                </Flex>
              )}
            </Box>
          </Flex>
        </Option>

        <Option id="ownHost">
          <Flex>
            <Box width="50px" mr={2}>
              <Radio
                id="host-radio-ownHost"
                checked={selectedOption === 'ownHost'}
                onChange={() => this.updateSelectedOption('ownHost')}
                className="hostRadio"
              />
            </Box>
            <Box mb={4}>
              <h2>
                <label htmlFor="host-radio-ownHost">
                  <FormattedMessage id="collective.edit.host.useOwn.title" defaultMessage="Our organization" />
                </label>
              </h2>
              <FormattedMessage
                id="collective.edit.host.useOwn.description"
                defaultMessage="Use an organization you own as Fiscal Host so you can host multiple collectives. The organization will be responsible for their accounting, taxes, payments, and liability."
              />
              &nbsp;
              <a href="https://docs.opencollective.com/help/fiscal-hosts/become-a-fiscal-host">
                <FormattedMessage id="moreInfo" defaultMessage="More info" />
              </a>
              .
              {selectedOption === 'ownHost' && LoggedInUser && (
                <CreateHostFormWithData
                  collective={collective}
                  LoggedInUser={LoggedInUser}
                  onSubmit={hostCollective => this.changeHost(hostCollective)}
                />
              )}
            </Box>
          </Flex>
        </Option>

        <Option id="findHost">
          <Flex>
            <Box width="50px" mr={2}>
              <Radio
                id="host-radio-findHost"
                checked={selectedOption === 'findHost'}
                onChange={() => this.updateSelectedOption('findHost')}
                className="hostRadio"
              />
            </Box>
            <Box mb={4}>
              <h2>
                <label htmlFor="host-radio-findHost">
                  <FormattedMessage
                    id="collective.edit.host.findHost.title"
                    defaultMessage="Apply to an existing Fiscal Host"
                  />
                </label>
              </h2>
              <FormattedMessage
                id="collective.edit.host.findHost.description"
                defaultMessage="You won't need to hold funds yourself, or set up a legal entity and bank account for your project. The Fiscal Host will take care of accounting, invoices, taxes, admin, payments, and liability. Most hosts charge a fee for this service (you can review these details on the Host's page before confirming)."
              />
              {selectedOption === 'findHost' && (
                <div>
                  <Container display="flex" alignItems="baseline">
                    <h3>
                      <FormattedMessage
                        id="collective.edit.host.suggestedHosts.title"
                        defaultMessage="Suggested hosts"
                      />
                    </h3>
                    <Link route="/hosts">
                      <FormattedMessage id="collective.edit.host.viewAllHosts" defaultMessage="View all Fiscal Hosts" />
                    </Link>
                  </Container>
                  {collective.tags && collective.tags.length > 0 && (
                    <Container color="#666f80" fontSize="1.5rem">
                      <FormattedMessage
                        id="collective.edit.host.suggestedHosts.description"
                        defaultMessage="Based on the tags ({tags})"
                        values={{
                          tags: collective.tags.join(', '),
                        }}
                      />
                    </Container>
                  )}
                  <HostsWithData
                    limit={6}
                    tags={collective.tags}
                    empty={
                      <FormattedMessage
                        id="collective.edit.host.suggestedHosts.empty"
                        defaultMessage="No suggestions. Please look at all available hosts or consider creating a new host."
                      />
                    }
                  />
                </div>
              )}
            </Box>
          </Flex>
        </Option>
      </EditCollectiveHostSection>
    );
  }
}

export default withRouter(Host);
