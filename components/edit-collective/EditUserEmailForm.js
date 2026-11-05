import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { isNil } from 'lodash-es';
import { FormattedMessage } from 'react-intl';
import { isEmail } from 'validator';

import { gql } from '../../lib/graphql/helpers';

import { Box } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import StyledInput from '../StyledInput';
import { Span } from '../Text';
import { Button } from '../ui/Button';

import SettingsSectionTitle from './sections/SettingsSectionTitle';

class EditUserEmailForm extends React.Component {
  static propTypes = {
    // From addRequestEmailChangeMutation: requests the change and sends the confirmation email
    requestEmailChange: PropTypes.func.isRequired,

    // From addLoggedInUserEmailData
    data: PropTypes.shape({
      loading: PropTypes.bool,
      me: PropTypes.shape({
        email: PropTypes.string.isRequired,
        emailWaitingForValidation: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    step: 'initial',
    newEmail: null,
    error: null,
    isSubmitting: false,
    isResendingConfirmation: false,
    isTouched: false,
  };

  componentDidMount() {
    this.loadInitialState();
  }

  componentDidUpdate(oldProps) {
    if (oldProps.data.me !== this.props.data.me) {
      this.loadInitialState();
    }
  }

  loadInitialState() {
    const { me: LoggedInUser } = this.props.data;
    if (!LoggedInUser) {
      return;
    }

    this.setState({
      step: LoggedInUser.emailWaitingForValidation ? 'success' : 'initial',
      newEmail: LoggedInUser.emailWaitingForValidation,
    });
  }

  render() {
    const { data, requestEmailChange } = this.props;
    const { loading, me: LoggedInUser = { email: '' } } = data;
    const { step, newEmail, error, isSubmitting, isResendingConfirmation, isTouched } = this.state;
    const isValid = newEmail && isEmail(newEmail);
    const isDone = step === 'already-sent' || step === 'success';

    return (
      <Box mb={50} data-cy="EditUserEmailForm">
        <SettingsSectionTitle>
          <FormattedMessage id="User.EmailAddress" defaultMessage="Email address" />
        </SettingsSectionTitle>
        {LoggedInUser ? (
          <div className="flex flex-col gap-2 md:flex-row">
            <StyledInput
              name="email"
              type="email"
              className="w-full md:w-1/2"
              value={isNil(newEmail) ? LoggedInUser.email : newEmail}
              disabled={!data.me || loading}
              onChange={e => {
                this.setState({ step: 'form', error: null, newEmail: e.target.value, isTouched: true });
              }}
              onBlur={() => {
                if (newEmail && !isValid) {
                  this.setState({
                    error: <FormattedMessage id="error.email.invalid" defaultMessage="Invalid email address" />,
                  });
                }
              }}
            />
            <Button
              disabled={!isTouched || !newEmail || !isValid || isDone}
              loading={isSubmitting}
              variant="outline"
              onClick={async () => {
                this.setState({ isSubmitting: true });
                try {
                  const { data } = await requestEmailChange({ variables: { email: newEmail } });
                  this.setState({
                    step: LoggedInUser.email === newEmail ? 'initial' : 'success',
                    error: null,
                    newEmail: data.requestEmailChange.emailWaitingForValidation || LoggedInUser.email,
                    isSubmitting: false,
                    isTouched: false,
                  });
                } catch (e) {
                  this.setState({ error: e.message, isSubmitting: false });
                }
              }}
            >
              <FormattedMessage id="EditUserEmailForm.submit" defaultMessage="Confirm new email" />
            </Button>
            {step === 'success' && (
              <Button
                minWidth={180}
                disabled={step === 'already-sent'}
                loading={isResendingConfirmation}
                onClick={async () => {
                  this.setState({ isResendingConfirmation: true });
                  try {
                    await requestEmailChange({ variables: { email: newEmail } });
                    this.setState({ isResendingConfirmation: false, step: 'already-sent', error: null });
                  } catch (e) {
                    this.setState({ error: e.message, isResendingConfirmation: false });
                  }
                }}
              >
                <FormattedMessage id="EditUserEmailForm.reSend" defaultMessage="Re-send confirmation" />
              </Button>
            )}
          </div>
        ) : (
          <LoadingPlaceholder height={63} />
        )}
        {error && (
          <Span p={2} color="red.500" fontSize="12px">
            {error}
          </Span>
        )}
        {isDone && (
          <Box>
            <MessageBox display="inline-block" type="success" fontSize="12px" withIcon mt={2}>
              <FormattedMessage
                id="EditUserEmailForm.success"
                defaultMessage="An email with a confirmation link has been sent to {email}. Please click the link to validate your email address."
                values={{ email: <strong>{newEmail}</strong> }}
              />
            </MessageBox>
          </Box>
        )}
      </Box>
    );
  }
}

const loggedInUserEmailQuery = gql`
  query LoggedInUserEmail {
    me {
      id
      email
      emailWaitingForValidation
    }
  }
`;

const addLoggedInUserEmailData = graphql(loggedInUserEmailQuery, {
  options: {
    fetchPolicy: 'network-only',
  },
});

const requestEmailChangeMutation = gql`
  mutation RequestEmailChange($email: EmailAddress!) {
    requestEmailChange(email: $email) {
      id
      email
      emailWaitingForValidation
    }
  }
`;

const addRequestEmailChangeMutation = graphql(requestEmailChangeMutation, {
  name: 'requestEmailChange',
});

export default addRequestEmailChangeMutation(addLoggedInUserEmailData(EditUserEmailForm));
