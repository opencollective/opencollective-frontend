import React from 'react';
import Tier from './Tier';
import SignInUp from './SignInUp';
import { FormattedMessage } from 'react-intl';

class GetTicketForm extends React.Component {

  static propTypes = {
    onCancel: React.PropTypes.func.isRequired,
    onSubmit: React.PropTypes.func.isRequired,
    quantity: React.PropTypes.number.isRequired,
    stripePublishableKey: React.PropTypes.string,
    tier: React.PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    const response = {
      amount: this.props.tier.amount,
      quantity: this.props.quantity,
      tier: this.props.tier
    };
    this.state = { response };
    this.handleTicketChange = this.handleTicketChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    if (this.props.tier.name.match(/ticket/i)) {
      this.buttonLabel = (<FormattedMessage id='GetTicketForm.getTicketBtn' values={{quantity: this.state.response.quantity}} defaultMessage={`{quantity, plural, one {Get this ticket} other {Get those tickets}}`} />);
    } else {
      this.buttonLabel = (<FormattedMessage id='GetTicketForm.getTierBtn' values={{name: this.props.tier.name}} defaultMessage={`become a {name}`} />);
    }
  }

  handleTicketChange(response) {
    this.setState({ response });
  }

  handleSubmit(user) {
    const response = this.state.response;
    response.status = 'YES';
    response.user = user;
    response.description = user.description;
    return this.props.onSubmit(response);
  }

  render() {
    const label = (<FormattedMessage id='GetTicketForm.submit' values={{quantity: this.state.response.quantity}} defaultMessage={`{quantity, plural, one {Get this ticket} other {Get those tickets}}`} />);
    const tier = this.props.tier;
    return (
      <div className="GetTicketForm">
        <style jsx>{`
        .GetTicketForm {
          max-width: 45rem;
          margin: 2rem auto;
          padding: 0px 0.5rem;
        }
        `}</style>
        <Tier tier={tier} quantity={this.props.quantity} onChange={this.handleTicketChange} />
        <SignInUp
          label={this.buttonLabel}
          onSubmit={this.handleSubmit}
          requireCreditCard={(this.state.response.amount > 0)}
          stripePublishableKey={this.props.stripePublishableKey}
          />
      </div>
    );
  }
}

export default GetTicketForm;