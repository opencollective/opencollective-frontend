import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { get, groupBy } from 'lodash';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { formatCurrency } from '../../../lib/currency-utils';
import { formatDate } from '../../../lib/utils';

import CollectiveCard from '../../CollectiveCard';
import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import HostsWithData from '../../HostsWithData';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
import StyledInput from '../../StyledInput';
import StyledLink from '../../StyledLink';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import { H4, P } from '../../Text';
import CreateHostFormWithData from '../CreateHostFormWithData';
import EditConnectedAccount from '../EditConnectedAccount';
import SettingsTitle from '../SettingsTitle';

const OptionLabel = styled.label`
  display: block;
  font-weight: bold;
  cursor: pointer;
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
    this.props.router.push({
      pathname: `/${this.props.collective.slug}/edit/host`,
      query: {
        selectedOption: option,
      },
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
              defaultMessage="{type, select, COLLECTIVE {Your Collective} FUND {Your Fund}} hold its own funds; it doesn't use a Fiscal Host."
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
                  defaultMessage="Current balance: {balance}."
                  values={{
                    balance: formatCurrency(collective.stats.balance, collective.currency),
                    type: collective.type,
                  }}
                />{' '}
                <FormattedMessage
                  id="editCollective.selfHost.change.balanceNotEmpty"
                  defaultMessage="To change your Fiscal Host, you first need to empty {type, select, COLLECTIVE {your Collective's balance} FUND {your Fund's balance}} by submitting and paying expenses."
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
                <StyledButton
                  buttonStyle="primary"
                  type="submit"
                  onClick={() => this.changeHost()}
                  className="removeHostBtn"
                >
                  <FormattedMessage id="editCollective.selfHost.removeBtn" defaultMessage="Reset Fiscal Host" />
                </StyledButton>
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
                      defaultMessage="You applied to be hosted by {host} on {date}. Your application is being reviewed."
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
                    <StyledButton
                      buttonStyle="primary"
                      type="submit"
                      onClick={() => this.setState({ showModal: true, action: 'Withdraw' })}
                      className="removeHostBtn"
                    >
                      <FormattedMessage
                        id="editCollective.host.cancelApplicationBtn"
                        defaultMessage="Withdraw application"
                      />
                    </StyledButton>
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
                        defaultMessage="To change your Fiscal Host, you first need to empty {type, select, COLLECTIVE {your Collective's balance} FUND {your Fund's balance}}. You can do this by submitting expenses, making financial contributions, or sending the balance to your Fiscal Host using the {emptyBalanceLink} feature."
                        values={{
                          type: collective.type,
                          emptyBalanceLink: (
                            <Link href={`/${collective.slug}/edit/advanced`}>
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
                        <StyledButton
                          buttonStyle="primary"
                          type="submit"
                          onClick={() => this.setState({ showModal: true, action: 'Remove' })}
                          className="removeHostBtn"
                        >
                          <FormattedMessage id="editCollective.host.removeBtn" defaultMessage="Remove Host" />
                        </StyledButton>
                      </p>
                      <Fineprint>
                        <FormattedMessage
                          id="editCollective.host.change.removeFirst"
                          defaultMessage="Without a Fiscal Host, {type, select, COLLECTIVE {your Collective} FUND {your Fund}} won't be able to accept financial contributions. You will be able to apply to another Fiscal Host."
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
                  defaultMessage={'Withdraw application to {name}'}
                />
              )}
            </ModalHeader>
            <ModalBody>
              <P>
                {action === 'Withdraw' && (
                  <FormattedMessage
                    id="collective.editHost.withdrawApp"
                    values={{ name }}
                    defaultMessage={'Are you sure you want to withdraw your application to {name}?'}
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
        <SettingsTitle>
          <FormattedMessage id="Fiscalhost" defaultMessage="Fiscal Host" />
        </SettingsTitle>
        <H4 fontSize="15px" mb={3}>
          <FormattedMessage
            id="acceptContributions.picker.subtitle"
            defaultMessage="Who will hold money on behalf of the Collective?"
          />
        </H4>
        <div id="noHost">
          <Flex>
            <Box flex="0 0 35px" mr={2} pl={2}>
              <StyledInput
                type="radio"
                name="host-radio"
                id="host-radio-noHost"
                checked={selectedOption === 'noHost'}
                onChange={() => this.updateSelectedOption('noHost')}
                className="hostRadio"
              />
            </Box>
            <Box mb={4}>
              <OptionLabel htmlFor="host-radio-noHost">
                <FormattedMessage id="collective.edit.host.noHost.title" defaultMessage="No one" />
              </OptionLabel>
              <FormattedMessage
                id="collective.edit.host.noHost.description"
                defaultMessage="You can't receive financial contributions or use the budget features. You can still edit your profile page, submit expenses to be paid later, and post updates."
              />
            </Box>
          </Flex>
        </div>

        <div id="selfHost">
          <Flex>
            <Box flex="0 0 35px" mr={2} pl={2}>
              <StyledInput
                type="radio"
                name="host-radio"
                id="host-radio-selfHost"
                checked={selectedOption === 'selfHost'}
                onChange={() => this.updateSelectedOption('selfHost')}
                className="hostRadio"
              />
            </Box>
            <Box mb={4}>
              <OptionLabel htmlFor="host-radio-selfHost">
                <FormattedMessage id="acceptContributions.picker.ourselves" defaultMessage="Ourselves" />
              </OptionLabel>
              <FormattedMessage
                id="collective.edit.host.selfHost.description"
                defaultMessage="Simply connect a bank account for a single Collective. You will be responsible for accounting, taxes, payments, and liability."
              />
              {selectedOption === 'selfHost' && LoggedInUser && (
                <Flex
                  flexDirection={['column', 'row', 'row']}
                  justifyContent="space-between"
                  alignItems="flex-end"
                  mt={3}
                >
                  <Box mb={[3]}>
                    <StyledButton
                      buttonStyle="primary"
                      type="submit"
                      onClick={() => this.changeHost({ id: collective.id })}
                    >
                      <FormattedMessage
                        id="host.selfHost.confirm"
                        defaultMessage="Yes, hold money for one Collective in our own bank account"
                      />
                    </StyledButton>
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
        </div>

        <div id="ownHost">
          <Flex>
            <Box flex="0 0 35px" mr={2} pl={2}>
              <StyledInput
                type="radio"
                id="host-radio-ownHost"
                name="host-radio"
                checked={selectedOption === 'ownHost'}
                onChange={() => this.updateSelectedOption('ownHost')}
                className="hostRadio"
              />
            </Box>
            <Box mb={4}>
              <OptionLabel htmlFor="host-radio-ownHost">
                <FormattedMessage id="acceptContributions.organization.subtitle" defaultMessage="Our organization" />
              </OptionLabel>
              <FormattedMessage
                id="collective.edit.host.useOwn.description"
                defaultMessage="Create or select a Fiscal Host that you manage, to hold funds for multiple Collectives. The organization will be responsible for accounting, taxes, payments, and liability."
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
        </div>

        <div id="findHost">
          <Flex>
            <Box flex="0 0 35px" mr={2} pl={2}>
              <StyledInput
                type="radio"
                name="host-radio"
                id="host-radio-findHost"
                checked={selectedOption === 'findHost'}
                onChange={() => this.updateSelectedOption('findHost')}
                className="hostRadio"
              />
            </Box>
            <Box mb={4}>
              <OptionLabel htmlFor="host-radio-findHost">
                <FormattedMessage
                  id="collective.edit.host.findHost.title"
                  defaultMessage="Apply to an existing Fiscal Host"
                />
              </OptionLabel>
              <FormattedMessage
                id="collective.edit.host.findHost.description"
                defaultMessage="You won't need to hold funds or set up a legal entity and bank account for your project. The Fiscal Host will take care of accounting, invoices, taxes, admin, payments, and liability. Most hosts charge a fee for this service (which you can review before choosing a Host)."
              />
              {selectedOption === 'findHost' && (
                <div>
                  <Container display="flex" alignItems="baseline" mt={2}>
                    <H4 fontSize="13px" mr={2}>
                      <FormattedMessage
                        id="collective.edit.host.suggestedHosts.title"
                        defaultMessage="Suggested Hosts"
                      />
                    </H4>
                    <StyledLink as={Link} fontSize="13px" href="/hosts">
                      <FormattedMessage id="collective.edit.host.viewAllHosts" defaultMessage="View all Fiscal Hosts" />
                    </StyledLink>
                  </Container>
                  {collective.tags && collective.tags.length > 0 && (
                    <Container color="#666f80" fontSize="12px">
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
                        defaultMessage="No suggestions. Please look at all Hosts or consider creating a new one."
                      />
                    }
                  />
                </div>
              )}
            </Box>
          </Flex>
        </div>
      </EditCollectiveHostSection>
    );
  }
}

export default withRouter(Host);
