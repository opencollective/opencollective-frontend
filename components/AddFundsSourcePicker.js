import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';

import CollectivePickerAsync from './CollectivePickerAsync';
import StyledSelect from './StyledSelect';

const messages = defineMessages({
  addFundsFromHost: {
    id: 'addfunds.fromCollective.host',
    defaultMessage: 'Host ({host})',
  },
});

class AddFundsSourcePicker extends React.Component {
  static propTypes = {
    host: PropTypes.object,
    onChange: PropTypes.func,
    intl: PropTypes.object.isRequired,
  };

  onChange = option => {
    this.props.onChange(option.value.id);
  };

  render() {
    const { intl, host } = this.props;
    const customOptions = [
      {
        value: { id: host.legacyId || host.id },
        label: intl.formatMessage(messages.addFundsFromHost, { host: host.name }),
      },
    ];

    return (
      <CollectivePickerAsync
        id="sourcePicker"
        onChange={this.onChange}
        maxMenuHeight={200}
        customOptions={customOptions}
        types={['USER', 'ORGANIZATION']}
        creatable
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
    this.props.onChange(e);
  };

  render() {
    const hosts = this.props.LoggedInUser.hostsUserIsAdminOf();
    const hostOptions = [
      { key: 'addfsph-00', value: '' },
      ...hosts.map(h => {
        const value = h.legacyId || h.id;
        return { key: `addfsph-${h.id}`, value: value, label: h.name };
      }),
    ];
    return (
      <div>
        <StyledSelect id="sourcePicker" placeholder="select" options={hostOptions} onChange={this.onChange} />
      </div>
    );
  }
}

export const AddFundsSourcePickerWithData = injectIntl(AddFundsSourcePicker);
export const AddFundsSourcePickerForUserWithData = injectIntl(AddFundsSourcePickerForUser);

// for testing
export const MockAddFundsSourcePicker = injectIntl(AddFundsSourcePicker);
export const MockAddFundsSourcePickerForUser = injectIntl(AddFundsSourcePickerForUser);

export default AddFundsSourcePickerWithData;
