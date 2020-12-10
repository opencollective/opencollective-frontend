import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { exportMembers } from '../../../lib/export_file';

import Container from '../../Container';
import ExportImages from '../../ExportImages';
import StyledButton from '../../StyledButton';
import StyledLink from '../../StyledLink';
import { P } from '../../Text';

class Export extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
  }

  render() {
    const { collective } = this.props;
    const widgetCode = `<script src="https://opencollective.com/${collective.slug}/banner.js"></script>`;

    return (
      <div>
        <h1>
          <FormattedMessage id="export.widget.title" defaultMessage="Widget" />
        </h1>
        <Container as="pre" fontSize="11px">
          {widgetCode}
        </Container>

        <ExportImages collective={collective} />

        <h1>
          <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
        </h1>
        <P textAlign="center">
          <FormattedMessage
            id="ExportContributors.Description"
            defaultMessage="Export your contributors data in {format} format"
            values={{ format: 'CSV' }}
          />
        </P>
        <Container textAlign="center">
          <StyledButton onClick={async () => await exportMembers(collective.slug)}>
            <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
          </StyledButton>
        </Container>

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
              values={{
                link: (
                  <StyledLink display="block" href={`/${collective.slug}/members/all.json`}>
                    https://opencollective.com/
                    {collective.slug}
                    /members/all.json
                  </StyledLink>
                ),
              }}
            />
          </li>
          <li>
            <FormattedMessage
              id="ExportContributors.OnlyIndividuals"
              defaultMessage="Only individuals: {link}"
              values={{
                link: (
                  <StyledLink display="block" href={`/${collective.slug}/members/users.json`}>
                    https://opencollective.com/
                    {collective.slug}
                    /members/users.json
                  </StyledLink>
                ),
              }}
            />
          </li>
          <li>
            <FormattedMessage
              id="ExportContributors.OnlyOrganizations"
              defaultMessage="Only organizations: {link}"
              values={{
                link: (
                  <StyledLink display="block" href={`/${collective.slug}/members/organizations.json`}>
                    https://opencollective.com/
                    {collective.slug}
                    /members/organizations.json
                  </StyledLink>
                ),
              }}
            />
          </li>
        </ul>

        <h2>
          <FormattedMessage id="export.json.parameters.title" defaultMessage="Parameters" />
        </h2>
        <Container as="table" fontSize="14px" mb={3} width="100%" css={{ borderSpacing: 16 }}>
          <tbody>
            <tr>
              <td>limit</td>
              <td>
                <FormattedMessage id="export.json.parameters.limit" defaultMessage="number of contributors to return" />
              </td>
            </tr>
            <tr>
              <td>offset</td>
              <td>
                <FormattedMessage
                  id="export.json.parameters.offset"
                  defaultMessage="number of contributors to skip (for paging)"
                />
              </td>
            </tr>
            <tr>
              <Container as="td" pr={2}>
                TierId
              </Container>
              <td>
                <FormattedMessage
                  id="export.json.parameters.TierId"
                  defaultMessage="only return contributors that belong to this TierID, which you can find in the URL after selecting a tier on your Collective page."
                />
              </td>
            </tr>
          </tbody>
        </Container>
        {collective.tiers[0] && (
          <div>
            e.g.
            <br />
            <a href={`/${collective.slug}/members/all.json?limit=10&offset=0&TierId=${collective.tiers[0].id}`}>
              https://opencollective.com/
              {collective.slug}
              /members/all.json?limit=10&offset=0&TierId=
              {collective.tiers[0].id}
            </a>
          </div>
        )}
        {!collective.tiers[0] && (
          <div>
            e.g.
            <br />
            <a href={`/${collective.slug}/members/all.json?limit=10&offset=0`}>
              https://opencollective.com/
              {collective.slug}
              /members/all.json?limit=10&offset=0
            </a>
          </div>
        )}
      </div>
    );
  }
}

export default Export;
