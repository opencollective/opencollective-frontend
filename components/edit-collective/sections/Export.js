import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { getEnvVar } from '../../../lib/env-utils';
import { exportHosts, exportMembers } from '../../../lib/export_file';

import { P } from '../../../components/Text';

import ExportImages from '../../ExportImages';
import StyledLink from '../../StyledLink';

class Export extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
  }

  renderStyledLink(path) {
    const restURL = getEnvVar('REST_URL');
    const URL = `${restURL}${path}`;
    return (
      <StyledLink display="block" href={URL}>
        {URL}
      </StyledLink>
    );
  }

  renderCollectivesExport(collective, widgetCode) {
    return (
      <Fragment>
        <h1>
          <FormattedMessage id="export.widget.title" defaultMessage="Widget" />
        </h1>
        <div className="code">{widgetCode}</div>

        <ExportImages collective={collective} />

        <h1>
          <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
        </h1>
        <p>
          <FormattedMessage
            id="ExportContributors.Description"
            defaultMessage="Export your contributors data in {format} format"
            values={{ format: 'CSV' }}
          />
        </p>
        <div className="actions">
          <Button onClick={async () => await exportMembers(collective.slug)}>
            <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
          </Button>
        </div>

        <h1>
          <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'JSON' }} />
        </h1>
        <p>
          <FormattedMessage
            id="ExportContributors.Description"
            defaultMessage="Export your contributors data in {format} format"
            values={{ format: 'JSON' }}
          />
        </p>
        <ul>
          <li>
            <FormattedMessage
              id="ExportContributors.All"
              defaultMessage="All contributors: {link}"
              values={{ link: this.renderStyledLink(`/${collective.slug}/members/all.json`) }}
            />
          </li>
          <li>
            <FormattedMessage
              id="ExportContributors.OnlyIndividuals"
              defaultMessage="Only individuals: {link}"
              values={{ link: this.renderStyledLink(`/${collective.slug}/members/users.json`) }}
            />
          </li>
          <li>
            <FormattedMessage
              id="ExportContributors.OnlyOrganizations"
              defaultMessage="Only organizations: {link}"
              values={{ link: this.renderStyledLink(`/${collective.slug}/members/organizations.json`) }}
            />
          </li>
        </ul>

        <h2>
          <FormattedMessage id="export.json.parameters.title" defaultMessage="Parameters" />
        </h2>
        <table>
          <tbody>
            <tr>
              <td className="param">limit</td>
              <td>
                <FormattedMessage id="export.json.parameters.limit" defaultMessage="number of contributors to return" />
              </td>
            </tr>
            <tr>
              <td className="param">offset</td>
              <td>
                <FormattedMessage
                  id="export.json.parameters.offset"
                  defaultMessage="number of contributors to skip (for paging)"
                />
              </td>
            </tr>
            <tr>
              <td className="param">TierId</td>
              <td>
                <FormattedMessage
                  id="export.json.parameters.TierId"
                  defaultMessage="only return contributors that belong to this TierID, which you can find in the URL after selecting a tier on your Collective page."
                />
              </td>
            </tr>
          </tbody>
        </table>
        {collective.tiers[0] && (
          <div>
            e.g.
            {this.renderStyledLink(
              `/${collective.slug}/members/all.json?limit=10&offset=0&TierId=${collective.tiers[0].id}`,
            )}
          </div>
        )}
        {!collective.tiers[0] && (
          <div>
            e.g.
            {this.renderStyledLink(`/${collective.slug}/members/all.json?limit=10&offset=0`)}
          </div>
        )}
      </Fragment>
    );
  }

  renderHostExports(collective) {
    return (
      <Fragment>
        <h1>
          <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
        </h1>
        <P textAlign="center">
          <FormattedMessage
            id="ExportHostedCollectives.Description"
            defaultMessage="Export your hosted collectives data in {format} format"
            values={{ format: 'CSV' }}
          />
        </P>
        <div className="actions">
          <Button onClick={async () => await exportHosts(collective.slug, 'csv')}>
            <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
          </Button>
        </div>

        <hr />

        <h1>
          <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'JSON' }} />
        </h1>
        <P textAlign="center">
          <FormattedMessage
            id="ExportHostedCollectives.Description"
            defaultMessage="Export your hosted collectives data in {format} format"
            values={{ format: 'JSON' }}
          />
        </P>
        <div className="actions">
          <Button onClick={async () => await exportHosts(collective.slug, 'json')}>
            <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'JSON' }} />
          </Button>
        </div>
      </Fragment>
    );
  }

  render() {
    const { collective } = this.props;
    const widgetCode = `<script src="https://opencollective.com/${collective.slug}/banner.js"></script>`;

    return (
      <div className="ExportData">
        <style global jsx>
          {`
            table tr td {
              vertical-align: top;
            }
            .param {
              font-weight: bold;
              padding-right: 0.5rem;
              font-family: 'Courrier';
            }
            .actions {
              text-align: center;
            }
            .code {
              font-size: 1.4rem;
              font-family: Courrier;
              padding: 0.1rem 0.3rem;
              background: #ddd;
              margin: 0.5rem;
              border: 1px solid #ccc;
            }
          `}
        </style>
        {collective.type === CollectiveType.COLLECTIVE
          ? this.renderCollectivesExport(collective, widgetCode)
          : this.renderHostExports(collective)}
      </div>
    );
  }
}

export default Export;
