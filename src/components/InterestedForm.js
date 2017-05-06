import React from 'react';
import SignInUp from './SignInUp';
import { FormattedMessage } from 'react-intl';

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
      <div className="InterestedPane">
        <style jsx>{`
          .InterestedPane {
            position: absolute;
            display: flex;
            justify-content: center;
            width: 100%;
          }
          .InterestedForm {
            width: 100%;
            background: white;
            max-width: 500px;
            box-shadow: 0px 2px 4px rgba(0,0,0,0.1);
            border-radius: 0px 0px 10px 10px;
            margin: 0px auto 40px auto;
            padding: 10px 20px 20px 20px;
          }
        `}</style>
        <div className="InterestedForm">
          <SignInUp label={(<FormattedMessage id='InterestedForm.RemindMe' defaultMessage='remind me' />)} emailOnly={true} showLabels={false} onSubmit={this.handleSubmit} />
        </div>
      </div>
    );
  }
}

export default InterestedForm;