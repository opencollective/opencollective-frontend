import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from './Container';
import { Box } from './Grid';
import InputField from './InputField';
import StyledLink from './StyledLink';

const ParameterColumnHeader = styled.th`
  font-size: 12px;
  font-weight: bold;
  padding: 0.1rem 1rem 0.1rem 0;
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
            url: `https://opencollective.com/${collective.slug}/tiers/${tier.slug}/badge.svg?label=${encodedTierName}&color=brightgreen`,
            code: `<img src="https://opencollective.com/${collective.slug}/tiers/${tier.slug}/badge.svg?label=${encodedTierName}&color=brightgreen" />`,
            options: [
              {
                name: 'label',
                description: 'label of the badge',
                defaultValue: `name of the tier (${tier.name})`,
              },
              {
                name: 'color',
                description:
                  'color of the badge (brightgreen, green, yellowgreen, yellow, orange, red, lightgrey, blue)',
                defaultValue: 'brightgreen',
              },
            ],
          },
          {
            name: 'Financial contributors widget',
            url: `https://opencollective.com/${collective.slug}/tiers/${tier.slug}.svg?avatarHeight=36`,
            code: `<object type="image/svg+xml" data="https://opencollective.com/${collective.slug}/tiers/${tier.slug}.svg?avatarHeight=36&width=600"></object>`,
            options: [
              {
                name: 'width',
                description: 'width of the image',
              },
              {
                name: 'height',
                description: 'height of the image',
              },
              {
                name: 'limit',
                description: 'max number of financial contributors to show',
                defaultValue: '(unlimited)',
              },
              {
                name: 'avatarHeight',
                description: 'max height of each avatar / logo',
              },
              {
                name: 'button',
                description: 'show "become a backer/sponsor" button',
                defaultValue: 'true',
              },
              {
                name: 'format',
                description: 'format of the image (replace .svg with .png or .jpg)',
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
        <h1>
          <FormattedMessage id="export.images.title" defaultMessage="Export images" />
        </h1>
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
          <div>
            {tier.images.map(image => (
              <Container key={image.name} mb={4}>
                <label>{image.name}</label>
                <div
                  dangerouslySetInnerHTML={{
                    __html: image.code,
                  }}
                />
                <Box my={1}>
                  <StyledLink fontSize="14px" href={image.url} openInNewTab>
                    {image.url}
                  </StyledLink>
                </Box>
                <Container as="pre" fontSize="11px" maxWidth={880}>
                  {image.code}
                </Container>
                <Container fontSize="14px" mt={3}>
                  <label>
                    <FormattedMessage id="export.json.parameters.title" defaultMessage="Parameters" />
                  </label>
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
          </div>
        )}
        <hr />
        <label>
          <FormattedMessage id="ExportImages.AllFinancial" defaultMessage="All financial contributors badge" />
        </label>
        <div>
          <StyledLink
            fontSize="14px"
            openInNewTab
            href={`https://opencollective.com/${collective.slug}/tiers/badge.svg`}
            target="_blank"
          >
            {`https://opencollective.com/${collective.slug}/tiers/badge.svg`}
          </StyledLink>
        </div>
        <img src={`https://opencollective.com/${collective.slug}/tiers/badge.svg`} />
      </div>
    );
  }
}

export default ExportImages;
