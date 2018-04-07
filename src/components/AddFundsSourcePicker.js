import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import { capitalize } from '../lib/utils';
import { get, uniqBy, groupBy } from 'lodash';

class AddFundsSourcePicker extends React.Component {

  static propTypes = {
    host: PropTypes.object,
    collective: PropTypes.object,
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.messages = defineMessages({
      "collective": { id: "collective.types.collective", defaultMessage: "{n, plural, one {collective} other {collectives}}" },
      "organization": { id: "collective.types.organization", defaultMessage: "{n, plural, one {organization} other {organizations}}" },
      "user": { id: "collective.types.user", defaultMessage: "{n, plural, one {people} other {people}}" }
    });
  }

  onChange(e) {
    const memberId = e.target.value;
    this.props.onChange(memberId);
  }

  renderSeparator(type) {
    if (!this.membersByType[type]) return;
    const { intl } = this.props;

    let label = intl.formatMessage(this.messages[type.toLowerCase()], { n: this.membersByType[type].length });
    if (label.length % 2 !== 0) {
      label += ' ';
    }

    let dashes = '';
    for (let i=0; i < (40 - label.length) / 2; i++) {
      dashes += '-';
    }

    return (<option value="">{`${dashes} ${(label).toUpperCase()} ${dashes}`}</option>)
  }

  renderSourceEntry(member) {
    return (<option key={`${member.member.type}-${member.member.id}`} value={member.member.id}>{member.member.name}</option>);
  }

  render() {
    const { host, data: { loading, allMembers } } = this.props;
    if (loading) return (<div />);
    const uniqueMembers = uniqBy(allMembers, m => get(m, 'member.id'));
    this.membersByType = groupBy(uniqueMembers, m => get(m, 'member.type'));

    return (
      <FormControl id="sourcePicker" name="template" componentClass="select" placeholder="select" onChange={this.onChange}>
        <option value={host.id}><FormattedMessage id="addfunds.fromCollective.host" values={{ host: host.name}} defaultMessage="Host ({host})"/></option>
        { this.membersByType['COLLECTIVE'].length > 0 && this.renderSeparator("COLLECTIVE") }
        { this.membersByType['COLLECTIVE'].map(this.renderSourceEntry) }

        { this.membersByType['ORGANIZATION'].length > 0 && this.renderSeparator("ORGANIZATION") }
        { this.membersByType['ORGANIZATION'].map(this.renderSourceEntry) }

        { this.membersByType['USER'].length > 0 && this.renderSeparator("USER") }
        { this.membersByType['USER'].map(this.renderSourceEntry) }

        <option value="">---------------</option>
        <option value="other"><FormattedMessage id="addfunds.fromCollective.other" defaultMessage="other (please specify)"/></option>
      </FormControl>
    );
  }

}

const getSourcesQuery = gql`
query allMembers($CollectiveId: Int) {
  allMembers(CollectiveId: $CollectiveId, includeHostedCollectives: true) {
    id
    member {
      id
      type
      name
      slug
    }
  }
}
`;

const addOrganizationsData = graphql(getSourcesQuery, {
  options: (props) => ({
    variables: {
      CollectiveId: props.host.id
    }
  })
});


export default withIntl(addOrganizationsData(AddFundsSourcePicker));