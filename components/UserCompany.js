import React from 'react';
import PropTypes from 'prop-types';
import NextLink from 'next/link';

const UserCompany = ({ company, ...props }) => {
  if (!company || company[0] !== '@') {
    return company;
  }

  // This could be used to generate malicious URLs.
  // By splitting on `/` we limit that risk.
  const companySlug = company.split('/')[0].slice(1);
  return (
    <NextLink href={companySlug} {...props}>
      @{companySlug}
    </NextLink>
  );
};

UserCompany.propTypes = {
  company: PropTypes.string,
};

export default UserCompany;
