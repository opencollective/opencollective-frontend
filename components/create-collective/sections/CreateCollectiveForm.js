import React from 'react';
import PropTypes from 'prop-types';
import InputField from '../../InputField';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { defaultBackgroundImage } from '../../../lib/constants/collectives';
import { Button } from 'react-bootstrap';
import { get } from 'lodash';
import CollectiveCategoryPicker from './CollectiveCategoryPicker';
import fetch from 'fetch-jsonp';
import { firstSentence } from '../../../lib/utils';

class CreateCollectiveForm extends React.Component {
  static propTypes = {
    host: PropTypes.object,
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
      'slug.label': { id: 'collective.slug.label', defaultMessage: 'url' },
      'type.label': { id: 'collective.type.label', defaultMessage: 'Type' },
      'name.label': { id: 'Fields.name', defaultMessage: 'Name' },
      'company.label': {
        id: 'collective.company.label',
        defaultMessage: 'company',
      },
      'company.description': {
        id: 'collective.company.description',
        defaultMessage: 'Start with a @ to reference an organization (e.g. @airbnb)',
      },
      'amount.label': {
        id: 'Fields.amount',
        defaultMessage: 'Amount',
      },
      'description.label': {
        id: 'collective.description.label',
        defaultMessage: 'Short description',
      },
      'startsAt.label': {
        id: 'startDateAndTime',
        defaultMessage: 'start date and time',
      },
      'image.label': { id: 'collective.image.label', defaultMessage: 'Avatar' },
      'backgroundImage.label': {
        id: 'collective.backgroundImage.label',
        defaultMessage: 'Cover image',
      },
      'website.label': {
        id: 'Fields.website',
        defaultMessage: 'Website',
      },
      'website.description': {
        id: 'collective.website.description',
        defaultMessage: 'Enter the URL of your website or Facebook Page',
      },
      'location.label': {
        id: 'collective.location.label',
        defaultMessage: 'City',
      },
      'meetup.label': {
        id: 'collective.meetup.label',
        defaultMessage: 'Meetup URL',
      },
      'members.label': {
        id: 'collective.members.label',
        defaultMessage: 'Number of members',
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
    this.state = {
      modified: false,
      section: 'info',
      collective,
    };

    this.categories = get(props.host, 'settings.apply.categories') || [];

    if (this.categories.length === 1) {
      this.state.collective.category = this.categories[0];
    }

    if (get(props.host, 'settings.apply.defaultValues')) {
      this.state.collective = {
        ...this.state.collective,
        ...props.host.settings.apply.defaultValues,
      };
    }

    this.defineFields(this.state.collective.category);
    this.addLabels();

    window.OC = { collective, state: this.state };
  }

  componentDidMount() {
    const hash = window.location.hash;
    if (hash) {
      this.setState({ section: hash.substr(1) });
    }
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

  defineFields(category) {
    this.fields = {
      info: [
        {
          name: 'name',
          placeholder: '',
          maxLength: 255,
        },
        {
          name: 'company',
          placeholder: '',
          maxLength: 255,
          when: () => get(this.state, 'collective.type') === 'USER',
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

    if (category === 'meetup') {
      this.fields.info.splice(2, 0, {
        name: 'members',
        type: 'number',
      });
      this.fields.info.unshift({
        name: 'meetup',
        type: 'text',
        pre: 'https://meetup.com/',
        maxLength: 255,
        placeholder: '',
      });
      this.fields.info.push({
        name: 'location',
        placeholder: 'Search cities',
        type: 'location',
        options: {
          types: ['(cities)'],
        },
      });
    }

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
    if (fieldname === 'category' && value === 'opensource') {
      return (window.location = '/opensource/apply');
    }

    if (fieldname === 'category') {
      this.defineFields(value);
    }

    const collective = {};
    if (fieldname === 'meetup') {
      fetch(`https://api.meetup.com/${value}?fields=plain_text_description,topics`)
        .then(response => {
          if (response.ok) {
            return response.json();
          }
        })
        .then(json => {
          if (!json || !json.data || json.data.errors) {
            return;
          }
          const {
            city,
            localized_location,
            lat,
            lon,
            members,
            plain_text_description,
            name,
            timezone,
            key_photo,
            link,
            created,
            topics,
          } = json.data;
          Object.assign(collective, { name, timezone });
          collective.description = firstSentence(plain_text_description, 255);
          collective.longDescription = plain_text_description;
          collective.location = {
            name: city,
            address: localized_location,
            lat,
            long: lon,
          };
          collective.image = get(key_photo, 'highres_link');
          collective.tags = topics && topics.map(t => t.urlkey);
          collective.website = link;
          collective.members = members;
          collective.data = {
            created: new Date(created),
          };
          this.masterKey = value; // making sure we recreate the form with new prefilled values
          this.setState({
            modified: true,
            collective: Object.assign({}, this.state.collective, collective),
          });
          window.state = this.state;
        });
    }
    collective[fieldname] = value;
    this.setState({
      modified: true,
      collective: Object.assign({}, this.state.collective, collective),
    });
    window.state = this.state;
  }

  handleObjectChange(obj) {
    this.setState({ ...obj, modified: true });
    window.state = this.state;
  }

  async handleSubmit() {
    this.props.onSubmit(this.state.collective);
    this.setState({ modified: false });
  }

  render() {
    const { host, collective, loading, intl } = this.props;

    console.log(host);
    console.log(this.categories);

    const showForm = Boolean(this.categories.length === 0 || this.state.collective.category);
    const defaultStartsAt = new Date();
    defaultStartsAt.setHours(19);
    defaultStartsAt.setMinutes(0);

    return (
      <div className="CreateCollectiveForm">
        <style jsx>
          {`
            :global(.field) {
              margin: 1rem;
            }
            :global(label) {
              width: 150px;
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
          {this.categories.length > 1 && (
            <CollectiveCategoryPicker onChange={value => this.handleChange('category', value)} />
          )}

          {showForm && (
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
                <div>
                  <input
                    type="checkbox"
                    name="tos"
                    required
                    onChange={({ target }) => this.handleChange('tos', target.checked)}
                  />
                  <span>
                    I agree with the{' '}
                    <a href="/tos" target="_blank" rel="noopener noreferrer">
                      terms of service of Open Collective
                    </a>
                  </span>
                </div>
                {get(host, 'settings.tos') && (
                  <div>
                    <input
                      type="checkbox"
                      name="hostTos"
                      required
                      onChange={({ target }) => this.handleChange('hostTos', target.checked)}
                    />
                    <span>
                      I agree with the{' '}
                      <a href={get(host, 'settings.tos')} target="_blank" rel="noopener noreferrer">
                        the terms of fiscal sponsorship of the host
                      </a>{' '}
                      (
                      <a href={`/${host.slug}`} target="_blank" rel="noopener noreferrer">
                        {host.name}
                      </a>
                      ) that will collect money on behalf of our collective
                    </span>
                  </div>
                )}
              </div>

              <div className="actions">
                <Button
                  bsStyle="primary"
                  type="submit"
                  onClick={this.handleSubmit}
                  disabled={loading || !this.state.modified}
                >
                  {loading && <FormattedMessage id="loading" defaultMessage="loading" />}
                  {!loading && collective.type === 'COLLECTIVE' && (
                    <FormattedMessage id="collective.create.button" defaultMessage="Create Collective" />
                  )}
                  {!loading && collective.type === 'ORGANIZATION' && (
                    <FormattedMessage id="organization.create" defaultMessage="Create organization" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default injectIntl(CreateCollectiveForm);
