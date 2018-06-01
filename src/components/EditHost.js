import React from 'react';
import PropTypes from 'prop-types';

import { get } from 'lodash';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import InputField from './InputField';
import styled from 'styled-components';
import { Flex, Box } from 'grid-styled';
import { Radio } from '@material-ui/core';
import CreateHostFormWithData from './CreateHostFormWithData';
import CollectiveCard from './CollectiveCard';
import { formatDate } from '../lib/utils';

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
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    const { intl } = props;
    this.handleChange = this.handleChange.bind(this);
    this.state = { selectedOption: "noHost" };
  }

  handleChange(attr, value) {
    this.setState({[attr]: value});
  }

  render() {
    const { LoggedInUser, collective } = this.props;
    console.log(">>> collective", collective);
    if (collective.host) {
      return (
        <Flex>
          <Box p={1} mr={3}>
            <CollectiveCard collective={collective.host} />
          </Box>
          <Box>
            <FormattedMessage id="host.label" defaultMessage="Hosting {collectives} collectives since {since}" values={{collectives: get(collective, 'host.stats.collectives.hosted'), since: formatDate(get(collective, 'host.createdAt'), { month: 'long', year: 'numeric' })}} />
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
              <h2><FormattedMessage id="collective.edit.host.createHost.title" defaultMessage="Create your own host" /></h2>
              <FormattedMessage id="collective.edit.host.createHost.description" defaultMessage="You can create your own host as an individual or as a legal entity. You will be responsible for keeping custody of the funds raised by this collective and for paying out the expenses that have been approved." />
              { this.state.selectedOption === "createHost" && LoggedInUser &&
                <CreateHostFormWithData
                  collective={collective}
                  LoggedInUser={LoggedInUser}
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
            </Box>
          </Flex>
        </Option>
      </div>
    );
  }
}

export default withIntl(EditHost);