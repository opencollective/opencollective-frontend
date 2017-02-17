import React from 'react';
import SignInUp from './SignInUp';
import { css } from 'glamor';
import { FormattedMessage } from 'react-intl';

const styles = {
  InterestedPane: css({
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    width: '100%'
  }),
  InterestedForm: css({
    width: '100%',
    background: 'white',
    maxWidth: '500px',
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
      <div className={styles.InterestedPane}>
        <div className={styles.InterestedForm}>
          <SignInUp label={(<FormattedMessage id='InterestedForm.RemindMe' defaultMessage='remind me' />)} emailOnly={true} showLabels={false} onSubmit={this.handleSubmit} />
        </div>
      </div>
    );
  }
}

export default InterestedForm;