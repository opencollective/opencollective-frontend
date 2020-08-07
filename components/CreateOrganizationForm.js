import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { defaultBackgroundImage } from '../lib/constants/collectives';

import InputField from './InputField';
import StyledButton from './StyledButton';
import StyledCheckbox from './StyledCheckbox';
import StyledLink from './StyledLink';

class CreateOrganizationForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    loading: PropTypes.bool,
    onSubmit: PropTypes.func,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.defineFields = this.defineFields.bind(this);
    this.addLabels = this.addLabels.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleObjectChange = this.handleObjectChange.bind(this);

    const collective = { ...(props.collective || {}) };
    collective.slug = collective.slug ? collective.slug.replace(/.*\//, '') : '';

    this.messages = defineMessages({
      'name.label': { id: 'Fields.name', defaultMessage: 'Name' },
      'description.label': {
        id: 'collective.description.label',
        defaultMessage: 'Short description',
      },
      'website.label': {
        id: 'Fields.website',
        defaultMessage: 'Website',
      },
      'website.description': {
        id: 'collective.website.description',
        defaultMessage: 'Enter the URL of your website or Facebook Page',
      },
      'tags.label': { id: 'Tags', defaultMessage: 'Tags' },
      'tags.description': {
        id: 'collective.tags.description',
        defaultMessage: 'Tags helps people discover your collective',
      },
      'tos.label': {
        id: 'collective.tos.label',
        defaultMessage: 'Terms of Service',
      },
    });

    collective.backgroundImage = collective.backgroundImage || defaultBackgroundImage[collective.type];

    this.masterKey = '';
    this.state = { modified: false, collective };
    this.defineFields();
    this.addLabels();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.collective &&
      (!prevProps.collective || get(this.props, 'collective.name') !== get(prevProps, 'collective.name'))
    ) {
      this.setState({
        collective: this.props.collective,
        tiers: this.props.collective.tiers,
      });
    }
  }

  defineFields() {
    this.fields = {
      info: [
        {
          name: 'name',
          placeholder: '',
          maxLength: 255,
        },
        {
          name: 'description',
          type: 'text',
          maxLength: 255,
          placeholder: '',
        },
        {
          name: 'website',
          type: 'text',
          maxLength: 255,
          placeholder: '',
        },
        {
          name: 'tags',
          placeholder: 'civic tech, open source, vegan',
          maxLength: 255,
          type: 'tags',
        },
      ],
    };

    this.addLabels();
  }

  addLabels() {
    const { intl } = this.props;
    Object.keys(this.fields).map(key => {
      this.fields[key] = this.fields[key].map(field => {
        if (this.messages[`${field.name}.label`]) {
          field.label = intl.formatMessage(this.messages[`${field.name}.label`]);
        }
        if (this.messages[`${field.name}.description`]) {
          field.description = intl.formatMessage(this.messages[`${field.name}.description`]);
        }
        this.state.collective[field.name] = this.state.collective[field.name] || field.defaultValue;
        return field;
      });
    });
  }

  handleChange(fieldname, value) {
    const collective = {};
    collective[fieldname] = value;
    this.setState({
      modified: true,
      collective: Object.assign({}, this.state.collective, collective),
    });
  }

  handleObjectChange(obj) {
    this.setState({ ...obj, modified: true });
  }

  async handleSubmit() {
    this.props.onSubmit(this.state.collective);
    this.setState({ modified: false });
  }

  render() {
    const { loading, intl } = this.props;

    return (
      <div className="CreateCollectiveForm">
        <style jsx>
          {`
            :global(.field) {
              margin: 1rem;
            }
            :global(label) {
              display: inline-block;
              vertical-align: top;
            }
            :global(input),
            select,
            :global(textarea) {
              width: 300px;
              font-size: 1.5rem;
            }

            .FormInputs {
              max-width: 700px;
              margin: 0 auto;
              overflow-x: hidden;
            }

            .actions {
              margin: 5rem auto 1rem;
              text-align: center;
            }
            .backToProfile {
              font-size: 1.3rem;
              margin: 1rem;
            }
            input[type='checkbox'] {
              width: 25px;
            }
          `}
        </style>
        <style global jsx>
          {`
            section#location {
              margin-top: 0;
            }

            .image .InputTypeDropzone {
              width: 100px;
            }

            .backgroundImage-dropzone {
              max-width: 500px;
              overflow: hidden;
            }

            .user .image-dropzone {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              overflow: hidden;
            }

            .menu {
              text-align: center;
              margin: 1rem 0 3rem 0;
            }
          `}
        </style>
        <div className="FormInputs">
          <div>
            {Object.keys(this.fields).map(key => (
              <div className="inputs" key={key}>
                {this.fields[key].map(
                  field =>
                    (!field.when || field.when()) && (
                      <InputField
                        key={`${this.masterKey}-${field.name}`}
                        value={this.state.collective[field.name]}
                        className={field.className}
                        defaultValue={this.state.collective[field.name] || field.defaultValue}
                        validate={field.validate}
                        ref={field.name}
                        name={field.name}
                        focus={field.focus}
                        label={field.label}
                        description={field.description}
                        options={field.options}
                        placeholder={field.placeholder}
                        type={field.type}
                        help={field.help}
                        pre={field.pre}
                        context={this.state.collective}
                        onChange={value => this.handleChange(field.name, value)}
                        maxLength={field.maxLength}
                      />
                    ),
                )}
              </div>
            ))}

            <div className="tos">
              <label>{intl.formatMessage(this.messages['tos.label'])}</label>
              <div data-cy="tos">
                <StyledCheckbox
                  name="tos"
                  id="oc-tos-checkbox"
                  required
                  onChange={({ target }) => this.handleChange('tos', target.checked)}
                  label={
                    <FormattedMessage
                      id="createcollective.tos.label"
                      defaultMessage="I agree with the {toslink} of Open Collective."
                      values={{
                        toslink: (
                          <StyledLink href="/tos" openInNewTab>
                            <FormattedMessage id="tos" defaultMessage="terms of service" />
                          </StyledLink>
                        ),
                      }}
                    />
                  }
                />
              </div>
            </div>

            <div className="actions">
              <StyledButton
                buttonStyle="primary"
                type="submit"
                onClick={this.handleSubmit}
                disabled={loading || !this.state.modified}
              >
                {loading ? (
                  <FormattedMessage id="loading" defaultMessage="loading" />
                ) : (
                  <FormattedMessage id="organization.create" defaultMessage="Create organization" />
                )}
              </StyledButton>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default injectIntl(CreateOrganizationForm);
