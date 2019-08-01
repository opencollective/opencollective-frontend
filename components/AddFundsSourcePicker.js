import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { FormControl } from 'react-bootstrap';
import { graphql } from 'react-apollo';
import { defineMessages, injectIntl } from 'react-intl';
import { get, groupBy, sortBy } from 'lodash';
import memoizeOne from 'memoize-one';
import StyledSelect from './StyledSelect';

const CollectiveTypesI18n = defineMessages({
  collective: {
    id: 'collective.types.collective',
    defaultMessage: '{n, plural, one {collective} other {collectives}}',
  },
  organization: {
    id: 'collective.types.organization',
    defaultMessage: '{n, plural, one {organization} other {organizations}}',
  },
  user: {
    id: 'collective.types.user',
    defaultMessage: '{n, plural, one {people} other {people}}',
  },
});

const messages = defineMessages({
  addFundsFromHost: {
    id: 'addfunds.fromCollective.host',
    defaultMessage: 'Host ({host})',
  },
  addFundsFromOther: {
    id: 'addfunds.fromCollective.other',
    defaultMessage: 'other (please specify)',
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
    const FromCollectiveId = option.value;
    this.props.onChange(FromCollectiveId);
  };

  getSelectOptions = memoizeOne((intl, host, PaymentMethod) => {
    if (!host || !PaymentMethod) {
      return [];
    }

    const fromCollectives = get(PaymentMethod, 'fromCollectives.collectives', []).filter(c => c.id !== host.id);
    const collectivesByTypes = groupBy(fromCollectives, m => get(m, 'type'));
    const sortedActiveTypes = Object.keys(collectivesByTypes).sort();

    return [
      // Add funds from host
      {
        value: host.id,
        label: intl.formatMessage(messages.addFundsFromHost, { host: host.name }),
      },
      // Add funds from given collectives
      ...sortedActiveTypes.map(type => {
        const sortedCollectives = sortBy(collectivesByTypes[type], 'name');
        const sectionI18n = CollectiveTypesI18n[type.toLowerCase()];
        const sectionLabel = sectionI18n ? intl.formatMessage(sectionI18n, { n: sortedCollectives.length }) : type;
        return {
          label: sectionLabel,
          options: sortedCollectives.map(collective => ({
            value: collective.id,
            label: collective.name,
          })),
        };
      }),
      // Other
      {
        value: 'other',
        label: intl.formatMessage(messages.addFundsFromOther),
      },
    ];
  });

  render() {
    const { intl, host, data } = this.props;

    return (
      <StyledSelect
        id="sourcePicker"
        isLoading={data.loading}
        disabled={!data.PaymentMethod}
        options={this.getSelectOptions(intl, host, data.PaymentMethod)}
        onChange={this.onChange}
        maxMenuHeight={200}
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
        total
        collectives {
          id
          type
          name
          slug
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
