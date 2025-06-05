import React from 'react';
import PropTypes from 'prop-types';

import Container from '../Container';
import LinkCollective from '../LinkCollective';
import { P } from '../Text';

const BanAccountsSummary = ({ dryRunData }) => {
  return (
    <React.Fragment>
      <P whiteSpace="pre-wrap" lineHeight="24px">
        {dryRunData.message}
      </P>
      {Boolean(dryRunData.accounts.length) && (
        <Container fontSize="13px" mt={2} maxHeight="300px" overflowY="auto">
          List of impacted accounts:{' '}
          {dryRunData.accounts.map((account, index) => (
            <span key={account.id}>
              {index > 0 && ', '}
              <LinkCollective collective={account} openInNewTab />
            </span>
          ))}
        </Container>
      )}
    </React.Fragment>
  );
};

BanAccountsSummary.propTypes = {
  dryRunData: PropTypes.object,
};

export default BanAccountsSummary;
