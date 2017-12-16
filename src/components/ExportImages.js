import React from 'react';
import PropTypes from 'prop-types';

import { Row, Col, Checkbox, Button, Form } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import { exportMembers } from '../lib/export_file';
import InputField from './InputField';

class ExportImages extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    const { intl } = props;
    this.state = { tierIndex: 0 };
  }

  render() {
    const { intl, collective } = this.props;

    let i = 0;
    const tiers = collective.tiers.map(tier => {
      return {
        index: i++,
        id: tier.id,
        name: tier.name,
        images: [
          {
            name: "badge",
            url: `https://opencollective.com/${collective.slug}/tiers/${tier.slug}/badge.svg?label=${tier.name}&color=brightgreen`,
            code: `<img src="https://opencollective.com/${collective.slug}/tiers/${tier.slug}/badge.svg?label=${tier.name}&color=brightgreen" />`,
            options: [
              {
                name: "label",
                description: "label of the badge",
                defaultValue: `name of the tier (${tier.name})`
              },
              {
                name: "color",
                description: "color of the badge (brightgreen, green, yellowgreen, yellow, orange, red, lightgrey, blue)",
                defaultValue: "brightgreen"
              }
            ]
          },
          {
            name: "members",
            url: `https://opencollective.com/${collective.slug}/tiers/${tier.slug}.svg?avatarHeight=36`,
            code: `<object type="image/svg+xml" data="https://opencollective.com/${collective.slug}/tiers/${tier.slug}.svg?avatarHeight=36&width=600" />`,
            options: [
              {
                name: "width",
                description: "width of the image"
              },
              {
                name: "height",
                description: "height of the image"
              },
              {
                name: "limit",
                description: "max number of members to show",
                defaultValue: "(unlimited)"
              },
              {
                name: "avatarHeight",
                description: "max height of each avatar / logo"
              },
              {
                name: "showBtn",
                description: `show "become a backer/sponsor" button`,
                defaultValue: "true"
              },
              {
                name: "format",
                description: "format of the image (replace .svg with .png or .jpg)"
              }
            ]
          }
        ]
      }
    });

    const tierOptions = tiers.map(tier => {
      return { [tier.index]: tier.name }
    });
    const tier = tiers[this.state.tierIndex];

    return (
      <div className="ExportImages">
        <style global jsx>{`
          table {
            font-size: 1.3rem;
          }
          table tr td, table tr th {
            vertical-align: top;
            padding: 0.1rem 0.3rem;
          }
          .param {
            font-weight: bold;
            padding-right: 0.5rem;
            font-family: 'Courrier';
          }
          .actions {
            text-align: center;
          }
          .url {
            font-size: 1.4rem;
          }
          .code {
            font-size: 1.4rem;
            font-family: Courrier;
            padding: 0.1rem 0.3rem;
            background: #ddd;
            margin: 0.5rem;
            border: 1px solid #ccc;
          }
        `}</style>

        <h1><FormattedMessage id="export.images.title" defaultMessage="Export images" /></h1>
        <p>You can export images of each tier with the logo/avatar of the contributors.</p>
        <div>
          <InputField
            type="select"
            options={tierOptions}
            onChange={(tierIndex) => this.setState({tierIndex})}
            />
        </div>
        { tier &&
          <div>
            { tier.images.map(image =>
              <div>
                <label>{image.name}</label>
                <div 
                  dangerouslySetInnerHTML={{
                    __html: image.code
                  }}
                  />
                <div className="url"><a href={image.url} target="_blank">{image.url}</a></div>
                <div className="code">{image.code}</div>
                <div>
                  <label>Options:</label>
                  <table><tbody>
                    <tr><th>parameter</th><th>description</th><th>default value</th></tr>
                    { image.options.map(option =>
                      <tr>
                        <th valign="top">{option.name}</th><td valign="top">{option.description}</td><td valign="top">{option.defaultValue}</td>
                      </tr>
                    )}
                  </tbody></table>
                </div>
              </div>
            )}
          </div>
        }
      </div>
    );
  }

}

export default withIntl(ExportImages);