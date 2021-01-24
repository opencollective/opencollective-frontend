import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { formatManualInstructions } from '../../lib/payment-method-utils';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import StyledTextarea from '../StyledTextarea';
import { P, Span } from '../Text';

import { formatAccountDetails } from './utils';

const List = styled.ul`
  margin: 0;
  padding: 0;
  position: relative;
  list-style: none;
`;

class UpdateBankDetailsForm extends React.Component {
  static propTypes = {
    intl: PropTypes.object.isRequired,
    profileType: PropTypes.string, // USER or ORGANIZATION
    error: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    useStructuredForm: PropTypes.bool,
    bankAccount: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { form: { instructions: props.value } };
    this.onChange = this.onChange.bind(this);
    this.messages = defineMessages({
      'bankaccount.instructions.label': {
        id: 'paymentMethods.manual.instructions',
        defaultMessage: 'Bank transfer instructions',
      },
    });
  }

  onChange(field, value) {
    this.setState(
      state => {
        return { form: { ...state.form, [field]: value } };
      },
      () => {
        return this.props.onChange(this.state.form);
      },
    );
  }

  renderInstructions() {
    const formatValues = {
      account: this.props.bankAccount ? formatAccountDetails(this.props.bankAccount) : '',
      reference: '76400',
      OrderId: '76400',
      amount: '$30',
      collective: 'acme',
    };

    return formatManualInstructions(this.state.form.instructions, formatValues);
  }

  render() {
    const { intl, value, error, useStructuredForm, bankAccount } = this.props;
    return (
      <Flex flexDirection="column">
        <Container as="fieldset" border="none" width={1}>
          <Flex flexDirection={['column-reverse', 'row']}>
            <Box mb={3} flexGrow={1}>
              <StyledTextarea
                label={intl.formatMessage(this.messages['bankaccount.instructions.label'])}
                htmlFor="instructions"
                width="100%"
                height={400}
                onChange={e => this.onChange('instructions', e.target.value)}
                defaultValue={value}
              />
            </Box>
            <Container fontSize="1.4rem" pl={[0, 3]} width={[1, 0.5]}>
              <P>
                <FormattedMessage
                  id="bankaccount.instructions.variables"
                  defaultMessage="This is the email payers will receive when they make a bank transfer contribution. Include the details they will need to complete their payment, including reference info so you can match the pending transaction. A variable is like a blank that gets filled in automatically. You can use the following variables in the instructions:"
                />
              </P>

              <List>
                {useStructuredForm && bankAccount?.currency && (
                  <li>
                    <code>&#123;account&#125;</code>:{' '}
                    <FormattedMessage
                      id="bankaccount.instructions.account"
                      defaultMessage="The bank account details you added above."
                    />
                  </li>
                )}
                <li>
                  <code>&#123;amount&#125;</code>:{' '}
                  <FormattedMessage id="bankaccount.instructions.amount" defaultMessage="Total amount the payer should transfer." />
                </li>
                <li>
                  <code>&#123;collective&#125;</code>:{' '}
                  <FormattedMessage
                    id="bankaccount.instructions.collective"
                    defaultMessage="Collective to receive the funds."
                  />
                </li>
                <li>
                  <code>&#123;reference&#125;</code>:{' '}
                  <FormattedMessage
                    id="bankaccount.instructions.reference"
                    defaultMessage="Unique ID code, to confirm receipt of funds."
                  />
                </li>

                <P>
                  <FormattedMessage id="bankaccount.instructions.preview" defaultMessage="Preview:" />
                </P>

                <pre style={{ whiteSpace: 'pre-wrap' }}>{this.renderInstructions()}</pre>
              </List>
            </Container>
          </Flex>
        </Container>

        {error && (
          <Span display="block" color="red.500" pt={2} fontSize="10px">
            {error}
          </Span>
        )}
      </Flex>
    );
  }
}

export default injectIntl(UpdateBankDetailsForm);
