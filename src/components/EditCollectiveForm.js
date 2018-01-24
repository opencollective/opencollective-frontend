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

class EditCollectiveForm extends React.Component {

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
    this.showSection = this.showSection.bind(this);

    const collective = { ... props.collective || {} };
    collective.slug = collective.slug ? collective.slug.replace(/.*\//, '') : '';

    this.state = {
      modified: false,
      section: 'info',
      collective,
      members: collective.members || [{}],
      tiers: collective.tiers || [{}],
      paymentMethods: collective.paymentMethods || [{}]
    };

    this.showEditTiers = ['COLLECTIVE', 'EVENT'].includes(collective.type);
    this.defaultTierType = collective.type === 'EVENT' ? 'TICKET' : 'TIER';
    this.showEditMembers = ['COLLECTIVE', 'ORGANIZATION'].includes(collective.type);
    this.showPaymentMethods = ['USER', 'ORGANIZATION'].includes(collective.type);
    this.members = collective.members && collective.members.filter(m => ['ADMIN','MEMBER'].includes(m.role));

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
      'location.label': { id: 'collective.location.label', defaultMessage: 'City' }
    });

    collective.backgroundImage = collective.backgroundImage || defaultBackgroundImage[collective.type];

    window.OC = { collective, state: this.state };
  }

  showSection(section) {
    window.location.hash = `#${section}`;
    this.setState({section});
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
    const collective = {
      ...this.state.collective,
      tiers: this.state.tiers,
      members: this.state.members,
      paymentMethods: this.state.paymentMethods
    };
    this.props.onSubmit(collective);
    this.setState({ modified: false })
  }

  render() {

    const { collective, loading, intl } = this.props;

    const isNew = !(collective && collective.id);
    const submitBtnLabel = loading ? "loading" : isNew ? "Create Event" : "Save";
    const defaultStartsAt = new Date;
    const type = collective.type.toLowerCase();
    defaultStartsAt.setHours(19);
    defaultStartsAt.setMinutes(0);

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
        // {
        //   name: 'location',
        //   placeholder: 'Search cities',
        //   type: 'location',
        //   options: {
        //     types: ['cities']
        //   }
        // },
        {
          name: 'longDescription',
          type: 'textarea',
          placeholder: '',
          description: 'Protip: you can use markdown'
        }
      ],
      images: [
        {
          name: 'image',
          type: 'dropzone',
          placeholder: 'Drop an image or click to upload',
          className: 'horizontal',
          when: () => this.state.section === 'images'
        },
        {
          name: 'backgroundImage',
          type: 'dropzone',
          placeholder: 'Drop an image or click to upload',
          className: 'horizontal',
          when: () => this.state.section === 'images'
        }
      ],
      advanced: [
        {
          name: 'slug',
          pre: `https://opencollective.com/`,
          placeholder: '',
          when: () => this.state.section === 'advanced'
        }
      ]
    }


    Object.keys(this.fields).map(fieldname => {
      this.fields[fieldname] = this.fields[fieldname].map(field => {
      if (this.messages[`${field.name}.label`]) {
        field.label = intl.formatMessage(this.messages[`${field.name}.label`]);
      }
      if (this.messages[`${field.name}.description`]) {
        field.description = intl.formatMessage(this.messages[`${field.name}.description`]);
      }
      return field;
      });
    });

    return (
      <div className="EditCollectiveForm">
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

        <div className="menu">
          <ButtonGroup className="menuBtnGroup">
            <Button className="menuBtn info" bsStyle={this.state.section === 'info' ? 'primary' : 'default'} onClick={() => this.showSection('info')}>
              <FormattedMessage id='editCollective.menu.info' defaultMessage='info' />
            </Button>
            <Button className="menuBtn images" bsStyle={this.state.section === 'images' ? 'primary' : 'default'} onClick={() => this.showSection('images')}>
              <FormattedMessage id='editCollective.menu.' defaultMessage='images' />
            </Button>
            { this.showEditMembers &&
              <Button className="menuBtn members" bsStyle={this.state.section === 'members' ? 'primary' : 'default'} onClick={() => this.showSection('members')}>
                <FormattedMessage id='editCollective.menu.members' defaultMessage='members' />
              </Button>
            }
            { this.showEditTiers &&
              <Button className="menuBtn tiers" bsStyle={this.state.section === 'tiers' ? 'primary' : 'default'} onClick={() => this.showSection('tiers')}>
                <FormattedMessage id='editCollective.menu.tiers' defaultMessage='tiers' />
              </Button>
            }
            { this.showPaymentMethods &&
              <Button className="menuBtn paymentMethods" bsStyle={this.state.section === 'paymentMethods' ? 'primary' : 'default'} onClick={() => this.showSection('paymentMethods')}>
                <FormattedMessage id='editCollective.menu.paymentMethods' defaultMessage='Payment Methods' />
              </Button>
            }
            <Button className="menuBtn connectedAccounts" bsStyle={this.state.section === 'connectedAccounts' ? 'primary' : 'default'} onClick={() => this.showSection('connectedAccounts')}>
              <FormattedMessage id='editCollective.menu.connectedAccounts' defaultMessage='Connected Accounts' />
            </Button>
            { collective.type === 'COLLECTIVE' &&
            <Button className="menuBtn export" bsStyle={this.state.section === 'export' ? 'primary' : 'default'} onClick={() => this.showSection('export')}>
              <FormattedMessage id='editCollective.menu.export' defaultMessage='export' />
            </Button>
            }
            <Button className="menuBtn advanced" bsStyle={this.state.section === 'advanced' ? 'primary' : 'default'} onClick={() => this.showSection('advanced')}>
              <FormattedMessage id='editCollective.menu.advanced' defaultMessage='advanced' />
            </Button>
          </ButtonGroup>
        </div>

        <div className="FormInputs">
          { Object.keys(this.fields).map(section => this.state.section === section &&
            <div className="inputs" key={section}>
              {this.fields[section].map((field) => (!field.when || field.when()) && <InputField
                key={field.name}
                className={field.className}
                defaultValue={field.defaultValue || this.state.collective[field.name]}
                validate={field.validate}
                ref={field.name}
                name={field.name}
                label={field.label}
                description={field.description}
                options={field.options}
                placeholder={field.placeholder}
                type={field.type}
                pre={field.pre}
                context={this.state.collective}
                onChange={(value) => this.handleChange(field.name, value)}
                />)}
            </div>
          )}
          { this.state.section === 'members' &&
            <EditMembers title="Edit members" members={this.members} collective={collective} onChange={this.handleObjectChange} />
          }
          { this.state.section === 'tiers' &&
            <EditTiers
              title="Tiers"
              tiers={this.state.tiers}
              collective={collective}
              currency={collective.currency}
              onChange={this.handleObjectChange}
              defaultType={this.defaultTierType}
              />
          }
          { this.state.section === 'paymentMethods' &&
            <EditPaymentMethods
              paymentMethods={this.state.paymentMethods}
              collective={collective}
              onChange={this.handleObjectChange}
              />
          }
          { this.state.section === 'connectedAccounts' &&
            <EditConnectedAccounts
              collective={collective}
              connectedAccounts={collective.connectedAccounts}
              />
          }
          { this.state.section === 'export' &&
            <ExportData
              collective={collective}
              />
          }
        </div>
        { this.state.section !== 'export' &&
          <div className="actions">
            <Button bsStyle="primary" type="submit" ref="submit" onClick={this.handleSubmit} disabled={loading || !this.state.modified} >{submitBtnLabel}</Button>
            <div className="backToProfile">
              <Link route={`/${collective.slug}`}><a><FormattedMessage id="collective.edit.backToProfile" defaultMessage="or go back to the {type} page" values={{ type }} /></a></Link>
            </div>
          </div>
        }
      </div>
    );
  }

}

export default withIntl(EditCollectiveForm);