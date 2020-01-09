import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { Link } from '../server/pages';
import { FormattedMessage } from 'react-intl';

import { Flex } from '@rebass/grid';
import StyledLink from './StyledLink';
import { TextInput } from './StyledInput';

const Pagination = ({ router, limit, offset, total, scrollToTopOnChange }) => {
  const { pathname, query, route } = router;
  const totalPages = Math.ceil(total / limit);
  const currentPage = offset / limit + 1;

  const changePage = async ({ target, key }) => {
    if (key && key !== 'Enter') return;

    const { value } = target;
    if (!value) return;

    await router.push({ pathname, query: { ...query, offset: (value - 1) * limit } });

    if (scrollToTopOnChange) {
      window.scrollTo(0, 0);
    }
  };

  return (
    <Flex alignItems="center">
      {currentPage > 1 && (
        <Link
          route={route.slice(1)}
          scroll={scrollToTopOnChange}
          params={{ ...query, offset: offset - limit }}
          passHref
        >
          <StyledLink buttonStyle="standard" buttonSize="small">
            <FormattedMessage id="Pagination.Prev" defaultMessage="Previous" />
          </StyledLink>
        </Link>
      )}
      <Flex alignItems="center" mx={2}>
        <FormattedMessage
          id="Pagination.Count"
          defaultMessage="Page {current} of {total}"
          values={{
            current: (
              <TextInput
                key={offset}
                defaultValue={currentPage}
                onBlur={changePage}
                onKeyPress={changePage}
                textAlign="center"
                mx={1}
                px={1}
                py={1}
                width={30}
              />
            ),
            total: totalPages,
          }}
        />
      </Flex>
      {currentPage < totalPages && (
        <Link
          route={route.slice(1)}
          scroll={scrollToTopOnChange}
          params={{ ...query, offset: offset + limit }}
          passHref
        >
          <StyledLink buttonStyle="standard" buttonSize="small">
            <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
          </StyledLink>
        </Link>
      )}
    </Flex>
  );
};

Pagination.propTypes = {
  router: PropTypes.object,
  limit: PropTypes.number,
  offset: PropTypes.number,
  total: PropTypes.number,
  /** Use this to scroll back on top when pagination changes */
  scrollToTopOnChange: PropTypes.bool,
};

Pagination.defaultProps = {
  scrollToTopOnChange: false,
};

export default withRouter(Pagination);
