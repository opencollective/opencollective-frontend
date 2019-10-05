import React from 'react';
import PropTypes from 'prop-types';
import { Box, Flex } from '@rebass/grid';
import { defineMessages, injectIntl } from 'react-intl';
import { get } from 'lodash';

import { H4, P, Span } from './Text';
import Container from './Container';
import StyledTextarea from './StyledTextarea';
import styled from 'styled-components';

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
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.state = { form: {} };
    this.onChange = this.onChange.bind(this);
    this.messages = defineMessages({
      'bankaccount.instructions.label': {
        id: 'paymentMethods.manual.instructions',
        defaultMessage: 'Bank transfer instructions',
      },
      'bankaccount.instructions.default': {
        id: 'paymentMethods.manual.instructions.default',
        defaultMessage: `Please make a bank transfer as follows:

<code>
    Amount: {amount}
    Reference/Communication: {OrderId}
    IBAN/Account Number: BE61310126985517
    BIC: TRIOBEBB
    Bank name: Triodos
</code>
        
Please note that it will take a few days to process your payment.`,
      },
    });
  }

  onChange(field, value) {
    const newState = this.state;
    newState.form[field] = value;
    this.setState(newState);
    this.props.onChange(newState.form);
  }

  render() {
    const { intl, value, error } = this.props;
    return (
      <Flex flexDirection="column">
        <Container as="fieldset" border="none" width={1} py={3}>
          <Flex flexDirection="row">
            <Box mb={3}>
              <StyledTextarea
                label={intl.formatMessage(this.messages['bankaccount.instructions.label'])}
                htmlFor="instructions"
                width={500}
                height={300}
                onChange={e => this.onChange('instructions', e.target.value)}
                defaultValue={
                  get(value, 'instructions') || intl.formatMessage(this.messages['bankaccount.instructions.default'])
                }
              />
            </Box>
            <Container fontSize="1.4rem" ml={3}>
              <H4 fontSize="1.4rem">Variables:</H4>
              <P>Make sure you are using the following variables in the instructions.</P>

              <List>
                <li>
                  <code>&#123;amount&#125;</code>: total amount of the order
                </li>
                <li>
                  <code>&#123;collective&#125;</code>: slug of the collective for which the donation is earmarked
                </li>
                <li>
                  <code>&#123;OrderId&#125;</code>: unique id of the order to help you mark it as paid when you receive
                  the money
                </li>
              </List>
            </Container>
          </Flex>
        </Container>

        {error && (
          <Span display="block" color="red.500" pt={2} fontSize="Tiny">
            {error}
          </Span>
        )}
      </Flex>
    );
  }
}

UpdateBankDetailsForm.propTypes = {
  intl: PropTypes.object,
};

export default injectIntl(UpdateBankDetailsForm);
