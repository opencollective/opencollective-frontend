import React from 'react';
import PropTypes from 'prop-types';
import InputField from './InputField';
import { FormattedMessage, defineMessages } from 'react-intl';
import { defaultBackgroundImage } from '../constants/collectives';
import withIntl from '../lib/withIntl';
import { Button } from 'react-bootstrap';
import { get } from 'lodash';
import CollectiveCategoryPicker from './CollectiveCategoryPicker';
import fetch from 'fetch-jsonp';
import { firstSentence } from '../lib/utils';

class CreateCollectiveForm extends React.Component {

  static propTypes = {
    host: PropTypes.object,
    collective: PropTypes.object,
    loading: PropTypes.bool,
    onSubmit: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.defineFields = this.defineFields.bind(this);
    this.addLabels = this.addLabels.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleObjectChange = this.handleObjectChange.bind(this);

    const collective = { ... props.collective || {} };
    collective.slug = collective.slug ? collective.slug.replace(/.*\//, '') : '';

    this.messages = defineMessages({
      'slug.label': { id: 'collective.slug.label', defaultMessage: 'url' },
      'type.label': { id: 'collective.type.label', defaultMessage: 'type' },
      'name.label': { id: 'collective.name.label', defaultMessage: 'name' },
      'company.label': { id: 'collective.company.label', defaultMessage: 'company' },
      'company.description': { id: 'collective.company.description', defaultMessage: 'Start with a @ to reference an organization (e.g. @airbnb)' },
      'amount.label': { id: 'collective.amount.label', defaultMessage: 'amount' },
      'description.label': { id: 'collective.description.label', defaultMessage: 'Short description' },
      'longDescription.label': { id: 'collective.longDescription.label', defaultMessage: 'Long description' },
      'startsAt.label': { id: 'collective.startsAt.label', defaultMessage: 'start date and time' },
      'image.label': { id: 'collective.image.label', defaultMessage: 'Avatar' },
      'backgroundImage.label': { id: 'collective.backgroundImage.label', defaultMessage: 'Cover image' },
      'twitterHandle.label': { id: 'collective.twitterHandle.label', defaultMessage: 'Twitter' },
      'website.label': { id: 'collective.website.label', defaultMessage: 'Website' },
      'location.label': { id: 'collective.location.label', defaultMessage: 'City' },
      'meetup.label': { id: 'collective.meetup.label', defaultMessage: 'Meetup URL' },
      'members.label': { id: 'collective.members.label', defaultMessage: 'Number of members' },
      'tags.label': { id: 'collective.tags.label', defaultMessage: 'Tags' },
      'tags.description': { id: 'collective.tags.description', defaultMessage: 'Tags helps people discover your collective. Separate them with a comma.' },
      'tos.label': { id: 'collective.tos.label', defaultMessage: 'Terms of Service' }
    });

    collective.backgroundImage = collective.backgroundImage || defaultBackgroundImage[collective.type];

    this.masterKey = '';
    this.state = {
      modified: false,
      section: 'info',
      collective
    };

    this.categories = get(props.host, 'settings.categories') || [];
    if (this.categories.length === 1) {
      this.state.collective.category = this.categories[0];
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

  componentWillReceiveProps(nextProps) {
    if (nextProps.collective && (!this.props.collective || get(nextProps, 'collective.name') != get(this.props, 'collective.name'))) {
      this.setState({ collective: nextProps.collective, tiers: nextProps.collective.tiers });
    }
  }

  defineFields(category) {

    this.fields = {
      info: [
        {
          name: 'name',
          placeholder: '',
          maxLength: 255
        },
        {
          name: 'company',
          placeholder: '',
          maxLength: 255,
          when: () => get(this.state, 'collective.type') === 'USER'
        },
        {
          name: 'description',
          type: 'text',
          maxLength: 255,
          placeholder: ''
        },
        {
          name: 'twitterHandle',
          type: 'text',
          pre: 'https://twitter.com/',
          maxLength: 255,
          placeholder: ''
        },
        {
          name: 'website',
          type: 'text',
          pre: 'http://',
          maxLength: 255,
          placeholder: ''
        },
        {
          name: 'location',
          placeholder: 'Search cities',
          type: 'location',
          options: {
            types: ['(cities)']
          }
        },
        {
          name: 'longDescription',
          type: 'textarea',
          placeholder: '',
          help: 'Protip: you can use markdown'
        }
      ]
    }

    if (category === 'meetup') {
      this.fields.info.splice(2, 0, {
        name: 'members',
        type: 'number'
      });
      this.fields.info.unshift({
        name: 'meetup',
        type: 'text',
        pre: 'https://meetup.com/',
        maxLength: 255,
        placeholder: ''
      });
      this.fields.info.push({
        name: 'tags',
        type: 'text',
        maxLength: 255,
        placeholder: 'meetup, nyc, bitcoin'
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
      return window.location = '/opensource/apply';
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
          if (!json) return;
          const { city, localized_location, lat, lon, members, plain_text_description, name, timezone, key_photo, link, created, topics } = json.data;
          Object.assign(collective, { name, timezone })
          collective.description = firstSentence(plain_text_description, 255);
          collective.longDescription = plain_text_description;
          collective.location = { name: city, address: localized_location, lat, long: lon };
          collective.image = get(key_photo, 'highres_link');
          collective.tags = topics && topics.map(t => t.urlkey).join(', ');
          collective.website = link;
          collective.members = members;
          collective.data = {
            created: new Date(created)
          }
          this.masterKey = value; // making sure we recreate the form with new prefilled values
          this.setState( { modified: true, collective: Object.assign({}, this.state.collective, collective) });
          window.state = this.state;
        })
    }
    collective[fieldname] = value;
    this.setState( { modified: true, collective: Object.assign({}, this.state.collective, collective) });
    window.state = this.state;
  }

  handleObjectChange(obj) {
    this.setState({ ...obj, modified: true });
    window.state = this.state;
  }

  async handleSubmit() {
    this.props.onSubmit(this.state.collective);
    this.setState({ modified: false })
  }

  render() {

    const { host, collective, loading, intl } = this.props;

    const showForm = Boolean(this.categories.length === 0 || this.state.collective.category);
    const defaultStartsAt = new Date;
    defaultStartsAt.setHours(19);
    defaultStartsAt.setMinutes(0);

    return (
      <div className="CreateCollectiveForm">
        <style jsx>{`
        :global(.field) {
          margin: 1rem;
        }
        :global(label) {
          width: 150px;
          display: inline-block;
          vertical-align: top;
        }
        :global(input), select, :global(textarea) {
          width: 300px;
          font-size: 1.5rem;
        }

        .FormInputs {
          max-width: 700px;
          margin: 0 auto;
          overflow: hidden;
        }

        :global(textarea[name=longDescription]) {
          height: 30rem;
        }

        .actions {
          margin: 5rem auto 1rem;
          text-align: center;
        }
        .backToProfile {
          font-size: 1.3rem;
          margin: 1rem;
        }
        input[type="checkbox"] {
          width: 25px;
        }
        `}</style>
        <style global jsx>{`
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
          overflow: hidden
        }

        .menu {
          text-align:center;
          margin: 1rem 0 3rem 0;
        }
        `}</style>

        { this.categories.length > 1 && <CollectiveCategoryPicker categories={this.categories} onChange={(value) => this.handleChange("category", value)} /> }

        { showForm &&
          <div className="FormInputs">
            { Object.keys(this.fields).map(key =>
              (<div className="inputs" key={key}>
                {this.fields[key].map((field) => (!field.when || field.when()) && <InputField
                  key={`${this.masterKey}-${field.name}`}
                  value={this.state.collective[field.name]}
                  className={field.className}
                  defaultValue={this.state.collective[field.name] || field.defaultValue}
                  validate={field.validate}
                  ref={field.name}
                  name={field.name}
                  label={field.label}
                  description={field.description}
                  options={field.options}
                  placeholder={field.placeholder}
                  type={field.type}
                  help={field.help}
                  pre={field.pre}
                  context={this.state.collective}
                  onChange={(value) => this.handleChange(field.name, value)}
                  />)}
              </div>)
            )}

            <div className="tos">
              <label>{intl.formatMessage(this.messages['tos.label'])}</label>
              <div>
                <input type="checkbox" name="tos" onChange={(value) => this.handleChange("tos", value)} />
                <span>I agree with the <a href="/tos" target="_blank">terms of service of Open Collective</a></span>
              </div>
              { (get(host, 'settings.tos')) &&
                <div>
                  <input type="checkbox" name="hostTos" onChange={(value) => this.handleChange("hostTos", value)} />
                  <span>I agree with the <a href={get(host, 'settings.tos')} target="_blank">terms of service of the host</a> (<a href={`/${host.slug}`} target="_blank">{host.name}</a>) that will collect money on behalf of our collective</span>
                </div>
              }
            </div>

            <div className="actions">
              <Button bsStyle="primary" type="submit" ref="submit" onClick={this.handleSubmit} disabled={loading || !this.state.modified} >
                { loading && <FormattedMessage id="loading" defaultMessage="loading" /> }
                { !loading && collective.type === 'COLLECTIVE' && <FormattedMessage id="host.apply.btn" defaultMessage="Apply to create a collective" /> }
                { !loading && collective.type === 'ORGANIZATION' && <FormattedMessage id="organization.create" defaultMessage="Create organization" /> }
              </Button>
            </div>

          </div>
        }
      </div>
    );
  }

}

export default withIntl(CreateCollectiveForm);
