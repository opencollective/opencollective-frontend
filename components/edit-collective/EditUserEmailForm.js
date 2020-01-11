import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { isEmail } from 'validator';
import { Box, Flex } from '@rebass/grid';
import { isNil } from 'lodash';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { addUpdateUserEmailMutation } from '../../lib/graphql/mutations';
import { H2, Span } from '../Text';
import StyledInput from '../StyledInput';
import StyledButton from '../StyledButton';
import MessageBox from '../MessageBox';

class EditUserEmailForm extends React.Component {
  static propTypes = {
    // From withData: A function to call to update user
    updateUserEmail: PropTypes.func.isRequired,

    // from withUser
    data: PropTypes.shape({
      loading: PropTypes.bool,
      LoggedInUser: PropTypes.shape({
        email: PropTypes.string.isRequired,
        emailWaitingForValidation: PropTypes.string,
      }),
      updateUserEmail: PropTypes.shape({
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
    if (oldProps.data.LoggedInUser !== this.props.data.LoggedInUser) {
      this.loadInitialState();
    }
  }

  loadInitialState() {
    const { LoggedInUser } = this.props.data;
    if (!LoggedInUser) {
      return;
    }

    this.setState({
      step: LoggedInUser.emailWaitingForValidation ? 'success' : 'initial',
      newEmail: LoggedInUser.emailWaitingForValidation,
    });
  }

  render() {
    const { data, updateUserEmail } = this.props;
    const { loading, LoggedInUser = { email: '' } } = data;
    const { step, newEmail, error, isSubmitting, isResendingConfirmation, isTouched } = this.state;
    const isValid = newEmail && isEmail(newEmail);
    const isDone = step === 'already-sent' || step === 'success';

    return (
      <Box mb={4} data-cy="EditUserEmailForm">
        <H2>
          <FormattedMessage id="EditUserEmailForm.title" defaultMessage="Email address" />
        </H2>
        <Flex flexWrap="wrap">
          <StyledInput
            name="email"
            type="email"
            value={isNil(newEmail) ? LoggedInUser.email : newEmail}
            mr={3}
            my={2}
            disabled={!data.LoggedInUser || loading}
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
          <Flex my={2}>
            <StyledButton
              minWidth={180}
              disabled={!isTouched || !newEmail || !isValid || isDone}
              loading={isSubmitting}
              mr={2}
              onClick={async () => {
                this.setState({ isSubmitting: true });
                try {
                  const { data } = await updateUserEmail(newEmail);
                  this.setState({
                    step: LoggedInUser.email === newEmail ? 'initial' : 'success',
                    error: null,
                    newEmail: data.updateUserEmail.emailWaitingForValidation || LoggedInUser.email,
                    isSubmitting: false,
                    isTouched: false,
                  });
                } catch (e) {
                  this.setState({ error: e.message.replace('GraphQL error: ', ''), isSubmitting: false });
                }
              }}
            >
              <FormattedMessage id="EditUserEmailForm.submit" defaultMessage="Confirm new email" />
            </StyledButton>

            {isDone && (
              <StyledButton
                minWidth={180}
                disabled={step === 'already-sent'}
                loading={isResendingConfirmation}
                onClick={async () => {
                  this.setState({ isResendingConfirmation: true });
                  try {
                    await updateUserEmail(newEmail);
                    this.setState({ isResendingConfirmation: false, step: 'already-sent', error: null });
                  } catch (e) {
                    this.setState({ error: e.message.replace('GraphQL error: ', ''), isResendingConfirmation: false });
                  }
                }}
              >
                <FormattedMessage id="EditUserEmailForm.reSend" defaultMessage="Re-send confirmation" />
              </StyledButton>
            )}
          </Flex>
        </Flex>
        {error && (
          <Span p={2} color="red.500" fontSize="Caption">
            {error}
          </Span>
        )}
        {isDone && (
          <Box>
            <MessageBox display="inline-block" type="success" withIcon mt={2}>
              <FormattedMessage
                id="EditUserEmailForm.success"
                defaultMessage="An email with a confirmation link has been sent to {email}."
                values={{ email: <strong>{newEmail}</strong> }}
              />
            </MessageBox>
          </Box>
        )}
      </Box>
    );
  }
}

const withUserEmail = graphql(
  gql`
    query LoggedInUserEmail {
      LoggedInUser {
        id
        email
        emailWaitingForValidation
      }
    }
  `,
  {
    options: {
      fetchPolicy: 'network-only',
    },
  },
);

export default addUpdateUserEmailMutation(withUserEmail(EditUserEmailForm));
