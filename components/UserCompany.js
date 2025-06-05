import React from 'react';

import Link from './Link';

const UserCompany = ({ company, ...props }) => {
  if (!company || company[0] !== '@') {
    return company;
  }

  // This could be used to generate malicious URLs.
  // By splitting on `/` we limit that risk.
  const companySlug = company.split('/')[0].slice(1);
  return (
    <Link href={`/${companySlug}`} {...props}>
      @{companySlug}
    </Link>
  );
};

export default UserCompany;
