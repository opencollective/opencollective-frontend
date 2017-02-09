import React from 'react';
import SignInUp from './SignInUp';
import { css } from 'glamor';
import colors from '../constants/colors';

const styles = {
  InterestedForm: css({
    width: '100%',
    maxWidth: '620px',
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    borderRadius: '0px 0px 10px 10px',
    margin: '0px auto 40px auto',
    padding: '10px 20px 20px 20px'
  })
}

class InterestedForm extends React.Component {

  static propTypes = {
    onSubmit: React.PropTypes.func
  }

  constructor(props) {
    super(props);
    this.onSubmit = props.onSubmit;

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(user) {
    this.onSubmit(user);
  }

  render() {
    return (
      <div className={styles.InterestedForm}>
        <SignInUp label="Remind me" emailOnly={true} showLabels={false} onSubmit={this.handleSubmit} />
      </div>
    );
  }
}

export default InterestedForm;