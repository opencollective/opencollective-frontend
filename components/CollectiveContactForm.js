import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../lib/graphql/helpers';

import { Box } from './Grid';
import MessageBox from './MessageBox';
import MessageBoxGraphqlError from './MessageBoxGraphqlError';
import StyledButton from './StyledButton';
import StyledInput from './StyledInput';
import StyledInputField from './StyledInputField';
import StyledTextarea from './StyledTextarea';
import { H2, P, Span } from './Text';
import { TOAST_TYPE, useToasts } from './ToastProvider';

const sendMessageMutation = gql`
  mutation SendMessage($account: AccountReferenceInput!, $message: NonEmptyString!, $subject: String) {
    sendMessage(account: $account, message: $message, subject: $subject) {
      success
    }
  }
`;

const CollectiveContactForm = ({ collective, isModal = false, onClose, onChange }) => {
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState(null);
  const [submit, { data, loading }] = useMutation(sendMessageMutation, { context: API_V2_CONTEXT });
  const { addToast } = useToasts();

  // Dispatch changes to onChange if set
  React.useEffect(() => {
    if (onChange) {
      onChange({ subject, message });
    }
  }, [subject, message]);

  if (get(data, 'sendMessage.success') && !isModal) {
    return (
      <MessageBox type="success" withIcon maxWidth={400} m="32px auto">
        <FormattedMessage id="MessageSent" defaultMessage="Message sent" />
      </MessageBox>
    );
  }

  const messageLabel = (
    <Span fontWeight={700}>
      <FormattedMessage id="Contact.Message" defaultMessage="Message" />
    </Span>
  );
  const subjectLabel = (
    <FormattedMessage
      id="OptionalFieldLabel"
      defaultMessage="{field} (optional)"
      values={{
        field: (
          <Span fontWeight={700}>
            <FormattedMessage id="Contact.Subject" defaultMessage="Subject" />
          </Span>
        ),
      }}
    />
  );

  return (
    <Box flexDirection="column" alignItems={['center', 'flex-start']} maxWidth={1160} m="0 auto">
      {!isModal && (
        <H2 mb={2} fontSize={'40px'}>
          <FormattedMessage
            id="ContactCollective"
            defaultMessage="Contact {collective}"
            values={{ collective: collective.name }}
          />
        </H2>
      )}
      <P mb={4}>
        <FormattedMessage
          id="CollectiveContactForm.Disclaimer"
          defaultMessage="Your email address will be shared with the admins who will receive this message."
        />
      </P>
      <StyledInputField label={subjectLabel} htmlFor="subject" mb={4} width="100%">
        {inputProps => (
          <StyledInput
            {...inputProps}
            width="100%"
            maxWidth={500}
            maxLength={60}
            onChange={e => setSubject(e.target.value)}
            data-cy="subject"
          />
        )}
      </StyledInputField>
      <StyledInputField label={messageLabel} htmlFor="message" width="100%" maxWidth={800}>
        {inputProps => (
          <StyledTextarea
            {...inputProps}
            width="100%"
            minHeight={200}
            onChange={e => setMessage(e.target.value)}
            minLength={10}
            maxLength={4000}
            value={message}
            showCount
            data-cy="message"
          />
        )}
      </StyledInputField>
      {error && <MessageBoxGraphqlError error={error} mt={3} />}
      <p className="mt-2 text-sm">
        <FormattedMessage defaultMessage="Message needs to be at least 10 characters long" />
      </p>
      {isModal && <hr className="my-5" />}
      <Box textAlign={isModal ? 'right' : ''}>
        <StyledButton
          mt={isModal ? 0 : 4}
          minWidth={200}
          buttonStyle="primary"
          disabled={message.length < 10}
          loading={loading}
          data-cy="submit"
          onClick={async () => {
            try {
              setError(null);
              await submit({
                variables: {
                  account: { slug: collective.slug },
                  subject,
                  message,
                },
              });
              if (isModal) {
                addToast({
                  type: TOAST_TYPE.SUCCESS,
                  message: <FormattedMessage id="MessageSent" defaultMessage="Message sent" />,
                });
                onClose();
              }
            } catch (e) {
              setError(e);
            }
          }}
        >
          <FormattedMessage defaultMessage="Contact Collective" />
        </StyledButton>
      </Box>
    </Box>
  );
};

CollectiveContactForm.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    legacyId: PropTypes.number,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string,
  }),
  /* Defines whether this form is displayed as a modal */
  isModal: PropTypes.bool,
  /* Specifies close behaviour is this form is part of a modal */
  onClose: PropTypes.func,
  onChange: PropTypes.func,
};

export default CollectiveContactForm;
