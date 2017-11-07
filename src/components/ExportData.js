import React from 'react';
import PropTypes from 'prop-types';

import { Row, Col, Checkbox, Button, Form } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import { exportMembers } from '../lib/export_file';

class ExportData extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    const { intl } = props;
  }

  render() {
    const { intl, collective } = this.props;

    return (
      <div className="ExportData">
        <style global jsx>{`
          .param {
            vertical-align: top;
          }
        `}</style>

        <h1><FormattedMessage id="export.csv.title" defaultMessage="Export in CSV" /></h1>
        <p><FormattedMessage id="export.csv.description" defaultMessage="Export all your members in CSV (comma separated values) that can be easily imported into any spreadsheet application" /></p>
        <Button onClick={async () => await exportMembers(collective.slug)}><FormattedMessage id="export.all" defaultMessage="Export all members in CSV" /></Button>

        <h1><FormattedMessage id="export.json.title" defaultMessage="Export in JSON" /></h1>
        <p><FormattedMessage id="export.json.description" defaultMessage="Export all your members in JSON to integrate with other applications" /></p>
        <ul>
          <li>All members:<br /><a href={`/${collective.slug}/members/all.json`}>https://opencollective.com/{collective.slug}/members/all.json</a></li>
          <li>Only users:<br /><a href={`/${collective.slug}/members/users.json`}>https://opencollective.com/{collective.slug}/members/users.json</a></li>
          <li>Only organizations:<br /><a href={`/${collective.slug}/members/organizations.json`}>https://opencollective.com/{collective.slug}/members/organizations.json</a></li>
        </ul>

        <h2><FormattedMessage id="export.json.parameters.title" defaultMessage="Parameters" /></h2>
        <table>
          <tr><td className="param">limit</td><td><FormattedMessage id="export.json.parameters.limit" defaultMessage="number of members to return" /></td></tr>
          <tr><td className="param">offset</td><td><FormattedMessage id="export.json.parameters.offset" defaultMessage="number of members to skip (for paging)" /></td></tr>
          <tr><td className="param">TierId</td><td><FormattedMessage id="export.json.parameters.TierId" defaultMessage="only return the members that belong to this TierId. You can find the TierId as part of the URL after selecting a tier on your collective page." /></td></tr>
        </table>
        e.g.<br /><a href={`/${collective.slug}/members/all.json?limit=10&offset=0&TierId=${collective.tiers[0].id}`}>https://opencollective.com/{collective.slug}/members/all.json?limit=10&offset=0&TierId={collective.tiers[0].id}</a>
      </div>
    );
  }

}

export default withIntl(ExportData);