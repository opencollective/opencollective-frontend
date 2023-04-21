import React from 'react';
import * as Sentry from '@sentry/browser';
import { CommentDots } from '@styled-icons/boxicons-regular/CommentDots';
import { Formik } from 'formik';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';

import StyledButton from './StyledButton';
import StyledInputFormikField from './StyledInputFormikField';
import StyledModal, { ModalBody, ModalHeader } from './StyledModal';
import StyledTextarea from './StyledTextarea';

/**
 * A modal to collect user feedback that stores the result on Sentry
 */
export const ShareFeedbackButton = props => {
  const { LoggedInUser } = useLoggedInUser();
  const [hasModal, setHasModal] = React.useState(false);

  return (
    <React.Fragment>
      <StyledButton buttonSize="small" width="100%" onClick={() => setHasModal(true)}>
        Share feedback &nbsp; <CommentDots size="12px" />
      </StyledButton>
      {hasModal && (
        <StyledModal {...props} width="600px" onClose={() => setHasModal(false)}>
          <ModalHeader>Share feedback</ModalHeader>
          <Formik
            initialValues={{ feedback: '' }}
            onSubmit={values => {
              const eventId = Sentry.captureMessage('User Feedback');
              Sentry.captureUserFeedback({
                event_id: eventId,
                comments: values.feedback,
                name: LoggedInUser?.collective?.name || 'Incognito',
                email: LoggedInUser?.email || 'test@opencollective.com',
              });
              setHasModal(false);
            }}
          >
            {({ values, handleChange, handleSubmit }) => (
              <ModalBody>
                <form onSubmit={handleSubmit}>
                  <StyledInputFormikField
                    name="feedback"
                    htmlFor="feedback"
                    labelProps={{ fontWeight: 500, fontSize: '14px', lineHeight: '17px' }}
                  >
                    {({ field }) => (
                      <StyledTextarea
                        {...field}
                        value={values.feedback}
                        onChange={handleChange}
                        placeholder="What's on your mind?"
                        minHeight={200}
                      />
                    )}
                  </StyledInputFormikField>
                  <StyledButton
                    buttonStyle="primary"
                    buttonSize="medium"
                    type="submit"
                    mt={3}
                    width="100%"
                    disabled={!values.feedback}
                  >
                    Send
                  </StyledButton>
                </form>
              </ModalBody>
            )}
          </Formik>
        </StyledModal>
      )}
    </React.Fragment>
  );
};
