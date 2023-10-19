import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { get, range } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import Container from '../Container';
import { Box } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledSelect from '../StyledSelect';
import { H2, Span } from '../Text';
import { useToast } from '../ui/useToast';

import StyledModal, { ModalBody, ModalHeader } from './../StyledModal';

const setTaxFormMutation = gql`
  mutation SetTaxForm($account: AccountReferenceInput!, $taxFormLink: URL!, $year: Int!) {
    setTaxForm(account: $account, taxFormLink: $taxFormLink, year: $year) {
      success
    }
  }
`;

const arrayOfYears = () => {
  return range(2018, new Date().getFullYear() + 1);
};

const TaxFormLinkModal = ({ account, year, onClose, refetchExpense }) => {
  const [taxFormLink, setTaxFormLink] = React.useState(null);
  const taxYearOptions = arrayOfYears().map(year => ({ key: year, value: year, label: year }));
  const defaultTaxYearOption = taxYearOptions.filter(option => option.value === year)[0];
  const [taxFormYear, setTaxFormYear] = React.useState(defaultTaxYearOption.value);
  const { toast } = useToast();
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
            defaultMessage="Please upload the tax form to the <Link>Google Drive Folder</Link>. Copy the link to the file and paste it in the field below."
            values={{
              Link: getI18nLink({
                href: 'https://drive.google.com/drive/folders/1ga_-6tBTqADvngRr9nbxRKf7yoSne1n1?usp=share_link',
                openInNewTab: true,
              }),
            }}
          />
        </MessageBox>
        <Container pt={4}>
          <StyledInputField
            label={
              <Span fontWeight={700}>
                <FormattedMessage defaultMessage="Year" />
              </Span>
            }
            width="100%"
            htmlFor="year"
          >
            {inputProps => (
              <StyledSelect
                {...inputProps}
                options={taxYearOptions}
                defaultValue={defaultTaxYearOption}
                onChange={e => setTaxFormYear(e.value)}
              />
            )}
          </StyledInputField>
        </Container>
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
            {inputProps => <StyledInput {...inputProps} type="url" onChange={e => setTaxFormLink(e.target.value)} />}
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
                    year: taxFormYear,
                  },
                });
                if (get(result, 'data.setTaxForm.success')) {
                  toast({
                    variant: 'success',
                    message: <FormattedMessage defaultMessage="Tax form submitted" />,
                  });
                  await refetchExpense();
                } else {
                  toast({
                    variant: 'error',
                    message: <FormattedMessage defaultMessage="Failed to submit the tax form" />,
                  });
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
  /** function to refetch expense data after submitting the tax form */
  refetchExpense: PropTypes.object,
};

export default TaxFormLinkModal;
