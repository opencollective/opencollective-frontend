import React from 'react';
import PropTypes from 'prop-types';

import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import styled from 'styled-components';
import { Flex, Box } from '@rebass/grid';
import { Radio } from '@material-ui/core';
import CreateHostFormWithData from './CreateHostFormWithData';
import HostsWithData from './HostsWithData';
import CollectiveCard from './CollectiveCard';
import Link from './Link';
import InputField from './InputField';
import { formatCurrency, getQueryParams, formatDate } from '../lib/utils';
import { Button } from 'react-bootstrap';

const Option = styled.div`
  h2 {
    margin: 10px 0px 5px 0px;
    font-weight: bold;
  }
`;

const Fineprint = styled.div`
  font-size: 14px;
`;

class EditHost extends React.Component {
  static propTypes = {
    goals: PropTypes.arrayOf(PropTypes.object),
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
    editCollectiveMutation: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.changeHost = this.changeHost.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      selectedOption: 'noHost',
      collective: props.collective,
      currency: props.collective.currency,
    };
  }

  componentDidMount() {
    const queryParams = getQueryParams();
    const HostCollectiveId = Number(queryParams.CollectiveId);
    if (queryParams.message === 'StripeAccountConnected') {
      if (HostCollectiveId && HostCollectiveId !== get(this.props, 'collective.host.id')) {
        this.changeHost({ id: HostCollectiveId });
      }
    }
  }

  handleChange(attr, value) {
    this.setState({ [attr]: value });
  }

  async changeHost(newHost = { id: null }) {
    const { collective } = this.props;
    if (newHost.id === get(collective, 'host.id')) {
      return;
    }
    await this.props.editCollectiveMutation({
      id: collective.id,
      HostCollectiveId: newHost.id,
    });
    if (!newHost.id) {
      this.setState({ selectedOption: 'noHost' });
      if (window.location.search.length > 0) {
        window.location.replace(`/${collective.slug}/edit/host`); // make sure we clean the query params if any
      }
    }
  }

  render() {
    const { LoggedInUser, collective } = this.props;
    const hostMembership = get(collective, 'members', []).find(m => m.role === 'HOST');

    if (get(collective, 'host.id')) {
      return (
        <Flex>
          <Box p={1} mr={3}>
            <CollectiveCard collective={collective.host} membership={hostMembership} />
          </Box>
          <Box>
            {!collective.isActive && (
              <p>
                <FormattedMessage
                  id="editCollective.host.pending"
                  defaultMessage="You have applied to be hosted by {host} on {date}. Your application is being reviewed. As soon as the host accepts, you will be able to start collecting money for your collective."
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
            )}
            <p>
              <FormattedMessage
                id="editCollective.host.label"
                defaultMessage="Your host is {host}. It is currently hosting {collectives, plural, one {one collective} other {{collectives} collectives}}"
                values={{
                  collectives: get(collective, 'host.stats.collectives.hosted'),
                  host: get(collective, 'host.name'),
                }}
              />
            </p>
            {collective.stats.balance > 0 && (
              <p>
                <FormattedMessage
                  id="editCollective.host.balance"
                  defaultMessage="Your host currently holds {balance} on behalf of your collective."
                  values={{
                    balance: formatCurrency(collective.stats.balance, collective.currency),
                  }}
                />
                <br />
                <FormattedMessage
                  id="editCollective.host.change.balanceNotEmpty"
                  defaultMessage="If you would like to change host, you first need to empty your balance by filing expenses or transfering funds to another collective."
                />
              </p>
            )}
            {collective.stats.balance === 0 && (
              <div>
                <p>
                  <Button bsStyle="primary" type="submit" onClick={() => this.changeHost()} className="removeHostBtn">
                    <FormattedMessage id="editCollective.host.removeBtn" defaultMessage="Remove Host" />
                  </Button>
                </p>
                <Fineprint>
                  <FormattedMessage
                    id="editCollective.host.change.removeFirst"
                    defaultMessage="Once removed, you won't be able to accept donations anymore. But you will be able to select another host for your collective."
                  />
                </Fineprint>
              </div>
            )}
          </Box>
        </Flex>
      );
    }

    return (
      <div>
        <style jsx>
          {`
            .suggestedHostsTitle {
              display: flex;
              align-items: baseline;
            }
            .suggestedHostsTitle :global(a) {
              font-size: 1.3rem;
              margin-left: 0.5rem;
            }
            .subtitle {
              color: #666f80;
              font-size: 1.5rem;
            }
            :global(#findHost label) {
              width: 100%;
            }
          `}
        </style>
        <Option id="noHost">
          <Flex>
            <Box width="50px" mr={2}>
              <Radio
                checked={this.state.selectedOption === 'noHost'}
                onChange={() => this.handleChange('selectedOption', 'noHost')}
              />
            </Box>
            <Box mb={4}>
              <h2>
                <FormattedMessage id="collective.edit.host.noHost.title" defaultMessage="No host" />
              </h2>
              <FormattedMessage
                id="collective.edit.host.noHost.description"
                defaultMessage="Without a host, you can't collect money. But you can still use the other features of Open Collective: filing expenses, posting updates, and creating events."
              />
            </Box>
          </Flex>
        </Option>

        <Option id="createHost">
          <Flex>
            <Box width="50px" mr={2}>
              <Radio
                checked={this.state.selectedOption === 'createHost'}
                onChange={() => this.handleChange('selectedOption', 'createHost')}
              />
            </Box>
            <Box mb={4}>
              <h2>
                <FormattedMessage id="collective.edit.host.createHost.title" defaultMessage="Use your own host" />
              </h2>
              <FormattedMessage
                id="collective.edit.host.createHost.description"
                defaultMessage="You can create your own host as an individual or as an organization. You will be responsible for keeping custody of the funds raised by this collective and for paying out the expenses that have been approved."
              />
              &nbsp;
              <a href="https://github.com/opencollective/opencollective/wiki/Becoming-an-Open-Collective-Host">
                <FormattedMessage id="moreInfo" defaultMessage="More info" />
              </a>
              .
              {this.state.selectedOption === 'createHost' && LoggedInUser && (
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
                checked={this.state.selectedOption === 'findHost'}
                onChange={() => this.handleChange('selectedOption', 'findHost')}
              />
            </Box>
            <Box mb={4}>
              <h2>
                <FormattedMessage id="collective.edit.host.findHost.title" defaultMessage="Apply to an existing host" />
              </h2>
              <FormattedMessage
                id="collective.edit.host.findHost.description"
                defaultMessage="With this option, everything is taking care of for you. No need to create a new bank account, no need to worry about accounting and invoicing. All of that is being taken care of by an existing non profit organization that acts as your fiscal host. Note: most hosts charge a commission to cover the administrative overhead. "
              />
              {this.state.selectedOption === 'findHost' && (
                <div>
                  <InputField
                    name="currency"
                    label="What will be the primary currency of your collective?"
                    description=""
                    type="select"
                    options={[
                      { AUD: 'AUD' },
                      { CAD: 'CAD' },
                      { EUR: 'EUR' },
                      { GBP: 'GBP' },
                      { MXN: 'MXN' },
                      { NZD: 'NZD' },
                      { USD: 'USD' },
                    ]}
                    defaultValue={collective.currency}
                    onChange={val => this.handleChange('currency', val)}
                  />
                  <div className="suggestedHostsTitle">
                    <h3>
                      <FormattedMessage
                        id="collective.edit.host.suggestedHosts.title"
                        defaultMessage="Suggested hosts"
                      />
                    </h3>
                    <Link route="/hosts">
                      <FormattedMessage id="collective.edit.host.viewAllHosts" defaultMessage="View all hosts" />
                    </Link>
                  </div>
                  <div className="suggestedHostsDescription subtitle">
                    <FormattedMessage
                      id="collective.edit.host.suggestedHosts.description"
                      defaultMessage="Based on the currency of your collective ({currency}) and the tags ({tags})"
                      values={{
                        tags: collective.tags,
                        currency: this.state.currency,
                      }}
                    />
                    .
                  </div>
                  <HostsWithData
                    limit={6}
                    tags={collective.tags}
                    currency={this.state.currency}
                    empty={
                      <FormattedMessage
                        id="collective.edit.host.suggestedHosts.empty"
                        defaultMessage="No suggestion. Please look at all available hosts or consider creating a new host."
                      />
                    }
                  />
                </div>
              )}
            </Box>
          </Flex>
        </Option>
      </div>
    );
  }
}

export default withIntl(EditHost);
