import React from 'react';
import PropTypes from 'prop-types';
import { ArrowBack } from '@styled-icons/boxicons-regular/ArrowBack';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import StyledButton from '../StyledButton';
import { Span } from '../Text';

const Button = styled(StyledButton)`
  padding: 5px 12px;
  width: 69px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BackButton = ({ onClick }) => (
  <Button buttonStyle="secondary" onClick={onClick}>
    <ArrowBack size="13" />{' '}
    <Span fontSize="12px" lineHeight="14px">
      <FormattedMessage id="Back" defaultMessage="Back" />
    </Span>
  </Button>
);

BackButton.propTypes = {
  onClick: PropTypes.func,
};

export default BackButton;
