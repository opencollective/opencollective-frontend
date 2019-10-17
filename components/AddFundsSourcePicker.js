import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { FormControl } from 'react-bootstrap';
import { graphql } from 'react-apollo';
import { defineMessages, injectIntl } from 'react-intl';
import { get } from 'lodash';
import CollectivePicker from './CollectivePicker';

const messages = defineMessages({
  addFundsFromHost: {
    id: 'addfunds.fromCollective.host',
    defaultMessage: 'Host ({host})',
  },
  addFundsFromOther: {
    id: 'addfunds.fromCollective.other',
    defaultMessage: 'Other (please specify)',
  },
});

class AddFundsSourcePicker extends React.Component {
  static propTypes = {
    host: PropTypes.object,
    paymentMethod: PropTypes.object.isRequired,
    collective: PropTypes.object,
    onChange: PropTypes.func,
    intl: PropTypes.object.isRequired,
    data: PropTypes.object,
  };

  onChange = option => {
    if (option.value === 'other') {
      this.props.onChange('other');
    } else {
      this.props.onChange(option.value.id);
    }
  };

  render() {
    const { intl, host, data } = this.props;
    const customOptions = [
      { value: { id: host.id }, label: intl.formatMessage(messages.addFundsFromHost, { host: host.name }) },
      { value: 'other', label: intl.formatMessage(messages.addFundsFromOther) },
    ];

    return (
      <CollectivePicker
        id="sourcePicker"
        isLoading={data.loading}
        disabled={!data.PaymentMethod}
        onChange={this.onChange}
        maxMenuHeight={200}
        collectives={get(data.PaymentMethod, 'fromCollectives.collectives', []).filter(c => c.id !== host.id)}
        getDefaultOptions={() => customOptions[0]}
        customOptions={customOptions}
      />
    );
  }
}

class AddFundsSourcePickerForUser extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    LoggedInUser: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { loading: true };
  }

  onChange = async e => {
    this.props.onChange(e.target.value);
  };

  render() {
    const hosts = this.props.LoggedInUser.hostsUserIsAdminOf();
    return (
      <div>
        <FormControl
          id="sourcePicker"
          name="template"
          componentClass="select"
          placeholder="select"
          onChange={this.onChange}
        >
          <option value="" key="addfsph-00" />
          {hosts.map(h => (
            <option value={h.id} key={`addfsph-${h.id}`}>
              {h.name}
            </option>
          ))}
        </FormControl>
      </div>
    );
  }
}

const getSourcesQuery = gql`
  query PaymentMethod($id: Int!) {
    PaymentMethod(id: $id) {
      id
      fromCollectives {
        id
        total
        collectives {
          id
          type
          name
          slug
          imageUrl
        }
      }
    }
  }
`;

const addOrganizationsData = graphql(getSourcesQuery, {
  options: props => ({
    variables: {
      id: props.paymentMethod.id,
    },
  }),
});

export const AddFundsSourcePickerWithData = injectIntl(addOrganizationsData(AddFundsSourcePicker));

export const AddFundsSourcePickerForUserWithData = injectIntl(AddFundsSourcePickerForUser);

// for testing
export const MockAddFundsSourcePicker = injectIntl(AddFundsSourcePicker);
export const MockAddFundsSourcePickerForUser = injectIntl(AddFundsSourcePickerForUser);

export default AddFundsSourcePickerWithData;
