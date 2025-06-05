import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { v4 as uuid } from 'uuid';

import { formatManualInstructions } from '../../lib/payment-method-utils';

import Container from '../Container';
import StyledTextarea from '../StyledTextarea';
import { Badge } from '../ui/Badge';

import { formatAccountDetails } from './utils';

/**
 * Validates the provided instructions to see if the variable usage is correct.
 * Detects issues like unclosed brackets, missing variables, unknown variables, etc.
 *
 * @returns {Array<{key: string; message: React.ReactNode;}>} A list of errors found in the instructions.
 */
const validateInstructions = instructions => {
  const errors = [];
  const usedVariables = instructions.match(/{[^}]+}/g) || [];
  const allowedVariables = ['account', 'amount', 'collective', 'reference'];
  const requiredVariables = ['account', 'reference'];
  const addError = message => errors.push({ key: uuid(), message });

  usedVariables.forEach(variable => {
    const varName = variable.replace(/[{}]/g, '');
    if (!allowedVariables.includes(varName)) {
      addError(<FormattedMessage defaultMessage="Unknown variable: {variable}" id="ZTL623" values={{ variable }} />);
    }
  });

  requiredVariables.forEach(variable => {
    if (!usedVariables.includes(`{${variable}}`)) {
      addError(
        <FormattedMessage defaultMessage="Missing required variable: {variable}" id="CFeTrT" values={{ variable }} />,
      );
    }
  });

  const openBrackets = (instructions.match(/{/g) || []).length;
  const closeBrackets = (instructions.match(/}/g) || []).length;
  if (openBrackets !== closeBrackets) {
    addError(<FormattedMessage defaultMessage="Unclosed brackets" id="6LYnXr" />);
  }

  return errors;
};

class UpdateBankDetailsForm extends React.Component {
  static propTypes = {
    intl: PropTypes.object.isRequired,
    profileType: PropTypes.string, // USER or ORGANIZATION
    value: PropTypes.string,
    onChange: PropTypes.func,
    useStructuredForm: PropTypes.bool,
    bankAccount: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { instructions: props.value || '', errors: [] };
    this.onInstructionsChange = this.onInstructionsChange.bind(this);
    this.messages = defineMessages({
      'bankaccount.instructions.label': {
        id: 'paymentMethods.manual.instructions',
        defaultMessage: 'Bank transfer instructions',
      },
    });
  }

  onInstructionsChange(e) {
    const value = e.target.value;
    this.setState(
      () => {
        return { instructions: value, errors: validateInstructions(value) };
      },
      () => {
        return this.props.onChange({ instructions: value });
      },
    );
  }

  renderInstructions() {
    const formattedValues = {
      account: this.props.bankAccount ? formatAccountDetails(this.props.bankAccount) : '',
      reference: '76400',
      OrderId: '76400',
      amount: '30,00 USD',
      collective: 'acme',
    };

    return formatManualInstructions(this.state.instructions, formattedValues);
  }

  render() {
    const { intl, value, useStructuredForm, bankAccount } = this.props;
    return (
      <div>
        <div className="mb-3 text-sm">
          <p>
            <FormattedMessage
              id="bankaccount.instructions.variables"
              defaultMessage="Financial contributors will receive these instructions when they select bank transfer as the payment method. You can use the following variables (like blanks that gets filled in):"
            />
          </p>

          <ul className="list list-inside list-disc space-y-1">
            {useStructuredForm && bankAccount?.currency && (
              <li>
                <Badge size="sm">&#123;account&#125;</Badge>:{' '}
                <FormattedMessage
                  id="bankaccount.instructions.account"
                  defaultMessage="The bank account details you added above."
                />
              </li>
            )}
            <li>
              <Badge size="sm">&#123;amount&#125;</Badge>:{' '}
              <FormattedMessage
                id="bankaccount.instructions.amount"
                defaultMessage="Total amount the payer should transfer."
              />
            </li>
            <li>
              <Badge size="sm">&#123;collective&#125;</Badge>:{' '}
              <FormattedMessage
                id="bankaccount.instructions.collective"
                defaultMessage="Collective to receive the funds. If you only have one Collective, you might not need to include this."
              />
            </li>
            <li>
              <Badge size="sm">&#123;reference&#125;</Badge>:{' '}
              <FormattedMessage
                id="bankaccount.instructions.reference"
                defaultMessage="Unique ID code, to confirm receipt of funds."
              />
            </li>
          </ul>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block font-bold" htmlFor="bank-account-instructions">
                <FormattedMessage defaultMessage="Template" id="3JxaKs" />
              </label>
              <StyledTextarea
                label={intl.formatMessage(this.messages['bankaccount.instructions.label'])}
                id="bank-account-instructions"
                width="100%"
                minHeight={550}
                maxHeight={550}
                onChange={this.onInstructionsChange}
                defaultValue={value}
              />
            </div>
            <Container pl={[0, 3]} width={[1, 0.5]}>
              <p className="mb-1 font-bold">
                <FormattedMessage defaultMessage="Preview" id="TJo5E6" />
              </p>

              <pre className="h-[550px] overflow-y-auto rounded border bg-neutral-100 px-4 py-3 text-sm whitespace-pre-wrap">
                {this.renderInstructions()}
              </pre>
            </Container>
          </div>
        </div>

        {this.state.errors?.length > 0 && (
          <div className="mt-3 rounded-sm border-l-4 border-yellow-500 bg-yellow-100 p-3 text-sm">
            <p className="mb-1 font-bold">
              <FormattedMessage defaultMessage="Warning" id="3SVI5p" />
            </p>
            <ul className="list list-inside list-disc">
              {this.state.errors.map(({ key, message }) => (
                <li key={key}>{message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
}

export default injectIntl(UpdateBankDetailsForm);
