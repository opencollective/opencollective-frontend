import React from 'react';
import { FormattedMessage } from 'react-intl';

import StyledLink from '../StyledLink';
import { P } from '../Text';

const ApplicationDescription = () => (
  <React.Fragment>
    <P mb={3} fontSize="15px" lineHeight="22px">
      <FormattedMessage
        id="createcollective.opensource.p1"
        defaultMessage="You're creating software. You don't want to worry about creating a legal entity or bank account, taxes, invoices, and a bunch of other admin. Let us take care of all that, so you can stay focused on your project."
      />
    </P>
    <P mb={3} fontSize="15px" lineHeight="22px">
      <FormattedMessage
        id="createcollective.opensource.p2"
        defaultMessage="We have created the {osclink}, a non-profit umbrella organization, to serve the open source community. To join, you need to meet our {criterialink}."
        values={{
          osclink: (
            <StyledLink href="https://opencollective.com/opensource" openInNewTab color="purple.500">
              Open Source Collective
            </StyledLink>
          ),
          criterialink: (
            <StyledLink href="https://www.oscollective.org/#criteria" openInNewTab color="purple.500">
              <FormattedMessage id="verificationCriteria" defaultMessage="verification criteria" />
            </StyledLink>
          ),
        }}
      />
    </P>
    <P mb={3} fontWeight={700} fontSize="15px" lineHeight="22px">
      <FormattedMessage id="createcollective.opensource.p3" defaultMessage="Fees: 10% of funds raised." />
    </P>
    <P mb={3} fontSize="15px" lineHeight="22px">
      <FormattedMessage
        id="createcollective.opensource.p4"
        defaultMessage="Our fees cover operating costs like accounting, payments, tax reporting, invoices, legal liability, use of the Doohi Collective Platform, and providing support. We also run a range of initiatives to support a sustainable and healthy open source ecosystem. Join us!"
      />
    </P>
  </React.Fragment>
);

export default ApplicationDescription;
