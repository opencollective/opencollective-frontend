import React from 'react';
import PropTypes from 'prop-types';
import { Search, X } from 'lucide-react';
import { withRouter } from 'next/router';
import { injectIntl } from 'react-intl';
import styled from 'styled-components';
import { borderColor, borderRadius, height, typography } from 'styled-system';

import { compose } from '../lib/utils';

import { Box, Flex } from './Grid';
import StyledInput from './StyledInput';
import StyledRoundButton from './StyledRoundButton';
import StyledSpinner from './StyledSpinner';
import { Span } from './Text';

const SearchInputContainer = styled(Flex)`
  border: 1px solid;
  ${borderColor};
  ${borderRadius};
  ${height};
  background-color: white;

  input[type='search']::-webkit-search-cancel-button,
  input[type='search']::-webkit-search-clear-button {
    -webkit-appearance: none;
    appearance: none;
    display: none;
  }
`;

const SearchInput = styled(Box)`
  && {
    appearance: none;
    background-color: transparent;
    border: none;
    margin-right: 1.5rem;
    ${typography}
    ::placeholder {
      color: #9d9fa3;
    }
  }
`;

const SearchButton = styled(Flex)`
  && {
    appearance: none;
    background-color: transparent;
    border: none;
  }
`;

const ClearFilterButton = styled.button`
  appearance: none;
  background-color: transparent;
  border: none;
  margin-right: 8px;
  padding: 4px;
`;

class SearchForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isLoading: false };
  }

  handleSubmit = event => {
    event.preventDefault();
    const searchInput = event.target.elements.q;
    this.setState({ isLoading: true });
    this.props.router.push({ pathname: '/search', query: { q: searchInput.value } });
    this.props.closeSearchModal?.();
  };

  render() {
    const {
      onSubmit = this.handleSubmit,
      placeholder = 'Search...',
      width = 1,
      autoFocus,
      defaultValue,
      value,
      onChange,
      borderRadius = '20px',
      borderColor = '#e1e4e6',
      height = '48px',
      disabled,
      onFocus,
      autoComplete = 'on',
      fontStyle = '',
      letterSpacing = '0',
      fontSize = '0.75rem',
      lineHeight,
      fontWeight,
      className,
      onClearFilter,
      intl,
      onKeyPress,
    } = this.props;
    return (
      <form action="/search" method="GET" onSubmit={onSubmit} className={className}>
        <SearchInputContainer
          borderRadius={borderRadius}
          borderColor={borderColor}
          height={height}
          alignItems="center"
          justifyContent="space-between"
          p={this.props.py || 1}
        >
          <SearchButton as="button" ml={2} p={1}>
            <Search size={18} className="text-slate-500">
              <title>Search</title>
            </Search>
          </SearchButton>
          <SearchInput
            as={StyledInput}
            flex={1}
            type="search"
            name="q"
            autoFocus={autoFocus}
            placeholder={placeholder}
            py={1}
            px={2}
            width={width}
            fontSize={fontSize}
            fontStyle={fontStyle}
            letterSpacing={letterSpacing}
            lineHeight={lineHeight}
            fontWeight={fontWeight}
            aria-label="Open Collective search input"
            defaultValue={defaultValue}
            value={value}
            onChange={onChange && (e => onChange(e.target.value))}
            onKeyPress={onKeyPress}
            disabled={disabled}
            onFocus={onFocus}
            autoComplete={autoComplete}
          />
          {this.props.value && (
            <ClearFilterButton
              onClick={onClearFilter}
              aria-label={intl.formatMessage({ id: 'search.clear', defaultMessage: 'Clear search' })}
            >
              <X size={13} className="text-slate-500" />
            </ClearFilterButton>
          )}
          {this.props.showSearchButton && (
            <StyledRoundButton
              style={{ backgroundColor: '#F9FAFB', color: '#323334', ...this.props.searchButtonStyles }}
              isBorderless
              mr="6px"
            >
              {this.state.isLoading ? <StyledSpinner size="20px" /> : <Span>→</Span>}
            </StyledRoundButton>
          )}
        </SearchInputContainer>
      </form>
    );
  }
}

SearchForm.propTypes = {
  fontSize: PropTypes.string,
  defaultValue: PropTypes.string,
  py: PropTypes.string,
  value: PropTypes.string,
  onSubmit: PropTypes.func,
  placeholder: PropTypes.string,
  backgroundColor: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.array]),
  onChange: PropTypes.func,
  borderRadius: PropTypes.string,
  borderColor: PropTypes.string,
  height: PropTypes.string,
  router: PropTypes.object,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  showSearchButton: PropTypes.bool,
  searchButtonStyles: PropTypes.object,
  onFocus: PropTypes.func,
  autoComplete: PropTypes.string,
  fontStyle: PropTypes.string,
  letterSpacing: PropTypes.string,
  lineHeight: PropTypes.string,
  fontWeight: PropTypes.string,
  className: PropTypes.string,
  closeSearchModal: PropTypes.func,
  onClearFilter: PropTypes.func,
  intl: PropTypes.object,
  onKeyPress: PropTypes.func,
};

const composedFunction = compose(withRouter, injectIntl);

export default composedFunction(SearchForm);
