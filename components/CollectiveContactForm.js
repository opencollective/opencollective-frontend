import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../lib/errors';

import { Flex } from './Grid';
import MessageBox from './MessageBox';
import StyledButton from './StyledButton';
import StyledInput from './StyledInput';
import StyledInputField from './StyledInputField';
import StyledTextarea from './StyledTextarea';
import { H2, P } from './Text';

const sendMessageMutation = gql`
  mutation SendMessage($collectiveId: Int!, $message: String!, $subject: String) {
    sendMessageToCollective(collectiveId: $collectiveId, message: $message, subject: $subject) {
      success
    }
  }
`;

const CollectiveContactForm = ({ collective }) => {
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState(null);
  const [submit, { data, loading }] = useMutation(sendMessageMutation);

  if (get(data, 'sendMessageToCollective.success')) {
    return (
      <MessageBox type="success" withIcon maxWidth={400} m="32px auto">
        <FormattedMessage id="MessageSent" defaultMessage="Message sent" />
      </MessageBox>
    );
  }

  const messageLabel = <FormattedMessage id="Contact.Message" defaultMessage="Message" />;
  const subjectLabel = (
    <FormattedMessage
      id="OptionalFieldLabel"
      defaultMessage="{field} (optional)"
      values={{ field: <FormattedMessage id="Contact.Subject" defaultMessage="Subject" /> }}
    />
  );

  return (
    <Flex flexDirection="column" alignItems={['center', 'flex-start']} maxWidth={1160} m="0 auto">
      <H2 mb={2}>
        <FormattedMessage
          id="ContactCollective"
          defaultMessage="Contact {collective}"
          values={{ collective: collective.name }}
        />
      </H2>
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
      {error && (
        <MessageBox type="error" withIcon mt={3}>
          {error.message}
        </MessageBox>
      )}
      <StyledButton
        mt={4}
        minWidth={200}
        buttonStyle="primary"
        disabled={message.length < 10}
        loading={loading}
        data-cy="submit"
        onClick={async () => {
          try {
            setError(null);
            await submit({ variables: { collectiveId: collective.id, subject, message } });
          } catch (e) {
            setError(getErrorFromGraphqlException(e));
          }
        }}
      >
        <FormattedMessage id="SendMessage" defaultMessage="Send message" />
      </StyledButton>
    </Flex>
  );
};

CollectiveContactForm.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }),
};

export default CollectiveContactForm;
