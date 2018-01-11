import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, FormControl } from 'react-bootstrap';
import Payment from 'payment';
import withIntl from '../lib/withIntl';
import { FormattedMessage } from 'react-intl';

class InputTypeCreditCard extends React.Component {

  static propTypes = {
    name: PropTypes.string,
    value: PropTypes.object,
    options: PropTypes.arrayOf(PropTypes.object), // dropdown to select credit card on file
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = { loading: true };
  }

  handleChange(fieldname, value) {
    this.setState({ [fieldname]: value });
    this.props.onChange({ [fieldname]: value });
  }

  componentDidMount() {
    if (typeof stripe !== "undefined") {

      const style = {
        base: {
          // Add your base input styles here. For example:
          fontSize: '16px',
          color: "#32325d",
        }
      };

      const elements = stripe.elements();
      const card = elements.create('card', {style: style});

      // Add an instance of the card Element into the `card-element` <div>
      card.mount('#card-element');
      card.on('ready', () => {
        this.setState({ loading: false });
      })
      card.addEventListener('change', (event) => {
        var displayError = document.getElementById('card-errors');
        if (event.error) {
          this.setState({ error: event.error.message })
        } else {
          this.props.onChange(card);
          this.setState({ error: '' })
        }
      });
      
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.options && nextProps.options.length > 0) {
      if (typeof this.state.uuid !== 'string') {
        this.handleChange("uuid", nextProps.options[0].uuid);
      }
    }
  }

  render() {
    const { intl } = this.props;
    const options = this.props.options || [];
    const showNewCreditCardForm = !(this.state.uuid && this.state.uuid.length === 36);

    return (
      <div className="CreditCardForm">
        <style jsx>{`
        .CreditCardForm {
          max-width: 350px;
          margin: 0;
          border: 1px solid #ccc;
          padding: 1rem;
          max-height: 55px;
          border-radius: 3px;
        }
        .oneline {
          display: flex;
          flex-direction: row;
          margin-top: 0.5rem;
        }
        :global(.creditcardSelector) {
          margin-bottom: 2rem;
        }
      `}</style>

      { options.length > 0 &&
          <FormControl
            componentClass="select"
            className="creditcardSelector"
            type="select"
            name="creditcardSelector"
            onChange={event => this.handleChange("uuid", event.target.value)}
            >
            { options.map(option => {
              const value = option.uuid
              const label = `${option.data.brand} ${option.data.funding} ${option.data.identifier} ${option.data.expMonth}/${option.data.expYear}`;
              return (<option value={value}>{`💳 ${label}`}</option>)
              })
            }
            <option value="">other</option>
          </FormControl>
      }

      { showNewCreditCardForm &&
        <div>
          { this.state.loading &&
            <div className="loading">
              <FormattedMessage id="loading" defaultMessage="loading" />
            </div>
          }
          <div id="card-element"></div>
          <div id="card-errors" role="alert">{this.state.error}</div>
        </div>
        }
    </div>
    );
  }
}

export default withIntl(InputTypeCreditCard);