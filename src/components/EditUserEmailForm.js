import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { isEmail } from 'validator';
import { Box, Flex } from '@rebass/grid';
import { H2, Span } from './Text';
import StyledInput from './StyledInput';
import StyledButton from './StyledButton';
import MessageBox from './MessageBox';
import { addUpdateUserEmailMutation } from '../graphql/mutations';

const EditUserEmailForm = ({ user, updateUserEmail }) => {
  const [step, setStep] = useState(user.emailWaitingForValidation ? 'success' : 'initial');
  const [newEmail, setNewEmail] = useState(user.emailWaitingForValidation);
  const [error, setError] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const isValid = newEmail && isEmail(newEmail);
  const isDone = step === 'already-sent' || step === 'success';

  return (
    <Box my={4} data-cy="EditUserEmailForm">
      <H2>
        <FormattedMessage id="EditUserEmailForm.title" defaultMessage="Email address" />
      </H2>
      <Flex flexWrap="wrap">
        <StyledInput
          name="email"
          type="email"
          disabled={step !== 'form'}
          value={newEmail !== null ? newEmail : user.email}
          mr={3}
          my={2}
          onChange={e => {
            setError(false);
            setNewEmail(e.target.value);
          }}
          onBlur={() =>
            !isValid && setError(<FormattedMessage id="error.email.invalid" defaultMessage="Invalid email address" />)
          }
        />
        <Flex my={2}>
          {step === 'form' ? (
            <StyledButton
              disabled={!newEmail || !isValid || isDone}
              loading={isSubmitting}
              mr={2}
              onClick={async () => {
                setSubmitting(true);
                try {
                  const { data } = await updateUserEmail(newEmail);
                  setStep(newEmail === user.email ? 'initial' : 'success');
                  setNewEmail(data.updateUserEmail.emailWaitingForValidation || user.email);
                  setError(null);
                } catch (e) {
                  setError(e.message.replace('GraphQL error: ', ''));
                }
                setSubmitting(false);
              }}
            >
              <FormattedMessage id="EditUserEmailForm.submit" defaultMessage="Confirm new email" />
            </StyledButton>
          ) : (
            <React.Fragment>
              <StyledButton flex="1 1 175" mr={2} minWidth={175} onClick={() => setStep('form')}>
                <FormattedMessage id="EditUserEmailForm.change" defaultMessage="Change email" />
              </StyledButton>
              {isDone && (
                <StyledButton
                  disabled={step === 'already-sent'}
                  onClick={async () => {
                    setSubmitting(true);
                    await updateUserEmail(newEmail);
                    setSubmitting(false);
                    setStep('already-sent');
                  }}
                >
                  <FormattedMessage id="EditUserEmailForm.reSend" defaultMessage="Re-send confirmation" />
                </StyledButton>
              )}
            </React.Fragment>
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
};

EditUserEmailForm.propTypes = {
  /** The user to update the email for (normally, LoggedInUser) */
  user: PropTypes.shape({
    email: PropTypes.string.isRequired,
    emailWaitingForValidation: PropTypes.string,
  }).isRequired,

  /** A function to call to update user */
  updateUserEmail: PropTypes.func.isRequired,
};

export default addUpdateUserEmailMutation(EditUserEmailForm);
