import React from 'react';
import PropTypes from 'prop-types';
import Button from '../components/Button';
import InputField from '../components/InputField';
import EditTiers from '../components/EditTiers';
import { defineMessages, injectIntl } from 'react-intl';

class EditEventForm extends React.Component {

  static propTypes = {
    event: PropTypes.object,
    loading: PropTypes.bool,
    onSubmit: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleTiersChange = this.handleTiersChange.bind(this);
    
    const event = { ... props.event || {} };
    event.slug = event.slug ? event.slug.replace(/.*\//, '') : '';
    this.state = { event, tiers: event.tiers || [{}] };

    this.messages = defineMessages({
      'slug.label': { id: 'event.slug.label', defaultMessage: 'url' },
      'type.label': { id: 'event.type.label', defaultMessage: 'type' },
      'name.label': { id: 'event.name.label', defaultMessage: 'name' },
      'amount.label': { id: 'event.amount.label', defaultMessage: 'amount' },
      'longDescription.label': { id: 'event.longDescription.label', defaultMessage: 'description' },
      'startsAt.label': { id: 'event.startsAt.label', defaultMessage: 'start date and time' },
      'endsAt.label': { id: 'event.endsAt.label', defaultMessage: 'end date and time' },
      'location.label': { id: 'event.location.label', defaultMessage: 'location' }
    });

  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.event && (!this.props.event || nextProps.event.name != this.props.event.name)) {
      this.setState({ event: nextProps.event, tiers: nextProps.event.tiers });
    }
  }

  handleChange(fieldname, value) {
    const event = {};
    event[fieldname] = value;

    // Make sure that endsAt is always >= startsAt
    if (fieldname === 'startsAt' || fieldname === 'endsAt') {
      const endsAt = this.state.event.endsAt;
      if (!endsAt || new Date(endsAt) < new Date(value)) {
        event['endsAt'] = value;
      }
    }

    this.setState( { event: Object.assign({}, this.state.event, event) });
  }

  handleTiersChange(tiers) {
    this.setState({tiers});
  }

  async handleSubmit() {
    const event = Object.assign({}, this.state.event);
    event.tiers = this.state.tiers;
    this.props.onSubmit(event);
  }

  render() {

    const { event, loading, intl } = this.props;

    if (!event.parentCollective) return (<div />);

    const isNew = !(event && event.id);
    const submitBtnLabel = loading ? "loading" : isNew ? "Create Event" : "Save";
    const defaultStartsAt = new Date;
    defaultStartsAt.setHours(19);
    defaultStartsAt.setMinutes(0);

    this.fields = [
      {
        name: 'name',
        placeholder: ''
      },
      {
        name: 'longDescription',
        type: 'textarea',
        placeholder: ''
      },
      {
        name: 'startsAt',
        type: 'datetime',
        placeholder: '',
        defaultValue: defaultStartsAt,
        validate: (date) => {
          const yesterday = new Date;
          yesterday.setDate(yesterday.getDate() -1);
          return date.isAfter(yesterday);
        }
      },
      {
        name: 'endsAt',
        type: 'datetime',
        options: {timezone: event.timezone},
        placeholder: '',
        validate: (date) => {
          const yesterday = new Date(this.state.event.startsAt || defaultStartsAt);
          yesterday.setDate(yesterday.getDate() -1);
          return date.isAfter(yesterday);
        }
      },
      {
        name: 'location',
        placeholder: '',
        type: 'location'
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
      <div className="EditEventForm">
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
        `}</style>

        <div className="FormInputs">
          <div className="inputs">
            {this.fields.map((field) => <InputField
              key={field.name}
              value={this.state.event[field.name]}
              defaultValue={field.defaultValue}
              validate={field.validate}
              ref={field.name}
              name={field.name}
              label={field.label}
              description={field.description}
              placeholder={field.placeholder}
              type={field.type}
              pre={field.pre}
              context={this.state.event}
              onChange={(value) => this.handleChange(field.name, value)}
              />)}
          </div>
          <EditTiers title="Tickets" tiers={this.state.tiers} currency={event.parentCollective.currency} onChange={this.handleTiersChange} />
        </div>
        <div className="actions">
          <Button type="submit" className="green" ref="submit" label={submitBtnLabel} onClick={this.handleSubmit} disabled={loading} />
        </div>
      </div>
    );
  }

}

export default injectIntl(EditEventForm);