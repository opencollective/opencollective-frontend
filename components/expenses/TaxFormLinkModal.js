import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import Container from '../Container';
import { Box } from '../Grid';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledLink from '../StyledLink';
import { H2, Span } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

import StyledModal, { ModalBody, ModalHeader } from './../StyledModal';

const setTaxFormMutation = gql`
  mutation SetTaxForm($account: AccountReferenceInput!, $taxFormLink: NonEmptyString!, $year: Int!) {
    setTaxForm(account: $account, taxFormLink: $taxFormLink, year: $year) {
      success
    }
  }
`;

const TaxFormLinkModal = ({ account, year, onClose, expenseData }) => {
  const [taxFormLink, setTaxFormLink] = React.useState(null);
  const { addToast } = useToasts();
  const [error, setError] = React.useState(null);
  const [submit, { loading }] = useMutation(setTaxFormMutation, { context: API_V2_CONTEXT });
  return (
    <StyledModal role="alertdialog" width="578px" onClose={onClose} trapFocus>
      <ModalHeader>
        <H2 mb={2} fontSize={'28px'}>
          <FormattedMessage defaultMessage="Tax Form for {accountName}" values={{ accountName: account.name }} />
        </H2>
      </ModalHeader>
      <ModalBody>
        <MessageBox type="info" withIcon>
          <FormattedMessage
            defaultMessage="Please upload the tax form to the {linkToTaxFormsFolder}. Copy the link to the file and paste it in the field below."
            values={{
              linkToTaxFormsFolder: (
                <StyledLink
                  href="https://drive.google.com/drive/folders/1ga_-6tBTqADvngRr9nbxRKf7yoSne1n1?usp=share_link"
                  openInNewTab
                >
                  Google Drive Folder
                </StyledLink>
              ),
            }}
          />
        </MessageBox>
        <Container pt={4}>
          <StyledInputField
            label={
              <Span fontWeight={700}>
                <FormattedMessage defaultMessage="Tax Form Link" />
              </Span>
            }
            width="100%"
            htmlFor="taxFormLink"
          >
            {inputProps => <StyledInput {...inputProps} onChange={e => setTaxFormLink(e.target.value)} />}
          </StyledInputField>
        </Container>
        {error && <MessageBoxGraphqlError error={error} mt={3} />}
        <Box textAlign="right">
          <StyledButton
            mt={4}
            minWidth={200}
            buttonStyle="primary"
            disabled={!taxFormLink}
            loading={loading}
            onClick={async () => {
              try {
                setError(null);
                const result = await submit({
                  variables: {
                    account: { slug: account.slug },
                    taxFormLink,
                    year,
                  },
                });
                if (get(result, 'data.setTaxForm.success')) {
                  addToast({
                    type: TOAST_TYPE.SUCCESS,
                    message: <FormattedMessage defaultMessage="Tax From Submitted" />,
                  });
                  await expenseData.refetch();
                }
                onClose();
              } catch (e) {
                setError(e);
              }
            }}
          >
            <FormattedMessage defaultMessage="Submit Tax Form" />
          </StyledButton>
        </Box>
      </ModalBody>
    </StyledModal>
  );
};

TaxFormLinkModal.propTypes = {
  /** the account which the tax from should be set */
  account: PropTypes.object,
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
  /** the year for which the tax form should be set */
  year: PropTypes.number,
  /** expense data to refetch after submitting the tax form */
  expenseData: PropTypes.object,
};

export default TaxFormLinkModal;
