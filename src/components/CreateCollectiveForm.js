import React from 'react';
import PropTypes from 'prop-types';
import InputField from '../components/InputField';
import EditTiers from '../components/EditTiers';
import EditMembers from '../components/EditMembers';
import EditPaymentMethods from '../components/EditPaymentMethods';
import EditConnectedAccounts from '../components/EditConnectedAccounts';
import ExportData from '../components/ExportData';
import { FormattedMessage, defineMessages } from 'react-intl';
import { defaultBackgroundImage } from '../constants/collectives';
import withIntl from '../lib/withIntl';
import { ButtonGroup, Button } from 'react-bootstrap';
import { Link } from '../server/pages';

class CreateCollectiveForm extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    loading: PropTypes.bool,
    onSubmit: PropTypes.func
  };

  constructor(props) {
    super(props);
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
      'category.label': { id: 'collective.category.label', defaultMessage: 'Category' },
      'association': { id: 'collective.category.association', defaultMessage: 'Association' },
      'pta': { id: 'collective.category.pta', defaultMessage: 'Parent Teacher Association' },
      'other': { id: 'collective.category.other', defaultMessage: 'Other' },
      'studentclub': { id: 'collective.category.studentclub', defaultMessage: 'Student Club' },
      'meetup': { id: 'collective.category.meetup', defaultMessage: 'Meetup' },
      'movement': { id: 'collective.category.movement', defaultMessage: 'Movement' },
      'neighborhood': { id: 'collective.category.neighborhood', defaultMessage: 'Neighborhood Association' },
      'opensource': { id: 'collective.category.opensource', defaultMessage: 'Open Source Project' },
      'politicalparty': { id: 'collective.category.politicalparty', defaultMessage: 'Political Party' },
      'lobby': { id: 'collective.category.lobby', defaultMessage: 'Lobbying Group' },
      'coop': { id: 'collective.category.coop', defaultMessage: 'Cooperative' }
    });

    collective.backgroundImage = collective.backgroundImage || defaultBackgroundImage[collective.type];

    const getOptions = (arr) => {
      return arr.map(key => {
        const obj = {};
        obj[key] = props.intl.formatMessage(this.messages[key]);
        return obj;
      })
    }

    this.fields = {
      info: [
        {
          name: 'name',
          placeholder: ''
        },
        {
          name: 'company',
          placeholder: '',
          when: () => collective.type === 'USER'
        },
        {
          name: 'description',
          type: 'text',
          placeholder: ''
        },
        {
          name: 'twitterHandle',
          type: 'text',
          pre: 'https://twitter.com/',
          placeholder: ''
        },
        {
          name: 'website',
          type: 'text',
          pre: 'http://',
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
        },
        {
          name: 'category',
          type: 'select',
          defaultValue: "association",
          options: getOptions(["association","coop","lobby","meetup","movement","neighborhood","opensource","politicalparty","pta","studentclub","other"])
        }
      ]
    }

    this.state = {
      modified: false,
      section: 'info',
      collective
    };
    this.fields.info.map(field => {
    });

    Object.keys(this.fields).map(key => {
      this.fields[key] = this.fields[key].map(field => {
      if (this.messages[`${field.name}.label`]) {
        field.label = props.intl.formatMessage(this.messages[`${field.name}.label`]);
      }
      if (this.messages[`${field.name}.description`]) {
        field.description = props.intl.formatMessage(this.messages[`${field.name}.description`]);
      }
      this.state.collective[field.name] = this.state.collective[field.name] || field.defaultValue;
      return field;
      });
    });

    window.OC = { collective, state: this.state };

  }

  componentDidMount() {
    const hash = window.location.hash;
    if (hash) {
      this.setState({ section: hash.substr(1) });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.collective && (!this.props.collective || nextProps.collective.name != this.props.collective.name)) {
      this.setState({ collective: nextProps.collective, tiers: nextProps.collective.tiers });
    }
  }

  handleChange(fieldname, value) {
    const collective = {};
    collective[fieldname] = value;
    this.setState( { modified: true, collective: Object.assign({}, this.state.collective, collective) });
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

    const { collective, loading, intl } = this.props;

    const isNew = !(collective && collective.id);
    const defaultStartsAt = new Date;
    const type = collective.type.toLowerCase();
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

        <div className="FormInputs">
          { Object.keys(this.fields).map(key => this.state.section === key &&
            <div className="inputs">
              {this.fields[key].map((field) => (!field.when || field.when()) && <InputField
                key={field.name}
                value={this.state.collective[field.name]}
                className={field.className}
                defaultValue={field.defaultValue}
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
            </div>
          )}
        </div>
        <div className="actions">
          <Button bsStyle="primary" type="submit" ref="submit" onClick={this.handleSubmit} disabled={loading || !this.state.modified} >
            { loading && <FormattedMessage id="loading" defaultMessage="loading" /> }
            { !loading && collective.type === 'COLLECTIVE' && <FormattedMessage id="host.apply" defaultMessage="Apply to create a collective" /> }
            { !loading && collective.type === 'ORGANIZATION' && <FormattedMessage id="organization.create" defaultMessage="Create organization" /> }
          </Button>
        </div>
      </div>
    );
  }

}

export default withIntl(CreateCollectiveForm);