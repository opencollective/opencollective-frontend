import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { set } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';

import { convertDateFromApiUtc, convertDateToApiUtc } from '../lib/date-utils';

import Container from './Container';
import InputField from './InputField';
import StyledButton from './StyledButton';
import TimezonePicker from './TimezonePicker';

class CreateEventForm extends React.Component {
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
    this.state = {
      event,
      disabled: false,
      showDeleteModal: false,
      validStartDate: true,
      validEndDate: true,
      endsAtDate: dayjs(event.endsAt).tz(event.timezone).format('YYYY-MM-DDTHH:mm'),
      endAtDateTouched: false,
    };

    this.messages = defineMessages({
      'slug.label': { id: 'account.slug.label', defaultMessage: 'Handle' },
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
      'privateInstructions.label': {
        id: 'event.privateInstructions.label',
        defaultMessage: 'Private instructions',
      },
      privateInstructionsDescription: {
        id: 'event.privateInstructions.description',
        defaultMessage: 'These instructions will be provided by email to the participants.',
      },
      inValidDateError: { defaultMessage: 'Please enter a valid date' },
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.event && (!prevProps.event || this.props.event.name !== prevProps.event.name)) {
      this.setState({ event: this.props.event });
    }
  }

  handleChange(fieldname, value) {
    const event = {};

    if (value !== undefined) {
      set(event, fieldname, value);
    }

    if (fieldname === 'startsAt') {
      const isValid = dayjs(value).isValid();
      this.setState({ validStartDate: isValid, disabled: !isValid });
      if (isValid && !this.state.endsAtDateTouched) {
        const endsAtDate = dayjs(value).add(1, 'hour').tz(this.state.event.timezone).format('YYYY-MM-DDTHH:mm');
        this.setState({ endsAtDate });
        event[fieldname] = convertDateToApiUtc(value, this.state.event.timezone);
        event['endsAt'] = convertDateToApiUtc(endsAtDate, this.state.event.timezone);
      }
    } else if (fieldname === 'endsAt') {
      const isValid = dayjs(value).isValid();
      this.setState({ validEndDate: isValid, disabled: !isValid });
      if (isValid) {
        this.setState({ endsAtDate: value, endsAtDateTouched: true });
        event[fieldname] = convertDateToApiUtc(value, this.state.event.timezone);
      }
    } else if (fieldname === 'timezone') {
      if (value) {
        const timezone = this.state.event.timezone;
        const startsAt = this.state.event.startsAt;
        const endsAt = this.state.event.endsAt;
        event.startsAt = convertDateToApiUtc(convertDateFromApiUtc(startsAt, timezone), value);
        event.endsAt = convertDateToApiUtc(convertDateFromApiUtc(endsAt, timezone), value);
        event.timezone = value;
      }
    } else if (fieldname === 'name') {
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
    this.props.onSubmit({ ...this.state.event });
  }

  getFieldDefaultValue(field) {
    if (field.name === 'startsAt' || field.name === 'endsAt') {
      return field.defaultValue;
    } else {
      return this.state.event[field.name] || field.defaultValue;
    }
  }

  render() {
    const { event, loading, intl } = this.props;

    if (!event.parentCollective) {
      return <div />;
    }

    const isNew = !(event && event.id);
    const submitBtnLabel = loading ? 'loading' : isNew ? 'Create Event' : 'Save';

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
        type: 'datetime-local',
        defaultValue: dayjs(this.state.event.startsAt).tz(this.state.event.timezone).format('YYYY-MM-DDTHH:mm'),
        required: true,
        error: !this.state.validStartDate ? intl.formatMessage(this.messages.inValidDateError) : null,
      },
      {
        name: 'endsAt',
        type: 'datetime-local',
        value: this.state.endsAtDate,
        required: true,
        error: !this.state.validEndDate ? intl.formatMessage(this.messages.inValidDateError) : null,
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
      {
        name: 'privateInstructions',
        description: intl.formatMessage(this.messages.privateInstructionsDescription),
        type: 'textarea',
        maxLength: 10000,
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
                  mx="2px"
                  my={2}
                />
              ) : (
                <InputField
                  key={field.name}
                  defaultValue={this.getFieldDefaultValue(field)}
                  value={field.value}
                  validate={field.validate}
                  ref={field.name}
                  name={field.name}
                  label={field.label}
                  description={field.description}
                  placeholder={field.placeholder}
                  type={field.type}
                  error={field.error}
                  pre={field.pre}
                  context={{
                    timezone: this.state.event.timezone,
                  }}
                  onChange={value => this.handleChange(field.name, value)}
                  onKeyDown={event => {
                    if ((field.name === 'startsAt' || field.name === 'endsAt') && event.key === 'Backspace') {
                      event.preventDefault();
                    }
                  }}
                  min={field.min}
                  overflow="hidden"
                  required={field.required}
                />
              ),
            )}
          </div>
        </Container>
        <Container margin="3.15rem auto 0.65rem" textAlign="center">
          <StyledButton
            buttonStyle="primary"
            onClick={this.handleSubmit}
            disabled={this.state.disabled}
            loading={loading}
          >
            {submitBtnLabel}
          </StyledButton>
        </Container>
      </div>
    );
  }
}

export default injectIntl(CreateEventForm);
