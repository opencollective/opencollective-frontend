import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import themeGet from '@styled-system/theme-get';
import { Field, Form, Formik } from 'formik';
import { defineMessages, FormattedMessage, injectIntl, useIntl } from 'react-intl';
import styled from 'styled-components';

import { confettiFireworks } from '../../lib/confettis';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import Avatar from '../../components/Avatar';
import Container from '../../components/Container';
import { Flex } from '../../components/Grid';
import StyledButton from '../../components/StyledButton';
import StyledInputField from '../../components/StyledInputField';
import StyledTextarea from '../../components/StyledTextarea';
import { P } from '../../components/Text';

const PUBLIC_MESSAGE_MAX_LENGTH = 140;

// Styled components
const PublicMessageContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  background: ${themeGet('colors.white.full')};
  border: 1px solid ${themeGet('colors.black.400')};
  border-radius: 10px;
`;

// GraphQL
const postContributionPublicMessageMutation = gqlV2/* GraphQL */ `
  mutation NewContributionFlowEditPublicMessage(
    $fromAccount: AccountReferenceInput!
    $toAccount: AccountReferenceInput!
    $message: String
  ) {
    editPublicMessage(fromAccount: $fromAccount, toAccount: $toAccount, message: $message) {
      id
      publicMessage
    }
  }
`;

// Messages
const messages = defineMessages({
  publicMessagePlaceholder: {
    id: 'contribute.publicMessage.placeholder',
    defaultMessage: 'Motivate others to contribute in 140 characters :) ...',
  },
});

const ContributionFlowPublicMessage = ({ order, publicMessage }) => {
  const intl = useIntl();
  const collective = order.toAccount;
  const stepProfile = order.fromAccount;

  // GraphQL & data
  const [postPublicMessage] = useMutation(postContributionPublicMessageMutation, {
    context: API_V2_CONTEXT,
  });

  // Formik
  const initialValues = {
    publicMessage: publicMessage || '',
  };

  const submitPublicMessage = async values => {
    const { publicMessage } = values;
    await postPublicMessage({
      variables: {
        fromAccount: { id: stepProfile.id },
        toAccount: { id: collective.id },
        message: publicMessage,
      },
    }).then(() => {
      confettiFireworks(3000);
    });
  };

  return (
    <PublicMessageContainer width={[1, '400px']} flexShrink={1} height={112} mt={2}>
      <Formik initialValues={initialValues} onSubmit={submitPublicMessage}>
        {formik => {
          const { values, handleSubmit, isSubmitting } = formik;

          return (
            <Form>
              <StyledInputField name="publicMessage" htmlFor="publicMessage" disabled={isSubmitting}>
                {inputProps => (
                  <Field
                    as={StyledTextarea}
                    {...inputProps}
                    resize="none"
                    border="none"
                    withOutline={false}
                    maxLength={PUBLIC_MESSAGE_MAX_LENGTH}
                    minWidth={300}
                    minHeight={75}
                    fontSize="14px"
                    value={values.publicMessage}
                    placeholder={intl.formatMessage(messages.publicMessagePlaceholder)}
                  />
                )}
              </StyledInputField>

              <Flex flexGrow={1} mt={1} px={3}>
                <Flex width={1 / 2} alignItems="center" justifyContent="flex-start">
                  <Avatar collective={stepProfile} radius={24} />
                  <Flex flexDirection="column" ml={2}>
                    <P fontSize="10px">
                      <em>
                        <FormattedMessage id="contribute.publicMessage.postingAs" defaultMessage="Posting as" />
                      </em>
                    </P>
                    <P fontSize="12px">{stepProfile.name}</P>
                  </Flex>
                </Flex>
                <Flex width={1 / 2} alignItems="center" justifyContent="flex-end">
                  <StyledButton buttonSize="tiny" loading={isSubmitting} type="submit" onSubmit={handleSubmit}>
                    <FormattedMessage id="contribute.publicMessage.post" defaultMessage="Post message" />
                  </StyledButton>
                </Flex>
              </Flex>
            </Form>
          );
        }}
      </Formik>
    </PublicMessageContainer>
  );
};

ContributionFlowPublicMessage.propTypes = {
  order: PropTypes.object.isRequired,
  publicMessage: PropTypes.string,
  intl: PropTypes.object,
};

export default injectIntl(ContributionFlowPublicMessage);
