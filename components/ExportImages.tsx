import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { getWebsiteUrl } from '../lib/utils';

import SettingsSectionTitle from './edit-collective/sections/SettingsSectionTitle';
import Container from './Container';
import { Box } from './Grid';
import InputField from './InputField';
import StyledLink from './StyledLink';
import { Label, Strong } from './Text';

const ParameterColumnHeader = styled.th`
  font-size: 12px;
  font-weight: bold;
  padding: 0.05rem 0.65rem 0.05rem 0;
`;

class ExportImages extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { tierIndex: 0 };
  }

  render() {
    const { collective } = this.props;
    const websiteUrl = getWebsiteUrl();
    if (collective.tiers.length === 0) {
      return <div />;
    }

    const tiers = collective.tiers.map(tier => {
      const encodedTierName = encodeURIComponent(tier.name);
      return {
        id: tier.id,
        name: tier.name,
        images: [
          {
            name: 'Tier badge',
            url: `${websiteUrl}/${collective.slug}/tiers/${tier.slug}/badge.svg?label=${encodedTierName}&color=brightgreen`,
            code: `<img alt="open collective badge" src="${websiteUrl}/${collective.slug}/tiers/${tier.slug}/badge.svg?label=${encodedTierName}&color=brightgreen" />`,
            options: [
              {
                name: 'label',
                description: 'badge label',
                defaultValue: `tier name (${tier.name})`,
              },
              {
                name: 'color',
                description: 'badge color (brightgreen, green, yellowgreen, yellow, orange, red, lightgrey, blue)',
                defaultValue: 'brightgreen',
              },
            ],
          },
          {
            name: 'Financial contributors widget',
            url: `${websiteUrl}/${collective.slug}/tiers/${tier.slug}.svg?avatarHeight=36`,
            code: `<object type="image/svg+xml" data="${websiteUrl}/${collective.slug}/tiers/${tier.slug}.svg?avatarHeight=36&width=600"></object>`,
            options: [
              {
                name: 'width',
                description: 'image width',
              },
              {
                name: 'height',
                description: 'image height',
              },
              {
                name: 'limit',
                description: 'max contributors to show',
                defaultValue: '(unlimited)',
              },
              {
                name: 'avatarHeight',
                description: 'max avatar/logo height',
              },
              {
                name: 'button',
                description: 'show "become a contributor" button',
                defaultValue: 'true',
              },
              {
                name: 'format',
                description: 'image format (replace .svg with .png or .jpg)',
              },
            ],
          },
        ],
      };
    });

    const tierOptions = tiers.map((tier, index) => {
      return { [index]: tier.name };
    });
    const tier = tiers[this.state.tierIndex];

    return (
      <div>
        <SettingsSectionTitle>
          <FormattedMessage id="export.images.title" defaultMessage="Export tier images" />
        </SettingsSectionTitle>
        <p>
          <FormattedMessage
            id="ExportImages.Title"
            defaultMessage="You can export images showing the financial contributors to each tier."
          />
        </p>
        <div>
          <InputField
            name="tiers"
            type="select"
            options={tierOptions}
            onChange={tierIndex => this.setState({ tierIndex })}
          />
        </div>
        {tier && (
          <ul>
            {tier.images.map(image => (
              <Container as="li" key={image.name} mb={4}>
                <Label fontWeight="500">{image.name}</Label>
                <div
                  style={{ maxWidth: '100%' }}
                  dangerouslySetInnerHTML={{
                    __html: image.code,
                  }}
                />
                <Box my={1}>
                  <StyledLink fontSize="14px" href={image.url} openInNewTab>
                    {image.url}
                  </StyledLink>
                </Box>
                <Container as="pre" whiteSpace="pre-wrap" fontSize="11px" maxWidth={880}>
                  {image.code}
                </Container>
                <Container fontSize="14px" mt={3}>
                  <Strong>
                    <FormattedMessage id="export.json.parameters.title" defaultMessage="Parameters" />
                  </Strong>
                  <Container as="table" width="100%" css={{ borderSpacing: 16 }}>
                    <tbody>
                      <tr>
                        <ParameterColumnHeader>
                          <FormattedMessage id="Parameter" defaultMessage="Parameter" />
                        </ParameterColumnHeader>
                        <ParameterColumnHeader>
                          <FormattedMessage id="Fields.description" defaultMessage="Description" />
                        </ParameterColumnHeader>
                        <ParameterColumnHeader>
                          <FormattedMessage id="DefaultValue" defaultMessage="Default value" />
                        </ParameterColumnHeader>
                      </tr>
                      {image.options.map(option => (
                        <tr key={option.name}>
                          <td valign="top">{option.name}</td>
                          <td valign="top">{option.description}</td>
                          <td valign="top">{option.defaultValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Container>
                </Container>
              </Container>
            ))}
          </ul>
        )}
        <SettingsSectionTitle mt={4}>
          <FormattedMessage id="ExportImages.AllFinancial" defaultMessage="All financial contributors badge" />
        </SettingsSectionTitle>
        <Box mb={2}>
          <StyledLink fontSize="14px" openInNewTab href={`${websiteUrl}/${collective.slug}/tiers/badge.svg`}>
            {`${websiteUrl}/${collective.slug}/tiers/badge.svg`}
          </StyledLink>
        </Box>
        <img alt="open collective badge" src={`${websiteUrl}/${collective.slug}/tiers/badge.svg`} />
      </div>
    );
  }
}

export default ExportImages;
