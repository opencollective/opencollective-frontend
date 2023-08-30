import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { isOneOfTypes } from '../../../lib/collective-sections';
import { CollectiveType } from '../../../lib/constants/collectives';
import { exportMembers } from '../../../lib/export_file';
import { getWebsiteUrl } from '../../../lib/utils';

import Container from '../../Container';
import ExportImages from '../../ExportImages';
import { Box } from '../../Grid';
import StyledButton from '../../StyledButton';
import StyledLink from '../../StyledLink';
import { H4, P } from '../../Text';

import SettingsSectionTitle from './SettingsSectionTitle';

const Export = ({ collective }) => {
  const [isDownloadingCsv, setDownloadingCsv] = React.useState(false);
  const websiteUrl = getWebsiteUrl();
  const widgetCode = `<script src="${websiteUrl}/${collective.slug}/banner.js"></script>`;
  return (
    <div>
      <SettingsSectionTitle mt={2}>
        <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
      </SettingsSectionTitle>
      <P mb={2}>
        <FormattedMessage
          id="ExportContributors.Description"
          defaultMessage="Export your contributor data in {format} format"
          values={{ format: 'CSV' }}
        />
      </P>
      <StyledButton
        minWidth={150}
        loading={isDownloadingCsv}
        onClick={async () => {
          try {
            setDownloadingCsv(true);
            await exportMembers(collective.slug);
          } finally {
            setDownloadingCsv(false);
          }
        }}
      >
        <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
      </StyledButton>

      <SettingsSectionTitle mt={4}>
        <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'JSON' }} />
      </SettingsSectionTitle>
      <p>
        <FormattedMessage
          id="ExportContributors.Description"
          defaultMessage="Export your contributor data in {format} format"
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
                <StyledLink href={`/${collective.slug}/members/all.json`}>
                  {websiteUrl}/{collective.slug}
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
                <StyledLink href={`/${collective.slug}/members/users.json`}>
                  {websiteUrl}/{collective.slug}
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
                <StyledLink href={`/${collective.slug}/members/organizations.json`}>
                  {websiteUrl}/{collective.slug}
                  /members/organizations.json
                </StyledLink>
              ),
            }}
          />
        </li>
      </ul>

      <H4 fontSize="14px" fontWeight="500">
        <FormattedMessage id="export.json.parameters.title" defaultMessage="Parameters" />
      </H4>
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
                defaultMessage="only return contributors that belong to this Tier (select a tier on your Collective page and look at the URL to find its ID)."
              />
            </td>
          </tr>
        </tbody>
      </Container>
      <Container mb={4}>
        {collective.tiers[0] && (
          <div>
            e.g.,
            <br />
            <a href={`/${collective.slug}/members/all.json?limit=10&offset=0&TierId=${collective.tiers[0].id}`}>
              {websiteUrl}/{collective.slug}
              /members/all.json?limit=10&offset=0&TierId=
              {collective.tiers[0].id}
            </a>
          </div>
        )}
        {!collective.tiers[0] && (
          <div>
            e.g.,
            <br />
            <a href={`/${collective.slug}/members/all.json?limit=10&offset=0`}>
              {websiteUrl}/{collective.slug}
              /members/all.json?limit=10&offset=0
            </a>
          </div>
        )}
      </Container>

      {!isOneOfTypes(collective, [CollectiveType.EVENT, CollectiveType.PROJECT]) && (
        <React.Fragment>
          <SettingsSectionTitle>
            <FormattedMessage id="export.widget.title" defaultMessage="Widget" />
          </SettingsSectionTitle>
          <Container as="pre" fontSize="11px" whiteSpace="pre-wrap" mb={4}>
            {widgetCode}
          </Container>
          <Box my={4}>
            <ExportImages collective={collective} />
          </Box>
        </React.Fragment>
      )}
    </div>
  );
};

Export.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    tiers: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
      }),
    ),
  }).isRequired,
};

export default Export;
