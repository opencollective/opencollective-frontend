import React from 'react';
import PropTypes from 'prop-types';

import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import styled from 'styled-components';
import { Flex, Box } from 'grid-styled';
import { Radio } from '@material-ui/core';
import CreateHostFormWithData from './CreateHostFormWithData';
import CollectivesWithData from './CollectivesWithData';
import CollectiveCard from './CollectiveCard';
import { formatDate, formatCurrency } from '../lib/utils';
import { Button } from 'react-bootstrap';

const Option = styled.div`
  h2 {
    margin: 15px 0px 5px 0px;
    font-weight: bold;
  }
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
    this.state = { selectedOption: 'noHost', collective: props.collective };
  }

  handleChange(attr, value) {
    this.setState({[attr]: value});
  }

  async changeHost(newHost = { id: null }) {
    const { collective } = this.state;
    await this.props.editCollectiveMutation({ id: collective.id, HostCollectiveId: newHost.id });
    this.setState({ selectedOption: 'noHost', collective: { ...collective, host: newHost } });
  }

  render() {
    const { LoggedInUser } = this.props;
    const { collective } = this.state;

    if (get(collective, 'host.id')) {
      return (
        <Flex>
          <Box p={1} mr={3}>
            <CollectiveCard collective={collective.host} />
          </Box>
          <Box>
            <p>
              <FormattedMessage id="host.label" defaultMessage="Hosting {collectives} {collectives, plural, one {collective} other {collectives}} since {since}" values={{collectives: get(collective, 'host.stats.collectives.hosted'), since: formatDate(get(collective, 'host.createdAt'), { month: 'long', year: 'numeric' })}} />
            </p>
            { collective.stats.balance > 0 &&
              <p>
                <FormattedMessage id="host.balance" defaultMessage="Your host currently holds {balance} on behalf of your collective." values={{balance: formatCurrency(collective.stats.balance, collective.currency)}} /><br />
                <FormattedMessage id="host.change.balanceNotEmpty" defaultMessage="If you would like to change host, you first need to empty your balance by filing expenses or transfering funds to another collective." />
              </p>
            }
            { collective.stats.balance === 0 &&
              <div>
                <p>
                  <Button bsStyle="primary" type="submit" onClick={() => this.changeHost()} >
                    <FormattedMessage id="host.removeBtn" defaultMessage="Remove Host" />
                  </Button>
                </p>
                <p>
                  <FormattedMessage id="host.change.removeFirst" defaultMessage="Once removed, you won't be able to accept donations anymore. But you will be able to select another host for your collective." />
                </p>
              </div>
            }
          </Box>
        </Flex>
      );
    }

    return (
      <div>
        <Option>
          <Flex>
            <Box w="50px" mr={2}>
              <Radio
                checked={this.state.selectedOption === "noHost"}
                onChange={() => this.handleChange("selectedOption", "noHost")}
                />
            </Box>
            <Box mb={4}>
              <h2><FormattedMessage id="collective.edit.host.noHost.title" defaultMessage="No host" /></h2>
              <FormattedMessage id="collective.edit.host.noHost.description" defaultMessage="Without a host, you can't collect money. But you can still use the other features of Open Collective: filing expenses, posting updates, and creating events." />
            </Box>
          </Flex>
        </Option>

        <Option>
          <Flex>
            <Box w="50px" mr={2}>
              <Radio
                checked={this.state.selectedOption === "createHost"}
                onChange={() => this.handleChange("selectedOption", "createHost")}
                />
            </Box>
            <Box mb={4}>
              <h2><FormattedMessage id="collective.edit.host.createHost.title" defaultMessage="Use your own host" /></h2>
              <FormattedMessage id="collective.edit.host.createHost.description" defaultMessage="You can create your own host as an individual or as an organization. You will be responsible for keeping custody of the funds raised by this collective and for paying out the expenses that have been approved." />&nbsp;<a href="https://github.com/opencollective/opencollective/wiki/Becoming-an-Open-Collective-Host"><FormattedMessage id="moreInfo" defaultMessage="More info" /></a>.
              { this.state.selectedOption === "createHost" && LoggedInUser &&
                <CreateHostFormWithData
                  collective={collective}
                  LoggedInUser={LoggedInUser}
                  onSubmit={hostCollective => this.changeHost(hostCollective)}
                  />
              }
            </Box>
          </Flex>
        </Option>

        <Option>
          <Flex>
            <Box w="50px" mr={2}>
              <Radio
                checked={this.state.selectedOption === "findHost"}
                onChange={() => this.handleChange("selectedOption", "findHost")}
                />
            </Box>
            <Box mb={4}>
              <h2><FormattedMessage id="collective.edit.host.findHost.title" defaultMessage="Apply to an existing host" /></h2>
              <FormattedMessage id="collective.edit.host.findHost.description" defaultMessage="With this option, everything is taking care of for you. No need to create a new bank account, no need to worry about accounting and invoicing. All of that is being taken care of by an existing non profit organization that acts as your fiscal host. Note: most hosts charge a commission to cover the administrative overhead. " />
              { this.state.selectedOption === "findHost" && LoggedInUser &&
                <CollectivesWithData
                  isPublicHost={true}
                  />
              }
            </Box>
          </Flex>
        </Option>
      </div>
    );
  }
}

export default withIntl(EditHost);