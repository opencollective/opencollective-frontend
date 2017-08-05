import React from 'react';
import PropTypes from 'prop-types';
import Button from '../components/Button';
import InputField from '../components/InputField';
import EditTiers from '../components/EditTiers';
import { defineMessages, injectIntl } from 'react-intl';
import { defaultBackgroundImage } from '../constants/collective';

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
    this.handleTiersChange = this.handleTiersChange.bind(this);
    
    const collective = { ... props.collective || {} };
    collective.slug = collective.slug ? collective.slug.replace(/.*\//, '') : '';
    this.state = { collective, tiers: collective.tiers || [{}] };

    this.messages = defineMessages({
      'slug.label': { id: 'collective.slug.label', defaultMessage: 'url' },
      'type.label': { id: 'collective.type.label', defaultMessage: 'type' },
      'name.label': { id: 'collective.name.label', defaultMessage: 'name' },
      'amount.label': { id: 'collective.amount.label', defaultMessage: 'amount' },
      'longDescription.label': { id: 'collective.longDescription.label', defaultMessage: 'description' },
      'startsAt.label': { id: 'collective.startsAt.label', defaultMessage: 'start date and time' },
      'image.label': { id: 'collective.image.label', defaultMessage: 'Avatar' },
      'backgroundImage.label': { id: 'collective.backgroundImage.label', defaultMessage: 'Cover image' },
      'location.label': { id: 'collective.location.label', defaultMessage: 'City' }
    });

    collective.backgroundImage = collective.backgroundImage || defaultBackgroundImage[collective.type];

    window.OC = { collective };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.collective && (!this.props.collective || nextProps.collective.name != this.props.collective.name)) {
      this.setState({ collective: nextProps.collective, tiers: nextProps.collective.tiers });
    }
  }

  handleChange(fieldname, value) {
    console.log(">>> handleChange", fieldname, value);
    const collective = {};
    collective[fieldname] = value;
    this.setState( { collective: Object.assign({}, this.state.collective, collective) });
  }

  handleTiersChange(tiers) {
    this.setState({tiers});
  }

  async handleSubmit() {
    const collective = Object.assign({}, this.state.collective);
    collective.tiers = this.state.tiers;
    this.props.onSubmit(collective);
  }

  render() {

    const { collective, loading, intl } = this.props;

    const isNew = !(collective && collective.id);
    const submitBtnLabel = loading ? "loading" : isNew ? "Create Event" : "Save";
    const defaultStartsAt = new Date;
    defaultStartsAt.setHours(19);
    defaultStartsAt.setMinutes(0);

    this.fields = [
      {
        name: 'slug',
        pre: `https://opencollective.com/`,
        placeholder: ''
      },
      {
        name: 'name',
        placeholder: ''
      },
      {
        name: 'description',
        type: 'text',
        placeholder: ''
      },
      {
        name: 'location',
        placeholder: 'Search cities',
        type: 'location',
        options: {
          types: ['cities']
        }
      },
      {
        name: 'longDescription',
        type: 'textarea',
        placeholder: ''
      },
      {
        name: 'image',
        type: 'dropzone',
        placeholder: 'Drop an image or click to upload'
      },
      {
        name: 'backgroundImage',
        type: 'dropzone',
        placeholder: 'Drop an image or click to upload'
      }
    ];

    this.fields = this.fields.map(field => {
      if (this.messages[`${field.name}.label`]) {
        field.label = intl.formatMessage(this.messages[`${field.name}.label`]);
      }
      if (this.messages[`${field.name}.description`]) {
        field.description = intl.formatMessage(this.messages[`${field.name}.description`]);
      }
      return field;
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
        }

        :global(textarea[name=longDescription]) {
          height: 30rem;
        }

        .actions {
          margin: 5rem auto 1rem;
          text-align: center;
        }

        :global(section#location) {
          margin-top: 0;
        }

        :global(.inputField.image) {
          float: left;
          margin-right: 2rem;
          width: 100px
        }

        :global(.backgroundImage-dropzone) {
          width: 400px;
          overflow: hidden;
        }

        :global(.image-dropzone) {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          overflow: hidden
        }
        `}</style>

        <div className="FormInputs">
          <div className="inputs">
            {this.fields.map((field) => <InputField
              key={field.name}
              value={this.state.collective[field.name]}
              defaultValue={field.defaultValue}
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
          { collective.type === 'COLLECTIVE' &&
            <EditTiers title="Tiers" tiers={this.state.tiers} currency={collective.currency} onChange={this.handleTiersChange} />
          }
        </div>
        <div className="actions">
          <Button type="submit" className="green" ref="submit" label={submitBtnLabel} onClick={this.handleSubmit} disabled={loading} />
        </div>
      </div>
    );
  }

}

export default injectIntl(EditCollectiveForm);