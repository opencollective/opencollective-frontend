import React from 'react';
import PropTypes from 'prop-types';

import Link from './Link';

const UserCompany = ({ company, ...props }) => {
  if (!company || company[0] !== '@') {
    return company;
  }

  // This could be used to generate malicious URLs.
  // By splitting on `/` we limit that risk.
  const companySlug = company.split('/')[0].slice(1);
  return (
    <Link href={companySlug} {...props}>
      @{companySlug}
    </Link>
  );
};

UserCompany.propTypes = {
  company: PropTypes.string,
};

export default UserCompany;
