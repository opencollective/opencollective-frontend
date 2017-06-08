import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, FormattedDate, FormattedMessage } from 'react-intl';
import Button from '../components/Button';
import InputField from '../components/InputField';
import EditTiers from '../components/EditTiers';

class EditEventForm extends React.Component {

  static propTypes = {
    event: PropTypes.object,
    onSubmit: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleTiersChange = this.handleTiersChange.bind(this);
    
    const event = props.event || {};

    this.fields = [
      {
        name: 'slug',
        placeholder: ''
      },
      {
        name: 'name',
        placeholder: ''
      },
      {
        name: 'description',
        type: 'textarea',
        placeholder: ''
      },
      {
        name: 'startsAt',
        type: 'datetime',
        placeholder: ''
      },
      {
        name: 'endsAt',
        type: 'datetime',
        options: {timezone: event.timezone},
        placeholder: ''
      },
      {
        name: 'location',
        placeholder: '',
        type: 'location'
      }
    ];

    this.state = { event, tiers: event.tiers || [{}] };
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
    if (fieldname === 'startsAt') {
      const endsAt = this.state.event.endsAt;
      if (!endsAt || new Date(endsAt) < new Date(value)) {
        event['endsAt'] = value;
      }
    }

    this.setState( { event: Object.assign({}, this.state.event, event) });
  }

  handleTiersChange(tiers) {
    console.log(">>> handleTiersChange", tiers);
    this.setState({tiers});
  }

  async handleSubmit(e) {
    e.preventDefault();
    const event = Object.assign({}, this.state.event);
    event.tiers = this.state.tiers;
    debugger;
    this.props.onSubmit(event);
  }

  render() {

    const { event } = this.props;

    const isNew = !(event && event.id);
    const submitBtnLabel = isNew ? "Create Event" : "Edit Event";

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

        form {
          max-width: 700px;
          margin: 0 auto;
        }

        @media(min-width: 600px) {
          .FormInputs {
            display: flex;
            flex-direction: cols;
          }
        }

        .actions {
          margin: 5rem auto;
          text-align: center;
        }
        `}</style>

        <form onSubmit={this.handleSubmit}>
          <div className="FormInputs">
            <div className="inputs">
              <h2>Event details</h2>
              {this.fields.map((field) => <InputField value={this.state.event[field.name]} ref={field.name} name={field.name} placeholder={field.placeholder} type={field.type} context={this.state.event} onChange={(value) => this.handleChange(field.name, value)} />)}
            </div>
            <EditTiers tiers={this.state.tiers} onChange={this.handleTiersChange} />
          </div>
          <div className="actions">
            <Button type="submit" className="green" label={submitBtnLabel} />
          </div>
        </form>
      </div>
    );
  }

}

export default EditEventForm;