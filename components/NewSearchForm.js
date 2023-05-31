import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import styled from 'styled-components';
import { borderRadius, height, typography } from 'styled-system';

import { Box, Flex } from './Grid';
import SearchIcon from './SearchIcon';
import StyledInput from './StyledInput';
import StyledRoundButton from './StyledRoundButton';
import StyledSpinner from './StyledSpinner';
import { Span } from './Text';
import { Transition } from '@headlessui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

const SearchInputContainer = styled(Flex)`
  border: solid 1px var(--silver-four);
  ${borderRadius};
  ${height};
  background-color: white;
`;

const SearchInput = styled(Box)`
  && {
    appearance: none;
    background-color: transparent;
    border: none;
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

class SearchForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isLoading: false, query: '' };
  }

  handleSubmit = event => {
    event.preventDefault();
    const searchInput = this.state.query;
    this.setState({ isLoading: true });
    this.props.router.push({ pathname: '/search', query: { q: searchInput } });
    this.props.onClose();
  };

  render() {
    const { onSubmit = this.handleSubmit } = this.props;
    return (
      <form action="/search" method="GET" onSubmit={onSubmit}>
        <div className="relative">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
          <input
            className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
            placeholder="Search..."
            autoFocus
            onChange={e => this.setState({ query: e.target.value })}
          />
          <Transition
            show={this.state.query.length > 0}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute right-0 top-0 flex h-full p-1">
              <button
                type="submit"
                className="h-full w-10 flex-1 rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 focus:bg-slate-200"
              >
                {this.state.isLoading ? <StyledSpinner size="20px" /> : <span>→</span>}
              </button>
            </div>
          </Transition>
        </div>
        {/* <SearchButton as="button" ml={1} p={1}>
          <SearchIcon size={16} fill="#aaaaaa" />
        </SearchButton> */}

        {/* <SearchInput
            as={StyledInput}
            type="search"
            name="q"
           
            placeholder={placeholder}
            py={1}
            pl={3}
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
            disabled={disabled}
            onFocus={onFocus}
            autoComplete={autoComplete}
          /> */}
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
};

export default withRouter(SearchForm);
