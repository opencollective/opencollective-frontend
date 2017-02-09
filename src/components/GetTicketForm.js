import React from 'react';
import { css } from 'glamor';
import Tier from './Tier';
import SignInUp from './SignInUp';

const styles = {
  getTicketForm: css({
    maxWidth: '400px',
    margin: '20px auto',
    padding: '0px 5px'
  })
};

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
  }

  handleTicketChange(response) {
    this.setState({ response });
  }

  handleSubmit(user) {
    const response = this.state.response;
    response.status = 'YES';
    response.user = user;
    this.props.onSubmit(response);
  }

  render() {
    const label = (this.state.response.quantity > 1) ? 'Get those tickets!' : 'Get this ticket';
    const tier = this.props.tier;
    return (
      <div className={styles.getTicketForm}>
        <Tier tier={tier} quantity={this.props.quantity} onChange={this.handleTicketChange} />
        <SignInUp
          label={label}
          onSubmit={this.handleSubmit}
          requireCreditCard={(this.state.response.amount > 0)}
          stripePublishableKey={this.props.stripePublishableKey}
          />
      </div>
    );
  }
}

export default GetTicketForm;