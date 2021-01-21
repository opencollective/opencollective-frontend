import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';

import Tickets from './edit-collective/sections/Tickets';
import Container from './Container';
import InputField from './InputField';
import StyledButton from './StyledButton';
import TimezonePicker from './TimezonePicker';

class EditEventForm extends React.Component {
  static propTypes = {
    event: PropTypes.object,
    loading: PropTypes.bool,
    onSubmit: PropTypes.func,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleTimezoneChange = this.handleTimezoneChange.bind(this);

    const event = { ...(props.event || {}) };
    event.slug = event.slug ? event.slug.replace(/.*\//, '') : '';
    this.state = { event, tiers: event.tiers || [{}], disabled: false, showDeleteModal: false };

    this.messages = defineMessages({
      'slug.label': { id: 'collective.slug.label', defaultMessage: 'url' },
      'type.label': { id: 'event.type.label', defaultMessage: 'Type' },
      'name.label': { id: 'Fields.name', defaultMessage: 'Name' },
      'amount.label': { id: 'Fields.amount', defaultMessage: 'Amount' },
      'description.label': {
        id: 'collective.description.label',
        defaultMessage: 'Short description',
      },
      'longDescription.label': {
        id: 'event.longDescription.label',
        defaultMessage: 'Long description',
      },
      'startsAt.label': {
        id: 'startDateAndTime',
        defaultMessage: 'start date and time',
      },
      'endsAt.label': {
        id: 'event.endsAt.label',
        defaultMessage: 'end date and time',
      },
      'location.label': {
        id: 'event.location.label',
        defaultMessage: 'location',
      },
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.event && (!prevProps.event || this.props.event.name !== prevProps.event.name)) {
      this.setState({ event: this.props.event, tiers: this.props.event.tiers });
    }
  }

  handleChange(fieldname, value) {
    const event = {};
    event[fieldname] = value;

    // Make sure that endsAt is always >= startsAt
    if (fieldname === 'startsAt') {
      const endsAt = this.state.event.endsAt;
      if (!endsAt || new Date(endsAt) < new Date(value)) {
        let newEndDate = new Date(value);
        if (!endsAt) {
          newEndDate.setHours(newEndDate.getHours() + 2);
        } else {
          // https://github.com/opencollective/opencollective/issues/1232
          const endsAtDate = new Date(endsAt);
          newEndDate = new Date(value);
          newEndDate.setHours(endsAtDate.getHours());
          newEndDate.setMinutes(endsAtDate.getMinutes());
        }
        value = newEndDate.toString();
        event['endsAt'] = value;
      }
    }

    if (fieldname === 'name') {
      if (!event['name'].trim()) {
        this.setState({ disabled: true });
      } else {
        this.setState({ disabled: false });
      }
    }

    this.setState(state => {
      return { event: { ...state.event, ...event } };
    });
  }

  handleTimezoneChange(timezone) {
    this.handleChange('timezone', timezone.value);
  }

  async handleSubmit() {
    this.props.onSubmit({ ...this.state.event, tiers: this.state.tiers });
  }

  render() {
    const { event, loading, intl } = this.props;

    if (!event.parentCollective) {
      return <div />;
    }

    const isNew = !(event && event.id);
    const submitBtnLabel = loading ? 'loading' : isNew ? 'Create Event' : 'Save';
    const defaultStartsAt = new Date();
    defaultStartsAt.setHours(19);
    defaultStartsAt.setMinutes(0);

    this.fields = [
      {
        name: 'name',
        maxLength: 255,
        placeholder: '',
      },
      {
        name: 'description',
        type: 'text',
        maxLength: 255,
        placeholder: '',
      },
      {
        name: 'startsAt',
        type: 'datetime',
        placeholder: '',
        defaultValue: defaultStartsAt,
        validate: date => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return date.isAfter(yesterday);
        },
      },
      {
        name: 'endsAt',
        type: 'datetime',
        options: { timezone: event.timezone },
        placeholder: '',
        validate: date => {
          const yesterday = new Date(this.state.event.startsAt || defaultStartsAt);
          yesterday.setDate(yesterday.getDate() - 1);
          return date.isAfter(yesterday);
        },
      },
      {
        name: 'timezone',
        type: 'TimezonePicker',
      },
      {
        name: 'location',
        placeholder: '',
        type: 'location',
      },
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
        <Container maxWidth="700px" margin="0 auto">
          <div className="inputs">
            {this.fields.map(field =>
              field.name === 'timezone' ? (
                <TimezonePicker
                  key={field.name}
                  label="Timezone"
                  selectedTimezone={this.state.event.timezone}
                  onChange={this.handleTimezoneChange}
                  mb={2}
                />
              ) : (
                <InputField
                  key={field.name}
                  defaultValue={this.state.event[field.name] || field.defaultValue}
                  validate={field.validate}
                  ref={field.name}
                  name={field.name}
                  label={field.label}
                  description={field.description}
                  placeholder={field.placeholder}
                  type={field.type}
                  pre={field.pre}
                  context={{
                    timezone: this.state.event.timezone,
                  }}
                  onChange={value => this.handleChange(field.name, value)}
                />
              ),
            )}
          </div>
          {['e2e', 'ci'].includes(process.env.OC_ENV) && (
            <Tickets
              title="Tickets"
              types={['TICKET']}
              tiers={this.state.tiers}
              collective={{ ...event, type: 'EVENT' }}
              currency={event.parentCollective.currency}
              onChange={tiers => this.setState({ tiers })}
              defaultType="TICKET"
            />
          )}
        </Container>
        <Container margin="5rem auto 1rem" textAlign="center">
          <StyledButton
            className="save"
            buttonStyle="primary"
            onClick={this.handleSubmit}
            disabled={this.state.disabled ? true : loading}
          >
            {submitBtnLabel}
          </StyledButton>
        </Container>
      </div>
    );
  }
}

export default injectIntl(EditEventForm);
