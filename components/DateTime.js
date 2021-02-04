import React from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import ReactDateTime from 'react-datetime';
import styled from 'styled-components';

import dayjs from '../lib/dayjs';

const StyledDateTime = styled(ReactDateTime)`
  input {
    min-height: 36px;
    border: 1px solid #dcdee0;
    border-color: #dcdee0;
    border-radius: 4px;
    color: #313233;
    overflow: scroll;
    max-height: 100%;
    min-width: 0;
    width: 100%;
    flex: 1 1 auto;
    font-size: 14px;
    line-height: 1.5;
    overflow: scroll;
    padding-top: 0;
    padding-bottom: 0;
    padding-left: 8px;
    padding-right: 8px;
    box-sizing: border-box;
    outline: none;
    background-color: #ffffff;
    border-color: ${themeGet('colors.black.300')};
    box-sizing: border-box;

    &:disabled {
      background-color: ${themeGet('colors.black.50')};
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      border-color: ${themeGet('colors.primary.300')};
    }

    &:focus:not(:disabled) {
      border-color: ${themeGet('colors.primary.500')};
    }

    &::placeholder {
      color: ${themeGet('colors.black.400')};
    }
  }
`;

class DateTime extends React.Component {
  static propTypes = {
    date: PropTypes.string.isRequired,
    timezone: PropTypes.string.isRequired,
  };

  render() {
    const props = this.props;
    const { date, timezone } = props;
    const value = dayjs(new Date(date)).tz(timezone);

    return <StyledDateTime value={value.isValid() ? value.toDate() : ''} utc={timezone === 'utc'} {...props} />;
  }
}

export default DateTime;
