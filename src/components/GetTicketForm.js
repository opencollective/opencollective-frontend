import React from 'react';
import { css } from 'glamor';
import Tier from './Tier';
import SignInUp from './SignInUp';

const styles = {
  getTicketForm: css({
    maxWidth: '400px',
    margin: '20px auto'
  })
};

class GetTicketForm extends React.Component {

  static propTypes = {
    onCancel: React.PropTypes.func.isRequired,
    onClick: React.PropTypes.func.isRequired,    
    quantity: React.PropTypes.number.isRequired,
    tier: React.PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    this.state = { response: {} };
    this.handleTicketChange = this.handleTicketChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleTicketChange(response) {
    this.setState({ response });
  }

  handleSubmit(user) {
    const response = this.state.response;
    response.user = user;
    this.onClick(response);
  }

  render() {
    const label = (this.state.response.quantity > 1) ? 'Get those tickets!' : 'Get this ticket';
    const tier = this.props.tier;
    console.log("Response: ", this.state.response);
    return (      
      <div className={styles.getTicketForm}>
        <Tier tier={tier} onChange={this.handleTicketChange} />
        <SignInUp label={label} onClick={this.handleSubmit} requireCreditCard={(this.state.response.amount > 0)} />
      </div>
    );
  }
}

export default GetTicketForm;